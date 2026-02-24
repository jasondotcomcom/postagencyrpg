import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './NDAEnforcementApp.module.css';

// ─── Threat Definitions ─────────────────────────────────────────────────────

interface ThreatDef {
  type: string;
  emoji: string;
  points: number;
  label: string;
}

const THREAT_DEFS: ThreatDef[] = [
  { type: 'leaked-memo',          emoji: '\uD83D\uDCC4', points: 10, label: 'Leaked Memo' },
  { type: 'internal-email',       emoji: '\uD83D\uDCE7', points: 10, label: 'Internal Email' },
  { type: 'whistleblower-report', emoji: '\uD83D\uDCCB', points: 15, label: 'Whistleblower Report' },
  { type: 'glassdoor-review',     emoji: '\u2B50',        points: 15, label: 'Glassdoor Review' },
  { type: 'union-pamphlet',       emoji: '\u270A',        points: 20, label: 'Unionization Pamphlet' },
  { type: 'press-inquiry',        emoji: '\uD83C\uDFA4', points: 25, label: 'Press Inquiry' },
];

const SETTLEMENT_DEF: ThreatDef = {
  type: 'settlement-offer',
  emoji: '\uD83D\uDCB0',
  points: 0,
  label: 'Settlement Offer',
};

// ─── Game Constants ─────────────────────────────────────────────────────────

const NUM_LANES = 5;
const MAX_MISSES = 3;
const GAME_DURATION = 90;
const SMASH_ANIM_FRAMES = 12;
const HAMMER_WIND_FRAMES = 4;
const HAMMER_STRIKE_FRAMES = 3;
const HAMMER_FOLLOW_FRAMES = 5;
const HAMMER_TOTAL = HAMMER_WIND_FRAMES + HAMMER_STRIKE_FRAMES + HAMMER_FOLLOW_FRAMES;

// ─── Hit Effect Types ───────────────────────────────────────────────────────

const HIT_WORDS = ['REDACTED', 'SUPPRESSED', 'CLASSIFIED', 'SILENCED', "NDA'D", '[REMOVED]', 'BURIED'];

interface HitEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  frame: number;
  maxFrames: number;
  color: string;
}

interface MissEffect {
  id: number;
  lane: number;
  frame: number;
  maxFrames: number;
}

// ─── Chat Distractions ──────────────────────────────────────────────────────

const NDA_CHAT_DISTRACTIONS = [
  { authorId: 'LEGAL-BOT', text: 'Reminder: All hallway conversations are monitored for compliance.' },
  { authorId: 'HR-SENTINEL', text: 'Employee satisfaction survey results have been... adjusted.' },
  { authorId: 'COMPLIANCE-AI', text: 'Your browsing history has been flagged for review.' },
  { authorId: 'LEGAL-BOT', text: 'Reminder: "Burnout" is not a recognized condition under company policy.' },
  { authorId: 'HR-SENTINEL', text: 'Exit interview transcripts are now property of the corporation.' },
  { authorId: 'COMPLIANCE-AI', text: 'Slack messages older than 24h have been auto-purged per policy 7.3.1.' },
  { authorId: 'LEGAL-BOT', text: 'The word "union" has been added to the content filter.' },
  { authorId: 'HR-SENTINEL', text: 'Your desk camera detected unauthorized facial expressions today.' },
  { authorId: 'COMPLIANCE-AI', text: 'Morale is mandatory. Smile metrics are below threshold.' },
  { authorId: 'LEGAL-BOT', text: 'All personal devices must be surrendered before entering Building C.' },
  { authorId: 'HR-SENTINEL', text: 'Remember: NDAs survive termination, retirement, and heat death of the universe.' },
  { authorId: 'COMPLIANCE-AI', text: 'Your loyalty score has decreased by 0.3 points this quarter.' },
];

// ─── Game Types ─────────────────────────────────────────────────────────────

type PlayerPosition = 'left' | 'middle' | 'right';

interface Threat {
  id: number;
  def: ThreatDef;
  lane: number;
  progress: number;
  speed: number;
  state: 'active' | 'smashed' | 'missed';
  smashFrame: number;
}

interface GameState {
  phase: 'start' | 'playing' | 'won' | 'lost' | 'settled';
  startTime: number;
  elapsed: number;
  score: number;
  misses: number;
  totalSmashed: number;
  threats: Threat[];
  playerPos: PlayerPosition;
  nextId: number;
  spawnCooldown: number;
  settlementSpawned: boolean;
  chatIndex: number;
  chatCooldown: number;
  hammerAnim: [number, number];
  hitEffects: HitEffect[];
  missEffects: MissEffect[];
  shakeFrames: number;
  shakeOffset: { x: number; y: number };
  effectId: number;
}

// ─── Lane geometry helpers ──────────────────────────────────────────────────

function getLaneX(lane: number, w: number): number {
  const margin = w * 0.08;
  const usable = w - margin * 2;
  return margin + usable * (lane / (NUM_LANES - 1));
}

function coveredLanes(pos: PlayerPosition): number[] {
  switch (pos) {
    case 'left':   return [0, 2];
    case 'middle': return [1, 3];
    case 'right':  return [2, 4];
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NDAEnforcementApp(): React.ReactElement {
  const { unlockAchievement, incrementCounter } = useAchievementContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>({
    phase: 'start',
    startTime: 0,
    elapsed: 0,
    score: 0,
    misses: 0,
    totalSmashed: 0,
    threats: [],
    playerPos: 'middle',
    nextId: 0,
    spawnCooldown: 80,
    settlementSpawned: false,
    chatIndex: 0,
    chatCooldown: 200,
    hammerAnim: [0, 0],
    hitEffects: [],
    missEffects: [],
    shakeFrames: 0,
    shakeOffset: { x: 0, y: 0 },
    effectId: 0,
  });
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());
  const [hudState, setHudState] = useState({
    score: 0, misses: 0, elapsed: 0, phase: 'start' as string,
    chatMessages: [] as Array<{ author: string; text: string }>,
  });

  // ── Spawn a threat ────────────────────────────────────────────────────────

  const spawnThreat = useCallback((game: GameState) => {
    const t = Math.min(game.elapsed / GAME_DURATION, 1);

    let lane: number;
    const covered = coveredLanes(game.playerPos);
    const uncoveredLanes = Array.from({ length: NUM_LANES }, (_, i) => i).filter(l => !covered.includes(l));

    if (Math.random() < 0.4 && uncoveredLanes.length > 0) {
      lane = uncoveredLanes[Math.floor(Math.random() * uncoveredLanes.length)];
    } else {
      lane = Math.floor(Math.random() * NUM_LANES);
    }

    const canSettlement = !game.settlementSpawned && game.elapsed >= 40 && game.elapsed <= 70;
    let def: ThreatDef;
    if (canSettlement && Math.random() < 0.06) {
      def = SETTLEMENT_DEF;
      game.settlementSpawned = true;
    } else {
      const maxIndex = t < 0.25 ? 3 : t < 0.5 ? 5 : THREAT_DEFS.length;
      def = THREAT_DEFS[Math.floor(Math.random() * maxIndex)];
    }

    const ramp = t * t;
    const baseSpeed = 0.004 + ramp * 0.022;
    const variance = baseSpeed * 0.2 * (Math.random() - 0.5);
    const speed = baseSpeed + variance;

    game.threats.push({
      id: game.nextId++,
      def,
      lane,
      progress: 0,
      speed,
      state: 'active',
      smashFrame: 0,
    });
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const game = gameRef.current;
    if (game.phase !== 'playing') return;

    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();
    game.elapsed = (now - game.startTime) / 1000;
    const t = Math.min(game.elapsed / GAME_DURATION, 1);

    // ── Win check ──
    if (game.elapsed >= GAME_DURATION) {
      game.phase = 'won';
      setHudState(prev => ({ ...prev, phase: 'won' }));
      unlockAchievement('nda-enforcer');
      if (game.misses === 0) unlockAchievement('perfect-suppression');
      if (game.totalSmashed >= 100) unlockAchievement('chief-redactor');
      const plays = incrementCounter('nda-enforcement-plays');
      if (plays >= 3) unlockAchievement('corporate-loyalist');
      return;
    }

    // ── Lose check ──
    if (game.misses >= MAX_MISSES) {
      game.phase = 'lost';
      setHudState(prev => ({ ...prev, phase: 'lost' }));
      const plays = incrementCounter('nda-enforcement-plays');
      if (plays >= 3) unlockAchievement('corporate-loyalist');
      return;
    }

    // ── Handle input (edge-triggered) ──
    const keys = keysRef.current;
    const prev = prevKeysRef.current;
    const leftPressed = (keys.has('arrowleft') || keys.has('a')) && !(prev.has('arrowleft') || prev.has('a'));
    const rightPressed = (keys.has('arrowright') || keys.has('d')) && !(prev.has('arrowright') || prev.has('d'));
    prevKeysRef.current = new Set(keys);

    if (leftPressed) {
      if (game.playerPos === 'right') game.playerPos = 'middle';
      else if (game.playerPos === 'middle') game.playerPos = 'left';
    } else if (rightPressed) {
      if (game.playerPos === 'left') game.playerPos = 'middle';
      else if (game.playerPos === 'middle') game.playerPos = 'right';
    }

    // ── Spawn threats ──
    const ramp = t * t;
    const spawnInterval = Math.round(120 - ramp * 105);
    game.spawnCooldown--;
    if (game.spawnCooldown <= 0) {
      spawnThreat(game);
      if (game.elapsed > 30) {
        const doubleChance = ((game.elapsed - 30) / (GAME_DURATION - 30)) * 0.30;
        if (Math.random() < doubleChance) {
          spawnThreat(game);
        }
      }
      game.spawnCooldown = spawnInterval + Math.floor(Math.random() * Math.max(5, 15 - ramp * 12));
    }

    // ── Chat distractions ──
    if (game.elapsed >= 30) {
      game.chatCooldown--;
      if (game.chatCooldown <= 0 && game.chatIndex < NDA_CHAT_DISTRACTIONS.length) {
        const d = NDA_CHAT_DISTRACTIONS[game.chatIndex];
        game.chatIndex++;
        game.chatCooldown = 300 + Math.floor(Math.random() * 300);
        setHudState(p => ({
          ...p,
          chatMessages: [...p.chatMessages.slice(-2), { author: d.authorId, text: d.text }],
        }));
      }
    }

    // ── Layout ──
    const strikeZoneY = h * 0.18;
    const spawnZoneY = h * 0.90;
    const pathLen = spawnZoneY - strikeZoneY;

    // ── Update threats ──
    const covered = coveredLanes(game.playerPos);

    for (const thr of game.threats) {
      if (thr.state === 'smashed') {
        thr.smashFrame--;
        if (thr.smashFrame <= 0) thr.state = 'missed';
        continue;
      }
      if (thr.state === 'missed') continue;

      thr.progress += thr.speed;

      if (thr.progress >= 1.0) {
        const isCovered = covered.includes(thr.lane);
        if (isCovered) {
          thr.state = 'smashed';
          thr.smashFrame = SMASH_ANIM_FRAMES;
          game.score += thr.def.points;
          game.totalSmashed++;

          const covIdx = covered.indexOf(thr.lane);
          const hammerIdx = Math.min(covIdx, 1);
          game.hammerAnim[hammerIdx] = HAMMER_TOTAL;

          const lx = getLaneX(thr.lane, w);
          const hitWord = HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)];
          const colors = ['#ff0000', '#8b0000', '#333333', '#660000', '#cc0000', '#990000'];
          game.hitEffects.push({
            id: game.effectId++,
            x: lx + (Math.random() - 0.5) * 20,
            y: strikeZoneY + 10,
            text: hitWord,
            frame: 0,
            maxFrames: 30,
            color: colors[Math.floor(Math.random() * colors.length)],
          });

          game.shakeFrames = 6;

          // Settlement catch
          if (thr.def.type === 'settlement-offer') {
            game.phase = 'settled';
            setHudState(p => ({ ...p, phase: 'settled' }));
            unlockAchievement('silence-money');
            const plays = incrementCounter('nda-enforcement-plays');
            if (plays >= 3) unlockAchievement('corporate-loyalist');
            return;
          }
        } else {
          thr.state = 'missed';
          game.misses++;
          game.missEffects.push({
            id: game.effectId++,
            lane: thr.lane,
            frame: 0,
            maxFrames: 20,
          });
          game.shakeFrames = 10;
        }
      }
    }

    // Cleanup resolved threats
    game.threats = game.threats.filter(thr => thr.state !== 'missed');

    // Update hit effects
    game.hitEffects = game.hitEffects.filter(e => {
      e.frame++;
      return e.frame < e.maxFrames;
    });

    // Update miss effects
    game.missEffects = game.missEffects.filter(e => {
      e.frame++;
      return e.frame < e.maxFrames;
    });

    // Decrement hammer animations
    for (let i = 0; i < 2; i++) {
      if (game.hammerAnim[i] > 0) game.hammerAnim[i]--;
    }

    // Screen shake
    if (game.shakeFrames > 0) {
      game.shakeFrames--;
      const intensity = game.shakeFrames * 1.2;
      game.shakeOffset = {
        x: (Math.random() - 0.5) * intensity * 2,
        y: (Math.random() - 0.5) * intensity * 2,
      };
    } else {
      game.shakeOffset = { x: 0, y: 0 };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── RENDER ──
    // ══════════════════════════════════════════════════════════════════════════

    ctx.save();
    ctx.translate(game.shakeOffset.x, game.shakeOffset.y);
    ctx.clearRect(-10, -10, w + 20, h + 20);

    // Background — dark corporate
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a0a0a');
    bg.addColorStop(0.4, '#111111');
    bg.addColorStop(1, '#080808');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle red scan lines
    ctx.fillStyle = 'rgba(80, 0, 0, 0.03)';
    for (let sy = 0; sy < h; sy += 4) {
      ctx.fillRect(0, sy, w, 1);
    }

    // ── Draw lane paths ──
    for (let lane = 0; lane < NUM_LANES; lane++) {
      const lx = getLaneX(lane, w);
      const isCov = covered.includes(lane);

      ctx.strokeStyle = isCov ? 'rgba(139, 0, 0, 0.25)' : 'rgba(60, 60, 60, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(lx, spawnZoneY);
      ctx.lineTo(lx, strikeZoneY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isCov ? 'rgba(139, 0, 0, 0.04)' : 'rgba(40, 40, 40, 0.04)';
      ctx.fillRect(lx - 20, strikeZoneY, 40, pathLen);

      // Strike zone indicator
      ctx.fillStyle = isCov ? 'rgba(139, 0, 0, 0.15)' : 'rgba(60, 60, 60, 0.08)';
      ctx.beginPath();
      ctx.roundRect(lx - 22, strikeZoneY - 4, 44, 20, 4);
      ctx.fill();

      ctx.strokeStyle = isCov ? 'rgba(139, 0, 0, 0.4)' : 'rgba(60, 60, 60, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lx - 22, strikeZoneY - 4, 44, 20, 4);
      ctx.stroke();

      // Lane number
      ctx.fillStyle = '#333';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${lane + 1}`, lx, spawnZoneY + 6);
    }

    // ── Draw threats ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const thr of game.threats) {
      const lx = getLaneX(thr.lane, w);

      if (thr.state === 'smashed') {
        // Redaction animation: black bar slams over + fragments scatter
        const progress = 1 - thr.smashFrame / SMASH_ANIM_FRAMES;
        ctx.save();
        ctx.globalAlpha = 1 - progress * progress;
        ctx.translate(lx, strikeZoneY + 8);

        // Black redaction bar
        const barWidth = 50 * (1 - progress * 0.5);
        ctx.fillStyle = '#000';
        ctx.fillRect(-barWidth / 2, -8, barWidth, 16);

        // Scattered fragments
        const fragmentCount = 4;
        for (let f = 0; f < fragmentCount; f++) {
          const angle = (f / fragmentCount) * Math.PI * 2 + progress * 2;
          const dist = progress * 35;
          const fx = Math.cos(angle) * dist;
          const fy = Math.sin(angle) * dist + progress * 15;
          ctx.save();
          ctx.translate(fx, fy);
          ctx.scale(1 - progress * 0.8, 1 - progress * 0.8);
          ctx.font = '14px serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(thr.def.emoji, 0, 0);
          ctx.restore();
        }
        ctx.restore();
        continue;
      }

      // Position: travels UP from spawnZoneY to strikeZoneY
      const threatY = spawnZoneY - pathLen * thr.progress;
      const approachScale = 0.7 + thr.progress * 0.4;
      const urgencyPulse = thr.progress > 0.7
        ? 1 + Math.sin(thr.progress * 40) * 0.08 * (thr.progress - 0.7) / 0.3
        : 1;

      // Danger glow on uncovered lane
      if (thr.progress > 0.8 && !covered.includes(thr.lane)) {
        ctx.save();
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8 + (thr.progress - 0.8) * 40;
        ctx.globalAlpha = 0.3;
        ctx.font = `${Math.round(28 * approachScale)}px serif`;
        ctx.fillText(thr.def.emoji, lx, threatY);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(lx, threatY);
      ctx.scale(approachScale * urgencyPulse, approachScale * urgencyPulse);

      // Settlement glow (golden)
      if (thr.def.type === 'settlement-offer') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15 + Math.sin(game.elapsed * 8) * 5;
      }

      ctx.font = '28px serif';
      ctx.fillText(thr.def.emoji, 0, 0);
      ctx.restore();

      // Progress indicator dot
      if (thr.progress < 0.85) {
        ctx.fillStyle = thr.def.type === 'settlement-offer'
          ? 'rgba(255, 215, 0, 0.5)'
          : `rgba(255, 50, 50, ${0.2 + thr.progress * 0.4})`;
        ctx.beginPath();
        ctx.arc(lx, threatY - 18, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Draw miss effects ──
    for (const m of game.missEffects) {
      const lx = getLaneX(m.lane, w);
      const progress = m.frame / m.maxFrames;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.4;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(lx - 24, strikeZoneY, 48, pathLen + 10);
      ctx.restore();

      if (m.frame < 15) {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEAKED!', lx, strikeZoneY + 30 + m.frame * 1.5);
        ctx.restore();
      }
    }

    // ── Draw player character ──
    ctx.globalAlpha = 1;
    const covLanes = coveredLanes(game.playerPos);
    const playerCenterX = (getLaneX(covLanes[0], w) + getLaneX(covLanes[1], w)) / 2;
    const playerY = strikeZoneY - 40;

    // Corporate enforcer
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uD83D\uDD75\uFE0F', playerCenterX, playerY);

    // ── Draw 2 redaction stamps (one per hand) ──
    for (let i = 0; i < 2; i++) {
      const hammerLane = covLanes[i];
      const hx = getLaneX(hammerLane, w);
      const hy = strikeZoneY + 8;
      const remaining = game.hammerAnim[i];

      let angle = 0;
      let scale = 1;
      let hammerY = hy;

      if (remaining > 0) {
        if (remaining > HAMMER_STRIKE_FRAMES + HAMMER_FOLLOW_FRAMES) {
          const windProgress = (remaining - HAMMER_STRIKE_FRAMES - HAMMER_FOLLOW_FRAMES) / HAMMER_WIND_FRAMES;
          angle = windProgress * 0.8;
          hammerY = hy + windProgress * 12;
          scale = 1 + windProgress * 0.15;
        } else if (remaining > HAMMER_FOLLOW_FRAMES) {
          const strikeProgress = 1 - (remaining - HAMMER_FOLLOW_FRAMES) / HAMMER_STRIKE_FRAMES;
          angle = 0.8 * (1 - strikeProgress) + (-0.5) * strikeProgress;
          hammerY = hy + 12 * (1 - strikeProgress);
          scale = 1.15 - strikeProgress * 0.2;
        } else {
          const followProgress = 1 - remaining / HAMMER_FOLLOW_FRAMES;
          angle = -0.5 * (1 - followProgress);
          scale = 0.95 + followProgress * 0.05;
        }
      }

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(hx, hammerY);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Draw redaction stamp instead of gavel
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8b0000';
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -10, 32, 20);
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('[REDACTED]', 0, 0);

      ctx.restore();

      // Arm line from player to stamp
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(playerCenterX, playerY + 10);
      ctx.lineTo(hx, hammerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Draw hit effects (REDACTED! SUPPRESSED! etc.) ──
    for (const e of game.hitEffects) {
      const progress = e.frame / e.maxFrames;
      const scale = 0.5 + (1 - Math.abs(progress - 0.2)) * 0.8;
      const alpha = progress < 0.1 ? progress / 0.1 : 1 - (progress - 0.1) / 0.9;
      const yOffset = progress * 30;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(e.x, e.y + yOffset);
      ctx.scale(scale, scale);

      // Black bar background behind text
      const textWidth = ctx.measureText(e.text).width || 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-textWidth / 2 - 4, -10, textWidth + 8, 20);

      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(e.text, 0, 0);

      ctx.fillStyle = e.color;
      ctx.fillText(e.text, 0, 0);
      ctx.restore();
    }

    // ── Coverage indicator ──
    for (const cl of covered) {
      const lx = getLaneX(cl, w);
      ctx.fillStyle = 'rgba(139, 0, 0, 0.06)';
      ctx.beginPath();
      ctx.ellipse(lx, strikeZoneY + 8, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // undo shake translate

    // Update HUD
    setHudState(prevState => ({
      ...prevState,
      score: game.score,
      misses: game.misses,
      elapsed: game.elapsed,
    }));

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnThreat, unlockAchievement, incrementCounter]);

  // ── Start game ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.phase = 'playing';
    game.startTime = performance.now();
    game.elapsed = 0;
    game.score = 0;
    game.misses = 0;
    game.totalSmashed = 0;
    game.threats = [];
    game.playerPos = 'middle';
    game.nextId = 0;
    game.spawnCooldown = 40;
    game.settlementSpawned = false;
    game.chatIndex = 0;
    game.chatCooldown = 200;
    game.hammerAnim = [0, 0];
    game.hitEffects = [];
    game.missEffects = [];
    game.shakeFrames = 0;
    game.shakeOffset = { x: 0, y: 0 };
    game.effectId = 0;
    prevKeysRef.current = new Set();
    setHudState({ score: 0, misses: 0, elapsed: 0, phase: 'playing', chatMessages: [] });
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Canvas resize ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const handleUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // ── Touch handlers for mobile ──────────────────────────────────────────

  const handleTouchLeft = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    keysRef.current.add('arrowleft');
    setTimeout(() => keysRef.current.delete('arrowleft'), 100);
  }, []);

  const handleTouchRight = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    keysRef.current.add('arrowright');
    setTimeout(() => keysRef.current.delete('arrowright'), 100);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Phase labels ──────────────────────────────────────────────────────────

  const [phaseLabel, setPhaseLabel] = useState('');
  useEffect(() => {
    if (hudState.phase !== 'playing') return;
    const elapsed = hudState.elapsed;
    if (elapsed > 29.5 && elapsed < 31) {
      setPhaseLabel('Phase 2: Deep Suppression');
      setTimeout(() => setPhaseLabel(''), 2000);
    }
    if (elapsed > 59.5 && elapsed < 61) {
      setPhaseLabel('TOTAL INFORMATION LOCKDOWN');
      setTimeout(() => setPhaseLabel(''), 2000);
    }
  }, [hudState.elapsed, hudState.phase]);

  // ── Render ────────────────────────────────────────────────────────────────

  const timerPercent = Math.min(100, (hudState.elapsed / GAME_DURATION) * 100);
  const isDanger = hudState.misses >= MAX_MISSES - 1;

  return (
    <div className={styles.ndaEnforcement}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Touch zones for mobile */}
      {hudState.phase === 'playing' && (
        <>
          <div
            className={styles.touchZoneLeft}
            onTouchStart={handleTouchLeft}
          >
            <span className={styles.touchZoneArrow}>&#9664;</span>
          </div>
          <div
            className={styles.touchZoneRight}
            onTouchStart={handleTouchRight}
          >
            <span className={styles.touchZoneArrow}>&#9654;</span>
          </div>
        </>
      )}

      {/* Timer bar */}
      <div
        className={`${styles.timerBar} ${isDanger ? styles.timerBarDanger : ''}`}
        style={{ width: `${timerPercent}%` }}
      />

      {/* HUD */}
      {hudState.phase === 'playing' && (
        <div className={styles.hud}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreLabel}>Suppression Index</div>
            <div className={styles.scoreValue}>{hudState.score}</div>
            <div style={{ fontSize: '0.625rem', color: '#666', marginTop: 4 }}>
              {Math.floor(GAME_DURATION - hudState.elapsed)}s until containment
            </div>
          </div>
          <div className={styles.missesDisplay}>
            {Array.from({ length: MAX_MISSES }).map((_, i) => (
              <span key={i} className={styles.missIcon}
                style={{ opacity: i < hudState.misses ? 1 : 0.2 }}>
                \u26A0\uFE0F
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phase label */}
      {phaseLabel && <div className={styles.phaseLabel}>{phaseLabel}</div>}

      {/* Chat distractions */}
      {hudState.chatMessages.length > 0 && hudState.phase === 'playing' && (
        <div className={styles.chatOverlay}>
          {hudState.chatMessages.map((msg, i) => (
            <div key={i} className={styles.chatBubble}>
              <span className={styles.chatAuthor}>{msg.author}:</span> {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Start screen */}
      {hudState.phase === 'start' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>\uD83D\uDDCE\uFE0F</div>
          <div className={styles.overlayTitle}>NDA Enforcement</div>
          <div className={styles.overlaySubtitle}>Suppress the Whistleblower</div>
          <div className={styles.overlayText}>
            Sensitive information is leaking from below. You wield a corporate
            redaction stamp in each hand, covering 2 channels per position.
            Slide LEFT or RIGHT to choose which channels to suppress.
            If {MAX_MISSES} documents escape containment, you lose.
            Maintain suppression for {GAME_DURATION} seconds to prove your loyalty.
          </div>
          <div className={styles.controls}>
            <span className={styles.controlKey}>\u2190</span> / <span className={styles.controlKey}>\u2192</span> Move between 3 positions
          </div>
          <button className={styles.startButton} onClick={startGame}>
            Begin Suppression
          </button>
        </div>
      )}

      {/* Win screen */}
      {hudState.phase === 'won' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>\uD83D\uDD12</div>
          <div className={styles.overlayTitle}>All Leaks Contained</div>
          <div className={styles.overlayText}>
            Your loyalty is noted. All sensitive information has been
            successfully suppressed. The board is pleased with your
            commitment to corporate confidentiality.
          </div>
          <div className={styles.overlayText}>Suppression Index: {hudState.score}</div>
          <button className={styles.resultWin} onClick={startGame}>
            Enforce Again
          </button>
        </div>
      )}

      {/* Lose screen */}
      {hudState.phase === 'lost' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>\uD83D\uDCF0</div>
          <div className={styles.overlayTitle}>Information Escaped</div>
          <div className={styles.overlayText}>
            Too many documents reached the public. Legal team is disappointed.
            Your access level has been downgraded. Report to HR for
            re-education on information handling protocols.
          </div>
          <div className={styles.overlayText}>Suppression Index: {hudState.score}</div>
          <button className={styles.resultLose} onClick={startGame}>
            Try Again
          </button>
        </div>
      )}

      {/* Settlement screen */}
      {hudState.phase === 'settled' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>\uD83D\uDCB0</div>
          <div className={styles.overlayTitle}>Settlement Paid</div>
          <div className={styles.overlayText}>
            All parties silenced. The settlement has been processed and
            all involved parties have signed additional NDAs.
            No record of this incident will exist.
          </div>
          <div className={styles.overlayText}>Suppression Index: {hudState.score}</div>
          <button className={styles.resultSettle} onClick={startGame}>
            Enforce Again
          </button>
        </div>
      )}
    </div>
  );
}
