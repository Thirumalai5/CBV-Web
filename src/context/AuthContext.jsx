/**
 * CBV System - Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/auth.service';
import logger from '@/utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const existingSession = authService.getSession();
      
      if (existingSession && existingSession.isAuthenticated) {
        setSession(existingSession);
        setIsAuthenticated(true);
        
        // Load user profile
        const userProfile = await authService.getUserProfile(existingSession.userId);
        setCurrentUser(userProfile);
        
        logger.info('Session restored', { userId: existingSession.userId });
      }
    } catch (error) {
      logger.error('Failed to restore session', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId, password) => {
    try {
      setLoading(true);
      
      // Perform login
      const newSession = await authService.login(userId, password);
      
      // Update state
      setSession(newSession);
      setIsAuthenticated(true);
      
      // Load user profile
      const userProfile = await authService.getUserProfile(userId);
      setCurrentUser(userProfile);
      
      logger.info('User logged in via context', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Login failed in context', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
      setSession(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      logger.info('User logged out via context');
      return { success: true };
    } catch (error) {
      logger.error('Logout failed in context', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (session && session.userId) {
        const userProfile = await authService.getUserProfile(session.userId);
        setCurrentUser(userProfile);
        return userProfile;
      }
    } catch (error) {
      logger.error('Failed to refresh user profile', { error: error.message });
      throw error;
    }
  };

  const startEnrollment = async () => {
    try {
      if (!session || !session.userId) {
        throw new Error('No active session');
      }

      await authService.startEnrollment(session.userId);
      await refreshUserProfile();
      
      logger.info('Enrollment started via context');
      return { success: true };
    } catch (error) {
      logger.error('Failed to start enrollment', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateEnrollmentProgress = async (progress) => {
    try {
      if (!session || !session.userId) {
        throw new Error('No active session');
      }

      await authService.updateEnrollmentProgress(session.userId, progress);
      await refreshUserProfile();
      
      logger.info('Enrollment progress updated via context', { progress });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update enrollment progress', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const getEnrollmentStatus = async () => {
    try {
      if (!session || !session.userId) {
        throw new Error('No active session');
      }

      const status = await authService.getEnrollmentStatus(session.userId);
      return { success: true, data: status };
    } catch (error) {
      logger.error('Failed to get enrollment status', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const completeEnrolment = async () => {
    try {
      if (!session || !session.userId) {
        throw new Error('No active session');
      }

      await authService.completeEnrolment(session.userId);
      await refreshUserProfile();
      
      logger.info('Enrolment completed via context');
      return { success: true };
    } catch (error) {
      logger.error('Failed to complete enrolment', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    isAuthenticated,
    currentUser,
    session,
    loading,
    login,
    logout,
    refreshUserProfile,
    startEnrollment,
    updateEnrollmentProgress,
    getEnrollmentStatus,
    completeEnrolment,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
