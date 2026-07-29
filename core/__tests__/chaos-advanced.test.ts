import { injectNetworkChaos, injectStressChaos, clearChaos } from '../src/modules/chaos/experiments';

describe('Multi-Fault Chaos Engineering Engine', () => {
  it('should attempt network chaos injection cleanly with graceful fallback', async () => {
    await expect(injectNetworkChaos('non-existent-container', 150, 5)).resolves.not.toThrow();
  });

  it('should attempt resource stress injection cleanly with graceful fallback', async () => {
    await expect(injectStressChaos('non-existent-container', 1, 128)).resolves.not.toThrow();
  });

  it('should clear chaos rules cleanly', async () => {
    await expect(clearChaos('non-existent-container')).resolves.not.toThrow();
  });
});
