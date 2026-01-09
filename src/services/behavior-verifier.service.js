/**
 * CBV System - Behavior Verifier Service
 * Verifies behavior biometrics against baseline
 */

import logger from '@/utils/logger';

class BehaviorVerifierService {
  constructor() {
    this.baseline = null;
  }

  /**
   * Set behavior baseline
   * @param {Object} baseline - Behavior baseline
   */
  setBaseline(baseline) {
    if (!baseline) {
      throw new Error('Invalid behavior baseline');
    }

    // Support both old format (statistical) and new format (baseline.features)
    if (!baseline.statistical && !baseline.baseline) {
      throw new Error('Invalid behavior baseline format');
    }

    // Convert new format to old format if needed
    if (baseline.baseline && baseline.baseline.features && !baseline.statistical) {
      logger.info('Converting baseline from new format to old format');
      baseline.statistical = this._convertBaselineFormat(baseline.baseline.features, baseline.feature_names);
    }

    this.baseline = baseline;
    logger.info('Behavior baseline set', {
      method: baseline.method,
      features: baseline.statistical ? Object.keys(baseline.statistical).length : 0
    });
  }

  /**
   * Convert new baseline format to old format
   * @private
   */
  _convertBaselineFormat(features, featureNames) {
    const statistical = {};
    
    // Group features by type (every 5 features is one type)
    const featureTypes = [
      'keystroke_dwell_times',
      'keystroke_flight_times',
      'mouse_velocities',
      'mouse_curvatures'
    ];

    featureTypes.forEach((type, typeIndex) => {
      const startIndex = typeIndex * 5;
      const meanFeature = features.find(f => f.index === startIndex);
      const stdFeature = features.find(f => f.index === startIndex + 1);
      
      if (meanFeature) {
        statistical[type] = {
          mean: meanFeature.mean,
          std: stdFeature ? stdFeature.mean : meanFeature.std,
          percentiles: {
            p5: meanFeature.percentiles[5],
            p25: meanFeature.percentiles[25],
            p50: meanFeature.percentiles[50],
            p75: meanFeature.percentiles[75],
            p95: meanFeature.percentiles[95]
          }
        };
      }
    });

    return statistical;
  }

  /**
   * Calculate z-score for a value
   * @param {number} value - Value to test
   * @param {number} mean - Mean of distribution
   * @param {number} std - Standard deviation
   * @returns {number} Z-score
   */
  calculateZScore(value, mean, std) {
    if (std === 0) return 0;
    return Math.abs((value - mean) / std);
  }

  /**
   * Verify single feature value against baseline
   * @param {string} featureName - Feature name
   * @param {number} value - Feature value
   * @returns {Object} Verification result
   */
  verifyFeature(featureName, value) {
    if (!this.baseline) {
      throw new Error('No behavior baseline loaded');
    }

    const stats = this.baseline.statistical[featureName];
    if (!stats) {
      return {
        isValid: false,
        reason: 'Feature not in baseline',
        confidence: 0
      };
    }

    // Calculate z-score
    const zScore = this.calculateZScore(value, stats.mean, stats.std);

    // Check if within acceptable range (e.g., within 2 standard deviations)
    const isValid = zScore <= 2.0;

    // Calculate confidence (inverse of z-score, normalized)
    const confidence = Math.max(0, Math.min(1, 1 - (zScore / 3)));

    return {
      isValid,
      zScore,
      confidence,
      value,
      mean: stats.mean,
      std: stats.std,
      percentile: this.calculatePercentile(value, stats)
    };
  }

  /**
   * Calculate approximate percentile for a value
   * @param {number} value - Value
   * @param {Object} stats - Statistics object
   * @returns {number} Approximate percentile (0-100)
   */
  calculatePercentile(value, stats) {
    const percentiles = stats.percentiles;
    
    if (value <= percentiles.p5) return 5;
    if (value <= percentiles.p25) return 15;
    if (value <= percentiles.p50) return 37.5;
    if (value <= percentiles.p75) return 62.5;
    if (value <= percentiles.p95) return 85;
    return 97.5;
  }

  /**
   * Verify behavior window against baseline
   * @param {Object} behaviorWindow - Behavior window features
   * @returns {Object} Verification result
   */
  verifyBehaviorWindow(behaviorWindow) {
    if (!this.baseline) {
      throw new Error('No behavior baseline loaded');
    }

    const results = {
      isValid: true,
      confidence: 1.0,
      features: {},
      anomalyScore: 0,
      invalidFeatures: []
    };

    let totalConfidence = 0;
    let featureCount = 0;

    // Verify keystroke features
    if (behaviorWindow.keystroke) {
      const keystroke = behaviorWindow.keystroke;

      // Dwell times
      if (keystroke.dwellTimes && keystroke.dwellTimes.length > 0) {
        const avgDwell = keystroke.dwellTimes.reduce((a, b) => a + b, 0) / keystroke.dwellTimes.length;
        const dwellResult = this.verifyFeature('keystroke_dwell_times', avgDwell);
        results.features.keystroke_dwell = dwellResult;
        totalConfidence += dwellResult.confidence;
        featureCount++;

        if (!dwellResult.isValid) {
          results.invalidFeatures.push('keystroke_dwell');
        }
      }

      // Flight times
      if (keystroke.flightTimes && keystroke.flightTimes.length > 0) {
        const avgFlight = keystroke.flightTimes.reduce((a, b) => a + b, 0) / keystroke.flightTimes.length;
        const flightResult = this.verifyFeature('keystroke_flight_times', avgFlight);
        results.features.keystroke_flight = flightResult;
        totalConfidence += flightResult.confidence;
        featureCount++;

        if (!flightResult.isValid) {
          results.invalidFeatures.push('keystroke_flight');
        }
      }
    }

    // Verify mouse features
    if (behaviorWindow.mouse) {
      const mouse = behaviorWindow.mouse;

      // Velocities
      if (mouse.velocities && mouse.velocities.length > 0) {
        const avgVelocity = mouse.velocities.reduce((a, b) => a + b, 0) / mouse.velocities.length;
        const velocityResult = this.verifyFeature('mouse_velocities', avgVelocity);
        results.features.mouse_velocity = velocityResult;
        totalConfidence += velocityResult.confidence;
        featureCount++;

        if (!velocityResult.isValid) {
          results.invalidFeatures.push('mouse_velocity');
        }
      }

      // Curvatures
      if (mouse.curvatures && mouse.curvatures.length > 0) {
        const avgCurvature = mouse.curvatures.reduce((a, b) => a + b, 0) / mouse.curvatures.length;
        const curvatureResult = this.verifyFeature('mouse_curvatures', avgCurvature);
        results.features.mouse_curvature = curvatureResult;
        totalConfidence += curvatureResult.confidence;
        featureCount++;

        if (!curvatureResult.isValid) {
          results.invalidFeatures.push('mouse_curvature');
        }
      }

      // Click durations
      if (mouse.clickDurations && mouse.clickDurations.length > 0) {
        const avgClickDuration = mouse.clickDurations.reduce((a, b) => a + b, 0) / mouse.clickDurations.length;
        const clickResult = this.verifyFeature('mouse_click_durations', avgClickDuration);
        results.features.mouse_click = clickResult;
        totalConfidence += clickResult.confidence;
        featureCount++;

        if (!clickResult.isValid) {
          results.invalidFeatures.push('mouse_click');
        }
      }
    }

    // Calculate overall confidence
    if (featureCount > 0) {
      results.confidence = totalConfidence / featureCount;
    }

    // Calculate anomaly score (inverse of confidence)
    results.anomalyScore = 1 - results.confidence;

    // Determine if valid (confidence above threshold)
    const threshold = this.baseline.model?.threshold || 0.5;
    results.isValid = results.confidence >= threshold && results.invalidFeatures.length === 0;

    logger.debug('Behavior verification result', {
      isValid: results.isValid,
      confidence: results.confidence,
      anomalyScore: results.anomalyScore,
      invalidFeatures: results.invalidFeatures.length
    });

    return results;
  }

  /**
   * Verify continuous behavior stream
   * @param {Array<Object>} behaviorWindows - Array of recent behavior windows
   * @returns {Object} Verification result
   */
  verifyContinuousBehavior(behaviorWindows) {
    if (!this.baseline) {
      throw new Error('No behavior baseline loaded');
    }

    if (!behaviorWindows || behaviorWindows.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'No behavior data'
      };
    }

    // Verify each window
    const windowResults = behaviorWindows.map(window => 
      this.verifyBehaviorWindow(window)
    );

    // Calculate aggregate confidence
    const avgConfidence = windowResults.reduce((sum, r) => sum + r.confidence, 0) / windowResults.length;

    // Count valid windows
    const validCount = windowResults.filter(r => r.isValid).length;
    const validRatio = validCount / windowResults.length;

    // Overall validity (majority of windows must be valid)
    const isValid = validRatio >= 0.7 && avgConfidence >= 0.5;

    return {
      isValid,
      confidence: avgConfidence,
      validRatio,
      windowCount: windowResults.length,
      validCount,
      windowResults
    };
  }

  /**
   * Get baseline info
   * @returns {Object|null} Baseline info
   */
  getBaselineInfo() {
    if (!this.baseline) {
      return null;
    }

    return {
      userId: this.baseline.userId,
      method: this.baseline.method,
      features: Object.keys(this.baseline.statistical),
      featureCount: Object.keys(this.baseline.statistical).length,
      totalSamples: this.baseline.metadata?.total_samples,
      createdAt: this.baseline.createdAt
    };
  }

  /**
   * Check if baseline is loaded
   * @returns {boolean} Baseline loaded status
   */
  hasBaseline() {
    return !!this.baseline;
  }

  /**
   * Clear baseline
   */
  clearBaseline() {
    this.baseline = null;
    logger.info('Behavior baseline cleared');
  }
}

// Create singleton instance
const behaviorVerifierService = new BehaviorVerifierService();

export default behaviorVerifierService;
