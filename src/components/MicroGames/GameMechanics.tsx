import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './MicroGames.module.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 1. Click Target ────────────────────────────────────────────────────────

export function ClickTargetGame({
  emoji, label, animation, onWin,
}: {
  emoji: string; label: string; animation: string; onWin: () => void;
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <div className={styles.targetArea}>
      <div
        className={`${styles.target} ${styles[animation] || ''} ${clicked ? styles.clicked : ''}`}
        onClick={() => { if (!clicked) { setClicked(true); onWin(); } }}
      >
        <span className={styles.targetEmoji}>{emoji}</span>
        <span className={styles.targetLabel}>{label}</span>
      </div>
    </div>
  );
}

// ─── 2. Pick One ────────────────────────────────────────────────────────────

export function PickOneGame({
  options, context, onWin, onFail,
}: {
  options: { emoji: string; label: string; sub?: string; correct: boolean }[];
  context?: string;
  onWin: () => void;
  onFail: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handlePick = (i: number) => {
    if (picked !== null) return;
    const opt = options[i];
    setPicked(i);
    setRevealed(true);
    setTimeout(() => {
      if (opt.correct) onWin(); else onFail();
    }, 1500);
  };

  return (
    <div className={styles.pickWrap}>
    {context && <div className={styles.pickContext}>{context}</div>}
    <div className={styles.optionsRow}>
      {options.map((opt, i) => {
        const isCorrect = opt.correct;
        const isPicked = picked === i;
        let extraClass = '';
        if (revealed) {
          if (isCorrect) extraClass = styles.correct;
          else if (isPicked) extraClass = styles.wrong;
          else extraClass = styles.optionNeutral;
        }
        return (
          <button
            key={i}
            className={`${styles.option} ${extraClass}`}
            onClick={() => handlePick(i)}
          >
            <span className={styles.optionEmoji}>
              {revealed
                ? isCorrect ? '✅' : isPicked ? '❌' : opt.emoji
                : opt.emoji}
            </span>
            <span className={styles.optionLabel}>{opt.label}</span>
            {revealed && isCorrect && <span className={styles.optionSub}>Correct!</span>}
            {revealed && isPicked && !isCorrect && <span className={styles.optionSub}>Wrong!</span>}
          </button>
        );
      })}
    </div>
    </div>
  );
}

// ─── 3. Drag and Drop ───────────────────────────────────────────────────────

interface DragItem { id: string; emoji: string; label: string; correctZone: string }
interface DropZone { id: string; emoji: string; label: string }

export function DragDropGame({
  items, zones, onWin, revealDelayMs,
}: {
  items: DragItem[]; zones: DropZone[]; onWin: () => void; revealDelayMs?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const dragOffset = useRef({ x: 0, y: 0 });
  const wonRef = useRef(false);

  // Staggered reveal
  const [visibleCount, setVisibleCount] = useState(revealDelayMs ? 1 : items.length);
  useEffect(() => {
    if (!revealDelayMs || visibleCount >= items.length) return;
    const timer = setTimeout(() => setVisibleCount(c => c + 1), revealDelayMs);
    return () => clearTimeout(timer);
  }, [revealDelayMs, visibleCount, items.length]);

  // Initialize item positions scattered in top portion
  useEffect(() => {
    const init: Record<string, { x: number; y: number }> = {};
    items.forEach((item, i) => {
      init[item.id] = { x: 30 + (i % 3) * 130, y: 15 + Math.floor(i / 3) * 55 };
    });
    setPositions(init);
  }, [items.length]);

  // Drag events
  useEffect(() => {
    if (!dragId) return;
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPositions(prev => ({
        ...prev,
        [dragId]: {
          x: Math.max(0, Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.current.x)),
          y: Math.max(0, Math.min(rect.height - 35, e.clientY - rect.top - dragOffset.current.y)),
        },
      }));
    };
    const handleUp = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) { setDragId(null); return; }
      const dropY = e.clientY - rect.top;
      const dropX = e.clientX - rect.left;
      // Drop zones are at bottom, evenly spaced
      if (dropY > rect.height - 90) {
        const zoneW = rect.width / zones.length;
        const zoneIdx = Math.floor(dropX / zoneW);
        if (zoneIdx >= 0 && zoneIdx < zones.length) {
          const zone = zones[zoneIdx];
          const item = items.find(it => it.id === dragId);
          if (item && item.correctZone === zone.id) {
            setPlaced(prev => new Set(prev).add(dragId));
            setPositions(prev => ({
              ...prev,
              [dragId]: { x: zoneIdx * zoneW + zoneW / 2 - 40, y: rect.height - 70 },
            }));
          }
        }
      }
      setDragId(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragId, items, zones]);

  // Win check
  useEffect(() => {
    if (placed.size === items.length && !wonRef.current) {
      wonRef.current = true;
      onWin();
    }
  }, [placed.size, items.length, onWin]);

  const zoneW = 100 / zones.length;

  return (
    <div ref={containerRef} className={styles.gameCanvas}>
      {zones.map((zone, i) => (
        <div key={zone.id} className={`${styles.dropTarget} ${placed.size > 0 && [...placed].some(pid => items.find(it => it.id === pid)?.correctZone === zone.id) ? styles.dropFilled : ''}`}
          style={{ left: `${i * zoneW}%`, width: `${zoneW}%`, bottom: 0, height: 80, position: 'absolute' }}>
          <span className={styles.dropEmoji}>{zone.emoji}</span>
          <span className={styles.dropLabel}>{zone.label}</span>
        </div>
      ))}
      {items.slice(0, visibleCount).map(item => (
        <div key={item.id}
          className={`${styles.dragPiece} ${dragId === item.id ? styles.dragging : ''} ${placed.has(item.id) ? styles.placed : ''}`}
          style={{ left: positions[item.id]?.x ?? 0, top: positions[item.id]?.y ?? 0 }}
          onMouseDown={(e) => {
            if (placed.has(item.id)) return;
            const rect = e.currentTarget.getBoundingClientRect();
            dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            setDragId(item.id);
            e.preventDefault();
          }}>
          <span className={styles.pieceEmoji}>{item.emoji}</span> {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── 4. Simple Drag (one item to one target) ────────────────────────────────

export function SimpleDragGame({
  sourceEmoji, sourceLabel, targetEmoji, targetLabel, onWin,
}: {
  sourceEmoji: string; sourceLabel: string;
  targetEmoji: string; targetLabel: string;
  onWin: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 60, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [done, setDone] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  // Target position: bottom-right area
  const targetPos = { x: 320, y: 180 };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        x: Math.max(0, Math.min(rect.width - 50, e.clientX - rect.left - offset.current.x)),
        y: Math.max(0, Math.min(rect.height - 50, e.clientY - rect.top - offset.current.y)),
      });
    };
    const handleUp = (e: MouseEvent) => {
      setIsDragging(false);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = (e.clientX - rect.left) - (targetPos.x + 30);
      const dy = (e.clientY - rect.top) - (targetPos.y + 30);
      if (Math.sqrt(dx * dx + dy * dy) < 55) {
        setDone(true);
        setPos({ x: targetPos.x, y: targetPos.y });
        onWin();
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, onWin]);

  return (
    <div ref={containerRef} className={styles.gameCanvas}>
      <div className={styles.dropTarget}
        style={{ position: 'absolute', left: targetPos.x - 10, top: targetPos.y - 10, width: 80, height: 80 }}>
        <span className={styles.dropEmoji}>{targetEmoji}</span>
        <span className={styles.dropLabel}>{targetLabel}</span>
      </div>
      <div
        className={`${styles.dragPiece} ${isDragging ? styles.dragging : ''} ${done ? styles.placed : ''}`}
        style={{ left: pos.x, top: pos.y }}
        onMouseDown={(e) => {
          if (done) return;
          const rect = e.currentTarget.getBoundingClientRect();
          offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          setIsDragging(true);
          e.preventDefault();
        }}>
        <span className={styles.pieceEmoji}>{sourceEmoji}</span> {sourceLabel}
      </div>
    </div>
  );
}

// ─── 5. Click-to-Repel Flick ────────────────────────────────────────────────

export function RepelFlickGame({
  objectEmoji, startPos, targetPos, targetRadius, targetEmoji, targetLabel, gravity, onWin,
}: {
  objectEmoji: string;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  targetRadius: number;
  targetEmoji: string;
  targetLabel: string;
  gravity: number;
  onWin: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ ...startPos });
  const velRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef(0);
  const animRef = useRef(false);
  const resolvedRef = useRef(false);
  const [renderState, setRenderState] = useState({ x: startPos.x, y: startPos.y, rot: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [hit, setHit] = useState(false);

  // Clean up old ripples
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => setRipples(prev => prev.slice(1)), 500);
    return () => clearTimeout(timer);
  }, [ripples]);

  // Physics loop
  const startPhysics = useCallback(() => {
    if (animRef.current) return;
    animRef.current = true;

    const loop = () => {
      if (!animRef.current || resolvedRef.current) return;

      velRef.current.y += gravity;
      velRef.current.x *= 0.997;
      velRef.current.y *= 0.997;

      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;

      rotRef.current += velRef.current.x * 1.5;

      // Wall bounces (sides and top)
      if (posRef.current.x < 0) { posRef.current.x = 0; velRef.current.x *= -0.4; }
      if (posRef.current.x > 400) { posRef.current.x = 400; velRef.current.x *= -0.4; }
      if (posRef.current.y < -20) { posRef.current.y = -20; velRef.current.y *= -0.3; }

      // Target check
      const cx = posRef.current.x + 20;
      const cy = posRef.current.y + 20;
      const dx = cx - targetPos.x;
      const dy = cy - targetPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < targetRadius) {
        resolvedRef.current = true;
        animRef.current = false;
        setHit(true);
        onWin();
        return;
      }

      // Off bottom — reset to start (allow retry within timer)
      if (posRef.current.y > 300) {
        posRef.current = { ...startPos };
        velRef.current = { x: 0, y: 0 };
        rotRef.current = 0;
        animRef.current = false;
        setRenderState({ x: startPos.x, y: startPos.y, rot: 0 });
        return;
      }

      setRenderState({ x: posRef.current.x, y: posRef.current.y, rot: rotRef.current });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [gravity, targetPos, targetRadius, startPos, onWin]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (resolvedRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const objCX = posRef.current.x + 20;
    const objCY = posRef.current.y + 20;

    const dx = objCX - clickX;
    const dy = objCY - clickY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return;

    const force = Math.min(18, 12 / Math.max(distance / 60, 0.3));
    velRef.current.x += (dx / distance) * force;
    velRef.current.y += (dy / distance) * force;

    setRipples(prev => [...prev.slice(-3), { x: clickX, y: clickY, id: Date.now() + Math.random() }]);

    startPhysics();
  }, [startPhysics]);

  return (
    <div ref={containerRef} className={styles.flickCanvas} onClick={handleClick}>
      <div className={styles.flickTarget} style={{ left: targetPos.x - 24, top: targetPos.y - 24 }}>
        <span>{targetEmoji}</span>
        <span className={styles.flickTargetLabel}>{targetLabel}</span>
      </div>
      <div
        className={`${styles.flickObject} ${hit ? styles.launched : ''}`}
        style={{ left: renderState.x, top: renderState.y, transform: `rotate(${renderState.rot}deg)` }}
      >
        {objectEmoji}
      </div>
      {ripples.map(r => (
        <div key={r.id} className={styles.clickRipple} style={{ left: r.x, top: r.y }} />
      ))}
      {hit && <div className={styles.flickHitFlash}>✨</div>}
    </div>
  );
}

// ─── 6. Avoid / Dodge (wave-based difficulty, movement patterns) ─────────

type MovementPattern = 'horizontal' | 'inward' | 'vertical';
interface Obstacle { x: number; y: number; vx: number; vy: number; emoji: string }

function spawnObstacle(
  emoji: string, speed: number, pattern: MovementPattern,
): Obstacle {
  switch (pattern) {
    case 'horizontal': {
      const fromLeft = Math.random() > 0.5;
      return {
        x: fromLeft ? -20 : 460,
        y: 30 + Math.random() * 200,
        vx: (fromLeft ? 1 : -1) * speed * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * speed * 0.15,
        emoji,
      };
    }
    case 'inward': {
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number;
      switch (side) {
        case 0: x = 40 + Math.random() * 360; y = -20; break;
        case 1: x = 460; y = 30 + Math.random() * 200; break;
        case 2: x = 40 + Math.random() * 360; y = 280; break;
        default: x = -20; y = 30 + Math.random() * 200; break;
      }
      const centerX = 220, centerY = 130;
      const dx = centerX - x, dy = centerY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        x, y,
        vx: (dx / dist) * speed * 0.5,
        vy: (dy / dist) * speed * 0.5,
        emoji,
      };
    }
    case 'vertical': {
      return {
        x: 20 + Math.random() * 400,
        y: -20 - Math.random() * 40,
        vx: (Math.random() - 0.5) * speed * 0.15,
        vy: speed * (0.4 + Math.random() * 0.4),
        emoji,
      };
    }
  }
}

export function AvoidGame({
  playerEmoji, obstacleEmoji, baseCount, baseSpeed, movementPattern, onFail,
}: {
  playerEmoji: string;
  obstacleEmoji: string;
  baseCount: number;
  baseSpeed: number;
  movementPattern: MovementPattern;
  onFail: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const playerPos = useRef({ x: 220, y: 130 });
  const [renderTick, setRenderTick] = useState(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const failedRef = useRef(false);

  useEffect(() => {
    // Wave 1: slow sparse obstacles
    const wave1Speed = baseSpeed * 0.6;
    const obs: Obstacle[] = [];
    for (let i = 0; i < baseCount; i++) {
      const o = spawnObstacle(obstacleEmoji, wave1Speed, movementPattern);
      // For vertical pattern all obstacles spawn above the canvas (-20 to -60),
      // making the game look empty for 6+ seconds. Stagger initial y positions
      // so ~2/3 of obstacles are already visible at the top of the canvas.
      if (movementPattern === 'vertical') {
        o.y = -20 + (i / baseCount) * 70; // spreads -20 … 26 (safe: player at y=130)
      }
      obs.push(o);
    }
    obstaclesRef.current = obs;

    // Wave 2 after 3s: +2 obstacles, medium speed
    const wave2 = setTimeout(() => {
      if (failedRef.current) return;
      const speed = baseSpeed * 0.85;
      for (let i = 0; i < 2; i++) {
        obstaclesRef.current.push(spawnObstacle(obstacleEmoji, speed, movementPattern));
      }
    }, 3000);

    // Wave 3 after 6s: +2 obstacles, faster
    const wave3 = setTimeout(() => {
      if (failedRef.current) return;
      const speed = baseSpeed * 1.1;
      for (let i = 0; i < 2; i++) {
        obstaclesRef.current.push(spawnObstacle(obstacleEmoji, speed, movementPattern));
      }
    }, 6000);

    let running = true;
    let lastRender = 0;
    const loop = (time: number) => {
      if (!running || failedRef.current) return;

      for (const o of obstaclesRef.current) {
        o.x += o.vx;
        o.y += o.vy;

        // Respawn/wrap based on pattern
        switch (movementPattern) {
          case 'horizontal':
            if (o.y < 0 || o.y > 250) o.vy *= -1;
            if (o.x > 460) { o.x = -20; o.y = 30 + Math.random() * 200; }
            if (o.x < -20) { o.x = 460; o.y = 30 + Math.random() * 200; }
            break;
          case 'inward':
            // Passed through center and went off the other side — respawn from edge
            if (o.x < -30 || o.x > 470 || o.y < -30 || o.y > 290) {
              const fresh = spawnObstacle(obstacleEmoji, baseSpeed * 0.7, movementPattern);
              o.x = fresh.x; o.y = fresh.y; o.vx = fresh.vx; o.vy = fresh.vy;
            }
            break;
          case 'vertical':
            if (o.y > 280) { o.y = -20; o.x = 20 + Math.random() * 400; }
            break;
        }
      }

      // Collision check
      const px = playerPos.current.x;
      const py = playerPos.current.y;
      for (const o of obstaclesRef.current) {
        const dx = px - o.x;
        const dy = py - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          failedRef.current = true;
          onFail();
          return;
        }
      }

      // Throttle renders to ~30fps
      if (time - lastRender > 33) {
        lastRender = time;
        setRenderTick(t => t + 1);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => { running = false; clearTimeout(wave2); clearTimeout(wave3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCount, baseSpeed, obstacleEmoji, movementPattern, onFail]);

  // Track mouse
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      playerPos.current = {
        x: Math.max(14, Math.min(426, e.clientX - rect.left)),
        y: Math.max(14, Math.min(246, e.clientY - rect.top)),
      };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  void renderTick; // used to trigger re-render

  return (
    <div ref={canvasRef} className={styles.dodgeCanvas}>
      <div className={styles.dodgePlayer}
        style={{ transform: `translate(${playerPos.current.x - 14}px, ${playerPos.current.y - 14}px)` }}>
        {playerEmoji}
      </div>
      {obstaclesRef.current.map((o, i) => (
        <div key={i} className={styles.dodgeObstacle}
          style={{ transform: `translate(${o.x - 11}px, ${o.y - 11}px)` }}>
          {o.emoji}
        </div>
      ))}
    </div>
  );
}

// ─── 7. Bubble Pop (selective tap — slow drift) ─────────────────────────────

interface BubbleItem { text: string; bad: boolean }

export function BubblePopGame({
  items, onWin, onFail,
}: {
  items: BubbleItem[]; onWin: () => void; onFail: () => void;
}) {
  const [bubbles] = useState(() =>
    items.map((item, i) => ({
      ...item,
      id: i,
      x: 20 + (i % 4) * 100 + Math.random() * 20,
      y: 20 + Math.floor(i / 4) * 80 + Math.random() * 15,
      vx: 0.03 + Math.random() * 0.05,   // gentle rightward drift
      vy: (Math.random() - 0.5) * 0.02,   // near-zero vertical
    }))
  );
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const resolvedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef(bubbles.map(b => ({ x: b.x, y: b.y })));
  const [, forceRender] = useState(0);

  // Animate drift (very slow, like lazy clouds)
  useEffect(() => {
    let running = true;
    let lastRender = 0;
    const loop = (time: number) => {
      if (!running) return;
      positionsRef.current.forEach((pos, i) => {
        pos.x += bubbles[i].vx;
        pos.y += bubbles[i].vy;
        if (pos.x < 0 || pos.x > 380) bubbles[i].vx *= -1;
        if (pos.y < 0 || pos.y > 210) bubbles[i].vy *= -1;
      });
      if (time - lastRender > 50) {
        lastRender = time;
        forceRender(t => t + 1);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, []);

  const handlePop = useCallback((idx: number) => {
    if (resolvedRef.current || popped.has(idx)) return;
    const item = bubbles[idx];
    if (!item.bad) {
      // Popped a good one = fail
      resolvedRef.current = true;
      setPopped(prev => new Set(prev).add(idx));
      onFail();
      return;
    }
    const newPopped = new Set(popped).add(idx);
    setPopped(newPopped);
    // Check if all bad ones popped
    const allBadPopped = bubbles.every(b => !b.bad || newPopped.has(b.id));
    if (allBadPopped) {
      resolvedRef.current = true;
      onWin();
    }
  }, [popped, bubbles, onWin, onFail]);

  return (
    <div ref={containerRef} className={styles.bubbleField}>
      {bubbles.map((b, i) => (
        <div key={b.id}
          className={`${styles.bubble} ${b.bad ? styles.bubbleBad : styles.bubbleGood} ${popped.has(b.id) ? styles.bubblePopped : ''}`}
          style={{ left: positionsRef.current[i].x, top: positionsRef.current[i].y }}
          onClick={() => handlePop(b.id)}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}

// ─── 8. Connect Dots ────────────────────────────────────────────────────────

export function ConnectDotsGame({
  dots, onWin,
}: {
  dots: { x: number; y: number }[]; onWin: () => void;
}) {
  const [currentDot, setCurrentDot] = useState(0);

  const handleClick = (idx: number) => {
    if (idx !== currentDot) return;
    const next = currentDot + 1;
    setCurrentDot(next);
    if (next >= dots.length) onWin();
  };

  return (
    <div className={styles.drawCanvas}>
      <svg className={styles.drawSvg}>
        {dots.slice(0, currentDot).map((dot, i) => {
          if (i === 0) return null;
          const prev = dots[i - 1];
          return (
            <line key={i} x1={prev.x + 18} y1={prev.y + 18} x2={dot.x + 18} y2={dot.y + 18}
              stroke="var(--color-mint)" strokeWidth="3" strokeLinecap="round" />
          );
        })}
      </svg>
      {dots.map((dot, i) => (
        <div key={i}
          className={`${styles.dotMarker} ${
            i < currentDot ? styles.dotDone :
            i === currentDot ? styles.dotNext :
            styles.dotWaiting
          }`}
          style={{ left: dot.x, top: dot.y }}
          onClick={() => handleClick(i)}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

// ─── 9. Drag Line (A → B) ──────────────────────────────────────────────────

export function DragLineGame({
  startPos, endPos, startLabel, endLabel, onWin,
}: {
  startPos: { x: number; y: number }; endPos: { x: number; y: number };
  startLabel: string; endLabel: string; onWin: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const handleUp = (e: MouseEvent) => {
      setIsDragging(false);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = (e.clientX - rect.left) - (endPos.x + 22);
      const dy = (e.clientY - rect.top) - (endPos.y + 22);
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        setConnected(true);
        setDragPos(null);
        onWin();
      } else {
        setDragPos(null);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, endPos, onWin]);

  return (
    <div ref={containerRef} className={styles.drawCanvas}>
      <svg className={styles.drawSvg}>
        {(isDragging && dragPos) && (
          <line x1={startPos.x + 22} y1={startPos.y + 22} x2={dragPos.x} y2={dragPos.y}
            stroke="var(--color-sky)" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
        )}
        {connected && (
          <line x1={startPos.x + 22} y1={startPos.y + 22} x2={endPos.x + 22} y2={endPos.y + 22}
            stroke="var(--color-mint)" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
      <div className={`${styles.dragLineDot} ${styles.dragLineStart}`}
        style={{ left: startPos.x, top: startPos.y }}
        onMouseDown={(e) => { if (!connected) { setIsDragging(true); e.preventDefault(); } }}>
        {startLabel}
      </div>
      <div className={`${styles.dragLineDot} ${styles.dragLineEnd} ${connected ? styles.dragLineConnected : ''}`}
        style={{ left: endPos.x, top: endPos.y }}>
        {endLabel}
      </div>
    </div>
  );
}

// ─── 10. Timing Meter ───────────────────────────────────────────────────────

export function TimingMeterGame({
  sweetSpotStart, sweetSpotEnd, speed, label, onWin, onFail,
}: {
  sweetSpotStart: number; sweetSpotEnd: number; speed: number;
  label: string; onWin: () => void; onFail: () => void;
}) {
  const [needlePos, setNeedlePos] = useState(0);
  const [clicked, setClicked] = useState(false);
  const dirRef = useRef(1);

  useEffect(() => {
    if (clicked) return;
    const interval = setInterval(() => {
      setNeedlePos(prev => {
        let next = prev + dirRef.current * speed;
        if (next >= 1) { next = 1; dirRef.current = -1; }
        if (next <= 0) { next = 0; dirRef.current = 1; }
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [clicked, speed]);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    if (needlePos >= sweetSpotStart && needlePos <= sweetSpotEnd) {
      onWin();
    } else {
      onFail();
    }
  };

  return (
    <div className={styles.meterWrap} onClick={handleClick}>
      <div className={styles.meterLabel}>{label}</div>
      <div className={styles.meterTrack}>
        <div className={styles.meterSweetSpot}
          style={{ left: `${sweetSpotStart * 100}%`, width: `${(sweetSpotEnd - sweetSpotStart) * 100}%` }} />
        <div className={styles.meterNeedle} style={{ left: `${needlePos * 100}%` }} />
      </div>
    </div>
  );
}

// ─── 11. Rapid Click ────────────────────────────────────────────────────────

export function RapidClickGame({
  targetClicks, emoji, label, onWin,
}: {
  targetClicks: number; emoji: string; label: string; onWin: () => void;
}) {
  const [clicks, setClicks] = useState(0);
  const wonRef = useRef(false);

  const handleClick = () => {
    if (wonRef.current) return;
    const next = clicks + 1;
    setClicks(next);
    if (next >= targetClicks) {
      wonRef.current = true;
      onWin();
    }
  };

  return (
    <div className={styles.rapidWrap}>
      <div className={styles.rapidTarget} onClick={handleClick}>{emoji}</div>
      <div className={styles.rapidMeter}>
        <div className={styles.rapidFill} style={{ width: `${(clicks / targetClicks) * 100}%` }} />
      </div>
      <div className={styles.rapidCount}>{label}: {clicks}/{targetClicks}</div>
    </div>
  );
}

// ─── 12. Tap Pattern ────────────────────────────────────────────────────────

export function TapPatternGame({
  pattern, emojis, onWin, onFail,
}: {
  pattern: number[]; emojis: string[]; onWin: () => void; onFail: () => void;
}) {
  const [phase, setPhase] = useState<'showing' | 'input'>('showing');
  const [showIdx, setShowIdx] = useState(0);
  const [inputIdx, setInputIdx] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);

  // Show pattern — 1s flash, 750ms gap, 2s pause before input
  useEffect(() => {
    if (phase !== 'showing') return;
    if (showIdx >= pattern.length) {
      setTimeout(() => setPhase('input'), 2000);
      return;
    }
    setFlashIdx(pattern[showIdx]);
    const timer = setTimeout(() => {
      setFlashIdx(null);
      setTimeout(() => setShowIdx(s => s + 1), 750);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, showIdx, pattern]);

  const handleTap = (idx: number) => {
    if (phase !== 'input') return;
    if (idx === pattern[inputIdx]) {
      setFlashIdx(idx);
      setTimeout(() => setFlashIdx(null), 150);
      const next = inputIdx + 1;
      setInputIdx(next);
      if (next >= pattern.length) onWin();
    } else {
      setWrongIdx(idx);
      setTimeout(() => setWrongIdx(null), 300);
      onFail();
    }
  };

  return (
    <div className={styles.patternWrap}>
      <div className={styles.patternStatus}>
        {phase === 'showing' ? 'Watch the pattern...' : 'Your turn!'}
      </div>
      <div className={styles.patternDots}>
        {emojis.map((emoji, i) => (
          <div key={i}
            className={`${styles.patternDot} ${
              flashIdx === i ? styles.patternDotFlash :
              wrongIdx === i ? styles.patternDotWrong :
              (phase === 'input' && i < inputIdx && pattern[i] !== undefined) ? styles.patternDotCorrect : ''
            }`}
            onClick={() => handleTap(i)}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 13. Hold Button ────────────────────────────────────────────────────────

export function HoldButtonGame({
  holdDuration, emoji, label, onWin, onFail,
}: {
  holdDuration: number; emoji: string; label: string;
  onWin: () => void; onFail: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdStart = useRef(0);
  const wonRef = useRef(false);
  const circumference = 2 * Math.PI * 56;

  useEffect(() => {
    if (!isHolding || wonRef.current) return;
    holdStart.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      const pct = Math.min(1, elapsed / holdDuration);
      setProgress(pct);
      if (pct >= 1) {
        wonRef.current = true;
        clearInterval(interval);
        onWin();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [isHolding, holdDuration, onWin]);

  const handleRelease = () => {
    if (wonRef.current) return;
    setIsHolding(false);
    if (progress < 1) {
      onFail();
    }
  };

  return (
    <div className={styles.holdWrap}>
      <div className={styles.holdLabel}>{label}</div>
      <div
        className={`${styles.holdTarget} ${isHolding ? styles.holding : ''}`}
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
      >
        <svg className={styles.holdRingSvg} viewBox="0 0 124 124">
          <circle className={styles.holdRingBg} cx="62" cy="62" r="56" />
          <circle className={styles.holdRingFill} cx="62" cy="62" r="56"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)} />
        </svg>
        {emoji}
      </div>
    </div>
  );
}

// ─── 14. Layer Search ───────────────────────────────────────────────────────

export function LayerSearchGame({
  layers, targetEmoji, onWin,
}: {
  layers: { emoji: string; label: string; color: string }[];
  targetEmoji: string;
  onWin: () => void;
}) {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [found, setFound] = useState(false);
  const allRemoved = removed.size >= layers.length;

  const handleClick = (idx: number) => {
    if (found || removed.has(idx)) return;
    setRemoved(prev => new Set(prev).add(idx));
  };

  useEffect(() => {
    if (allRemoved && !found) {
      setFound(true);
      setTimeout(onWin, 400);
    }
  }, [allRemoved, found, onWin]);

  return (
    <div className={styles.layerStack}>
      {/* Target hidden underneath */}
      {allRemoved && (
        <div className={`${styles.layer} ${styles.layerTarget}`}
          style={{ left: 80, top: 60, width: 120, height: 80, background: 'rgba(168,230,207,0.2)' }}
          onClick={onWin}>
          <span className={styles.layerEmoji}>{targetEmoji}</span> Found!
        </div>
      )}
      {/* Layers stacked on top */}
      {layers.map((layer, i) => (
        <div key={i}
          className={`${styles.layer} ${removed.has(i) ? styles.layerRemoved : ''}`}
          style={{
            left: 20 + (i % 3) * 30,
            top: 10 + i * 20,
            width: 180 + (i % 2) * 40,
            height: 65,
            background: layer.color,
            zIndex: layers.length - i,
          }}
          onClick={() => handleClick(i)}>
          <span className={styles.layerEmoji}>{layer.emoji}</span> {layer.label}
        </div>
      ))}
    </div>
  );
}

// ─── 15. Tab Close ──────────────────────────────────────────────────────────

export function TabCloseGame({
  tabs, onWin, onFail,
}: {
  tabs: { label: string; isWork: boolean; icon: string }[];
  onWin: () => void; onFail: () => void;
}) {
  const [closed, setClosed] = useState<Set<number>>(new Set());
  const wonRef = useRef(false);

  const handleClose = (idx: number) => {
    if (wonRef.current || closed.has(idx)) return;
    const tab = tabs[idx];
    if (tab.isWork) {
      // Closed the work tab = fail
      onFail();
      return;
    }
    const newClosed = new Set(closed).add(idx);
    setClosed(newClosed);
    // Check if all non-work tabs closed
    const allDistractorsClosed = tabs.every((t, i) => t.isWork || newClosed.has(i));
    if (allDistractorsClosed) {
      wonRef.current = true;
      onWin();
    }
  };

  return (
    <div className={styles.tabGameWrap}>
      <div className={styles.tabBar}>
        {tabs.map((tab, i) => (
          <div key={i} className={`${styles.tab} ${tab.isWork ? styles.tabWork : ''} ${closed.has(i) ? styles.tabClosed : ''}`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {!tab.isWork && (
              <button className={styles.tabClose} onClick={() => handleClose(i)}>×</button>
            )}
          </div>
        ))}
      </div>
      <div className={styles.tabContent}>
        {wonRef.current ? '✅ Focus mode!' : 'Close the distractions!'}
      </div>
    </div>
  );
}

// ─── 16. Spin Stop ──────────────────────────────────────────────────────────

export function SpinStopGame({
  targetAngle, tolerance, emoji, onWin, onFail,
}: {
  targetAngle: number; tolerance: number; emoji: string;
  onWin: () => void; onFail: () => void;
}) {
  const angleRef = useRef(0);
  const [displayAngle, setDisplayAngle] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [stopped, setStopped] = useState(false);
  const speedRef = useRef(4);

  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      angleRef.current = (angleRef.current + speedRef.current) % 360;
      setDisplayAngle(angleRef.current);
    }, 16);
    return () => clearInterval(interval);
  }, [spinning]);

  const handleClick = () => {
    if (!spinning || stopped) return;
    setSpinning(false);
    setStopped(true);
    // Check using ref for instant, non-stale angle
    const diff = Math.abs(((angleRef.current - targetAngle + 540) % 360) - 180);
    if (diff < tolerance) {
      onWin();
    } else {
      onFail();
    }
  };

  // Draw target zone arc
  const startAngle = targetAngle - tolerance;
  const endAngle = targetAngle + tolerance;
  const r = 87;
  const cx = 90;
  const cy = 90;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = tolerance * 2 > 180 ? 1 : 0;

  return (
    <div className={styles.spinWrap}>
      <div className={styles.spinCircle} onClick={handleClick}>
        <svg className={styles.spinTargetZone} viewBox="0 0 180 180">
          <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill="rgba(168,230,207,0.25)" stroke="var(--color-mint)" strokeWidth="2" />
        </svg>
        <div className={styles.spinNeedle} style={{ transform: `translate(-50%, -100%) rotate(${displayAngle}deg)` }} />
        <div className={styles.spinEmoji}>{emoji}</div>
      </div>
      <div className={styles.spinLabel}>{spinning ? 'Click to stop!' : (stopped ? 'Stopped!' : '')}</div>
    </div>
  );
}

// ─── 17. Spin Build (click to add momentum, decelerates to target) ─────────

export function SpinBuildGame({
  targetAngle, tolerance, emoji, themeLabel, onWin, onFail,
}: {
  targetAngle: number; tolerance: number; emoji: string;
  themeLabel?: string;
  onWin: () => void; onFail: () => void;
}) {
  const angleRef = useRef(0);
  const speedRef = useRef(0);
  const peakSpeedRef = useRef(0);
  const resolvedRef = useRef(false);
  const [displayAngle, setDisplayAngle] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);

  // Physics loop
  useEffect(() => {
    let running = true;
    const friction = 0.988;

    const loop = () => {
      if (!running || resolvedRef.current) return;

      speedRef.current *= friction;
      angleRef.current = (angleRef.current + speedRef.current + 360) % 360;

      if (speedRef.current > peakSpeedRef.current) {
        peakSpeedRef.current = speedRef.current;
      }

      // Always sync display BEFORE the win check so the visual angle
      // matches exactly what is being evaluated — prevents the case where
      // the needle looks inside the green zone but the checked angle is
      // one frame ahead and just outside it.
      setDisplayAngle(angleRef.current);
      setDisplaySpeed(speedRef.current);

      // Check if it was spinning and has now stopped (0.03 ≈ 1.8 deg/s — visually still).
      // Use >= 1.5 because peakSpeedRef is set in handleClick (at exactly 1.5 for a single click).
      if (peakSpeedRef.current >= 1.5 && speedRef.current < 0.03) {
        resolvedRef.current = true;
        const diff = Math.abs(((angleRef.current - targetAngle + 540) % 360) - 180);
        if (diff < tolerance) {
          onWin();
        } else {
          onFail();
        }
        return;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [targetAngle, tolerance, onWin, onFail]);

  const handleClick = () => {
    if (resolvedRef.current) return;

    // Immediately check if the needle is inside the win zone at this exact moment.
    // This rewards timing: if the green zone is under the needle when you click, you win.
    const diff = Math.abs(((angleRef.current - targetAngle + 540) % 360) - 180);
    if (diff < tolerance) {
      resolvedRef.current = true;
      speedRef.current = 0; // freeze the display
      onWin();
      return;
    }

    // Not in the zone — add spin momentum and try again.
    speedRef.current += 1.5;
    // Record peak before friction runs so the stop-check threshold (>= 1.5) is met.
    if (speedRef.current > peakSpeedRef.current) {
      peakSpeedRef.current = speedRef.current;
    }
  };

  // Draw target zone arc
  const startAng = targetAngle - tolerance;
  const endAng = targetAngle + tolerance;
  const r = 87;
  const cx = 90;
  const cy = 90;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(toRad(startAng));
  const y1 = cy + r * Math.sin(toRad(startAng));
  const x2 = cx + r * Math.cos(toRad(endAng));
  const y2 = cy + r * Math.sin(toRad(endAng));
  const largeArc = tolerance * 2 > 180 ? 1 : 0;

  const speedLabel = displaySpeed < 0.1 ? 'Click to spin!' :
    displaySpeed < 0.8 ? 'Click in the green zone!' :
    displaySpeed < 3 ? 'Click to stop in the zone!' : 'Spinning!';

  return (
    <div className={styles.spinWrap}>
      {themeLabel && <div className={styles.spinThemeLabel}>{themeLabel}</div>}
      <div className={styles.spinCircle} onClick={handleClick}>
        <svg className={styles.spinTargetZone} viewBox="0 0 180 180">
          <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill="rgba(168,230,207,0.25)" stroke="var(--color-mint)" strokeWidth="2" />
        </svg>
        <div className={styles.spinNeedle} style={{ transform: `translate(-50%, -100%) rotate(${displayAngle}deg)` }} />
        <div className={styles.spinEmoji}>{emoji}</div>
      </div>
      <div className={styles.spinLabel}>{speedLabel}</div>
    </div>
  );
}

// ─── 18. Typo Find ───────────────────────────────────────────────────────────

export function TypoFindGame({
  words, typoIndex, onWin, onFail,
}: {
  words: string[]; typoIndex: number;
  onWin: (meta?: { elapsedMs?: number }) => void;
  onFail: (meta?: { wrongPicks?: number }) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());

  const handleClick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === typoIndex) {
      setTimeout(() => onWin({ elapsedMs: Date.now() - startTimeRef.current }), 400);
    } else {
      setTimeout(() => onFail({ wrongPicks: 1 }), 400);
    }
  };

  return (
    <div className={styles.typoWrap}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`${styles.typoWord} ${
            picked === i
              ? i === typoIndex ? styles.typoCorrect : styles.typoWrong
              : picked !== null && i === typoIndex ? styles.typoCorrect : ''
          }`}
          onClick={() => handleClick(i)}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

// ─── 19. Spot Difference ─────────────────────────────────────────────────────

interface SpotPanel { emoji: string; lines: string[] }

export function SpotDifferenceGame({
  panelA, panelB, errorPanel, onWin, onFail,
}: {
  panelA: SpotPanel; panelB: SpotPanel; errorPanel: 'A' | 'B';
  onWin: (meta?: { elapsedMs?: number }) => void;
  onFail: (meta?: { wrongPicks?: number }) => void;
}) {
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const startTimeRef = useRef(Date.now());

  const handleClick = (panel: 'A' | 'B') => {
    if (picked !== null) return;
    setPicked(panel);
    if (panel === errorPanel) {
      setTimeout(() => onWin({ elapsedMs: Date.now() - startTimeRef.current }), 500);
    } else {
      setTimeout(() => onFail({ wrongPicks: 1 }), 500);
    }
  };

  const renderPanel = (panel: SpotPanel, id: 'A' | 'B') => (
    <div
      className={`${styles.spotPanel} ${
        picked === id
          ? id === errorPanel ? styles.spotCorrect : styles.spotWrong
          : ''
      }`}
      onClick={() => handleClick(id)}
    >
      <div className={styles.spotEmoji}>{panel.emoji}</div>
      {panel.lines.map((line, i) => (
        <div key={i} className={styles.spotLine}>{line}</div>
      ))}
    </div>
  );

  return (
    <div className={styles.spotWrap}>
      {renderPanel(panelA, 'A')}
      {renderPanel(panelB, 'B')}
    </div>
  );
}

// ─── 20. Swipe Game ──────────────────────────────────────────────────────────

interface SwipeItem { emoji: string; label: string; correct: 'left' | 'right' }

export function SwipeGame({
  items, leftLabel, rightLabel, onWin, onFail,
}: {
  items: SwipeItem[];
  leftLabel?: string; rightLabel?: string;
  onWin: () => void;
  onFail: (meta?: { wrongPicks?: number }) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const resolvedRef = useRef(false);
  const wrongRef = useRef(0);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (resolvedRef.current || currentIdx >= items.length) return;
    const item = items[currentIdx];
    setExitDir(dir);
    if (dir !== item.correct) {
      resolvedRef.current = true;
      wrongRef.current += 1;
      setTimeout(() => onFail({ wrongPicks: wrongRef.current }), 400);
      return;
    }
    setTimeout(() => {
      setExitDir(null);
      const next = currentIdx + 1;
      if (next >= items.length) {
        resolvedRef.current = true;
        onWin();
      } else {
        setCurrentIdx(next);
      }
    }, 300);
  }, [currentIdx, items, onWin, onFail]);

  const item = items[currentIdx];
  if (!item) return null;

  return (
    <div className={styles.swipeWrap}>
      <div className={styles.swipeProgress}>{currentIdx + 1} / {items.length}</div>
      <div className={`${styles.swipeCard} ${exitDir === 'left' ? styles.swipeExitLeft : exitDir === 'right' ? styles.swipeExitRight : ''}`}>
        <span className={styles.swipeEmoji}>{item.emoji}</span>
        <span className={styles.swipeLabel}>{item.label}</span>
      </div>
      <div className={styles.swipeBtns}>
        <button className={`${styles.swipeBtn} ${styles.swipeLeft}`} onClick={() => handleSwipe('left')}>
          {leftLabel || 'Nope'}
        </button>
        <button className={`${styles.swipeBtn} ${styles.swipeRight}`} onClick={() => handleSwipe('right')}>
          {rightLabel || 'Yes'}
        </button>
      </div>
    </div>
  );
}
