import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './SolitaireApp.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Color = 'red' | 'black';

interface Card {
  suit: Suit;
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  faceUp: boolean;
  id: string;
}

interface DragState {
  cards: Card[];
  sourceType: 'tableau' | 'waste';
  sourceIndex: number; // tableau column index or 0 for waste
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

function suitColor(s: Suit): Color {
  return s === 'hearts' || s === 'diamonds' ? 'red' : 'black';
}

function suitSymbol(s: Suit): string {
  return { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' }[s];
}

function rankLabel(r: number): string {
  if (r === 1) return 'A';
  if (r === 11) return 'J';
  if (r === 12) return 'Q';
  if (r === 13) return 'K';
  return String(r);
}

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false, id: `${suit}-${rank}` });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── Win Animation (bouncing cards) ──────────────────────────────────────────

interface BouncingCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean; // still bouncing
}

function WinAnimation({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { unlockAchievement } = useAchievementContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const W = canvas.width;
    const H = canvas.height;
    const CARD_W = 50;
    const CARD_H = 70;
    const GRAVITY = 0.5;
    const BOUNCE = 0.7; // energy retained per bounce (positive -- we negate vy manually)
    const SPAWN_INTERVAL = 12; // frames between each card spawn (~200ms at 60fps)

    // Build card order: K down to A, cycling through 4 foundation piles
    const allCards: Card[] = [];
    for (let rank = 13; rank >= 1; rank--) {
      for (const suit of SUITS) {
        allCards.push({ suit, rank, faceUp: true, id: `${suit}-${rank}` });
      }
    }

    // Foundation pile starting positions (top of screen, spaced across)
    const pileSpacing = Math.min((CARD_W + 16), (W - 40) / 4);
    const pilesStartX = W - 4 * pileSpacing - 10;
    const pilePositions = SUITS.map((_, i) => pilesStartX + i * pileSpacing);

    const activeCards: BouncingCard[] = [];
    let spawnIndex = 0;
    let frameCount = 0;
    let animId: number;
    let cornerHitTriggered = false;

    // Use two canvases: one for permanent trails, one for active cards
    // We'll use the main canvas and never clear the trail layer
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = W;
    trailCanvas.height = H;
    const trailCtx = trailCanvas.getContext('2d')!;

    const drawCard = (ctx: CanvasRenderingContext2D, card: Card, x: number, y: number) => {
      // Card background
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 4);
      ctx.fill();
      ctx.stroke();

      // Rank and suit
      const color = suitColor(card.suit) === 'red' ? '#e74c3c' : '#2c3e50';
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Quicksand, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(rankLabel(card.rank), x + 4, y + 16);
      ctx.font = '16px serif';
      ctx.fillText(suitSymbol(card.suit), x + 4, y + 34);
    };

    const loop = () => {
      frameCount++;

      // Spawn new cards with staggered delay
      if (frameCount % SPAWN_INTERVAL === 0 && spawnIndex < allCards.length) {
        const card = allCards[spawnIndex];
        const pileIndex = SUITS.indexOf(card.suit);
        const startX = pilePositions[pileIndex];

        // Random horizontal velocity -- spread cards across the screen
        // Alternate direction: even piles go left, odd go right, with randomness
        const baseVx = (pileIndex < 2 ? -1 : 1) * (2 + Math.random() * 3);
        const vx = baseVx + (Math.random() - 0.5) * 2;

        activeCards.push({
          card,
          x: startX,
          y: 10, // Start near top (foundation area)
          vx,
          vy: 0, // Start with no vertical velocity -- gravity pulls them
          active: true,
        });
        spawnIndex++;
      }

      // Clear main canvas (we composite trail canvas onto it each frame)
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Draw permanent trail layer first
      ctx.drawImage(trailCanvas, 0, 0);

      // Update and draw active cards
      for (const bc of activeCards) {
        if (!bc.active) continue;

        // Stamp current position onto trail canvas BEFORE moving
        drawCard(trailCtx, bc.card, bc.x, bc.y);

        // Physics
        bc.vy += GRAVITY;
        bc.x += bc.vx;
        bc.y += bc.vy;

        // Bounce off bottom -- each bounce loses energy
        if (bc.y + CARD_H >= H) {
          bc.y = H - CARD_H;
          bc.vy = -Math.abs(bc.vy) * BOUNCE;

          // Check for corner hit during cascade
          if (!cornerHitTriggered && (bc.x <= CARD_W || bc.x + CARD_W >= W - CARD_W)) {
            cornerHitTriggered = true;
            unlockAchievement('corner-office');
          }

          // If bounce is too small, card is done
          if (Math.abs(bc.vy) < 1) {
            bc.active = false;
            // Stamp final position
            drawCard(trailCtx, bc.card, bc.x, bc.y);
            continue;
          }
        }

        // Card goes off screen horizontally -- deactivate
        if (bc.x > W + CARD_W || bc.x < -CARD_W * 2) {
          bc.active = false;
          continue;
        }

        // Draw the active card on top of trails
        drawCard(ctx, bc.card, bc.x, bc.y);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [containerRef, unlockAchievement]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.winCanvas}
    />
  );
}

// ─── Game Component ──────────────────────────────────────────────────────────

export default function SolitaireApp() {
  const { unlockAchievement } = useAchievementContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef(Date.now());

  // Game state
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], []]);
  const [won, setWon] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Initialize game
  const initGame = useCallback(() => {
    const deck = makeDeck();
    const tab: Card[][] = [[], [], [], [], [], [], []];
    let idx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = { ...deck[idx++] };
        card.faceUp = row === col;
        tab[col].push(card);
      }
    }
    const remaining = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
    setStock(remaining);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableau(tab);
    setWon(false);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // Check win
  useEffect(() => {
    if (foundations.every(f => f.length === 13) && !won) {
      setWon(true);
      unlockAchievement('mandatory-fun');
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed < 180) unlockAchievement('card-shark');
    }
  }, [foundations, won, unlockAchievement]);

  // Draw from stock
  const drawCard = useCallback(() => {
    if (stock.length === 0) {
      // Recycle waste back to stock
      setStock(waste.map(c => ({ ...c, faceUp: false })).reverse());
      setWaste([]);
    } else {
      const card = { ...stock[stock.length - 1], faceUp: true };
      setStock(prev => prev.slice(0, -1));
      setWaste(prev => [...prev, card]);
    }
  }, [stock, waste]);

  // Try to move card to foundation
  const tryFoundation = useCallback((card: Card): number | null => {
    for (let i = 0; i < 4; i++) {
      const pile = foundations[i];
      if (pile.length === 0 && card.rank === 1) return i;
      if (pile.length > 0) {
        const top = pile[pile.length - 1];
        if (top.suit === card.suit && card.rank === top.rank + 1) return i;
      }
    }
    return null;
  }, [foundations]);

  // Double-click waste card -> try foundation, then tableau
  const handleWasteDoubleClick = useCallback(() => {
    if (waste.length === 0) return;
    const card = waste[waste.length - 1];

    // Try foundation
    const fi = tryFoundation(card);
    if (fi !== null) {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[fi].push(card);
        return next;
      });
      setWaste(prev => prev.slice(0, -1));
      return;
    }

    // Try tableau
    for (let col = 0; col < 7; col++) {
      const colCards = tableau[col];
      if (colCards.length === 0 && card.rank === 13) {
        setTableau(prev => {
          const next = prev.map(p => [...p]);
          next[col].push({ ...card, faceUp: true });
          return next;
        });
        setWaste(prev => prev.slice(0, -1));
        return;
      }
      if (colCards.length > 0) {
        const top = colCards[colCards.length - 1];
        if (top.faceUp && suitColor(top.suit) !== suitColor(card.suit) && card.rank === top.rank - 1) {
          setTableau(prev => {
            const next = prev.map(p => [...p]);
            next[col].push({ ...card, faceUp: true });
            return next;
          });
          setWaste(prev => prev.slice(0, -1));
          return;
        }
      }
    }
  }, [waste, foundations, tableau, tryFoundation]);

  // Double-click tableau card -> try foundation
  const handleTableauDoubleClick = useCallback((colIdx: number) => {
    const col = tableau[colIdx];
    if (col.length === 0) return;
    const card = col[col.length - 1];
    if (!card.faceUp) return;

    const fi = tryFoundation(card);
    if (fi !== null) {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[fi].push(card);
        return next;
      });
      setTableau(prev => {
        const next = prev.map(p => [...p]);
        next[colIdx] = next[colIdx].slice(0, -1);
        // Flip new top card
        const newCol = next[colIdx];
        if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
          newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true };
        }
        return next;
      });
    }
  }, [tableau, foundations, tryFoundation]);

  // Click on tableau card to start drag (simplified: click source, click dest)
  const handleTableauClick = useCallback((colIdx: number, cardIdx: number) => {
    const col = tableau[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) return;

    if (dragState) {
      // Attempting to drop
      if (dragState.sourceType === 'tableau' && dragState.sourceIndex === colIdx) {
        setDragState(null);
        return;
      }

      const destCol = col;
      const dragCards = dragState.cards;
      const firstDrag = dragCards[0];

      // Validate drop
      let valid = false;
      if (destCol.length === 0 && firstDrag.rank === 13) {
        valid = true;
      } else if (destCol.length > 0) {
        const top = destCol[destCol.length - 1];
        if (top.faceUp && suitColor(top.suit) !== suitColor(firstDrag.suit) && firstDrag.rank === top.rank - 1) {
          valid = true;
        }
      }

      if (valid) {
        setTableau(prev => {
          const next = prev.map(p => [...p]);
          // Remove from source
          if (dragState.sourceType === 'tableau') {
            const srcCol = next[dragState.sourceIndex];
            next[dragState.sourceIndex] = srcCol.slice(0, srcCol.length - dragCards.length);
            // Flip new top
            const newSrc = next[dragState.sourceIndex];
            if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
              newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
            }
          }
          // Add to destination
          next[colIdx] = [...next[colIdx], ...dragCards.map(c => ({ ...c, faceUp: true }))];
          return next;
        });

        if (dragState.sourceType === 'waste') {
          setWaste(prev => prev.slice(0, -1));
        }
      }

      setDragState(null);
    } else {
      // Start drag -- pick up this card and all below it in the column
      const cards = col.slice(cardIdx);
      setDragState({ cards, sourceType: 'tableau', sourceIndex: colIdx });
    }
  }, [tableau, dragState]);

  // Click waste to start drag
  const handleWasteClick = useCallback(() => {
    if (waste.length === 0) return;
    if (dragState) {
      setDragState(null);
      return;
    }
    const card = waste[waste.length - 1];
    setDragState({ cards: [card], sourceType: 'waste', sourceIndex: 0 });
  }, [waste, dragState]);

  // Double-tap detection for mobile (maps to double-click)
  const lastTapRef = useRef<{ time: number; id: string }>({ time: 0, id: '' });

  const handleTableauTap = useCallback((colIdx: number, cardIdx: number) => {
    const col = tableau[colIdx];
    const card = col[cardIdx];
    if (!card || !card.faceUp) return;
    const now = Date.now();
    const tapId = `tab-${colIdx}-${cardIdx}`;
    if (now - lastTapRef.current.time < 350 && lastTapRef.current.id === tapId) {
      // Double tap detected -- auto-move to foundation
      if (cardIdx === col.length - 1) {
        handleTableauDoubleClick(colIdx);
      }
      lastTapRef.current = { time: 0, id: '' };
      return;
    }
    lastTapRef.current = { time: now, id: tapId };
    handleTableauClick(colIdx, cardIdx);
  }, [tableau, handleTableauDoubleClick, handleTableauClick]);

  const handleWasteTap = useCallback(() => {
    const now = Date.now();
    const tapId = 'waste';
    if (now - lastTapRef.current.time < 350 && lastTapRef.current.id === tapId) {
      handleWasteDoubleClick();
      lastTapRef.current = { time: 0, id: '' };
      return;
    }
    lastTapRef.current = { time: now, id: tapId };
    handleWasteClick();
  }, [handleWasteDoubleClick, handleWasteClick]);

  // Click empty tableau column
  const handleEmptyColClick = useCallback((colIdx: number) => {
    if (!dragState) return;
    const firstDrag = dragState.cards[0];
    if (firstDrag.rank !== 13) { setDragState(null); return; }

    setTableau(prev => {
      const next = prev.map(p => [...p]);
      if (dragState.sourceType === 'tableau') {
        const srcCol = next[dragState.sourceIndex];
        next[dragState.sourceIndex] = srcCol.slice(0, srcCol.length - dragState.cards.length);
        const newSrc = next[dragState.sourceIndex];
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
          newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
        }
      }
      next[colIdx] = [...dragState.cards.map(c => ({ ...c, faceUp: true }))];
      return next;
    });

    if (dragState.sourceType === 'waste') {
      setWaste(prev => prev.slice(0, -1));
    }

    setDragState(null);
  }, [dragState]);

  // Click foundation to drop
  const handleFoundationClick = useCallback((fi: number) => {
    if (!dragState || dragState.cards.length !== 1) { setDragState(null); return; }
    const card = dragState.cards[0];
    const pile = foundations[fi];

    let valid = false;
    if (pile.length === 0 && card.rank === 1) valid = true;
    if (pile.length > 0 && pile[pile.length - 1].suit === card.suit && card.rank === pile[pile.length - 1].rank + 1) valid = true;

    if (valid) {
      setFoundations(prev => {
        const next = prev.map(p => [...p]);
        next[fi].push(card);
        return next;
      });
      if (dragState.sourceType === 'tableau') {
        setTableau(prev => {
          const next = prev.map(p => [...p]);
          next[dragState.sourceIndex] = next[dragState.sourceIndex].slice(0, -1);
          const newSrc = next[dragState.sourceIndex];
          if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
            newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
          }
          return next;
        });
      } else {
        setWaste(prev => prev.slice(0, -1));
      }
    }
    setDragState(null);
  }, [dragState, foundations]);

  // Is a card part of the current drag selection?
  const isDragging = useCallback((cardId: string) => {
    return dragState?.cards.some(c => c.id === cardId) ?? false;
  }, [dragState]);

  if (won) {
    return (
      <div ref={containerRef} className={styles.container}>
        <WinAnimation containerRef={containerRef} />
        <div className={styles.winOverlay}>
          <div className={styles.winText}>Productivity increased. Return to work.</div>
          <button className={styles.newGameBtn} onClick={initGame}>Resume Mandatory Fun</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Top row: stock, waste, foundations */}
      <div className={styles.topRow}>
        {/* Stock */}
        <div className={styles.cardSlot} onClick={drawCard}>
          {stock.length > 0 ? (
            <div className={styles.cardBack}>
              <span className={styles.cardBackDesign}>{'\u2726'}</span>
            </div>
          ) : (
            <div className={styles.emptySlot}>{'\u21BA'}</div>
          )}
        </div>

        {/* Waste */}
        <div className={styles.cardSlot} onClick={handleWasteTap} onDoubleClick={handleWasteDoubleClick}>
          {waste.length > 0 ? (
            <CardView card={waste[waste.length - 1]} highlight={isDragging(waste[waste.length - 1].id)} />
          ) : (
            <div className={styles.emptySlot} />
          )}
        </div>

        <div className={styles.topSpacer} />

        {/* Foundations */}
        {foundations.map((pile, i) => (
          <div key={i} className={styles.cardSlot} onClick={() => handleFoundationClick(i)}>
            {pile.length > 0 ? (
              <CardView card={pile[pile.length - 1]} />
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.foundationHint}>{suitSymbol(SUITS[i])}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className={styles.tableauRow}>
        {tableau.map((col, colIdx) => (
          <div key={colIdx} className={styles.tableauCol}>
            {col.length === 0 ? (
              <div className={styles.emptySlot} onClick={() => handleEmptyColClick(colIdx)}>K</div>
            ) : (
              col.map((card, cardIdx) => (
                <div
                  key={card.id}
                  className={styles.tableauCard}
                  style={{ top: cardIdx * (card.faceUp ? 22 : 8) }}
                  onClick={() => handleTableauTap(colIdx, cardIdx)}
                  onDoubleClick={cardIdx === col.length - 1 ? () => handleTableauDoubleClick(colIdx) : undefined}
                >
                  {card.faceUp ? (
                    <CardView card={card} highlight={isDragging(card.id)} />
                  ) : (
                    <div className={styles.cardBack}>
                      <span className={styles.cardBackDesign}>{'\u2726'}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* New Game button */}
      <button className={styles.newGameBtnSmall} onClick={initGame}>Redistribute Assets</button>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ card, highlight }: { card: Card; highlight?: boolean }) {
  const isRed = suitColor(card.suit) === 'red';
  return (
    <div className={`${styles.card} ${isRed ? styles.cardRed : styles.cardBlack} ${highlight ? styles.cardHighlight : ''}`}>
      <div className={styles.cardRank}>{rankLabel(card.rank)}</div>
      <div className={styles.cardSuit}>{suitSymbol(card.suit)}</div>
      <div className={styles.cardCenter}>{suitSymbol(card.suit)}</div>
    </div>
  );
}
