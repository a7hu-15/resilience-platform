import { queueManager } from '../src/modules/queue/manager';
import { sendWebhookNotification } from '../src/modules/notifications/webhook';

describe('Queue Manager & Webhook Notifications', () => {
  it('should enqueue and track pipeline job status', () => {
    const job = queueManager.enqueueJob('job-123', 'nginx:alpine', 'user-456');
    expect(job.status).toBe('QUEUED');

    queueManager.markProcessing('job-123');
    expect(queueManager.getJobStatus('job-123')?.status).toBe('PROCESSING');

    queueManager.markCompleted('job-123');
    expect(queueManager.getJobStatus('job-123')?.status).toBe('COMPLETED');
  });

  it('should handle webhook notification dispatch gracefully', async () => {
    const success = await sendWebhookNotification('https://httpbin.org/post', {
      testRunId: 'run-789',
      imageName: 'nginx:alpine',
      masterScore: 92,
      qualityGatePassed: true,
      securityScore: 95,
      performanceScore: 90,
      resilienceScore: 91
    });
    expect(typeof success).toBe('boolean');
  });
});
