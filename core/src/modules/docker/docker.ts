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
 */
export async function inspectDockerImage(imageName: string): Promise<DockerImageInspect> {
  try {
    // Try inspecting image locally first
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
    throw new Error(`Failed to inspect image '${imageName}'. Ensure image exists and Docker is running.`);
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
