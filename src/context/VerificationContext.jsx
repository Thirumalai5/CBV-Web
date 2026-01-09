/**
 * CBV System - Verification Context
 * Provides global access to verification state and controls
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import verificationService from '@/services/verification.service';
import trustScoreService from '@/services/trust-score.service';
import logger from '@/utils/logger';

const VerificationContext = createContext(null);

export const VerificationProvider = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [trustScore, setTrustScore] = useState(1.0);
  const [currentState, setCurrentState] = useState('NORMAL');
  const [scores, setScores] = useState({
    face: 0,
    liveness: 0,
    behavior: 0
  });
  const [status, setStatus] = useState({
    cameraActive: false,
    faceDetected: false,
    modelsLoaded: false,
    lastError: null
  });

  const unsubscribeRefs = useRef([]);

  /**
   * Start verification
   */
  const startVerification = useCallback(async (userId, videoElement) => {
    try {
      logger.info('Starting verification from context', { userId });

      // Start verification service
      await verificationService.start(userId, videoElement);
      
      setIsVerifying(true);

      // Subscribe to verification events
      const unsubscribeScores = verificationService.on('scores', (newScores) => {
        // Update trust score service
        const result = trustScoreService.updateScores(
          newScores.face,
          newScores.liveness,
          newScores.behavior
        );

        // Update context state
        setTrustScore(result.trustScore);
        setCurrentState(result.state);
        setScores(result.scores);
      });

      const unsubscribeError = verificationService.on('error', (data) => {
        logger.error('Verification error', data);
        setStatus(prev => ({ ...prev, lastError: data.error }));
      });

      const unsubscribeStopped = verificationService.on('stopped', () => {
        setIsVerifying(false);
        logger.info('Verification stopped');
      });

      // Store unsubscribe functions
      unsubscribeRefs.current = [
        unsubscribeScores,
        unsubscribeError,
        unsubscribeStopped
      ];

      // Update status
      const serviceStatus = verificationService.getStatus();
      setStatus({
        cameraActive: serviceStatus.cameraActive,
        faceDetected: serviceStatus.faceDetected,
        modelsLoaded: serviceStatus.modelsLoaded,
        lastError: serviceStatus.lastError
      });

      logger.info('Verification started successfully');
      return true;
    } catch (error) {
      logger.error('Failed to start verification', { error: error.message });
      setStatus(prev => ({ ...prev, lastError: error.message }));
      throw error;
    }
  }, []);

  /**
   * Stop verification
   */
  const stopVerification = useCallback(() => {
    logger.info('Stopping verification from context');

    // Unsubscribe from events
    unsubscribeRefs.current.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    unsubscribeRefs.current = [];

    // Stop verification service
    verificationService.stop();

    // Reset state
    setIsVerifying(false);
    setTrustScore(1.0);
    setCurrentState('NORMAL');
    setScores({ face: 0, liveness: 0, behavior: 0 });
    setStatus({
      cameraActive: false,
      faceDetected: false,
      modelsLoaded: false,
      lastError: null
    });

    // Reset trust score service
    trustScoreService.reset();

    logger.info('Verification stopped successfully');
  }, []);

  /**
   * Get state information
   */
  const getStateInfo = useCallback((state = currentState) => {
    return trustScoreService.getStateInfo(state);
  }, [currentState]);

  /**
   * Get score history
   */
  const getScoreHistory = useCallback(() => {
    return trustScoreService.getScoreHistory();
  }, []);

  /**
   * Get state history
   */
  const getStateHistory = useCallback(() => {
    return trustScoreService.getStateHistory();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isVerifying) {
        stopVerification();
      }
    };
  }, [isVerifying, stopVerification]);

  const value = {
    // State
    isVerifying,
    trustScore,
    currentState,
    scores,
    status,

    // Controls
    startVerification,
    stopVerification,

    // Utilities
    getStateInfo,
    getScoreHistory,
    getStateHistory
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

/**
 * Hook to use verification context
 */
export const useVerification = () => {
  const context = useContext(VerificationContext);
  
  if (!context) {
    throw new Error('useVerification must be used within VerificationProvider');
  }
  
  return context;
};

export default VerificationContext;
