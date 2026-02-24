import React from 'react';

/**
 * Icon map for mobile shell components.
 * Duplicated here because the Desktop icons constant is not exported
 * and we cannot modify existing PostAgencyRPG files.
 */
export const icons: Record<string, React.ReactElement> = {
  inbox: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="8" y="16" width="32" height="24" rx="4" fill="#a8d8ea"/>
      <rect x="8" y="16" width="32" height="24" rx="4" stroke="#7fc4dc" strokeWidth="2"/>
      <rect x="14" y="24" width="20" height="3" rx="1.5" fill="#7fc4dc"/>
      <rect x="36" y="12" width="3" height="16" rx="1" fill="#ff9a8b"/>
      <path d="M39 12 L39 20 L46 16 Z" fill="#ff9a8b"/>
      <rect x="16" y="30" width="16" height="10" rx="2" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <path d="M16 32 L24 37 L32 32" stroke="#ffb7b2" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="14" r="2" fill="#ffeaa7"/>
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="36" rx="4" fill="#a8e6cf"/>
      <rect x="8" y="8" width="32" height="36" rx="4" stroke="#7ed3b2" strokeWidth="2"/>
      <rect x="18" y="4" width="12" height="8" rx="2" fill="#7ed3b2"/>
      <rect x="20" y="6" width="8" height="4" rx="1" fill="#fff"/>
      <rect x="14" y="18" width="20" height="4" rx="2" fill="#fff"/>
      <rect x="14" y="18" width="14" height="4" rx="2" fill="#ffb7b2"/>
      <rect x="14" y="26" width="20" height="4" rx="2" fill="#fff"/>
      <rect x="14" y="26" width="18" height="4" rx="2" fill="#a8d8ea"/>
      <rect x="14" y="34" width="20" height="4" rx="2" fill="#fff"/>
      <rect x="14" y="34" width="8" height="4" rx="2" fill="#c3aed6"/>
      <circle cx="36" cy="16" r="3" fill="#ffeaa7"/>
      <path d="M34 16 L35.5 17.5 L38 14.5" stroke="#7ed3b2" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M8 12 C8 8 12 6 16 6 L32 6 C36 6 40 8 40 12 L40 26 C40 30 36 32 32 32 L18 32 L12 40 L12 32 L16 32 C12 32 8 30 8 26 Z" fill="#ffb7b2"/>
      <path d="M8 12 C8 8 12 6 16 6 L32 6 C36 6 40 8 40 12 L40 26 C40 30 36 32 32 32 L18 32 L12 40 L12 32 C12 32 8 30 8 26 Z" stroke="#ff9a94" strokeWidth="2"/>
      <circle cx="18" cy="19" r="3" fill="#fff"/>
      <circle cx="26" cy="19" r="3" fill="#fff"/>
      <circle cx="34" cy="19" r="3" fill="#fff"/>
      <path d="M38 8 C40 6 43 7 43 10 C43 12 40 15 40 15 C40 15 37 12 37 10 C37 7 38 6 38 8 Z" fill="#ff9a8b"/>
    </svg>
  ),
  files: (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M6 16 L6 38 C6 40 8 42 10 42 L38 42 C40 42 42 40 42 38 L42 20 C42 18 40 16 38 16 L24 16 L20 12 L10 12 C8 12 6 14 6 16 Z" fill="#ffeaa7"/>
      <path d="M6 16 L6 38 C6 40 8 42 10 42 L38 42 C40 42 42 40 42 38 L42 20 C42 18 40 16 38 16 L24 16 L20 12 L10 12 C8 12 6 14 6 16 Z" stroke="#fddc6d" strokeWidth="2"/>
      <path d="M6 20 L42 20 L42 38 C42 40 40 42 38 42 L10 42 C8 42 6 40 6 38 Z" fill="#fff4cc"/>
      <path d="M24 28 L26 32 L30 32 L27 35 L28 39 L24 37 L20 39 L21 35 L18 32 L22 32 Z" fill="#ff9a8b"/>
      <circle cx="36" cy="26" r="2" fill="#a8e6cf"/>
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="6" y="8" width="36" height="28" rx="6" fill="#c3aed6"/>
      <rect x="6" y="8" width="36" height="28" rx="6" stroke="#a98fc4" strokeWidth="2"/>
      <rect x="10" y="12" width="28" height="20" rx="3" fill="#2d2d2d"/>
      <text x="14" y="24" fill="#a8e6cf" fontSize="10" fontFamily="monospace" fontWeight="bold">&gt;_</text>
      <rect x="26" y="18" width="8" height="2" rx="1" fill="#a8e6cf"/>
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#a98fc4"/>
      <rect x="16" y="40" width="16" height="3" rx="1.5" fill="#c3aed6"/>
      <circle cx="32" cy="26" r="1.5" fill="rgba(168, 230, 207, 0.3)"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="10" y="6" width="28" height="36" rx="4" fill="#ffeaa7"/>
      <rect x="10" y="6" width="28" height="36" rx="4" stroke="#fddc6d" strokeWidth="2"/>
      <circle cx="10" cy="12" r="2" fill="#ff9a8b"/>
      <circle cx="10" cy="20" r="2" fill="#ff9a8b"/>
      <circle cx="10" cy="28" r="2" fill="#ff9a8b"/>
      <circle cx="10" cy="36" r="2" fill="#ff9a8b"/>
      <rect x="16" y="14" width="18" height="2" rx="1" fill="#a8d8ea"/>
      <rect x="16" y="22" width="14" height="2" rx="1" fill="#c3aed6"/>
      <rect x="16" y="30" width="16" height="2" rx="1" fill="#ffb7b2"/>
      <rect x="30" y="32" width="12" height="4" rx="1" fill="#ffb7b2" transform="rotate(45 36 34)"/>
      <polygon points="28,42 30,38 32,40" fill="#fddc6d"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="4" fill="#fff"/>
      <rect x="6" y="10" width="36" height="32" rx="4" stroke="#a8e6cf" strokeWidth="2"/>
      <rect x="6" y="10" width="36" height="10" rx="4" fill="#a8e6cf"/>
      <rect x="14" y="6" width="4" height="10" rx="2" fill="#7ed3b2"/>
      <rect x="30" y="6" width="4" height="10" rx="2" fill="#7ed3b2"/>
      <circle cx="16" cy="28" r="3" fill="#e0e0e0"/>
      <circle cx="24" cy="28" r="3" fill="#e0e0e0"/>
      <circle cx="32" cy="28" r="3" fill="#ffb7b2"/>
      <circle cx="16" cy="36" r="3" fill="#e0e0e0"/>
      <circle cx="24" cy="36" r="3" fill="#a8d8ea"/>
      <circle cx="32" cy="36" r="3" fill="#e0e0e0"/>
      <path d="M32 28 L33 30 L35 30 L33.5 31.5 L34 33.5 L32 32.5 L30 33.5 L30.5 31.5 L29 30 L31 30 Z" fill="#fff"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" fill="#e8e8e8" stroke="#d0d0d0" strokeWidth="2"/>
      <circle cx="24" cy="24" r="5" fill="#fff"/>
      <rect x="22" y="4" width="4" height="8" rx="2" fill="#c3aed6"/>
      <rect x="22" y="36" width="4" height="8" rx="2" fill="#c3aed6"/>
      <rect x="4" y="22" width="8" height="4" rx="2" fill="#a8d8ea"/>
      <rect x="36" y="22" width="8" height="4" rx="2" fill="#a8d8ea"/>
      <rect x="8" y="8" width="4" height="8" rx="2" fill="#ffb7b2" transform="rotate(45 10 12)"/>
      <rect x="36" y="8" width="4" height="8" rx="2" fill="#ffb7b2" transform="rotate(-45 38 12)"/>
      <rect x="8" y="32" width="4" height="8" rx="2" fill="#a8e6cf" transform="rotate(-45 10 36)"/>
      <rect x="36" y="32" width="4" height="8" rx="2" fill="#a8e6cf" transform="rotate(45 38 36)"/>
      <circle cx="24" cy="24" r="2" fill="#c3aed6"/>
    </svg>
  ),
  portfolio: (
    <svg viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="36" rx="4" fill="#c3aed6"/>
      <rect x="8" y="8" width="32" height="36" rx="4" stroke="#a98fc4" strokeWidth="2"/>
      <rect x="8" y="8" width="6" height="36" rx="4" fill="#a98fc4"/>
      <rect x="18" y="14" width="18" height="3" rx="1.5" fill="#fff"/>
      <rect x="18" y="21" width="18" height="3" rx="1.5" fill="#ffeaa7"/>
      <rect x="18" y="28" width="12" height="3" rx="1.5" fill="#ffb7b2"/>
      <circle cx="36" cy="16" r="6" fill="#ffeaa7"/>
      <path d="M36 11 L37.2 14.2 L40.5 14.4 L38 16.6 L38.8 19.8 L36 18 L33.2 19.8 L34 16.6 L31.5 14.4 L34.8 14.2 Z" fill="#f7c948"/>
    </svg>
  ),
  help: (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M8 8 C8 8 24 6 24 6 C24 6 40 8 40 8 L40 40 C40 40 24 38 24 38 C24 38 8 40 8 40 Z" fill="#c3aed6"/>
      <path d="M8 8 C8 8 24 6 24 6 C24 6 40 8 40 8 L40 40 C40 40 24 38 24 38 C24 38 8 40 8 40 Z" stroke="#a98fc4" strokeWidth="2"/>
      <path d="M24 6 L24 38" stroke="#a98fc4" strokeWidth="2"/>
      <rect x="12" y="12" width="8" height="2" rx="1" fill="#fff"/>
      <rect x="12" y="18" width="6" height="2" rx="1" fill="#fff"/>
      <rect x="28" y="12" width="8" height="2" rx="1" fill="#fff"/>
      <rect x="28" y="18" width="6" height="2" rx="1" fill="#fff"/>
      <circle cx="24" cy="28" r="8" fill="#ffeaa7"/>
      <text x="24" y="33" fill="#5a5a5a" fontSize="14" fontFamily="Quicksand" textAnchor="middle" fontWeight="bold">?</text>
      <circle cx="14" cy="34" r="2" fill="#ffb7b2"/>
      <circle cx="34" cy="34" r="2" fill="#a8e6cf"/>
    </svg>
  ),
};
