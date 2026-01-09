/**
 * CBV System - Storage Service
 * Handles IndexedDB operations for persistent storage
 */

import { openDB } from 'idb';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import encryptionService from './encryption.service';

class StorageService {
  constructor() {
    this.db = null;
    this.dbName = CONFIG.STORAGE.DB_NAME;
    this.dbVersion = CONFIG.STORAGE.DB_VERSION;
    this.stores = CONFIG.STORAGE.STORES;
  }

  /**
   * Initialize database
   */
  async init() {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
          logger.info('Upgrading database', { oldVersion, newVersion });

          // Create users store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.USERS)) {
            const usersStore = db.createObjectStore(CONFIG.STORAGE.STORES.USERS, {
              keyPath: 'id',
              autoIncrement: true,
            });
            usersStore.createIndex('userId', 'userId', { unique: true });
            usersStore.createIndex('createdAt', 'createdAt');
          }

          // Create face_samples store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.FACE_SAMPLES)) {
            const faceSamplesStore = db.createObjectStore(CONFIG.STORAGE.STORES.FACE_SAMPLES, {
              keyPath: 'id',
              autoIncrement: true,
            });
            faceSamplesStore.createIndex('userId', 'userId');
            faceSamplesStore.createIndex('sessionId', 'sessionId');
            faceSamplesStore.createIndex('timestamp', 'timestamp');
          }

          // Create liveness_samples store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.LIVENESS_SAMPLES)) {
            const livenessSamplesStore = db.createObjectStore(CONFIG.STORAGE.STORES.LIVENESS_SAMPLES, {
              keyPath: 'id',
              autoIncrement: true,
            });
            livenessSamplesStore.createIndex('userId', 'userId');
            livenessSamplesStore.createIndex('sessionId', 'sessionId');
            livenessSamplesStore.createIndex('timestamp', 'timestamp');
          }

          // Create behavior_windows store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.BEHAVIOR_WINDOWS)) {
            const behaviorWindowsStore = db.createObjectStore(CONFIG.STORAGE.STORES.BEHAVIOR_WINDOWS, {
              keyPath: 'id',
              autoIncrement: true,
            });
            behaviorWindowsStore.createIndex('userId', 'userId');
            behaviorWindowsStore.createIndex('sessionId', 'sessionId');
            behaviorWindowsStore.createIndex('timestamp', 'timestamp');
          }

          // Create templates store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.TEMPLATES)) {
            const templatesStore = db.createObjectStore(CONFIG.STORAGE.STORES.TEMPLATES, {
              keyPath: 'id',
              autoIncrement: true,
            });
            templatesStore.createIndex('userId', 'userId', { unique: true });
            templatesStore.createIndex('createdAt', 'createdAt');
          }

          // Create logs store
          if (!db.objectStoreNames.contains(CONFIG.STORAGE.STORES.LOGS)) {
            const logsStore = db.createObjectStore(CONFIG.STORAGE.STORES.LOGS, {
              keyPath: 'id',
              autoIncrement: true,
            });
            logsStore.createIndex('userId', 'userId');
            logsStore.createIndex('timestamp', 'timestamp');
            logsStore.createIndex('state', 'state');
          }
        },
      });

      logger.info('Database initialized successfully', {
        name: this.dbName,
        version: this.dbVersion,
      });

      return this.db;
    } catch (error) {
      logger.error('Failed to initialize database', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // ==================== USERS ====================

  /**
   * Create or update user profile
   */
  async saveUser(userData) {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(this.stores.USERS, 'readwrite');
      const store = tx.objectStore(this.stores.USERS);

      // Check if user exists
      const existingUser = await store.index('userId').get(userData.userId);

      let result;
      if (existingUser) {
        // Update existing user
        result = await store.put({
          ...existingUser,
          ...userData,
          lastUpdated: Date.now(),
        });
      } else {
        // Create new user with enhanced profile
        result = await store.add({
          ...userData,
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          lastLogin: Date.now(),
          enrollmentStatus: 'not_started', // not_started, in_progress, completed
          enrollmentProgress: 0, // 0-100
          enrollmentAttempts: 0,
          enrollmentMetadata: {
            startTime: null,
            endTime: null,
            duration: null,
            faceSamplesCollected: 0,
            livenessSamplesCollected: 0,
            behaviorWindowsCollected: 0,
          },
          templateVersions: [],
          permissions: {
            canUpdateTemplates: true,
            canExportData: true,
            canPurgeData: true,
            isOwner: true,
          },
        });
      }

      await tx.done;
      logger.info('User saved', { userId: userData.userId });
      return result;
    } catch (error) {
      logger.error('Failed to save user', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user by userId
   */
  async getUser(userId) {
    try {
      const db = await this.ensureDB();
      const user = await db.getFromIndex(this.stores.USERS, 'userId', userId);
      return user || null;
    } catch (error) {
      logger.error('Failed to get user', { error: error.message });
      throw error;
    }
  }

  // ==================== FACE SAMPLES ====================

  /**
   * Save face sample
   */
  async saveFaceSample(sample) {
    try {
      const db = await this.ensureDB();
      const id = await db.add(this.stores.FACE_SAMPLES, {
        ...sample,
        timestamp: Date.now(),
      });
      logger.debug('Face sample saved', { id });
      return id;
    } catch (error) {
      logger.error('Failed to save face sample', { error: error.message });
      throw error;
    }
  }

  /**
   * Get face samples by session
   */
  async getFaceSamples(sessionId) {
    try {
      const db = await this.ensureDB();
      const samples = await db.getAllFromIndex(
        this.stores.FACE_SAMPLES,
        'sessionId',
        sessionId
      );
      return samples;
    } catch (error) {
      logger.error('Failed to get face samples', { error: error.message });
      throw error;
    }
  }

  /**
   * Get face samples by user
   */
  async getFaceSamplesByUser(userId) {
    try {
      const db = await this.ensureDB();
      const samples = await db.getAllFromIndex(
        this.stores.FACE_SAMPLES,
        'userId',
        userId
      );
      return samples;
    } catch (error) {
      logger.error('Failed to get face samples by user', { error: error.message });
      throw error;
    }
  }

  // ==================== LIVENESS SAMPLES ====================

  /**
   * Save liveness sample
   */
  async saveLivenessSample(sample) {
    try {
      const db = await this.ensureDB();
      const id = await db.add(this.stores.LIVENESS_SAMPLES, {
        ...sample,
        timestamp: Date.now(),
      });
      logger.debug('Liveness sample saved', { id });
      return id;
    } catch (error) {
      logger.error('Failed to save liveness sample', { error: error.message });
      throw error;
    }
  }

  /**
   * Get liveness samples by session
   */
  async getLivenessSamples(sessionId) {
    try {
      const db = await this.ensureDB();
      const samples = await db.getAllFromIndex(
        this.stores.LIVENESS_SAMPLES,
        'sessionId',
        sessionId
      );
      return samples;
    } catch (error) {
      logger.error('Failed to get liveness samples', { error: error.message });
      throw error;
    }
  }

  // ==================== BEHAVIOR WINDOWS ====================

  /**
   * Save behavior window
   */
  async saveBehaviorWindow(window) {
    try {
      const db = await this.ensureDB();
      const id = await db.add(this.stores.BEHAVIOR_WINDOWS, {
        ...window,
        timestamp: Date.now(),
      });
      logger.debug('Behavior window saved', { id });
      return id;
    } catch (error) {
      logger.error('Failed to save behavior window', { error: error.message });
      throw error;
    }
  }

  /**
   * Get behavior windows by session
   */
  async getBehaviorWindows(sessionId) {
    try {
      const db = await this.ensureDB();
      const windows = await db.getAllFromIndex(
        this.stores.BEHAVIOR_WINDOWS,
        'sessionId',
        sessionId
      );
      return windows;
    } catch (error) {
      logger.error('Failed to get behavior windows', { error: error.message });
      throw error;
    }
  }

  // ==================== TEMPLATES ====================

  /**
   * Save template (encrypted)
   */
  async saveTemplate(userId, template, password) {
    try {
      const db = await this.ensureDB();
      
      // Encrypt template
      const encrypted = await encryptionService.createEncryptedObject(template, password);

      const tx = db.transaction(this.stores.TEMPLATES, 'readwrite');
      const store = tx.objectStore(this.stores.TEMPLATES);

      // Check if template exists
      const existing = await store.index('userId').get(userId);

      let result;
      if (existing) {
        result = await store.put({
          ...existing,
          userId,
          encrypted,
          updatedAt: Date.now(),
        });
      } else {
        result = await store.add({
          userId,
          encrypted,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      await tx.done;
      logger.info('Template saved', { userId });
      return result;
    } catch (error) {
      logger.error('Failed to save template', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template (decrypt)
   */
  async getTemplate(userId, password) {
    try {
      const db = await this.ensureDB();
      const record = await db.getFromIndex(this.stores.TEMPLATES, 'userId', userId);

      if (!record) {
        return null;
      }

      // Decrypt template
      const template = await encryptionService.decryptObject(record.encrypted, password);
      return template;
    } catch (error) {
      logger.error('Failed to get template', { error: error.message });
      throw error;
    }
  }

  // ==================== LOGS ====================

  /**
   * Save log entry
   */
  async saveLog(logEntry) {
    try {
      const db = await this.ensureDB();
      const id = await db.add(this.stores.LOGS, {
        ...logEntry,
        timestamp: Date.now(),
      });
      return id;
    } catch (error) {
      logger.error('Failed to save log', { error: error.message });
      throw error;
    }
  }

  /**
   * Get logs by user
   */
  async getLogs(userId, limit = 1000) {
    try {
      const db = await this.ensureDB();
      const logs = await db.getAllFromIndex(this.stores.LOGS, 'userId', userId);
      
      // Sort by timestamp descending and limit
      return logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get logs', { error: error.message });
      throw error;
    }
  }

  // ==================== EXPORT / IMPORT ====================

  /**
   * Export all data for a user
   */
  async exportData(userId) {
    try {
      const db = await this.ensureDB();

      const data = {
        version: CONFIG.VERSION,
        exportedAt: Date.now(),
        userId,
        user: await this.getUser(userId),
        faceSamples: await this.getFaceSamplesByUser(userId),
        livenessSamples: await db.getAllFromIndex(this.stores.LIVENESS_SAMPLES, 'userId', userId),
        behaviorWindows: await db.getAllFromIndex(this.stores.BEHAVIOR_WINDOWS, 'userId', userId),
        logs: await this.getLogs(userId),
      };

      logger.info('Data exported', { userId, recordCount: data.faceSamples.length });
      return data;
    } catch (error) {
      logger.error('Failed to export data', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear all data (purge)
   */
  async clearAll() {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(Object.values(this.stores), 'readwrite');

      for (const storeName of Object.values(this.stores)) {
        await tx.objectStore(storeName).clear();
      }

      await tx.done;
      logger.info('All data cleared');
    } catch (error) {
      logger.error('Failed to clear data', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear data for specific user
   */
  async clearUserData(userId) {
    try {
      const db = await this.ensureDB();

      // Clear from each store
      for (const storeName of Object.values(this.stores)) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        if (store.indexNames.contains('userId')) {
          const index = store.index('userId');
          let cursor = await index.openCursor(userId);
          
          while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
          }
        }
        
        await tx.done;
      }

      logger.info('User data cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear user data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    try {
      const db = await this.ensureDB();
      const stats = {};

      for (const [key, storeName] of Object.entries(this.stores)) {
        const count = await db.count(storeName);
        stats[key] = count;
      }

      logger.debug('Storage stats', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Import data from exported JSON
   * @param {string} userId - User ID to import for
   * @param {Object} data - Data object containing arrays of samples
   */
  async importData(userId, data) {
    try {
      logger.info('Starting data import', { userId });
      const db = await this.ensureDB();

      // Import face samples
      if (data.faceSamples && Array.isArray(data.faceSamples)) {
        const tx = db.transaction(this.stores.FACE_SAMPLES, 'readwrite');
        for (const sample of data.faceSamples) {
          // Update userId to match current user
          const importSample = { ...sample, userId };
          await tx.store.add(importSample);
        }
        await tx.done;
        logger.info(`Imported ${data.faceSamples.length} face samples`);
      }

      // Import liveness samples
      if (data.livenessSamples && Array.isArray(data.livenessSamples)) {
        const tx = db.transaction(this.stores.LIVENESS_SAMPLES, 'readwrite');
        for (const sample of data.livenessSamples) {
          const importSample = { ...sample, userId };
          await tx.store.add(importSample);
        }
        await tx.done;
        logger.info(`Imported ${data.livenessSamples.length} liveness samples`);
      }

      // Import behavior windows
      if (data.behaviorWindows && Array.isArray(data.behaviorWindows)) {
        const tx = db.transaction(this.stores.BEHAVIOR_WINDOWS, 'readwrite');
        for (const window of data.behaviorWindows) {
          const importWindow = { ...window, userId };
          await tx.store.add(importWindow);
        }
        await tx.done;
        logger.info(`Imported ${data.behaviorWindows.length} behavior windows`);
      }

      // Import logs (optional)
      if (data.logs && Array.isArray(data.logs)) {
        const tx = db.transaction(this.stores.LOGS, 'readwrite');
        for (const log of data.logs) {
          const importLog = { ...log, userId };
          await tx.store.add(importLog);
        }
        await tx.done;
        logger.info(`Imported ${data.logs.length} log entries`);
      }

      logger.info('Data import completed successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to import data', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const storageService = new StorageService();

export default storageService;
