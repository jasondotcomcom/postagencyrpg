import { useEmailContext } from '../../../context/EmailContext';
import EmailListItem from './EmailListItem';
import EmailDetail from './EmailDetail';
import type { EmailFilter } from '../../../types/email';
import styles from './InboxApp.module.css';

const filterLabels: Record<EmailFilter, string> = {
  all: 'All',
  unread: 'Unread',
  starred: 'Starred',
  campaign_brief: 'Briefs',
  team_message: 'Team',
  reputation_bonus: 'News',
};

export default function InboxApp() {
  const {
    filter,
    searchQuery,
    setFilter,
    setSearch,
    getFilteredEmails,
    getSelectedEmail,
  } = useEmailContext();

  const filteredEmails = getFilteredEmails();
  const selectedEmail = getSelectedEmail();

  return (
    <div className={styles.inboxApp}>
      {/* Sidebar with email list */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.composeButton} disabled title="Coming soon">
            <span className={styles.composeIcon}>✏️</span>
            Compose
          </button>

          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterTabs}>
          {(Object.keys(filterLabels) as EmailFilter[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div className={styles.emailList}>
          {filteredEmails.length === 0 ? (
            <div className={styles.emptyList}>
              <span className={styles.emptyIcon}>📭</span>
              <p className={styles.emptyText}>No emails here!</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <EmailListItem key={email.id} email={email} />
            ))
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className={styles.detailPane}>
        {selectedEmail ? (
          <EmailDetail email={selectedEmail} />
        ) : (
          <div className={styles.noSelection}>
            <span className={styles.noSelectionIcon}>📬</span>
            <p className={styles.noSelectionText}>Select an email</p>
            <p className={styles.noSelectionHint}>
              Choose an email from the list to read it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
