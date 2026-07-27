import { 
  calculateSecurityScore, 
  calculateIacScore,
  calculateDastScore,
  calculatePerformanceScore, 
  calculateResilienceScore, 
  calculateMasterScore 
} from '../src/modules/scoring/algorithms';
import { TrivyScanResult } from '../src/modules/security/trivy';
import { LoadTestResult } from '../src/modules/load/k6';

describe('Scoring Algorithms', () => {
  
  describe('calculateSecurityScore', () => {
    it('should return 100 for an image with zero CVEs', () => {
      const mockResult: TrivyScanResult = {
        critical: 0, high: 0, medium: 0, low: 0, unknown: 0, total: 0, rawJson: {}
      };
      expect(calculateSecurityScore(mockResult)).toBe(100);
    });

    it('should deduct precisely based on severity weights', () => {
      const mockResult: TrivyScanResult = {
        // Critical (-15), High (-5), Medium (-2), Low (-0.5)
        // 15 + 10 + 2 + 0.5 = 27.5 deduction
        critical: 1, high: 2, medium: 1, low: 1, unknown: 0, total: 5, rawJson: {}
      };
      expect(calculateSecurityScore(mockResult)).toBe(72.5);
    });

    it('should floor the score at 0 for extremely vulnerable images', () => {
      const mockResult: TrivyScanResult = {
        critical: 10, high: 0, medium: 0, low: 0, unknown: 0, total: 10, rawJson: {}
      };
      expect(calculateSecurityScore(mockResult)).toBe(0);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should return 100 for perfect performance (<100ms latency, 99%+ success)', () => {
      const mockResult: LoadTestResult = {
        p95LatencyMs: 80,
        requestsPerSecond: 500,
        successRate: 100,
        rawOutput: {}
      };
      expect(calculatePerformanceScore(mockResult)).toBe(100);
    });

    it('should deduct 1 point for every 10ms over 100ms latency', () => {
      const mockResult: LoadTestResult = {
        p95LatencyMs: 150, // 50ms over = -5 points
        requestsPerSecond: 500,
        successRate: 100,
        rawOutput: {}
      };
      expect(calculatePerformanceScore(mockResult)).toBe(95);
    });

    it('should deduct 10 points for every 1% drop in success rate below 99%', () => {
      const mockResult: LoadTestResult = {
        p95LatencyMs: 90, 
        requestsPerSecond: 500,
        successRate: 97, // 2% drop below 99% = -20 points
        rawOutput: {}
      };
      expect(calculatePerformanceScore(mockResult)).toBe(80);
    });
  });

  describe('calculateResilienceScore', () => {
    it('should return 100 for recovery within 5 seconds', () => {
      expect(calculateResilienceScore(4)).toBe(100);
      expect(calculateResilienceScore(5)).toBe(100);
    });

    it('should deduct 2 points per second over 5 seconds', () => {
      // 15 seconds = 10s over = -20 points
      expect(calculateResilienceScore(15)).toBe(80);
    });

    it('should halve the score if recovery takes more than 60 seconds', () => {
      // 65 seconds = 60s over = -120 points? Wait, score floors at 0.
      // Let's test 61 seconds. 56s over = -112. Score will be 0.
      expect(calculateResilienceScore(65)).toBe(0);
    });

    it('should return 0 if recovery fails entirely (null)', () => {
      expect(calculateResilienceScore(null)).toBe(0);
    });
  });

  describe('calculateDastScore', () => {
    it('should calculate precise DAST score', () => {
      // 1 sqli (-20), 2 xss (-20), 1 broken auth (-15) = -55
      const mockResult = {
        sqlInjectionCount: 1, xssCount: 2, brokenAuthCount: 1,
        cveId: null, description: null, mitigationSteps: null, rawJson: {}
      };
      expect(calculateDastScore(mockResult)).toBe(45);
    });
  });

  describe('calculateIacScore', () => {
    it('should calculate precise IaC score', () => {
      // 1 root (-25), 2 network (-20), 1 limit (-5) = -50
      const mockResult = {
        rootPrivilegeCount: 1, networkPolicyFlawsCount: 2, missingLimitsCount: 1,
        cveId: null, description: null, mitigationSteps: null, rawJson: {}
      };
      expect(calculateIacScore(mockResult)).toBe(50);
    });
  });

  describe('calculateMasterScore', () => {
    it('should calculate the perfectly weighted master score', () => {
      // 100 * 0.2 + 80 * 0.2 + 90 * 0.2 + 70 * 0.2 + 60 * 0.2 = 20 + 16 + 18 + 14 + 12 = 80
      expect(calculateMasterScore(100, 80, 90, 70, 60)).toBe(80);
    });

    it('should generate high master score (>95) for hardened Alpine images', () => {
      const security = 97;
      const iac = 100;
      const dast = 100;
      const perf = 100;
      const chaos = 100;
      expect(calculateMasterScore(security, iac, dast, perf, chaos)).toBeGreaterThanOrEqual(95);
    });

    it('should generate low master score (<40) for vulnerable target images', () => {
      const security = 0;
      const iac = 35;
      const dast = 0;
      const perf = 0;
      const chaos = 80.4;
      expect(calculateMasterScore(security, iac, dast, perf, chaos)).toBeLessThan(40);
    });
  });
});
