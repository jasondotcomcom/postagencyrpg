import React, { useMemo } from 'react';
import styles from './MobileCommandBar.module.css';

const DEFAULT_COMMANDS = ['help', 'status', 'brief', 'list', 'build'];

const ALL_COMMANDS = [
  'help', 'status', 'brief', 'team', 'list',
  'build', 'run', 'delete', 'clear',
];

interface MobileCommandBarProps {
  inputValue: string;
  onSelectCommand: (command: string) => void;
  toolNames: string[];
}

export default function MobileCommandBar({
  inputValue,
  onSelectCommand,
  toolNames,
}: MobileCommandBarProps): React.ReactElement {
  const suggestions = useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();

    // Empty input: show defaults
    if (!trimmed) {
      return DEFAULT_COMMANDS;
    }

    // Filter matching commands and tool names
    const matches: string[] = [];

    // Match built-in commands
    for (const cmd of ALL_COMMANDS) {
      if (cmd.startsWith(trimmed) && cmd !== trimmed) {
        matches.push(cmd);
      }
    }

    // If input starts with "run " or "delete ", suggest matching tool names
    if (trimmed.startsWith('run ') || trimmed.startsWith('delete ')) {
      const prefix = trimmed.split(' ')[0] + ' ';
      const partial = trimmed.slice(prefix.length);
      for (const name of toolNames) {
        if (!partial || name.toLowerCase().startsWith(partial)) {
          matches.push(`${prefix}${name}`);
        }
      }
    } else {
      // Also suggest tool names if partial matches
      for (const name of toolNames) {
        if (name.toLowerCase().startsWith(trimmed)) {
          matches.push(`run ${name}`);
        }
      }
    }

    return matches.slice(0, 8);
  }, [inputValue, toolNames]);

  if (suggestions.length === 0) return <></>;

  return (
    <div className={styles.commandBar}>
      <div className={styles.commandScroll}>
        {suggestions.map((cmd) => (
          <button
            key={cmd}
            className={styles.commandPill}
            onClick={() => onSelectCommand(cmd)}
            type="button"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
