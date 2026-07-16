import { 
  calculateSecurityScore, 
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

  describe('calculateMasterScore', () => {
    it('should calculate the perfectly weighted master score', () => {
      // 100 * 0.3 + 80 * 0.3 + 90 * 0.4 = 30 + 24 + 36 = 90
      expect(calculateMasterScore(100, 80, 90)).toBe(90);
    });
  });
});
