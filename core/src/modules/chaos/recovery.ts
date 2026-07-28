import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Observes container recovery after chaos injection and measures exact empirical RTO using a high-precision stopwatch.
 * Handles both HTTP Web Applications and Background Worker applications cleanly.
 * 
 * @param containerName Target sandbox container name
 * @param targetUrl Target sandbox URL endpoint
 * @param isHttpServer Whether target is an active HTTP server
 * @returns Empirical RTO in seconds, or null if recovery failed
 */
export async function observeRecovery(containerName: string, targetUrl: string, isHttpServer: boolean = true): Promise<number | null> {
  console.log(`[Chaos Engine] Measuring real RTO stopwatch for ${containerName}...`);
  
  const startTime = Date.now();
  
  // Issue docker start to trigger container auto-recovery
  try {
    await execAsync(`docker start ${containerName}`, { timeout: 10000 });
  } catch (e: any) {
    console.warn(`[Chaos Engine] Container restart command warning: ${e.message}`);
  }

  const timeoutMs = 30000;
  while (Date.now() - startTime < timeoutMs) {
    if (isHttpServer) {
      try {
        const res = await fetch(targetUrl, { signal: AbortSignal.timeout(1000) });
        if (res.ok || res.status < 500) {
          const recoveryTimeMs = Date.now() - startTime;
          const rtoSeconds = parseFloat((recoveryTimeMs / 1000).toFixed(2));
          console.log(`[Chaos Engine] Container HTTP recovery successful! Empirical RTO: ${rtoSeconds}s.`);
          return rtoSeconds;
        }
      } catch (e) {
        // Rebooting...
      }
    } else {
      // For non-HTTP background workers, poll Docker process state directly
      try {
        const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${containerName}`, { timeout: 2000 });
        if (stdout.trim() === 'true') {
          const recoveryTimeMs = Date.now() - startTime;
          const rtoSeconds = parseFloat((recoveryTimeMs / 1000).toFixed(2));
          console.log(`[Chaos Engine] Process state recovery successful! Empirical RTO: ${rtoSeconds}s.`);
          return rtoSeconds;
        }
      } catch (e) {
        // Rebooting...
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.warn(`[Chaos Engine] Container failed to recover within ${timeoutMs}ms observation window.`);
  return null;
}
