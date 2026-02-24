import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TeamMember } from '../../types/campaign';
import type { GamePhase, WaitPhase, GameDef, MechanicCategory } from './types';
import { ALL_GAMES } from './allGames';
import { useSettingsContext } from '../../context/SettingsContext';
import styles from './MicroGames.module.css';

// ─── Props ──────────────────────────────────────────────────────────────────

interface MicroGamesProps {
  phase: WaitPhase;
  members: TeamMember[];
  progress: { current: number; total: number } | null;
  isComplete: boolean;
  onSeeResults?: () => void;
}

// ─── Weighted Game Picker (category-aware, no back-to-back same category) ───

function weightedPick(pool: GameDef[]): GameDef {
  const totalWeight = pool.reduce((sum, g) => sum + (g.weight ?? 1.0), 0);
  let r = Math.random() * totalWeight;
  for (const g of pool) {
    r -= g.weight ?? 1.0;
    if (r <= 0) return g;
  }
  return pool[pool.length - 1];
}

function pickNextGame(
  phase: WaitPhase,
  recentIds: Set<string>,
  lastCategory: MechanicCategory | null,
): GameDef {
  const phaseMatch = (g: GameDef) => g.waitPhase === phase || g.waitPhase === 'both';

  // Best: different category AND not recently played
  let pool = ALL_GAMES.filter(g =>
    phaseMatch(g) && !recentIds.has(g.id) && g.category !== lastCategory
  );

  // Fallback 1: allow same category but not recently played
  if (pool.length === 0) {
    pool = ALL_GAMES.filter(g => phaseMatch(g) && !recentIds.has(g.id));
  }

  // Fallback 2: allow everything for this phase
  if (pool.length === 0) {
    pool = ALL_GAMES.filter(g => phaseMatch(g));
  }

  return weightedPick(pool);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MicroGames({
  phase, members, progress, isComplete, onSeeResults,
}: MicroGamesProps): React.ReactElement {
  const { settings } = useSettingsContext();
  const { extendedTimers, skipMiniGames } = settings.accessibility;

  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [currentGame, setCurrentGame] = useState<GameDef | null>(null);
  const [gameMember, setGameMember] = useState<TeamMember | null>(null);
  const [score, setScore] = useState({ won: 0, total: 0 });
  const [lastResult, setLastResult] = useState<{ won: boolean; msg: string } | null>(null);
  const [timeFraction, setTimeFraction] = useState(1);
  const [gameKey, setGameKey] = useState(0); // Forces full remount between games
  const recentRef = useRef<Set<string>>(new Set());
  const lastCategoryRef = useRef<MechanicCategory | null>(null);
  const resolvedRef = useRef(false);

  const pickMember = useCallback(() => {
    return members[Math.floor(Math.random() * members.length)] || {
      id: 'pm', name: 'Taylor', role: 'PM', avatar: '📋',
      specialty: '', description: '', personality: '', voiceStyle: '',
    };
  }, [members]);

  // Pick first game
  useEffect(() => {
    const game = pickNextGame(phase, recentRef.current, null);
    setCurrentGame(game);
    setGameMember(pickMember());
  }, [phase, pickMember]);

  // Ready → Playing transition (0.8s pause)
  useEffect(() => {
    if (gamePhase !== 'ready' || !currentGame) return;
    const timer = setTimeout(() => setGamePhase('playing'), 800);
    return () => clearTimeout(timer);
  }, [gamePhase, currentGame]);

  // Timer during playing
  useEffect(() => {
    if (gamePhase !== 'playing' || !currentGame) return;
    resolvedRef.current = false;
    const startTime = Date.now();
    const duration = currentGame.duration * (extendedTimers ? 2 : 1);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      setTimeFraction(Math.max(0, remaining / duration));

      if (remaining <= 0 && !resolvedRef.current) {
        clearInterval(interval);
        // Survivor games: surviving the timer = win
        if (currentGame.survivorGame) {
          handleResult(true);
        } else {
          handleResult(false);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, currentGame]);

  function handleResult(won: boolean) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const member = gameMember || pickMember();
    const msg = won
      ? currentGame!.winMsg(member)
      : currentGame!.failMsg(member);

    // Track recent games (last 8)
    recentRef.current.add(currentGame!.id);
    if (recentRef.current.size > 8) {
      const first = recentRef.current.values().next().value;
      if (first !== undefined) recentRef.current.delete(first);
    }
    lastCategoryRef.current = currentGame!.category;

    setScore(s => ({ won: s.won + (won ? 1 : 0), total: s.total + 1 }));
    setLastResult({ won, msg });
    setGamePhase('result');

    // Transition after result display (1.3s)
    setTimeout(() => {
      if (isComplete) {
        setGamePhase('complete');
      } else {
        const next = pickNextGame(phase, recentRef.current, lastCategoryRef.current);
        setCurrentGame(next);
        setGameMember(pickMember());
        setGameKey(k => k + 1); // Force fresh component tree
        setGamePhase('ready');
      }
    }, 1300);
  }

  // Check for completion mid-game
  useEffect(() => {
    if (isComplete && gamePhase === 'ready') {
      setTimeout(() => setGamePhase('complete'), 300);
    }
  }, [isComplete, gamePhase]);

  const handleWin = useCallback(() => handleResult(true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGame, gameMember]);
  const handleFail = useCallback(() => handleResult(false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGame, gameMember]);

  // Memoize the rendered game element so render() is called once per game,
  // not on every 50ms timer tick. Prevents random values (targetAngle, shuffled
  // items, etc.) from re-generating each render and breaking game state.
  const gameElement = useMemo(
    () => (currentGame && gameMember ? currentGame.render(handleWin, handleFail, gameMember) : null),
    // gameKey increments on every game transition; handleWin/handleFail change with currentGame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameKey, handleWin, handleFail],
  );

  const progressPct = progress
    ? (progress.total > 0 ? (progress.current / progress.total) * 100 : 0)
    : 0;

  // ─── Render ───────────────────────────────────────────────────────────

  // Skip Mini-Games: show a passive wait screen instead of games
  if (skipMiniGames) {
    if (isComplete) {
      // Reuse the complete screen without a score remark
      return (
        <div className={styles.container}>
          <div className={styles.completeScreen}>
            <div className={styles.completeEmoji}>🎉</div>
            <div className={styles.completeTitle}>
              {phase === 'concepting' ? 'CONCEPTS READY!' : 'Production Complete!'}
            </div>
            <div className={styles.completeActions}>
              <button className={styles.primaryButton} onClick={onSeeResults}>
                {phase === 'concepting' ? 'See Concepts' : 'Review Work'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.container}>
        <div className={styles.readyScreen}>
          <div className={styles.readySubtext}>Team is working on it...</div>
          {progress && (
            <div className={styles.progressFooter}>
              <div className={styles.progressMini}>
                <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.progressMiniLabel}>{progress.current}/{progress.total}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'complete') {
    const remark = score.total === 0 ? '' :
      score.won / score.total >= 0.8 ? 'Great help! The team appreciated your input.' :
      score.won / score.total >= 0.5 ? 'Solid contributions - concepts coming together.' :
      'Nice work helping out, boss.';

    return (
      <div className={styles.container}>
        <div className={styles.completeScreen}>
          <div className={styles.completeEmoji}>🎉</div>
          <div className={styles.completeTitle}>
            {phase === 'concepting' ? "CONCEPTS READY!" : "Production Complete!"}
          </div>
          {score.total > 0 && (
            <div className={styles.completeScore}>
              {remark}
            </div>
          )}
          <div className={styles.completeActions}>
            <button className={styles.primaryButton} onClick={onSeeResults}>
              {phase === 'concepting' ? 'See Concepts' : 'Review Work'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'result' && lastResult) {
    return (
      <div className={styles.container}>
        <div className={styles.resultScreen}>
          <div className={`${styles.resultIcon} ${lastResult.won ? styles.win : styles.lose}`}>
            {lastResult.won ? '✅' : '❌'}
          </div>
          <div className={styles.resultText}>
            {lastResult.won ? 'Nice work!' : 'Oops!'}
          </div>
          <div className={styles.resultMessage}>{lastResult.msg}</div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'ready' && currentGame) {
    return (
      <div className={styles.container}>
        <div className={styles.readyScreen}>
          <div className={styles.readySubtext}>Get ready...</div>
          <div className={styles.readyInstruction}>{currentGame.instruction}</div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'playing' && currentGame && gameMember) {
    return (
      <div className={styles.container}>
        <div className={styles.gameArea}>
          <div className={styles.timerBar}>
            <div
              className={`${styles.timerFill} ${timeFraction < 0.25 ? styles.urgent : ''}`}
              style={{ width: `${timeFraction * 100}%` }}
            />
          </div>
          <div key={`game-${currentGame.id}-${gameKey}`} style={{ width: '100%' }}>
            {gameElement}
          </div>
        </div>
        {(progress || score.total > 0) && (
          <div className={styles.progressFooter}>
            {progress && (
              <>
                <div className={styles.progressMini}>
                  <div className={styles.progressMiniFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressMiniLabel}>
                  {progress.current}/{progress.total}
                </span>
              </>
            )}
            <span className={styles.scoreDisplay}>
              Score: {score.won}/{score.total}
            </span>
          </div>
        )}
      </div>
    );
  }

  return <div className={styles.container} />;
}
