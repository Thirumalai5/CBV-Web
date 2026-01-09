/**
 * CBV System - Authentication Service
 * Handles user authentication, session management, and enrolment key generation
 */

import { v4 as uuidv4 } from 'uuid';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import storageService from './storage.service';
import encryptionService from './encryption.service';
import permissionService from './permission.service';

class AuthService {
  constructor() {
    this.sessionKey = 'cbv_session';
    this.currentSession = null;
    this.sessionTimeoutId = null;
  }

  /**
   * Validate credentials against demo credentials
   */
  validateCredentials(userId, password) {
    const { USER_ID, PASSWORD } = CONFIG.DEMO_CREDENTIALS;
    
    if (userId === USER_ID && password === PASSWORD) {
      logger.info('Credentials validated successfully', { userId });
      return true;
    }
    
    logger.warn('Invalid credentials', { userId });
    return false;
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId) {
    try {
      const user = await storageService.getUser(userId);
      if (!user || !user.lockedUntil) {
        return false;
      }

      const now = Date.now();
      if (now < user.lockedUntil) {
        const remainingTime = Math.ceil((user.lockedUntil - now) / 1000);
        logger.warn('Account is locked', { userId, remainingSeconds: remainingTime });
        return true;
      }

      // Lock expired, clear it
      await this.clearAccountLock(userId);
      return false;
    } catch (error) {
      logger.error('Failed to check account lock', { error: error.message });
      return false;
    }
  }

  /**
   * Clear account lock
   */
  async clearAccountLock(userId) {
    try {
      const user = await storageService.getUser(userId);
      if (user) {
        await storageService.saveUser({
          ...user,
          loginAttempts: 0,
          lockedUntil: null,
        });
        logger.info('Account lock cleared', { userId });
      }
    } catch (error) {
      logger.error('Failed to clear account lock', { error: error.message });
    }
  }

  /**
   * Increment login attempts and lock if needed
   */
  async incrementLoginAttempts(userId) {
    try {
      let user = await storageService.getUser(userId);
      
      if (!user) {
        // Create user profile for tracking attempts
        user = {
          userId,
          createdAt: Date.now(),
          loginAttempts: 0,
          lockedUntil: null,
          enrollment: {
            status: CONFIG.ENROLLMENT.STATUS.NOT_STARTED,
            startedAt: null,
            completedAt: null,
            progress: {
              faceSamples: 0,
              livenessDuration: 0,
              behaviorDuration: 0,
            },
            attempts: 0,
          },
        };
      }

      const attempts = (user.loginAttempts || 0) + 1;
      const updates = { loginAttempts: attempts };

      // Lock account if max attempts reached
      if (attempts >= CONFIG.AUTH.MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = Date.now() + CONFIG.AUTH.LOCKOUT_DURATION;
        logger.warn('Account locked due to failed attempts', { userId, attempts });
      }

      await storageService.saveUser({ ...user, ...updates });
      return attempts;
    } catch (error) {
      logger.error('Failed to increment login attempts', { error: error.message });
      return 0;
    }
  }

  /**
   * Reset login attempts on successful login
   */
  async resetLoginAttempts(userId) {
    try {
      const user = await storageService.getUser(userId);
      if (user) {
        await storageService.saveUser({
          ...user,
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Failed to reset login attempts', { error: error.message });
    }
  }

  /**
   * Login user and create enrolment session
   */
  async login(userId, password) {
    try {
      // Check if account is locked
      const isLocked = await this.isAccountLocked(userId);
      if (isLocked) {
        const user = await storageService.getUser(userId);
        const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 1000);
        throw new Error(`Account locked. Try again in ${remainingTime} seconds.`);
      }

      // Validate credentials
      if (!this.validateCredentials(userId, password)) {
        // Increment failed attempts
        const attempts = await this.incrementLoginAttempts(userId);
        const remaining = CONFIG.AUTH.MAX_LOGIN_ATTEMPTS - attempts;
        
        if (remaining > 0) {
          throw new Error(`Invalid credentials. ${remaining} attempts remaining.`);
        } else {
          throw new Error('Account locked due to too many failed attempts.');
        }
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(userId);

      // Generate enrolment session ID
      const sessionId = uuidv4();
      const timestamp = Date.now();

      // Derive encryption key from password
      const enrolmentKey = await this.deriveEnrolmentKey(password);

      // Create session object
      const session = {
        userId,
        sessionId,
        enrolmentKey,
        createdAt: timestamp,
        expiresAt: timestamp + CONFIG.AUTH.SESSION_TIMEOUT,
        isAuthenticated: true,
      };

      // Check if user exists in database
      let user = await storageService.getUser(userId);
      
      if (!user) {
        // Create new user profile with enhanced schema
        await storageService.saveUser({
          userId,
          createdAt: timestamp,
          lastLogin: timestamp,
          loginAttempts: 0,
          lockedUntil: null,
          enrollment: {
            status: CONFIG.ENROLLMENT.STATUS.NOT_STARTED,
            startedAt: null,
            completedAt: null,
            progress: {
              faceSamples: 0,
              livenessDuration: 0,
              behaviorDuration: 0,
            },
            attempts: 0,
          },
          templates: {
            version: 0,
            createdAt: null,
            updatedAt: null,
          },
          permissions: permissionService.isOwner(userId) ? CONFIG.PERMISSIONS.OWNER_ONLY : CONFIG.PERMISSIONS.VERIFICATION_ONLY,
        });
        logger.info('New user profile created', { userId });
      } else {
        // Update last login
        await storageService.saveUser({
          ...user,
          lastLogin: timestamp,
        });
        logger.info('Existing user logged in', { userId });
      }

      // Store session
      this.currentSession = session;
      this.saveSession(session);

      // Start session timeout
      this.startSessionTimeout();

      logger.info('Login successful', { userId, sessionId });
      return session;
    } catch (error) {
      logger.error('Login failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Start session timeout
   */
  startSessionTimeout() {
    // Clear existing timeout
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    // Set new timeout
    this.sessionTimeoutId = setTimeout(() => {
      logger.warn('Session expired due to timeout');
      this.logout();
      // Optionally trigger a callback or event
      window.dispatchEvent(new CustomEvent('session-timeout'));
    }, CONFIG.AUTH.SESSION_TIMEOUT);
  }

  /**
   * Check if session is expired
   */
  isSessionExpired() {
    const session = this.getSession();
    if (!session || !session.expiresAt) {
      return true;
    }

    return Date.now() > session.expiresAt;
  }

  /**
   * Logout user and clear session
   */
  logout() {
    try {
      if (this.currentSession) {
        logger.info('User logged out', { userId: this.currentSession.userId });
      }
      
      // Clear session timeout
      if (this.sessionTimeoutId) {
        clearTimeout(this.sessionTimeoutId);
        this.sessionTimeoutId = null;
      }
      
      this.currentSession = null;
      sessionStorage.removeItem(this.sessionKey);
      
      return true;
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current session
   */
  getSession() {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to restore from sessionStorage
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      if (stored) {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      }
    } catch (error) {
      logger.error('Failed to restore session', { error: error.message });
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = this.getSession();
    
    if (!session || !session.isAuthenticated) {
      return false;
    }

    // Check if session is expired
    if (this.isSessionExpired()) {
      logger.warn('Session expired');
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Save session to sessionStorage
   */
  saveSession(session) {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      logger.error('Failed to save session', { error: error.message });
    }
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  async deriveEnrolmentKey(password) {
    try {
      // Generate or retrieve salt (for demo, use fixed salt based on user)
      // In production, this should be stored securely
      const salt = new TextEncoder().encode(CONFIG.DEMO_CREDENTIALS.USER_ID + '_salt');

      // Derive key - we don't export it, just store a hash for verification
      const keyMaterial = await encryptionService.deriveKey(password, salt);

      // Create a hash of the password for verification purposes
      const passwordHash = await encryptionService.hash(password);

      logger.info('Enrolment key derived successfully');
      return passwordHash;
    } catch (error) {
      logger.error('Failed to derive enrolment key', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has completed enrolment
   */
  async hasCompletedEnrolment(userId) {
    try {
      const user = await storageService.getUser(userId);
      return user && user.hasCompletedEnrolment === true;
    } catch (error) {
      logger.error('Failed to check enrolment status', { error: error.message });
      return false;
    }
  }

  /**
   * Start enrollment
   */
  async startEnrollment(userId) {
    try {
      // Check permission
      await permissionService.requirePermission(userId, 'complete_enrollment');

      const user = await storageService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if already completed
      if (user.enrollment && user.enrollment.status === CONFIG.ENROLLMENT.STATUS.COMPLETED) {
        throw new Error('Enrollment already completed');
      }

      await storageService.saveUser({
        ...user,
        enrollment: {
          ...user.enrollment,
          status: CONFIG.ENROLLMENT.STATUS.IN_PROGRESS,
          startedAt: Date.now(),
          attempts: (user.enrollment?.attempts || 0) + 1,
        },
      });

      logger.info('Enrollment started', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to start enrollment', { error: error.message });
      throw error;
    }
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(userId, progress) {
    try {
      const user = await storageService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await storageService.saveUser({
        ...user,
        enrollment: {
          ...user.enrollment,
          progress: {
            ...user.enrollment.progress,
            ...progress,
          },
        },
      });

      logger.info('Enrollment progress updated', { userId, progress });
      return true;
    } catch (error) {
      logger.error('Failed to update enrollment progress', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if enrollment requirements are met
   */
  async checkEnrollmentRequirements(userId) {
    try {
      const user = await storageService.getUser(userId);
      if (!user || !user.enrollment) {
        return { met: false, missing: ['No enrollment data'] };
      }

      const { progress } = user.enrollment;
      const { REQUIREMENTS } = CONFIG.ENROLLMENT;
      const missing = [];

      // Only check face samples as required
      if (progress.faceSamples < REQUIREMENTS.MIN_FACE_SAMPLES) {
        missing.push(`Face samples: ${progress.faceSamples}/${REQUIREMENTS.MIN_FACE_SAMPLES}`);
      }

      // Liveness and behavior are optional (only check if MIN > 0)
      if (REQUIREMENTS.MIN_LIVENESS_DURATION > 0 && progress.livenessDuration < REQUIREMENTS.MIN_LIVENESS_DURATION) {
        missing.push(`Liveness duration: ${progress.livenessDuration}s/${REQUIREMENTS.MIN_LIVENESS_DURATION}s`);
      }

      if (REQUIREMENTS.MIN_BEHAVIOR_DURATION > 0 && (progress.behaviorDuration || 0) < REQUIREMENTS.MIN_BEHAVIOR_DURATION) {
        missing.push(`Behavior duration: ${progress.behaviorDuration || 0}s/${REQUIREMENTS.MIN_BEHAVIOR_DURATION}s`);
      }

      return {
        met: missing.length === 0,
        missing,
        progress,
      };
    } catch (error) {
      logger.error('Failed to check enrollment requirements', { error: error.message });
      return { met: false, missing: ['Error checking requirements'] };
    }
  }

  /**
   * Mark enrolment as complete
   */
  async completeEnrolment(userId) {
    try {
      // Check permission
      await permissionService.requirePermission(userId, 'complete_enrollment');

      const user = await storageService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check requirements
      const requirements = await this.checkEnrollmentRequirements(userId);
      if (!requirements.met) {
        throw new Error(`Enrollment requirements not met: ${requirements.missing.join(', ')}`);
      }

      await storageService.saveUser({
        ...user,
        enrollment: {
          ...user.enrollment,
          status: CONFIG.ENROLLMENT.STATUS.COMPLETED,
          completedAt: Date.now(),
        },
        hasCompletedEnrolment: true,
        enrolmentCompletedAt: Date.now(),
      });

      logger.info('Enrolment marked as complete', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to complete enrolment', { error: error.message });
      throw error;
    }
  }

  /**
   * Get enrollment status
   */
  async getEnrollmentStatus(userId) {
    try {
      const user = await storageService.getUser(userId);
      if (!user || !user.enrollment) {
        return {
          status: CONFIG.ENROLLMENT.STATUS.NOT_STARTED,
          progress: { faceSamples: 0, livenessDuration: 0, behaviorDuration: 0 },
          requirements: await this.checkEnrollmentRequirements(userId),
        };
      }

      return {
        status: user.enrollment.status,
        progress: user.enrollment.progress,
        startedAt: user.enrollment.startedAt,
        completedAt: user.enrollment.completedAt,
        attempts: user.enrollment.attempts,
        requirements: await this.checkEnrollmentRequirements(userId),
      };
    } catch (error) {
      logger.error('Failed to get enrollment status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      return await storageService.getUser(userId);
    } catch (error) {
      logger.error('Failed to get user profile', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const user = await storageService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await storageService.saveUser({
        ...user,
        ...updates,
      });

      logger.info('User profile updated', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to update user profile', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
