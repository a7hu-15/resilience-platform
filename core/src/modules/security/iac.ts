import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface IacScanResult {
  missingLimitsCount: number;
  rootPrivilegeCount: number;
  networkPolicyFlawsCount: number;
  cveId: string | null;
  description: string | null;
  mitigationSteps: string | null;
  rawJson: any;
}

/**
 * Performs a 100% empirical security context & isolation audit on the running sandbox container.
 * Inspects host config, root privileges, resource caps, and capability drops.
 * 
 * @param containerName The sandbox container name (e.g., 'resilience-sandbox-xxx')
 */
export async function runIacScan(containerName: string): Promise<IacScanResult> {
  console.log(`[Security Engine] Auditing real container security context for ${containerName}...`);
  
  try {
    const { stdout } = await execAsync(`docker inspect ${containerName}`, { timeout: 10000 });
    const inspectData = JSON.parse(stdout)[0];

    const config = inspectData.Config || {};
    const hostConfig = inspectData.HostConfig || {};

    let rootPrivilegeCount = 0;
    let missingLimitsCount = 0;
    let networkPolicyFlawsCount = 0;

    // 1. Audit Root User Execution
    const user = config.User || '';
    if (user === '' || user === 'root' || user === '0' || user === '0:0') {
      rootPrivilegeCount = 1;
    }

    // 2. Audit Memory/CPU Limits
    const memory = hostConfig.Memory || 0;
    const nanoCpus = hostConfig.NanoCpus || 0;
    if (memory === 0 && nanoCpus === 0) {
      missingLimitsCount = 1;
    }

    // 3. Audit Capabilities & Security Flags
    const capDrop = hostConfig.CapDrop || [];
    if (!Array.isArray(capDrop) || capDrop.length === 0 || (!capDrop.includes('ALL') && !capDrop.includes('all'))) {
      networkPolicyFlawsCount = 1;
    }

    const totalViolations = rootPrivilegeCount + missingLimitsCount + networkPolicyFlawsCount;

    return {
      missingLimitsCount,
      rootPrivilegeCount,
      networkPolicyFlawsCount,
      cveId: totalViolations === 0 ? "PASSED-SPEC-HARDENED" : "CKV-K8S-SPEC-AUDIT",
      description: totalViolations === 0 
        ? "Container specification adheres strictly to security hardening standards." 
        : `Container spec failed ${totalViolations} security isolation rules (Root User: ${rootPrivilegeCount}, Limits: ${missingLimitsCount}, CapDrop: ${networkPolicyFlawsCount}).`,
      mitigationSteps: totalViolations === 0 
        ? "No remediation required. Container is security hardened." 
        : "Set User to non-root, define Memory/CPU limits, and set CapDrop: ['ALL'] in container config.",
      rawJson: {
        containerName,
        user: config.User || 'root (default)',
        memoryLimit: memory,
        capDrop: capDrop
      }
    };
  } catch (error: any) {
    console.error(`[Security Engine] Container spec audit failed: ${error.message}`);
    throw new Error(`Real container security audit failed for '${containerName}'. Ensure container is running.`);
  }
}
