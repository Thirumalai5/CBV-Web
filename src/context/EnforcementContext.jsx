/**
 * CBV System - Enforcement Context
 * Global enforcement state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useVerification } from './VerificationContext';
import formBlockerService from '@/services/enforcement/form-blocker.service';
import logger from '@/utils/logger';

const EnforcementContext = createContext(null);

export const EnforcementProvider = ({ children }) => {
  const { currentState, trustScore, isVerifying } = useVerification();
  
  const [isReAuthModalOpen, setIsReAuthModalOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringEndTime, setMonitoringEndTime] = useState(null);
  const [enforcementConfig, setEnforcementConfig] = useState({
    blurEnabled: true,
    formBlockingEnabled: true,
    downloadBlockingEnabled: true,
    clipboardBlockingEnabled: true,
    navigationBlockingEnabled: true,
  });

  // Initialize form blocker when state changes
  useEffect(() => {
    if (!enforcementConfig.formBlockingEnabled) return;

    formBlockerService.init(currentState);
    formBlockerService.updateState(currentState);

    return () => {
      formBlockerService.destroy();
    };
  }, [currentState, enforcementConfig.formBlockingEnabled]);

  // Auto-open re-auth modal in REAUTH state
  useEffect(() => {
    if (currentState === 'REAUTH' && !isReAuthModalOpen) {
      logger.warn('REAUTH state detected, opening re-authentication modal');
      setIsReAuthModalOpen(true);
    }
  }, [currentState, isReAuthModalOpen]);

  // Monitor recovery period
  useEffect(() => {
    if (!isMonitoring) return;

    const checkMonitoring = setInterval(() => {
      if (Date.now() >= monitoringEndTime) {
        endRecoveryMonitoring();
      }
    }, 1000);

    return () => clearInterval(checkMonitoring);
  }, [isMonitoring, monitoringEndTime]);

  /**
   * Open re-authentication modal
   */
  const openReAuthModal = useCallback(() => {
    logger.info('Opening re-authentication modal');
    setIsReAuthModalOpen(true);
  }, []);

  /**
   * Close re-authentication modal
   */
  const closeReAuthModal = useCallback(() => {
    logger.info('Closing re-authentication modal');
    setIsReAuthModalOpen(false);
  }, []);

  /**
   * Handle successful re-authentication
   */
  const handleReAuthSuccess = useCallback(() => {
    logger.info('Re-authentication successful');
    closeReAuthModal();
    startRecoveryMonitoring();
  }, [closeReAuthModal]);

  /**
   * Start recovery monitoring period
   */
  const startRecoveryMonitoring = useCallback(() => {
    const monitoringDuration = 60000; // 60 seconds
    const endTime = Date.now() + monitoringDuration;
    
    setIsMonitoring(true);
    setMonitoringEndTime(endTime);
    
    logger.info('Started recovery monitoring', {
      duration: monitoringDuration,
      endTime: new Date(endTime).toISOString(),
    });
  }, []);

  /**
   * End recovery monitoring period
   */
  const endRecoveryMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setMonitoringEndTime(null);
    
    logger.info('Recovery monitoring period ended');
  }, []);

  /**
   * Check if action should be blocked
   */
  const isActionBlocked = useCallback((actionType) => {
    switch (actionType) {
      case 'form':
        return enforcementConfig.formBlockingEnabled && 
               (currentState === 'RESTRICT' || currentState === 'REAUTH');
      
      case 'download':
        return enforcementConfig.downloadBlockingEnabled && 
               (currentState === 'RESTRICT' || currentState === 'REAUTH');
      
      case 'clipboard':
        return enforcementConfig.clipboardBlockingEnabled && 
               (currentState === 'RESTRICT' || currentState === 'REAUTH');
      
      case 'navigation':
        return enforcementConfig.navigationBlockingEnabled && 
               currentState === 'REAUTH';
      
      default:
        return false;
    }
  }, [currentState, enforcementConfig]);

  /**
   * Check if action requires confirmation
   */
  const requiresConfirmation = useCallback((actionType) => {
    return currentState === 'WATCH';
  }, [currentState]);

  /**
   * Update enforcement configuration
   */
  const updateConfig = useCallback((newConfig) => {
    setEnforcementConfig(prev => ({
      ...prev,
      ...newConfig,
    }));
    logger.info('Enforcement config updated', newConfig);
  }, []);

  /**
   * Get blur amount based on state
   */
  const getBlurAmount = useCallback(() => {
    if (!enforcementConfig.blurEnabled) return 0;
    
    switch (currentState) {
      case 'NORMAL': return 0;
      case 'WATCH': return 2;
      case 'RESTRICT': return 5;
      case 'REAUTH': return 10;
      default: return 0;
    }
  }, [currentState, enforcementConfig.blurEnabled]);

  const value = {
    // State
    currentState,
    trustScore,
    isVerifying,
    isReAuthModalOpen,
    isMonitoring,
    monitoringEndTime,
    enforcementConfig,

    // Modal controls
    openReAuthModal,
    closeReAuthModal,
    handleReAuthSuccess,

    // Recovery monitoring
    startRecoveryMonitoring,
    endRecoveryMonitoring,

    // Action checking
    isActionBlocked,
    requiresConfirmation,
    getBlurAmount,

    // Configuration
    updateConfig,
  };

  return (
    <EnforcementContext.Provider value={value}>
      {children}
    </EnforcementContext.Provider>
  );
};

/**
 * Hook to use enforcement context
 */
export const useEnforcement = () => {
  const context = useContext(EnforcementContext);
  
  if (!context) {
    throw new Error('useEnforcement must be used within EnforcementProvider');
  }
  
  return context;
};

export default EnforcementContext;
