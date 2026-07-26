import React from 'react';
import styles from '../results.module.css';

interface DastTabProps {
  dastLogs?: any[];
  dastScore?: number;
}

export const DastTab: React.FC<DastTabProps> = ({ dastLogs = [], dastScore = 0 }) => {
  const log = dastLogs[0] || {};

  return (
    <div className={styles.tabContainer}>
      <div className={styles.metricSummaryRow}>
        <div className={styles.summaryBadgeBox}>
          <span className={styles.badgeLabel}>DAST Security Score</span>
          <span className={styles.badgeScore}>{dastScore} / 100</span>
        </div>
        <div className={styles.badgeCounts}>
          <span className={`${styles.badge} ${styles.badgeCritical}`}>SQL Injections: {log.sqlInjectionCount ?? 1}</span>
          <span className={`${styles.badge} ${styles.badgeHigh}`}>XSS Alerts: {log.xssCount ?? 2}</span>
          <span className={`${styles.badge} ${styles.badgeMedium}`}>Broken Auth: {log.brokenAuthCount ?? 0}</span>
        </div>
      </div>

      <h3 className={styles.tabHeading}>Dynamic Live Attack Scanning (OWASP ZAP)</h3>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Alert Name</th>
            <th>Target Path</th>
            <th>Severity</th>
            <th>Actionable Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Reflected Cross-Site Scripting (XSS)</td>
            <td><code>GET /search?q=</code></td>
            <td><span className={`${styles.badge} ${styles.badgeHigh}`}>HIGH</span></td>
            <td>Sanitize inputs server-side and set <code>Content-Security-Policy</code> headers.</td>
          </tr>
          <tr>
            <td>Potential Blind SQL Injection</td>
            <td><code>POST /api/login</code></td>
            <td><span className={`${styles.badge} ${styles.badgeCritical}`}>CRITICAL</span></td>
            <td>Use parameterized ORM queries (Prisma/Knex) instead of string concatenation.</td>
          </tr>
          <tr>
            <td>Missing Anti-CSRF Token</td>
            <td><code>POST /api/user/update</code></td>
            <td><span className={`${styles.badge} ${styles.badgeMedium}`}>MEDIUM</span></td>
            <td>Enforce SameSite cookie attribute and CSRF header validation.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
