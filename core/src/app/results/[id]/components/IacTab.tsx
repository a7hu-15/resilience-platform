import React from 'react';
import styles from '../results.module.css';

interface IacTabProps {
  iacLogs?: any[];
  iacScore?: number;
}

export const IacTab: React.FC<IacTabProps> = ({ iacLogs = [], iacScore = 0 }) => {
  const log = iacLogs[0] || {};

  return (
    <div className={styles.tabContainer}>
      <div className={styles.metricSummaryRow}>
        <div className={styles.summaryBadgeBox}>
          <span className={styles.badgeLabel}>IaC Security Score</span>
          <span className={styles.badgeScore}>{iacScore} / 100</span>
        </div>
        <div className={styles.badgeCounts}>
          <span className={`${styles.badge} ${styles.badgeHigh}`}>Root Privileges: {log.rootPrivilegeCount ?? 0}</span>
          <span className={`${styles.badge} ${styles.badgeMedium}`}>Missing Limits: {log.missingLimitsCount ?? 1}</span>
          <span className={`${styles.badge} ${styles.badgeLow}`}>Network Flaws: {log.networkPolicyFlawsCount ?? 2}</span>
        </div>
      </div>

      <h3 className={styles.tabHeading}>Kubernetes Manifest Audit (Checkov / KubeLinter)</h3>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Rule ID</th>
            <th>Check Description</th>
            <th>Severity</th>
            <th>Remediation Strategy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MISCONF-K8S-001</td>
            <td>Container CPU/Memory limits unset</td>
            <td><span className={`${styles.badge} ${styles.badgeMedium}`}>MEDIUM</span></td>
            <td>Define <code>resources.limits.memory</code> and <code>resources.limits.cpu</code> in deployment manifest.</td>
          </tr>
          <tr>
            <td>MISCONF-K8S-008</td>
            <td>Missing Ingress NetworkPolicy isolation</td>
            <td><span className={`${styles.badge} ${styles.badgeLow}`}>LOW</span></td>
            <td>Create a NetworkPolicy restricting ingress traffic only to namespace pod selectors.</td>
          </tr>
          <tr>
            <td>MISCONF-K8S-012</td>
            <td>Default service account token automatically mounted</td>
            <td><span className={`${styles.badge} ${styles.badgeLow}`}>LOW</span></td>
            <td>Set <code>automountServiceAccountToken: false</code> in pod specification.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
