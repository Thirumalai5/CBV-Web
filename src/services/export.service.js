/**
 * CBV System - Export Service
 * Handles data export and download functionality
 */

import storageService from './storage.service';
import logger from '@/utils/logger';
import CONFIG from '@/utils/config';

class ExportService {
  /**
   * Export user data as JSON file
   * @param {string} userId - User ID to export data for
   * @returns {Promise<Object>} Export result with download info
   */
  async exportUserData(userId) {
    try {
      logger.info('Starting data export', { userId });

      // Get all user data from storage
      const data = await storageService.exportData(userId);

      // Add export metadata
      const exportData = {
        version: CONFIG.VERSION,
        schemaVersion: CONFIG.SCHEMA_VERSION,
        exportDate: new Date().toISOString(),
        userId: data.userId,
        user: data.user,
        data: {
          faceSamples: data.faceSamples || [],
          livenessSamples: data.livenessSamples || [],
          behaviorWindows: data.behaviorWindows || [],
          logs: data.logs || [],
        },
        statistics: {
          totalFaceSamples: data.faceSamples?.length || 0,
          totalLivenessSamples: data.livenessSamples?.length || 0,
          totalBehaviorWindows: data.behaviorWindows?.length || 0,
          totalLogs: data.logs?.length || 0,
          exportSize: 0, // Will be calculated
        },
      };

      // Calculate export size
      const jsonString = JSON.stringify(exportData, null, 2);
      exportData.statistics.exportSize = new Blob([jsonString]).size;

      logger.info('Data export prepared', {
        userId,
        size: exportData.statistics.exportSize,
        samples: exportData.statistics.totalFaceSamples,
      });

      return exportData;
    } catch (error) {
      logger.error('Failed to export user data', { error: error.message });
      throw error;
    }
  }

  /**
   * Download exported data as JSON file
   * @param {Object} exportData - Data to download
   * @param {string} filename - Optional custom filename
   */
  downloadExport(exportData, filename = null) {
    try {
      // Generate filename if not provided
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `cbv_export_${exportData.userId}_${timestamp}.json`;
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Export downloaded', { filename, size: blob.size });

      return {
        success: true,
        filename,
        size: blob.size,
      };
    } catch (error) {
      logger.error('Failed to download export', { error: error.message });
      throw error;
    }
  }

  /**
   * Export and download user data in one step
   * @param {string} userId - User ID to export
   * @param {string} filename - Optional custom filename
   * @returns {Promise<Object>} Download result
   */
  async exportAndDownload(userId, filename = null) {
    try {
      // Export data
      const exportData = await this.exportUserData(userId);
      
      // Download
      const result = this.downloadExport(exportData, filename);
      
      return {
        ...result,
        statistics: exportData.statistics,
      };
    } catch (error) {
      logger.error('Failed to export and download', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate export data structure
   * @param {Object} exportData - Data to validate
   * @returns {Object} Validation result
   */
  validateExport(exportData) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!exportData.version) errors.push('Missing version');
    if (!exportData.userId) errors.push('Missing userId');
    if (!exportData.exportDate) errors.push('Missing exportDate');
    if (!exportData.data) errors.push('Missing data object');

    // Check data structure
    if (exportData.data) {
      if (!Array.isArray(exportData.data.faceSamples)) {
        errors.push('faceSamples must be an array');
      }
      if (!Array.isArray(exportData.data.livenessSamples)) {
        errors.push('livenessSamples must be an array');
      }
      if (!Array.isArray(exportData.data.behaviorWindows)) {
        errors.push('behaviorWindows must be an array');
      }
    }

    // Check for empty data
    if (exportData.statistics) {
      if (exportData.statistics.totalFaceSamples === 0) {
        warnings.push('No face samples in export');
      }
      if (exportData.statistics.totalLivenessSamples === 0) {
        warnings.push('No liveness samples in export');
      }
      if (exportData.statistics.totalBehaviorWindows === 0) {
        warnings.push('No behavior windows in export');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get export preview (metadata only, no actual data)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Export preview
   */
  async getExportPreview(userId) {
    try {
      const stats = await storageService.getStats();
      const user = await storageService.getUser(userId);

      return {
        userId,
        userName: user?.userId || 'Unknown',
        enrollmentStatus: user?.enrollmentStatus || 'unknown',
        statistics: {
          faceSamples: stats.FACE_SAMPLES || 0,
          livenessSamples: stats.LIVENESS_SAMPLES || 0,
          behaviorWindows: stats.BEHAVIOR_WINDOWS || 0,
          logs: stats.LOGS || 0,
        },
        estimatedSize: this.estimateExportSize(stats),
      };
    } catch (error) {
      logger.error('Failed to get export preview', { error: error.message });
      throw error;
    }
  }

  /**
   * Estimate export file size
   * @param {Object} stats - Storage statistics
   * @returns {number} Estimated size in bytes
   */
  estimateExportSize(stats) {
    // Rough estimates based on typical data sizes
    const faceSampleSize = 100 * 1024; // ~100KB per face sample
    const livenessSize = 10 * 1024; // ~10KB per liveness sample
    const behaviorSize = 10 * 1024; // ~10KB per behavior window
    const logSize = 1 * 1024; // ~1KB per log entry

    const estimated =
      (stats.FACE_SAMPLES || 0) * faceSampleSize +
      (stats.LIVENESS_SAMPLES || 0) * livenessSize +
      (stats.BEHAVIOR_WINDOWS || 0) * behaviorSize +
      (stats.LOGS || 0) * logSize;

    return estimated;
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Import user data from exported JSON
   * @param {string} userId - User ID to import data for
   * @param {Object} exportData - Exported data object
   * @returns {Promise<Object>} Import result
   */
  async importData(userId, exportData) {
    try {
      logger.info('Starting data import', { userId, exportUserId: exportData.userId });

      // Validate export data
      const validation = this.validateExport(exportData);
      if (!validation.isValid) {
        throw new Error(`Invalid export data: ${validation.errors.join(', ')}`);
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        logger.warn('Import warnings', { warnings: validation.warnings });
      }

      // Import data using storage service
      await storageService.importData(userId, exportData.data);

      logger.info('Data import completed', {
        userId,
        faceSamples: exportData.statistics?.totalFaceSamples || 0,
        livenessSamples: exportData.statistics?.totalLivenessSamples || 0,
        behaviorWindows: exportData.statistics?.totalBehaviorWindows || 0,
      });

      return {
        success: true,
        statistics: exportData.statistics,
      };
    } catch (error) {
      logger.error('Failed to import data', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const exportService = new ExportService();

export default exportService;
