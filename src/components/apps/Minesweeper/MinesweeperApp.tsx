import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './MinesweeperApp.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS = 9;
const COLS = 9;
const MINES = 10;

type CellState = 'hidden' | 'revealed' | 'flagged';
type GameStatus = 'playing' | 'won' | 'lost';

interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
}

type Board = Cell[][];

// ─── Board Generation ─────────────────────────────────────────────────────────

function createBoard(firstRow?: number, firstCol?: number): Board {
  const board: Board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      adjacent: 0,
      state: 'hidden' as CellState,
    }))
  );

  // Place mines (avoid first click cell and neighbors)
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (board[r][c].mine) continue;
    if (firstRow !== undefined && firstCol !== undefined) {
      if (Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1) continue;
    }
    board[r][c].mine = true;
    placed++;
  }

  // Calculate adjacency
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) {
            count++;
          }
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MinesweeperApp() {
  const { unlockAchievement } = useAchievementContext();
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [status, setStatus] = useState<GameStatus>('playing');
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hitMineRef = useRef(false);
  const [touchMode, setTouchMode] = useState<'reveal' | 'flag'>('reveal');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressTriggeredRef = useRef(false);

  // Timer
  useEffect(() => {
    if (status === 'playing' && !firstClick) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (status !== 'playing') {
      clearInterval(timerRef.current);
    }
  }, [status, firstClick]);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setStatus('playing');
    setFirstClick(true);
    setTime(0);
    setFlagCount(0);
    hitMineRef.current = false;
  }, []);

  // Flood-fill reveal for 0-adjacent cells
  const reveal = useCallback((board: Board, r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (board[r][c].state !== 'hidden') return;

    board[r][c].state = 'revealed';
    if (board[r][c].adjacent === 0 && !board[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(board, r + dr, c + dc);
        }
      }
    }
  }, []);

  const checkWin = useCallback((board: Board): boolean => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].mine && board[r][c].state !== 'revealed') return false;
      }
    }
    return true;
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (status !== 'playing') return;
    const cell = board[r][c];
    if (cell.state === 'flagged' || cell.state === 'revealed') return;

    let newBoard: Board;
    if (firstClick) {
      newBoard = createBoard(r, c);
      setFirstClick(false);
    } else {
      newBoard = cloneBoard(board);
    }

    if (newBoard[r][c].mine) {
      // Hit a violation — game over
      hitMineRef.current = true;
      // Reveal all violations
      for (let rr = 0; rr < ROWS; rr++) {
        for (let cc = 0; cc < COLS; cc++) {
          if (newBoard[rr][cc].mine) newBoard[rr][cc].state = 'revealed';
        }
      }
      newBoard[r][c].state = 'revealed';
      setBoard(newBoard);
      setStatus('lost');
      return;
    }

    reveal(newBoard, r, c);

    if (checkWin(newBoard)) {
      setBoard(newBoard);
      setStatus('won');
      if (!hitMineRef.current) unlockAchievement('compliance-clear');
      return;
    }

    setBoard(newBoard);
  }, [board, status, firstClick, reveal, checkWin, unlockAchievement]);

  const handleRightClick = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status !== 'playing') return;
    const cell = board[r][c];
    if (cell.state === 'revealed') return;

    const newBoard = cloneBoard(board);
    if (cell.state === 'flagged') {
      newBoard[r][c].state = 'hidden';
      setFlagCount(prev => prev - 1);
    } else {
      newBoard[r][c].state = 'flagged';
      setFlagCount(prev => prev + 1);
    }
    setBoard(newBoard);
  }, [board, status]);

  // Touch handlers: long-press = flag, or use mode toggle
  const handleCellTouchStart = useCallback((r: number, c: number) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      // Long press = toggle flag (formal complaint)
      if (status !== 'playing') return;
      const cell = board[r][c];
      if (cell.state === 'revealed') return;
      const newBoard = cloneBoard(board);
      if (cell.state === 'flagged') {
        newBoard[r][c].state = 'hidden';
        setFlagCount(prev => prev - 1);
      } else {
        newBoard[r][c].state = 'flagged';
        setFlagCount(prev => prev + 1);
      }
      setBoard(newBoard);
    }, 500);
  }, [board, status]);

  const handleCellTouchEnd = useCallback((r: number, c: number) => {
    clearTimeout(longPressTimerRef.current);
    if (longPressTriggeredRef.current) return; // Already handled as long-press
    // Short tap: use the current touch mode
    if (touchMode === 'flag') {
      if (status !== 'playing') return;
      const cell = board[r][c];
      if (cell.state === 'revealed') return;
      const newBoard = cloneBoard(board);
      if (cell.state === 'flagged') {
        newBoard[r][c].state = 'hidden';
        setFlagCount(prev => prev - 1);
      } else {
        newBoard[r][c].state = 'flagged';
        setFlagCount(prev => prev + 1);
      }
      setBoard(newBoard);
    } else {
      handleCellClick(r, c);
    }
  }, [touchMode, board, status, handleCellClick]);

  const smileyFace = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂';

  const NUMBER_COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.counterGroup}>
          <span className={styles.counterLabel}>Violations</span>
          <div className={styles.counter}>{String(MINES - flagCount).padStart(3, '0')}</div>
        </div>
        <button className={styles.smileyBtn} onClick={resetGame}>{smileyFace}</button>
        <div className={styles.counter}>{String(Math.min(time, 999)).padStart(3, '0')}</div>
      </div>

      {/* Board */}
      <div className={styles.board}>
        {board.map((row, r) => (
          <div key={r} className={styles.row}>
            {row.map((cell, c) => {
              let content: React.ReactNode = null;
              let cellClass = styles.cell;

              if (cell.state === 'revealed') {
                cellClass += ` ${styles.cellRevealed}`;
                if (cell.mine) {
                  content = '📋';
                  if (status === 'lost' && hitMineRef.current) {
                    // HR violation exposed
                  }
                } else if (cell.adjacent > 0) {
                  content = <span style={{ color: NUMBER_COLORS[cell.adjacent], fontWeight: 700 }}>{cell.adjacent}</span>;
                }
              } else if (cell.state === 'flagged') {
                content = '⚠️';
              }

              return (
                <button
                  key={c}
                  className={cellClass}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  onTouchStart={(e) => { e.preventDefault(); handleCellTouchStart(r, c); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleCellTouchEnd(r, c); }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mode toggle for mobile */}
      {status === 'playing' && (
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${touchMode === 'reveal' ? styles.modeBtnActive : ''}`}
            onClick={() => setTouchMode('reveal')}
          >
            Investigate
          </button>
          <button
            className={`${styles.modeBtn} ${touchMode === 'flag' ? styles.modeBtnActive : ''}`}
            onClick={() => setTouchMode('flag')}
          >
            File Complaint
          </button>
        </div>
      )}

      {status !== 'playing' && (
        <div className={styles.statusBar}>
          {status === 'won'
            ? 'All violations contained. Your vigilance is appreciated.'
            : 'HR violation detected. Incident logged.'}
        </div>
      )}
    </div>
  );
}
