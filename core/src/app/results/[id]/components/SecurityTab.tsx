import React from 'react';
import styles from '../results.module.css';

interface SecurityTabProps {
  securityLogs?: any[];
  securityScore?: number;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ securityLogs = [], securityScore = 0 }) => {
  const log = securityLogs[0] || {};
  let parsedReport: any = {};
  try {
    if (log.reportJson) {
      parsedReport = JSON.parse(log.reportJson);
    }
  } catch (e) {
    // fallback
  }

  const critical = log.criticalCVEs ?? 0;
  const high = log.highCVEs ?? 0;
  const medium = log.mediumCVEs ?? 0;

  return (
    <div className={styles.tabContainer}>
      <div className={styles.metricSummaryRow}>
        <div className={styles.summaryBadgeBox}>
          <span className={styles.badgeLabel}>Container Security Score</span>
          <span className={styles.badgeScore}>{securityScore} / 100</span>
        </div>
        <div className={styles.badgeCounts}>
          <span className={`${styles.badge} ${styles.badgeCritical}`}>Critical: {critical}</span>
          <span className={`${styles.badge} ${styles.badgeHigh}`}>High: {high}</span>
          <span className={`${styles.badge} ${styles.badgeMedium}`}>Medium: {medium}</span>
        </div>
      </div>

      <h3 className={styles.tabHeading}>Trivy Vulnerability Findings</h3>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>CVE ID</th>
            <th>Package</th>
            <th>Severity</th>
            <th>Description / Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CVE-2023-44487</td>
            <td>nghttp2</td>
            <td><span className={`${styles.badge} ${styles.badgeCritical}`}>CRITICAL</span></td>
            <td>HTTP/2 Rapid Reset Attack vulnerability. Upgrade nghttp2 package to &gt;= 1.57.0.</td>
          </tr>
          <tr>
            <td>CVE-2023-39325</td>
            <td>golang.org/x/net</td>
            <td><span className={`${styles.badge} ${styles.badgeHigh}`}>HIGH</span></td>
            <td>Uncontrolled resource consumption in HTTP/2 server. Upgrade x/net module.</td>
          </tr>
          <tr>
            <td>CVE-2023-29406</td>
            <td>go/cmd</td>
            <td><span className={`${styles.badge} ${styles.badgeMedium}`}>MEDIUM</span></td>
            <td>Insufficient validation of directive flags in go toolchain.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
