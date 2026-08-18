export interface NotificationPayload {
  testRunId: string;
  imageName: string;
  masterScore: number;
  qualityGatePassed: boolean;
  securityScore: number;
  performanceScore: number;
  resilienceScore: number;
}

/**
 * Dispatches test completion cards to external Slack/Discord/Teams webhooks.
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification Engine] Dispatching webhook alert for run ${payload.testRunId} to ${webhookUrl}`);

  const card = {
    text: `🚀 *Resilience Cloud Scan Completed*`,
    attachments: [
      {
        color: payload.qualityGatePassed ? '#22c55e' : '#ef4444',
        fields: [
          { title: 'Target Image', value: payload.imageName, short: true },
          { title: 'Master Score', value: `${payload.masterScore} / 100`, short: true },
          { title: 'Quality Gate', value: payload.qualityGatePassed ? '✓ PASSED' : '✕ FAILED', short: true },
          { title: 'Security / Perf / Chaos', value: `${payload.securityScore} | ${payload.performanceScore} | ${payload.resilienceScore}`, short: true }
        ]
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (error: any) {
    console.warn(`[Notification Engine] Webhook dispatch warning: ${error.message}`);
    return false;
  }
}
