import React from 'react';
import styles from './ClusterMap.module.css';
import { useExecutionStore } from '../../../../store/executionStore';

export function ClusterMap() {
  const { clusterNodes } = useExecutionStore();

  return (
    <div className={styles.clusterContainer}>
      <h3 className={styles.title}>Visual Cluster Map</h3>
      <div className={styles.nodesGrid}>
        {clusterNodes.map(node => (
          <div key={node.id} className={styles.nodeCard}>
            <div className={styles.nodeHeader}>
              <span className={styles.nodeIcon}>🖥️</span>
              <span className={styles.nodeName}>{node.name}</span>
              <span className={`${styles.nodeStatus} ${styles[node.status.toLowerCase()]}`}>{node.status}</span>
            </div>
            
            <div className={styles.podsContainer}>
              {node.pods.map(pod => (
                <div 
                  key={pod.id} 
                  className={`${styles.podItem} ${styles[pod.status.toLowerCase()]} ${pod.isTarget ? styles.target : ''}`}
                >
                  <div className={styles.podHeader}>
                    <span className={styles.podIcon}>📦</span>
                    <span className={styles.podName}>{pod.name}</span>
                  </div>
                  <div className={styles.podStatusRow}>
                    <span className={styles.podStatusText}>{pod.status}</span>
                  </div>
                  {(pod.cpu || pod.memory) && (
                    <div className={styles.podMetrics}>
                      {pod.cpu && <span>CPU: {pod.cpu}</span>}
                      {pod.memory && <span>Mem: {pod.memory}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
