import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Injects a real SIGKILL crash into the running sandbox container.
 * 
 * @param containerName Target sandbox container name
 */
export async function injectPodKill(containerName: string): Promise<void> {
  console.log(`[Chaos Engine] Injecting real SIGKILL into container ${containerName}...`);
  try {
    await execAsync(`docker kill --signal=SIGKILL ${containerName}`, { timeout: 10000 });
    console.log(`[Chaos Engine] Container ${containerName} terminated via SIGKILL.`);
  } catch (error: any) {
    console.error(`[Chaos Engine] Failed to inject SIGKILL: ${error.message}`);
    throw new Error(`Real chaos injection failed for container '${containerName}'.`);
  }
}
