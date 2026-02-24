import styles from './AboutApp.module.css';

declare const __APP_VERSION__: string;

export default function AboutApp() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-dev';

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <svg viewBox="0 0 48 48" fill="none" className={styles.logoSvg}>
          <rect x="4" y="4" width="40" height="40" rx="4" fill="#4a5568"/>
          <rect x="10" y="10" width="28" height="4" fill="#9ab0b0"/>
          <rect x="10" y="18" width="20" height="4" fill="#7a8a8a"/>
          <rect x="10" y="26" width="24" height="4" fill="#7a8a8a"/>
          <rect x="10" y="34" width="16" height="4" fill="#5a6a6a"/>
        </svg>
      </div>

      <h1 className={styles.title}>OmniPubDent OS</h1>
      <p className={styles.subtitle}>PostAgency RPG</p>
      <p className={styles.version}>v{version} &middot; 2026</p>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.builtBy}>
          Built by{' '}
          <a
            href="https://jasondotcom.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Jasondotcom.com
          </a>
        </p>
        <p className={styles.availability}>
          Available for creative direction, team leadership,
          AI team training and fun collabs.
        </p>
        <a
          href="mailto:jason@jasondotcom.com"
          className={styles.emailLink}
        >
          jason@jasondotcom.com
        </a>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.builtWith}>Built with Claude Code</p>
        <p className={styles.disclaimer}>
          No employees were harmed in the making of this game.
          <br />
          <span className={styles.small}>Their spirits, however, were not consulted.</span>
        </p>
      </div>

      <div className={styles.footer}>
        <p className={styles.quote}>
          "The only difference between this game and your actual job
          is that you can close this window."
        </p>
      </div>
    </div>
  );
}
