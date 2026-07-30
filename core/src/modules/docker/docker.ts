import { exec } from 'child_process';
import { promisify } from 'util';
import createServer from 'net';

const execAsync = promisify(exec);

export interface DockerImageInspect {
  id: string;
  user: string;
  exposedPorts: string[];
  entrypoint: string[];
  cmd: string[];
  env: string[];
}

/**
 * Checks if Docker Daemon is running on the host system.
 */
export async function checkDockerDaemon(): Promise<boolean> {
  try {
    await execAsync('docker info', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Inspects a local or remote Docker container image and extracts metadata.
 * Automatically pulls remote images from Docker Hub with multi-architecture (amd64/arm64) support.
 */
export async function inspectDockerImage(imageName: string): Promise<DockerImageInspect> {
  try {
    // Check if image exists in local Docker store; if not, pull from registry
    try {
      await execAsync(`docker image inspect ${imageName}`, { timeout: 5000 });
    } catch (e) {
      console.log(`[Docker Engine] Image '${imageName}' not in local store. Pulling from registry...`);
      try {
        await execAsync(`docker pull ${imageName}`, { maxBuffer: 20 * 1024 * 1024, timeout: 180000 });
      } catch (pullErr: any) {
        console.log(`[Docker Engine] Native architecture pull failed. Retrying pull with linux/amd64 emulation...`);
        await execAsync(`docker pull --platform=linux/amd64 ${imageName}`, { maxBuffer: 20 * 1024 * 1024, timeout: 180000 });
      }
    }

    const { stdout } = await execAsync(`docker inspect ${imageName}`, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 });
    const data = JSON.parse(stdout)[0];

    const exposedPorts = data.Config?.ExposedPorts ? Object.keys(data.Config.ExposedPorts) : ['80/tcp'];
    
    return {
      id: data.Id || '',
      user: data.Config?.User || '',
      exposedPorts,
      entrypoint: data.Config?.Entrypoint || [],
      cmd: data.Config?.Cmd || [],
      env: data.Config?.Env || []
    };
  } catch (error: any) {
    console.error(`[Docker Engine] Failed to inspect image '${imageName}': ${error.message}`);
    throw new Error(`Failed to inspect image '${imageName}'. Ensure Docker is running and image name is valid.`);
  }
}

/**
 * Authenticates against a container registry (Docker Hub, ghcr.io, ECR) using username and password/token.
 */
export async function dockerLogin(user: string, token: string): Promise<boolean> {
  try {
    console.log(`[Docker Engine] Authenticating container registry for user '${user}'...`);
    await execAsync(`echo "${token}" | docker login --username "${user}" --password-stdin`, { timeout: 15000 });
    return true;
  } catch (error: any) {
    console.warn(`[Docker Engine] Registry login warning: ${error.message}`);
    return false;
  }
}

/**
 * Finds an available random host port for dynamic container sandbox binding.
 */
export async function findFreeHostPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer.createServer();
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error('Failed to find free host port'));
      });
    });
    server.on('error', reject);
  });
}
