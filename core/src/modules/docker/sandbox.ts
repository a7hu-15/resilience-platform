import { exec } from 'child_process';
import { promisify } from 'util';
import { findFreeHostPort, inspectDockerImage } from './docker';

const execAsync = promisify(exec);

export interface SandboxInstance {
  containerName: string;
  hostPort: number;
  containerPort: number;
  targetUrl: string;
  isHttpServer: boolean;
}

/**
 * Provisions a dynamic Docker container sandbox for real empirical testing.
 * Automatically handles multi-arch platform emulation (amd64/arm64) for Apple Silicon Macs.
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

  // Run container in background sandbox with platform auto-emulation support
  let command = `docker run -d --name ${containerName} -p ${hostPort}:${containerPort} ${imageName}`;
  try {
    await execAsync(command, { timeout: 30000 });
  } catch (e: any) {
    console.log(`[Sandbox Engine] Standard run failed (${e.message}). Retrying run with --platform=linux/amd64...`);
    command = `docker run -d --platform=linux/amd64 --name ${containerName} -p ${hostPort}:${containerPort} ${imageName}`;
    await execAsync(command, { timeout: 30000 });
  }

  // Poll for container HTTP health
  const isHttpServer = await waitForContainerHealth(targetUrl, 4000);

  return {
    containerName,
    hostPort,
    containerPort,
    targetUrl,
    isHttpServer
  };
}

/**
 * Polls the running sandbox container endpoint to check if an HTTP server is active.
 */
async function waitForContainerHealth(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok || res.status < 500) {
        console.log(`[Sandbox Engine] Container at ${url} is an active HTTP server (Status: ${res.status}).`);
        return true;
      }
    } catch (e) {
      // Container starting or non-HTTP app...
    }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  console.log(`[Sandbox Engine] Container at ${url} is a background worker or non-HTTP application.`);
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
