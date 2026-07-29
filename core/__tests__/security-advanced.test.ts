import { runSbomScan, runSecretScan } from '../src/modules/security/trivy';

describe('Advanced Security Engine (SBOM & Secret Scanning)', () => {
  it('should generate an SBOM scan result structure cleanly', async () => {
    const result = await runSbomScan('alpine:latest');
    expect(result).toHaveProperty('totalPackages');
    expect(result).toHaveProperty('format', 'CycloneDX');
    expect(typeof result.totalPackages).toBe('number');
  });

  it('should generate a Secret & License scan result structure cleanly', async () => {
    const result = await runSecretScan('alpine:latest');
    expect(result).toHaveProperty('secretsCount');
    expect(result).toHaveProperty('licenseIssuesCount');
    expect(typeof result.secretsCount).toBe('number');
    expect(typeof result.licenseIssuesCount).toBe('number');
  });
});
