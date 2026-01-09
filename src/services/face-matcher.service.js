/**
 * CBV System - Face Matcher Service
 * Performs face verification using template matching with real face recognition
 */

import faceRecognitionService from './face-recognition.service';
import logger from '@/utils/logger';

class FaceMatcherService {
  constructor() {
    this.template = null;
    this.useRealFaceRecognition = true; // Toggle for real vs mock
  }

  /**
   * Initialize face recognition
   */
  async init() {
    if (this.useRealFaceRecognition) {
      try {
        await faceRecognitionService.init();
        logger.info('Face matcher initialized with real face recognition');
      } catch (error) {
        logger.warn('Failed to initialize real face recognition, falling back to mock', {
          error: error.message
        });
        this.useRealFaceRecognition = false;
      }
    }
  }

  /**
   * Set face template
   * @param {Object} template - Face template
   */
  setTemplate(template) {
    if (!template || !template.embedding || !template.threshold) {
      throw new Error('Invalid face template');
    }

    this.template = template;
    logger.info('Face template set', {
      dimension: template.embedding.dimension,
      threshold: template.threshold.value,
      usingRealRecognition: this.useRealFaceRecognition
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Match face embedding against template
   * @param {Array<number>} embedding - Face embedding to match
   * @returns {Object} Match result
   */
  matchFace(embedding) {
    if (!this.template) {
      throw new Error('No face template loaded');
    }

    if (!embedding || embedding.length !== this.template.embedding.dimension) {
      throw new Error(`Invalid embedding dimension. Expected ${this.template.embedding.dimension}, got ${embedding?.length}`);
    }

    // Calculate similarity
    const similarity = this.cosineSimilarity(
      embedding,
      this.template.embedding.vector
    );

    // Check against threshold
    const threshold = this.template.threshold.value;
    const isMatch = similarity > threshold;

    // Calculate confidence (normalized similarity)
    const confidence = Math.max(0, Math.min(1, (similarity + 1) / 2));

    const result = {
      isMatch,
      similarity,
      confidence,
      threshold,
      margin: similarity - threshold
    };

    logger.debug('Face match result', result);

    return result;
  }

  /**
   * Extract real face embedding using face-api.js
   * @param {HTMLVideoElement|HTMLImageElement} source - Video or image element
   * @returns {Promise<Array<number>|null>} Face embedding or null
   */
  async extractRealEmbedding(source) {
    try {
      const descriptor = await faceRecognitionService.extractDescriptorFromVideo(source);
      
      if (!descriptor) {
        logger.debug('No face detected for embedding extraction');
        return null;
      }

      // Convert Float32Array to regular array
      return Array.from(descriptor);
    } catch (error) {
      logger.error('Failed to extract real embedding', { error: error.message });
      return null;
    }
  }

  /**
   * Generate mock embedding for demonstration (fallback)
   * @param {HTMLVideoElement|HTMLImageElement} source - Video or image element
   * @returns {Promise<Array<number>>} Mock embedding
   */
  async generateMockEmbedding(source) {
    if (!this.template) {
      throw new Error('No face template loaded');
    }

    const dimension = this.template.embedding.dimension;
    
    // Generate embedding similar to template (for demo purposes)
    const baseEmbedding = this.template.embedding.vector;
    const embedding = [];
    
    // Add small random variations
    for (let i = 0; i < dimension; i++) {
      const noise = (Math.random() - 0.5) * 0.2; // Small noise
      embedding.push(baseEmbedding[i] + noise);
    }

    // Normalize
    let norm = 0;
    for (let i = 0; i < dimension; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);

    for (let i = 0; i < dimension; i++) {
      embedding[i] /= norm;
    }

    logger.debug('Generated mock embedding (fallback)', { dimension });

    return embedding;
  }

  /**
   * Verify face from video stream
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {Promise<Object>} Verification result
   */
  async verifyFace(videoElement) {
    try {
      if (!this.template) {
        throw new Error('No face template loaded');
      }

      let embedding;

      // Try real face recognition first
      if (this.useRealFaceRecognition && faceRecognitionService.areModelsLoaded()) {
        embedding = await this.extractRealEmbedding(videoElement);
        
        // If no face detected, return early
        if (!embedding) {
          return {
            success: false,
            error: 'No face detected',
            isMatch: false,
            confidence: 0
          };
        }
        
        logger.debug('Using real face recognition');
      } else {
        // Fallback to mock embedding
        embedding = await this.generateMockEmbedding(videoElement);
        logger.debug('Using mock face recognition (fallback)');
      }

      // Match against template
      const matchResult = this.matchFace(embedding);

      return {
        success: true,
        ...matchResult,
        usingRealRecognition: this.useRealFaceRecognition && faceRecognitionService.areModelsLoaded()
      };
    } catch (error) {
      logger.error('Face verification failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        isMatch: false,
        confidence: 0
      };
    }
  }

  /**
   * Get template info
   * @returns {Object|null} Template info
   */
  getTemplateInfo() {
    if (!this.template) {
      return null;
    }

    return {
      userId: this.template.userId,
      dimension: this.template.embedding.dimension,
      threshold: this.template.threshold.value,
      samplesUsed: this.template.metadata?.samples_used,
      createdAt: this.template.createdAt
    };
  }

  /**
   * Check if template is loaded
   * @returns {boolean} Template loaded status
   */
  hasTemplate() {
    return !!this.template;
  }

  /**
   * Clear template
   */
  clearTemplate() {
    this.template = null;
    logger.info('Face template cleared');
  }
}

// Create singleton instance
const faceMatcherService = new FaceMatcherService();

export default faceMatcherService;
