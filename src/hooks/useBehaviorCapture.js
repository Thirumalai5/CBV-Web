/**
 * CBV System - useBehaviorCapture Hook
 * Custom hook for behavior capture functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import behaviorCaptureService from '@/services/behavior-capture.service';
import storageService from '@/services/storage.service';
import { useAuth } from '@/context/AuthContext';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import { createBehaviorWindowMetadata } from '@/utils/capture-helpers';
import { validateBehaviorQuality } from '@/utils/quality-validator';

const useBehaviorCapture = (existingWindows = []) => {
  const { session } = useAuth();
  
  // Calculate initial state from existing windows
  const calculateInitialState = useCallback(() => {
    if (!existingWindows || existingWindows.length === 0) {
      return {
        isCapturing: false,
        elapsedTime: 0,
        timeRemaining: CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION,
        progress: 0,
      };
    }

    // Calculate elapsed time from existing windows
    const windowSize = CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000; // Convert to seconds
    const elapsedTime = Math.min(
      existingWindows.length * windowSize,
      CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION
    );
    const timeRemaining = Math.max(0, CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION - elapsedTime);
    const progress = Math.min(100, (elapsedTime / CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION) * 100);

    console.log('📊 Calculated initial state from existing windows:', {
      windowCount: existingWindows.length,
      elapsedTime,
      timeRemaining,
      progress
    });

    return {
      isCapturing: false,
      elapsedTime,
      timeRemaining,
      progress,
    };
  }, [existingWindows]);
  
  // Simple state approach with object
  const [captureState, setCaptureState] = useState(calculateInitialState);
  
  const [windows, setWindows] = useState(existingWindows || []);
  const [currentKeystrokeCount, setCurrentKeystrokeCount] = useState(0);
  const [currentMouseEventCount, setCurrentMouseEventCount] = useState(0);
  const [error, setError] = useState(null);

  const targetElementRef = useRef(null);
  const monitorIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const captureStateRef = useRef(captureState);
  
  // Keep ref in sync
  useEffect(() => {
    captureStateRef.current = captureState;
  }, [captureState]);

  // Load existing windows on mount or when they change
  useEffect(() => {
    if (existingWindows && existingWindows.length > 0) {
      console.log('🔄 Loading existing windows:', existingWindows.length);
      console.log('🔍 First window structure:', existingWindows[0]);
      console.log('🔍 Window has features?', existingWindows[0]?.features);
      console.log('🔍 Window has keystroke?', existingWindows[0]?.keystroke);
      console.log('🔍 Window has mouse?', existingWindows[0]?.mouse);
      
      const initialState = calculateInitialState();
      console.log('📊 Initial state:', initialState);
      console.log('🎯 isComplete will be:', initialState.elapsedTime >= CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION);
      setWindows(existingWindows);
      setCaptureState(initialState);
    }
  }, [existingWindows, calculateInitialState]);

  /**
   * Save behavior windows to storage
   */
  const saveWindows = useCallback(async (capturedWindows) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      const savedWindows = [];

      for (const window of capturedWindows) {
        // Validate quality
        const validation = validateBehaviorQuality(window);

        if (!validation.isValid) {
          logger.warn('Behavior window quality validation failed', {
            issues: validation.issues,
          });
        }

        // Create metadata
        const metadata = createBehaviorWindowMetadata(
          window,
          session.sessionId,
          session.userId
        );

        // Save to IndexedDB
        await storageService.saveBehaviorWindow(metadata);
        savedWindows.push(metadata);
      }

      logger.info('Behavior windows saved', { count: savedWindows.length });
      return savedWindows;
    } catch (err) {
      logger.error('Failed to save behavior windows', { error: err.message });
      throw err;
    }
  }, [session]);

  /**
   * Start behavior capture
   */
  const startCapture = useCallback(async (targetElement = document) => {
    console.log('🎬 startCapture called');
    console.log('📍 captureStateRef.current:', captureStateRef.current);
    console.log('👤 session:', session);
    
    if (captureStateRef.current.isCapturing) {
      logger.warn('Behavior capture already running');
      console.log('⚠️ Already capturing, returning');
      return;
    }

    if (!session) {
      const error = 'No active session';
      console.error('❌ No session:', error);
      throw new Error(error);
    }

    try {
      setError(null);
      
      // Calculate starting point based on existing windows
      const windowSize = CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000;
      const existingDuration = windows.length * windowSize;
      const remainingDuration = Math.max(0, CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION - existingDuration);
      
      console.log('▶️ Starting capture with existing data:', {
        existingWindows: windows.length,
        existingDuration,
        remainingDuration,
        windowSize,
        maxDuration: CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION,
        targetDuration: CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION
      });
      
      // Check if already complete or very close (within 5 seconds)
      if (existingDuration >= CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION - 5) {
        console.log('⚠️ Already at or near target duration, cannot start');
        setError('Behavior capture already complete. Please use "Recapture Behavior Data" button to start fresh.');
        return;
      }
      
      // Set initial state (continue from existing)
      setCaptureState({
        isCapturing: true,
        elapsedTime: existingDuration,
        timeRemaining: remainingDuration,
        progress: Math.min(100, (existingDuration / CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION) * 100),
      });
      
      // Set timer to account for existing duration
      startTimeRef.current = Date.now() - (existingDuration * 1000);
      
      // Reset service state (but we'll keep existing windows in component state)
      behaviorCaptureService.reset();
      
      // Store target element reference
      targetElementRef.current = targetElement;
      
      // Start capture service
      behaviorCaptureService.startCapture(targetElement);

      // Start timer interval with functional setState
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = startTimeRef.current;
        const elapsedMs = now - startTime;
        // Use Math.round for more accurate timing
        const elapsed = Math.round(elapsedMs / 1000);
        const remaining = Math.max(0, CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION - elapsed);
        const progress = Math.min(100, (elapsed / CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION) * 100);
        
        console.log('⏰ Timer tick:', { 
          now, 
          startTime, 
          elapsedMs, 
          elapsed, 
          remaining, 
          progress,
          maxDuration: CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION,
          targetDuration: CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION,
          willAutoStop: elapsed >= CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION
        });
        
        // Use functional update to ensure we get fresh state
        setCaptureState(prev => ({
          ...prev,
          elapsedTime: elapsed,
          timeRemaining: remaining,
          progress,
        }));
        
        // Check for auto-stop when we reach or exceed target duration
        if (elapsed >= CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION) {
          // Clear intervals
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          if (monitorIntervalRef.current) {
            clearInterval(monitorIntervalRef.current);
            monitorIntervalRef.current = null;
          }
          
          // Stop capture service
          behaviorCaptureService.stopCapture(targetElementRef.current || document);
          
          // Get newly captured windows from service
          const newlyCapturedWindows = behaviorCaptureService.getBehaviorWindows();
          
          // Merge with existing windows
          setWindows(prevWindows => {
            const allWindows = [...prevWindows, ...newlyCapturedWindows];
            
            // Save only newly captured windows to storage (existing ones are already saved)
            if (session && newlyCapturedWindows.length > 0) {
              saveWindows(newlyCapturedWindows).catch(err => {
                logger.error('Failed to save windows on auto-stop', { error: err.message });
              });
            }
            
            logger.info('Behavior capture auto-stopped', { 
              newWindows: newlyCapturedWindows.length,
              totalWindows: allWindows.length 
            });
            
            return allWindows;
          });
          
          setCaptureState(prev => ({ ...prev, isCapturing: false }));
        }
      }, 1000);

      // Start monitoring interval to update UI
      monitorIntervalRef.current = setInterval(() => {
        try {
          // Get newly captured windows from service
          const newlyCapturedWindows = behaviorCaptureService.getBehaviorWindows();
          
          // Merge with existing windows (keep existing + add new)
          setWindows(prevWindows => {
            // Only add windows that aren't already in the list
            const existingCount = prevWindows.length;
            const allWindows = [...prevWindows, ...newlyCapturedWindows];
            
            if (allWindows.length > existingCount) {
              console.log('📦 Updated windows:', {
                existing: existingCount,
                new: newlyCapturedWindows.length,
                total: allWindows.length
              });
            }
            
            return allWindows;
          });

          // Get current window stats (if available)
          const currentWindow = behaviorCaptureService.getCurrentWindow();
          if (currentWindow) {
            setCurrentKeystrokeCount(currentWindow.keystroke?.keyCount || 0);
            setCurrentMouseEventCount(currentWindow.mouse?.positions?.length || 0);
          }
        } catch (err) {
          logger.error('Failed to update capture status', { error: err.message });
        }
      }, 1000);

      logger.info('Behavior capture started');
    } catch (err) {
      logger.error('Failed to start behavior capture', { error: err.message });
      setError(err.message);
      setCaptureState(prev => ({ ...prev, isCapturing: false }));
      throw err;
    }
  }, [session, saveWindows, windows]);

  /**
   * Stop behavior capture
   */
  const stopCapture = useCallback(async () => {
    if (!captureStateRef.current.isCapturing) {
      return;
    }

    try {
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Stop monitoring
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }

      // Stop capture service
      behaviorCaptureService.stopCapture(targetElementRef.current || document);

      // Get newly captured windows from service
      const newlyCapturedWindows = behaviorCaptureService.getBehaviorWindows();

      // Merge with existing windows
      const allWindows = [...windows, ...newlyCapturedWindows];
      setWindows(allWindows);

      // Save only the newly captured windows to storage (existing ones are already saved)
      if (session && newlyCapturedWindows.length > 0) {
        await saveWindows(newlyCapturedWindows);
      }

      setCaptureState(prev => ({ ...prev, isCapturing: false }));
      logger.info('Behavior capture stopped', { 
        newWindows: newlyCapturedWindows.length,
        totalWindows: allWindows.length 
      });
    } catch (err) {
      logger.error('Failed to stop behavior capture', { error: err.message });
      setError(err.message);
      throw err;
    }
  }, [session, saveWindows]);

  /**
   * Get window statistics
   */
  const getWindowStats = useCallback(() => {
    if (windows.length === 0) {
      return {
        totalKeystrokes: 0,
        totalMouseEvents: 0,
        avgKeystrokesPerWindow: 0,
        avgMouseEventsPerWindow: 0,
      };
    }

    const totalKeystrokes = windows.reduce(
      (sum, w) => sum + (w.features?.keystroke?.keyCount || 0),
      0
    );

    const totalMouseEvents = windows.reduce(
      (sum, w) => sum + (w.features?.mouse?.clickCount || 0),
      0
    );

    return {
      totalKeystrokes,
      totalMouseEvents,
      avgKeystrokesPerWindow: totalKeystrokes / windows.length,
      avgMouseEventsPerWindow: totalMouseEvents / windows.length,
    };
  }, [windows]);

  /**
   * Validate current capture
   */
  const validateCurrent = useCallback(() => {
    const issues = [];
    const { CAPTURE } = CONFIG;

    // Only check if minimum duration is met
    if (captureState.elapsedTime < CAPTURE.BEHAVIOR.TARGET_DURATION) {
      const remaining = CAPTURE.BEHAVIOR.TARGET_DURATION - captureState.elapsedTime;
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
      issues.push(
        `Need ${Math.ceil(remaining)} more seconds (${formatTime(remaining)} remaining)`
      );
    }

    // Check if we have any data captured
    if (windows.length === 0 && captureState.elapsedTime > 10) {
      issues.push('No behavior data captured yet. Please interact with the interface.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [captureState.elapsedTime, windows.length]);

  /**
   * Clear all windows
   */
  const clearWindows = useCallback(() => {
    setWindows([]);
    setCurrentKeystrokeCount(0);
    setCurrentMouseEventCount(0);
    behaviorCaptureService.reset();
    setCaptureState({
      isCapturing: false,
      elapsedTime: 0,
      timeRemaining: CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION,
      progress: 0,
    });
    logger.info('Behavior windows cleared');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
      if (captureStateRef.current.isCapturing) {
        behaviorCaptureService.stopCapture(targetElementRef.current || document);
      }
    };
  }, []);

  return {
    // State
    isCapturing: captureState.isCapturing,
    windows,
    currentKeystrokeCount,
    currentMouseEventCount,
    error,
    progress: captureState.progress,
    elapsedTime: captureState.elapsedTime,
    timeRemaining: captureState.timeRemaining,

    // Methods
    startCapture,
    stopCapture,
    clearWindows,
    getWindowStats,
    validateCurrent,

    // Computed
    windowCount: windows.length,
    targetDuration: CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION,
    // Complete when elapsed time reaches target duration
    isComplete: captureState.elapsedTime >= CONFIG.CAPTURE.BEHAVIOR.TARGET_DURATION,
    windowSize: CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000, // Convert to seconds
    maxDuration: CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION,
    typingPrompt: CONFIG.CAPTURE.BEHAVIOR.TYPING_PROMPT,
  };
};

export default useBehaviorCapture;
