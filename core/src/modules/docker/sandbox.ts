import { exec } from 'child_process';
import { promisify } from 'util';
import { findFreeHostPort, inspectDockerImage } from './docker';

const execAsync = promisify(exec);

export interface SandboxInstance {
  containerName: string;
  hostPort: number;
  containerPort: number;
  targetUrl: string;
}

/**
 * Provisions a dynamic Docker container sandbox for real empirical testing.
 */
export async function provisionSandboxContainer(imageName: string, testRunId: string): Promise<SandboxInstance> {
  const containerName = `resilience-sandbox-${testRunId.slice(0, 8)}`;
  
  // Inspect image to discover container port
  const inspectMeta = await inspectDockerImage(imageName);
  let containerPort = 80;
  if (inspectMeta.exposedPorts.length > 0) {
    const rawPort = inspectMeta.exposedPorts[0].split('/')[0];
    containerPort = parseInt(rawPort, 10) || 80;
  }

  const hostPort = await findFreeHostPort();
  const targetUrl = `http://localhost:${hostPort}`;

  console.log(`[Sandbox Engine] Provisioning container ${containerName} (${imageName}) bound to ${hostPort}:${containerPort}...`);

  // Run container in background sandbox
  const command = `docker run -d --name ${containerName} -p ${hostPort}:${containerPort} ${imageName}`;
  await execAsync(command, { timeout: 30000 });

  // Wait for container readiness
  await waitForContainerHealth(targetUrl, 15000);

  return {
    containerName,
    hostPort,
    containerPort,
    targetUrl
  };
}

/**
 * Polls the running sandbox container endpoint until HTTP GET succeeds.
 */
async function waitForContainerHealth(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) {
        console.log(`[Sandbox Engine] Container at ${url} is healthy (Status: ${res.status}).`);
        return true;
      }
    } catch (e) {
      // Container starting...
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.warn(`[Sandbox Engine] Container at ${url} did not respond within ${timeoutMs}ms window. Proceeding with analysis.`);
  return false;
}

/**
 * Tears down and purges the sandbox container after testing completes.
 */
export async function teardownSandboxContainer(containerName: string): Promise<void> {
  try {
    console.log(`[Sandbox Engine] Tearing down container ${containerName}...`);
    await execAsync(`docker rm -f ${containerName}`, { timeout: 10000 });
  } catch (error: any) {
    console.warn(`[Sandbox Engine] Failed to teardown ${containerName}: ${error.message}`);
  }
}
