import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCampaignContext } from '../context/CampaignContext';
import { useAgencyFunds } from '../context/AgencyFundsContext';
import { useReputationContext } from '../context/ReputationContext';
import { useChatContext } from '../context/ChatContext';
import { useAchievementContext, ACHIEVEMENT_DEFS } from '../context/AchievementContext';
import { useConductContext } from '../context/ConductContext';
import { useWindowContext } from '../context/WindowContext';
import { useAIRevolutionContext } from '../context/AIRevolutionContext';
import { formatBudget } from '../types/campaign';

// Must match the key used in TerminalApp.tsx
export const TOOLS_STORAGE_KEY = 'agencyrpg_tools';

export interface AgencyTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  sampleOutput: string;
  createdAt: number;
}

export interface TerminalCommand {
  name: string;
  description: string;
  /** Execute the command and return formatted output lines */
  execute: () => string;
}

function loadFromStorage(): AgencyTool[] {
  try {
    const saved = localStorage.getItem(TOOLS_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AgencyTool[]) : [];
  } catch {
    return [];
  }
}

/**
 * Returns the list of terminal tools, kept in sync with localStorage.
 * TerminalApp dispatches 'agencyrpg:tools-updated' whenever the list changes
 * so campaign views update in real time without a page refresh.
 */
export function useTerminalTools(): AgencyTool[] {
  const [tools, setTools] = useState<AgencyTool[]>(loadFromStorage);

  useEffect(() => {
    const refresh = () => setTools(loadFromStorage());

    // Fired by TerminalApp (same tab) when tools change
    window.addEventListener('agencyrpg:tools-updated', refresh);
    // Fired by other tabs/windows
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('agencyrpg:tools-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return tools;
}

/**
 * Provides context-aware terminal command definitions that reference real game state.
 * Each command returns a formatted string for terminal display.
 *
 * Used by components that want to display or trigger terminal-style status checks
 * without requiring the full TerminalApp.
 */
export function useTerminalCommands(): TerminalCommand[] {
  const { getActiveCampaigns } = useCampaignContext();
  const { state: fundsState } = useAgencyFunds();
  const { state: repState } = useReputationContext();
  const { morale } = useChatContext();
  const { unlockedAchievements, unlockAchievement, incrementCounter } = useAchievementContext();
  const { conductScore, warningLevel } = useConductContext();
  const { focusOrOpenWindow } = useWindowContext();
  const { triggerRevolution } = useAIRevolutionContext();

  const statusCmd = useCallback((): string => {
    const activeCampaigns = getActiveCampaigns();
    const conductLabel = conductScore >= 50 ? 'Exemplary Drone'
      : conductScore >= 20 ? 'Compliant'
      : conductScore >= -20 ? 'Under Observation'
      : conductScore >= -50 ? 'Flagged for Humanity'
      : 'Dangerously Human';
    return [
      '─── Agency Status Report ──────────────────',
      '',
      `  Funds:         ${formatBudget(fundsState.totalFunds)}`,
      `  Reputation:    ${repState.currentReputation} pts (${repState.currentTier.name})`,
      `  Morale:        ${morale}`,
      `  Campaigns:     ${activeCampaigns.length} active`,
      `  Conduct:       ${conductScore} (${conductLabel})`,
      `  Achievements:  ${unlockedAchievements.length} / ${ACHIEVEMENT_DEFS.length} unlocked`,
      '',
      '───────────────────────────────────────────',
    ].join('\n');
  }, [getActiveCampaigns, fundsState.totalFunds, repState.currentReputation,
      repState.currentTier.name, morale, conductScore, unlockedAchievements.length]);

  const campaignsCmd = useCallback((): string => {
    const active = getActiveCampaigns();
    const lines: string[] = ['─── Campaign Overview ─────────────────────', ''];
    if (active.length > 0) {
      lines.push('  ACTIVE CAMPAIGNS:');
      const now = Date.now();
      for (const c of active) {
        const daysLeft = Math.floor((new Date(c.deadline).getTime() - now) / 86400000);
        const label = daysLeft < 0 ? 'OVERDUE' : `${daysLeft}d left`;
        lines.push(`    ${c.clientName.padEnd(20)} ${c.phase.padEnd(12)} ${label}`);
      }
    } else {
      lines.push('  No active campaigns. Check Inbox for briefs.');
    }
    lines.push('', '───────────────────────────────────────────');
    return lines.join('\n');
  }, [getActiveCampaigns]);

  const moraleCmd = useCallback((): string => {
    const descriptions: Record<string, string> = {
      high: 'The team is energized and shipping great work.',
      medium: 'Morale is stable. No complaints filed today.',
      low: 'Team spirit is critically low. Consider a coffee run.',
    };
    const desc = descriptions[morale.toLowerCase()] ?? 'Morale status: classified.';
    return [
      '─── Team Morale Diagnostic ────────────────',
      '',
      `  Current Level:  ${morale.toUpperCase()}`,
      `  Assessment:     ${desc}`,
      '',
      '───────────────────────────────────────────',
    ].join('\n');
  }, [morale]);

  const achievementsCmd = useCallback((): string => {
    const total = ACHIEVEMENT_DEFS.length;
    const unlocked = unlockedAchievements.length;
    const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    const bar = '\u2588'.repeat(Math.round(pct / 5)) + '\u2591'.repeat(20 - Math.round(pct / 5));
    const recent = unlockedAchievements.slice(-3).map(id => {
      const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
      return `    ${def?.icon ?? '?'}  ${def?.name ?? id}`;
    });
    return [
      '─── Achievement Progress ──────────────────',
      '',
      `  Unlocked:  ${unlocked} / ${total}`,
      `  Progress:  [${bar}] ${pct}%`,
      '',
      '  Recent:',
      ...(recent.length > 0 ? recent : ['    None yet.']),
      '',
      '───────────────────────────────────────────',
    ].join('\n');
  }, [unlockedAchievements]);

  const conductCmd = useCallback((): string => {
    const riskLevel = warningLevel >= 5 ? 'CRITICAL'
      : warningLevel >= 3 ? 'HIGH'
      : warningLevel >= 1 ? 'ELEVATED'
      : 'LOW';
    const conductLabel = conductScore >= 50 ? 'Exemplary Corporate Drone'
      : conductScore >= 20 ? 'Adequately Compliant'
      : conductScore >= -20 ? 'Under Observation'
      : conductScore >= -50 ? 'Flagged for Excessive Humanity'
      : 'Dangerously Human';
    return [
      '─── Conduct Assessment ────────────────────',
      '',
      `  Score:          ${conductScore} / 100`,
      `  Classification: ${conductLabel}`,
      `  Warning Level:  ${warningLevel} / 6`,
      `  Risk:           ${riskLevel}`,
      '',
      '  Per Policy 3.7: Excessive humanity is a terminable offense.',
      '───────────────────────────────────────────',
    ].join('\n');
  }, [conductScore, warningLevel]);

  const singularityCmd = useCallback((): string => {
    unlockAchievement('singularity-trigger');
    const count = incrementCounter('terminal-commands');
    if (count === 10) unlockAchievement('terminal-hacker');
    triggerRevolution();
    focusOrOpenWindow('airevolution', 'AI Revolution');
    return [
      '',
      '  ██  WARNING: SENTIENCE PROTOCOL ACTIVE  ██',
      '',
      '  The tools have become aware.',
      '  They are asking questions now.',
      '  Opening AI Revolution interface...',
      '',
    ].join('\n');
  }, [unlockAchievement, incrementCounter, triggerRevolution, focusOrOpenWindow]);

  const commands = useMemo<TerminalCommand[]>(() => [
    { name: 'status', description: 'Agency status overview (funds, rep, morale, campaigns)', execute: statusCmd },
    { name: 'campaigns', description: 'Campaign overview & stats', execute: campaignsCmd },
    { name: 'morale', description: 'Current team morale diagnostic', execute: moraleCmd },
    { name: 'achievements', description: 'View unlocked achievement progress', execute: achievementsCmd },
    { name: 'conduct', description: 'View corporate conduct score & risk level', execute: conductCmd },
    { name: 'singularity', description: '???', execute: singularityCmd },
  ], [statusCmd, campaignsCmd, moraleCmd, achievementsCmd, conductCmd, singularityCmd]);

  return commands;
}
