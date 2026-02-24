import type { ReactElement } from 'react';
import type { TeamMember } from '../../types/campaign';

export type GamePhase = 'ready' | 'playing' | 'result' | 'complete';
export type WaitPhase = 'concepting' | 'generating';

export type MechanicCategory =
  | 'click' | 'drag' | 'flick' | 'avoid'
  | 'draw' | 'timing' | 'physical' | 'puzzle' | 'hold';

export interface GameDef {
  id: string;
  instruction: string;
  duration: number;
  category: MechanicCategory;
  waitPhase: WaitPhase | 'both';
  /** If true, surviving the full timer = win (dodge/avoid games) */
  survivorGame?: boolean;
  /** Selection weight — higher = more likely to be picked (default 1.0) */
  weight?: number;
  render: (onWin: () => void, onFail: () => void, member: TeamMember) => ReactElement;
  winMsg: (m: TeamMember) => string;
  failMsg: (m: TeamMember) => string;
}
