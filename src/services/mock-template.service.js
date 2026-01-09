/**
 * CBV System - Mock Template Service
 * Generates templates from actual enrollment data
 */

import faceMatcherService from './face-matcher.service';
import storageService from './storage.service';
import templateLoaderService from './template-loader.service';
import logger from '@/utils/logger';

class MockTemplateService {
  constructor() {
    this.mockTemplateGenerated = false;
  }

  /**
   * Generate face template from ALL captured face samples
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Generated template
   */
  async generateMockFaceTemplate(userId) {
    try {
      logger.info('Generating face template from enrollment data', { userId });

      // Load all face samples for this user
      const faceSamples = await storageService.getFaceSamplesByUser(userId);
      
      if (!faceSamples || faceSamples.length === 0) {
        throw new Error('No face samples found for template generation');
      }

      logger.info(`Processing ${faceSamples.length} face samples for template`);

      // Extract features from all samples and average them
      const allFeatures = [];
      for (const sample of faceSamples) {
        if (sample.features && sample.features.histogram) {
          allFeatures.push(sample.features.histogram);
        }
      }

      if (allFeatures.length === 0) {
        throw new Error('No valid features found in face samples');
      }

      // Calculate average feature vector
      const dimension = allFeatures[0].length;
      const avgFeatures = new Array(dimension).fill(0);
      
      for (const features of allFeatures) {
        for (let i = 0; i < dimension; i++) {
          avgFeatures[i] += features[i];
        }
      }
      
      for (let i = 0; i < dimension; i++) {
        avgFeatures[i] /= allFeatures.length;
      }

      // Create template from real enrollment data
      const template = {
        version: '1.0',
        userId,
        createdAt: new Date().toISOString(),
        type: 'face_template',
        source: 'enrollment_data', // Generated from real enrollment
        embedding: {
          vector: avgFeatures,
          dimension: dimension,
          model: 'histogram_texture_features',
        },
        threshold: {
          value: 0.3, // Reasonable threshold
          method: 'enrollment_average',
          distance_metric: 'cosine',
        },
        metadata: {
          samples_used: faceSamples.length,
          quality_mean: faceSamples.reduce((sum, s) => sum + (s.quality || 0.8), 0) / faceSamples.length,
          note: `Template generated from ${faceSamples.length} enrollment samples`,
        },
      };

      // Save to storage using template loader service
      await templateLoaderService.saveFaceTemplate(userId, template, false);

      logger.info('Face template generated and saved', {
        userId,
        samplesUsed: faceSamples.length,
        dimension: template.embedding.dimension,
        threshold: template.threshold.value,
      });

      this.mockTemplateGenerated = true;

      return template;
    } catch (error) {
      logger.error('Failed to generate face template', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate behavior baseline from ALL captured behavior windows
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Generated baseline
   */
  async generateMockBehaviorBaseline(userId) {
    try {
      logger.info('Generating behavior baseline from enrollment data', { userId });

      // Load all behavior windows for this user
      const db = await storageService.ensureDB();
      const behaviorWindows = await db.getAllFromIndex(
        storageService.stores.BEHAVIOR_WINDOWS,
        'userId',
        userId
      );

      if (!behaviorWindows || behaviorWindows.length === 0) {
        logger.warn('No behavior windows found, using default baseline');
        // Return default baseline if no data
        return this._generateDefaultBehaviorBaseline(userId);
      }

      logger.info(`Processing ${behaviorWindows.length} behavior windows for baseline`);

      // Extract features from all windows
      const keystrokeDwells = [];
      const keystrokeFlights = [];
      const mouseVelocities = [];
      const mouseCurvatures = [];

      for (const window of behaviorWindows) {
        const features = window.features || window;
        
        // Keystroke features
        if (features.keystroke) {
          if (features.keystroke.dwellTimes) {
            keystrokeDwells.push(...features.keystroke.dwellTimes);
          }
          if (features.keystroke.flightTimes) {
            keystrokeFlights.push(...features.keystroke.flightTimes);
          }
        }

        // Mouse features
        if (features.mouse) {
          if (features.mouse.velocities) {
            mouseVelocities.push(...features.mouse.velocities);
          }
          if (features.mouse.curvature !== undefined) {
            mouseCurvatures.push(features.mouse.curvature);
          }
        }
      }

      // Calculate statistics for each feature type
      const baseline = {
        version: '1.0',
        userId,
        createdAt: new Date().toISOString(),
        type: 'behavior_baseline',
        source: 'enrollment_data',
        method: 'statistical',
        baseline: {
          features: [
            // Keystroke dwell times
            ...this._calculateFeatureStats(keystrokeDwells, 0),
            // Keystroke flight times
            ...this._calculateFeatureStats(keystrokeFlights, 5),
            // Mouse velocities
            ...this._calculateFeatureStats(mouseVelocities, 10),
            // Mouse curvatures
            ...this._calculateFeatureStats(mouseCurvatures, 15),
          ],
        },
        feature_names: [
          'dwell_mean', 'dwell_std', 'dwell_min', 'dwell_max', 'dwell_median',
          'flight_mean', 'flight_std', 'flight_min', 'flight_max', 'flight_median',
          'velocity_mean', 'velocity_std', 'velocity_min', 'velocity_max', 'velocity_median',
          'curvature_mean', 'curvature_std', 'curvature_min', 'curvature_max', 'curvature_median',
        ],
        metadata: {
          windows_used: behaviorWindows.length,
          keystroke_samples: keystrokeDwells.length,
          mouse_samples: mouseVelocities.length,
          note: `Baseline generated from ${behaviorWindows.length} enrollment windows`,
        },
      };

      // Save to storage using template loader service
      await templateLoaderService.saveBehaviorBaseline(userId, baseline, false);

      logger.info('Behavior baseline generated and saved', {
        userId,
        windowsUsed: behaviorWindows.length,
        keystrokeSamples: keystrokeDwells.length,
        mouseSamples: mouseVelocities.length,
      });

      return baseline;
    } catch (error) {
      logger.error('Failed to generate behavior baseline', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate statistics for a feature array
   * @private
   */
  _calculateFeatureStats(values, startIndex) {
    if (!values || values.length === 0) {
      // Return default stats if no data
      return [
        { index: startIndex, mean: 100, std: 30, percentiles: { 5: 50, 25: 80, 50: 100, 75: 120, 95: 150 } },
        { index: startIndex + 1, mean: 30, std: 15, percentiles: { 5: 10, 25: 20, 50: 30, 75: 40, 95: 55 } },
        { index: startIndex + 2, mean: 50, std: 20, percentiles: { 5: 20, 25: 35, 50: 50, 75: 65, 95: 85 } },
        { index: startIndex + 3, mean: 200, std: 50, percentiles: { 5: 110, 25: 165, 50: 200, 75: 235, 95: 290 } },
        { index: startIndex + 4, mean: 110, std: 25, percentiles: { 5: 65, 25: 92, 50: 110, 75: 128, 95: 155 } },
      ];
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];

    const percentile = (p) => sorted[Math.floor(sorted.length * p / 100)];

    return [
      { index: startIndex, mean, std, percentiles: { 5: percentile(5), 25: percentile(25), 50: median, 75: percentile(75), 95: percentile(95) } },
      { index: startIndex + 1, mean: std, std: std * 0.5, percentiles: { 5: std * 0.3, 25: std * 0.7, 50: std, 75: std * 1.3, 95: std * 1.8 } },
      { index: startIndex + 2, mean: min, std: min * 0.4, percentiles: { 5: min * 0.4, 25: min * 0.7, 50: min, 75: min * 1.3, 95: min * 1.7 } },
      { index: startIndex + 3, mean: max, std: max * 0.25, percentiles: { 5: max * 0.55, 25: max * 0.82, 50: max, 75: max * 1.17, 95: max * 1.45 } },
      { index: startIndex + 4, mean: median, std: median * 0.23, percentiles: { 5: median * 0.59, 25: median * 0.84, 50: median, 75: median * 1.16, 95: median * 1.41 } },
    ];
  }

  /**
   * Generate default behavior baseline when no data available
   * @private
   */
  _generateDefaultBehaviorBaseline(userId) {
    const baseline = {
      version: '1.0',
      userId,
      createdAt: new Date().toISOString(),
      type: 'behavior_baseline',
      source: 'default',
      method: 'statistical',
      baseline: {
        features: [
          // Keystroke dwell times (ms)
          { index: 0, mean: 120, std: 30, percentiles: { 5: 70, 25: 100, 50: 120, 75: 140, 95: 170 } },
          { index: 1, mean: 30, std: 15, percentiles: { 5: 10, 25: 20, 50: 30, 75: 40, 95: 55 } },
          { index: 2, mean: 50, std: 20, percentiles: { 5: 20, 25: 35, 50: 50, 75: 65, 95: 85 } },
          { index: 3, mean: 200, std: 50, percentiles: { 5: 110, 25: 165, 50: 200, 75: 235, 95: 290 } },
          { index: 4, mean: 110, std: 25, percentiles: { 5: 65, 25: 92, 50: 110, 75: 128, 95: 155 } },
          
          // Keystroke flight times (ms)
          { index: 5, mean: 150, std: 40, percentiles: { 5: 80, 25: 120, 50: 150, 75: 180, 95: 220 } },
          { index: 6, mean: 40, std: 20, percentiles: { 5: 10, 25: 25, 50: 40, 75: 55, 95: 75 } },
          { index: 7, mean: 60, std: 25, percentiles: { 5: 20, 25: 42, 50: 60, 75: 78, 95: 100 } },
          { index: 8, mean: 250, std: 60, percentiles: { 5: 145, 25: 205, 50: 250, 75: 295, 95: 355 } },
          { index: 9, mean: 140, std: 35, percentiles: { 5: 80, 25: 115, 50: 140, 75: 165, 95: 200 } },
          
          // Mouse velocity (pixels/second)
          { index: 10, mean: 200, std: 50, percentiles: { 5: 110, 25: 165, 50: 200, 75: 235, 95: 290 } },
          { index: 11, mean: 50, std: 25, percentiles: { 5: 10, 25: 32, 50: 50, 75: 68, 95: 95 } },
          { index: 12, mean: 50, std: 30, percentiles: { 5: 5, 25: 27, 50: 50, 75: 73, 95: 105 } },
          { index: 13, mean: 400, std: 100, percentiles: { 5: 220, 25: 330, 50: 400, 75: 470, 95: 580 } },
          { index: 14, mean: 180, std: 45, percentiles: { 5: 100, 25: 147, 50: 180, 75: 213, 95: 260 } },
          
          // Mouse curvature
          { index: 15, mean: 0.5, std: 0.2, percentiles: { 5: 0.15, 25: 0.35, 50: 0.5, 75: 0.65, 95: 0.85 } },
          { index: 16, mean: 0.2, std: 0.1, percentiles: { 5: 0.05, 25: 0.12, 50: 0.2, 75: 0.28, 95: 0.38 } },
          { index: 17, mean: 0.1, std: 0.08, percentiles: { 5: 0.01, 25: 0.05, 50: 0.1, 75: 0.15, 95: 0.24 } },
          { index: 18, mean: 0.9, std: 0.3, percentiles: { 5: 0.4, 25: 0.67, 50: 0.9, 75: 1.13, 95: 1.45 } },
          { index: 19, mean: 0.45, std: 0.15, percentiles: { 5: 0.2, 25: 0.34, 50: 0.45, 75: 0.56, 95: 0.72 } },
        ],
      },
      feature_names: [
        'dwell_mean', 'dwell_std', 'dwell_min', 'dwell_max', 'dwell_median',
        'flight_mean', 'flight_std', 'flight_min', 'flight_max', 'flight_median',
        'velocity_mean', 'velocity_std', 'velocity_min', 'velocity_max', 'velocity_median',
        'curvature_mean', 'curvature_std', 'curvature_min', 'curvature_max', 'curvature_median',
      ],
      metadata: {
        windows_used: 0,
        note: 'Default baseline - no enrollment data available',
      },
    };

    return baseline;
  }

  /**
   * Generate both templates from enrollment data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Generated templates
   */
  async generateMockTemplates(userId) {
    try {
      logger.info('Generating templates from enrollment data', { userId });

      const faceTemplate = await this.generateMockFaceTemplate(userId);
      const behaviorBaseline = await this.generateMockBehaviorBaseline(userId);

      logger.info('All templates generated successfully', { userId });

      return {
        faceTemplate,
        behaviorBaseline,
      };
    } catch (error) {
      logger.error('Failed to generate templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if mock template has been generated
   * @returns {boolean} Generation status
   */
  isMockTemplateGenerated() {
    return this.mockTemplateGenerated;
  }

  /**
   * Reset mock template flag
   */
  reset() {
    this.mockTemplateGenerated = false;
  }
}

// Create singleton instance
const mockTemplateService = new MockTemplateService();

export default mockTemplateService;
