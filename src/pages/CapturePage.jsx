/**
 * CBV System - Capture Page
 * Data collection for face, liveness, and behavioral biometrics
 * Phase 3: Full implementation with capture components
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import EnrollmentProgress from '@/components/common/EnrollmentProgress';
import FaceCapture from '@/components/capture/FaceCapture';
import LivenessCapture from '@/components/capture/LivenessCapture';
import BehaviorCapture from '@/components/capture/BehaviorCapture';
import mockTemplateService from '@/services/mock-template.service';
import storageService from '@/services/storage.service';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import './CapturePage.css';

const CapturePage = () => {
  const navigate = useNavigate();
  const { 
    session, 
    currentUser, 
    startEnrollment,
    getEnrollmentStatus,
    updateEnrollmentProgress,
    completeEnrolment 
  } = useAuth();

  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState('face'); // 'face', 'liveness', 'behavior'
  
  // Track capture data
  const [faceSamples, setFaceSamples] = useState([]);
  const [livenessData, setLivenessData] = useState(null);
  const [behaviorWindows, setBehaviorWindows] = useState([]);
  
  // Track last progress update to prevent unnecessary updates
  const lastProgressRef = useRef({ faceSamples: 0, livenessDuration: 0, behaviorDuration: 0 });

  useEffect(() => {
    loadEnrollmentStatus();
  }, []);

  // Load existing data when session becomes available
  useEffect(() => {
    if (session) {
      loadExistingCapturedData();
    }
  }, [session]);

  const loadEnrollmentStatus = async () => {
    try {
      setLoading(true);
      const result = await getEnrollmentStatus();
      if (result.success) {
        setEnrollmentStatus(result.data);
        console.log('📊 Enrollment status loaded:', result.data);
        logger.info('Enrollment status loaded', result.data);
      }
    } catch (error) {
      logger.error('Failed to load enrollment status', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingCapturedData = async () => {
    if (!session) {
      console.log('⚠️ No session, cannot load data');
      return;
    }

    try {
      console.log('🔄 Loading existing captured data for user:', session.userId);

      // Load existing face samples by userId (not sessionId)
      const existingFaceSamples = await storageService.getFaceSamplesByUser(session.userId);
      console.log('📦 Face samples from DB:', existingFaceSamples?.length || 0);
      
      if (existingFaceSamples && existingFaceSamples.length > 0) {
        console.log('✅ Setting face samples state:', existingFaceSamples.length);
        setFaceSamples(existingFaceSamples);
      } else {
        console.log('⚠️ No face samples found in DB');
      }

      // Load ALL liveness samples for this user (across all sessions)
      const db = await storageService.ensureDB();
      const allLivenessSamples = await db.getAllFromIndex(
        storageService.stores.LIVENESS_SAMPLES,
        'userId',
        session.userId
      );
      
      if (allLivenessSamples && allLivenessSamples.length > 0) {
        // Get the most recent liveness data
        const latestLiveness = allLivenessSamples[allLivenessSamples.length - 1];
        setLivenessData(latestLiveness);
        console.log('✅ Loaded liveness data:', latestLiveness);
      }

      // Load ALL behavior windows for this user (across all sessions)
      const allBehaviorWindows = await db.getAllFromIndex(
        storageService.stores.BEHAVIOR_WINDOWS,
        'userId',
        session.userId
      );
      
      if (allBehaviorWindows && allBehaviorWindows.length > 0) {
        setBehaviorWindows(allBehaviorWindows);
        console.log('✅ Loaded behavior windows:', allBehaviorWindows.length);
      }

      console.log('✅ All existing data loaded successfully');
      console.log('📊 Loaded data summary:', {
        faceSamples: existingFaceSamples?.length || 0,
        livenessSamples: allLivenessSamples?.length || 0,
        behaviorWindows: allBehaviorWindows?.length || 0
      });

      // Force immediate progress update after loading data
      try {
        const livenessDuration = (allLivenessSamples && allLivenessSamples.length > 0) 
          ? (allLivenessSamples[allLivenessSamples.length - 1]?.duration || 
             allLivenessSamples[allLivenessSamples.length - 1]?.features?.duration || 0)
          : 0;
        
        const windowSize = CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000;
        const totalBehaviorDuration = allBehaviorWindows 
          ? Math.min(allBehaviorWindows.length * windowSize, CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION)
          : 0;

        const immediateProgress = {
          faceSamples: existingFaceSamples?.length || 0,
          livenessDuration: Math.floor(livenessDuration),
          behaviorDuration: Math.floor(totalBehaviorDuration),
        };

        console.log('🔄 Forcing immediate progress update:', immediateProgress);
        
        // Update enrollment progress immediately
        const result = await updateEnrollmentProgress(immediateProgress);
        console.log('📥 Immediate update result:', result);
        
        if (result.success) {
          // Reload enrollment status
          const statusResult = await getEnrollmentStatus();
          if (statusResult.success && statusResult.data) {
            setEnrollmentStatus(statusResult.data);
            console.log('✅ Progress updated successfully');
          }
        }
      } catch (updateError) {
        console.error('❌ Failed to update progress:', updateError);
      }
    } catch (error) {
      console.error('❌ Failed to load existing data:', error);
      logger.error('Failed to load existing captured data', { error: error.message });
    }
  };

  const handleStartEnrollment = async () => {
    try {
      setIsStarting(true);
      const result = await startEnrollment();
      if (result.success) {
        await loadEnrollmentStatus();
        logger.info('Enrollment started successfully');
      } else {
        alert(`Failed to start enrollment: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Update enrollment progress based on captured data
  useEffect(() => {
    const updateProgress = async () => {
      // Skip if no session or enrollment status not loaded
      if (!session || !enrollmentStatus) {
        console.log('⚠️ No session or enrollment status, skipping update');
        return;
      }

      // Allow updates if we have data OR if status is in_progress
      const hasData = faceSamples.length > 0 || livenessData || behaviorWindows.length > 0;
      
      if (!hasData && !isInProgress) {
        console.log('⚠️ No data and not in progress, skipping update');
        return;
      }

      console.log('🔄 Updating progress - Status:', enrollmentStatus.status, 'Has data:', hasData);

      // Calculate behavior duration: windows * window_size (5 seconds each)
      // Cap at MAX_DURATION (300s) to avoid showing excessive values from old data
      const windowSize = CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000; // Convert ms to seconds
      const totalBehaviorDuration = Math.min(
        behaviorWindows.length * windowSize,
        CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION
      );

      // Extract liveness duration from the correct field
      const livenessDuration = livenessData?.duration || 
                              livenessData?.features?.duration || 
                              0;

      const newProgress = {
        faceSamples: faceSamples.length,
        livenessDuration: Math.floor(livenessDuration),
        behaviorDuration: Math.floor(totalBehaviorDuration),
      };

      console.log('📊 Current progress:', newProgress);
      console.log('📊 Last progress:', lastProgressRef.current);

      // Only update if values have actually changed
      const lastProgress = lastProgressRef.current;
      if (
        newProgress.faceSamples === lastProgress.faceSamples &&
        newProgress.livenessDuration === lastProgress.livenessDuration &&
        newProgress.behaviorDuration === lastProgress.behaviorDuration
      ) {
        console.log('✅ No changes, skipping update');
        return; // No changes, skip update
      }

      // Update ref
      lastProgressRef.current = newProgress;

      console.log('🔄 Updating enrollment progress...', newProgress);
      logger.info('Updating enrollment progress', newProgress);
      const result = await updateEnrollmentProgress(newProgress);
      console.log('📥 Update result:', result);
      
      if (result.success) {
        // Reload enrollment status to get updated requirements
        console.log('🔄 Reloading enrollment status...');
        const statusResult = await getEnrollmentStatus();
        console.log('📥 Status result:', statusResult);
        
        if (statusResult.success && statusResult.data) {
          console.log('✅ Setting new enrollment status:', statusResult.data);
          setEnrollmentStatus(statusResult.data);
        }
      }
    };

    updateProgress();
  }, [faceSamples.length, livenessData, behaviorWindows.length, isInProgress, session, enrollmentStatus, updateEnrollmentProgress, getEnrollmentStatus]);

  // Handlers for capture components
  const handleFaceSamplesUpdate = (samples) => {
    setFaceSamples(samples);
    logger.info('Face samples updated', { count: samples.length });
  };

  const handleFaceComplete = (samples) => {
    logger.info('Face capture complete', { count: samples.length });
    // Auto-switch to next tab
    setActiveTab('liveness');
  };

  const handleLivenessDataUpdate = (data) => {
    setLivenessData(data);
  };

  const handleLivenessComplete = (data) => {
    logger.info('Liveness capture complete', data);
    // Auto-switch to next tab
    setActiveTab('behavior');
  };

  const handleBehaviorWindowsUpdate = (windows) => {
    setBehaviorWindows(windows);
    logger.info('Behavior windows updated', { count: windows.length });
  };

  const handleBehaviorComplete = (windows) => {
    logger.info('Behavior capture complete', { count: windows.length });
  };

  const handleCompleteEnrolment = async () => {
    try {
      setCompleting(true);
      logger.info('Completing enrolment', { userId: session?.userId });

      // Generate mock templates from captured data (Phase 5 simulation)
      logger.info('[MOCK] Generating templates from captured data...');
      try {
        await mockTemplateService.generateMockTemplates(session.userId);
        logger.info('[MOCK] Templates generated successfully');
      } catch (templateError) {
        logger.warn('[MOCK] Failed to generate templates', { error: templateError.message });
        // Continue anyway - templates are optional for now
      }

      const result = await completeEnrolment();

      if (result.success) {
        logger.info('Enrolment completed successfully');
        navigate('/app');
      } else {
        throw new Error(result.error || 'Failed to complete enrolment');
      }
    } catch (error) {
      logger.error('Failed to complete enrolment', { error: error.message });
      alert('Failed to complete enrolment: ' + error.message);
    } finally {
      setCompleting(false);
    }
  };

  // Check completion status for each module using enrollment status
  const isFaceComplete = enrollmentStatus?.progress?.faceSamples >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES;
  
  // Extract liveness duration for display
  const displayLivenessDuration = enrollmentStatus?.progress?.livenessDuration || 0;
  const isLivenessComplete = displayLivenessDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION;
  
  const behaviorDuration = enrollmentStatus?.progress?.behaviorDuration || 0;
  const isBehaviorComplete = behaviorDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION;

  const canCompleteEnrollment = enrollmentStatus?.requirements?.met;
  const isInProgress = enrollmentStatus?.status === CONFIG.ENROLLMENT.STATUS.IN_PROGRESS;
  const isCompleted = enrollmentStatus?.status === CONFIG.ENROLLMENT.STATUS.COMPLETED;
  const notStarted = enrollmentStatus?.status === CONFIG.ENROLLMENT.STATUS.NOT_STARTED;

  if (loading) {
    return (
      <div className="capture-page">
        <div className="capture-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading enrollment status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="capture-page">
      <div className="capture-container">
        {/* Header */}
        <div className="capture-header">
          <h1 className="capture-title">Data Capture Session</h1>
          <p className="capture-subtitle">
            Collect biometric data for enrollment and template creation
          </p>
          {session && (
            <div className="session-info">
              <div className="session-item">
                <span className="session-label">User:</span>
                <span className="session-value">{session.userId}</span>
              </div>
              <div className="session-item">
                <span className="session-label">Session ID:</span>
                <span className="session-value">{session.sessionId.substring(0, 8)}...</span>
              </div>
              <div className="session-item">
                <span className="session-label">Status:</span>
                <span className={`session-value ${isCompleted ? 'status-completed' : isInProgress ? 'status-active' : 'status-pending'}`}>
                  {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enrollment Progress Component */}
        <EnrollmentProgress enrollmentStatus={enrollmentStatus} />

        {/* Start Enrollment Section */}
        {notStarted && (
          <div className="phase-notice">
            <div className="notice-icon">🚀</div>
            <div className="notice-content">
              <h3 className="notice-title">Ready to Start Enrollment</h3>
              <p className="notice-text">
                Click the button below to begin your enrollment session. You'll need to complete
                all three capture modules to meet the requirements.
              </p>
              <Button 
                variant="primary" 
                size="large"
                onClick={handleStartEnrollment}
                loading={isStarting}
                disabled={isStarting}
              >
                {isStarting ? 'Starting...' : 'Start Enrollment Session'}
              </Button>
            </div>
          </div>
        )}

        {/* Capture Tabs */}
        {(isInProgress || isCompleted) && (
          <div className="capture-tabs-container">
            {/* Tab Navigation */}
            <div className="capture-tabs">
              <button
                className={`capture-tab ${activeTab === 'face' ? 'active' : ''} ${isFaceComplete ? 'complete' : ''}`}
                onClick={() => setActiveTab('face')}
              >
                <span className="tab-icon">👤</span>
                <span className="tab-label">Face Capture</span>
                <span className="tab-badge">
                  {faceSamples.length}/{CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES}
                </span>
                {isFaceComplete && <span className="tab-complete-icon">✓</span>}
              </button>
              <button
                className={`capture-tab ${activeTab === 'liveness' ? 'active' : ''} ${isLivenessComplete ? 'complete' : ''}`}
                onClick={() => setActiveTab('liveness')}
              >
                <span className="tab-icon">👁️</span>
                <span className="tab-label">Liveness</span>
                <span className="tab-badge">
                  {displayLivenessDuration}s/{CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION}s
                </span>
                {isLivenessComplete && <span className="tab-complete-icon">✓</span>}
              </button>
              <button
                className={`capture-tab ${activeTab === 'behavior' ? 'active' : ''} ${isBehaviorComplete ? 'complete' : ''}`}
                onClick={() => setActiveTab('behavior')}
              >
                <span className="tab-icon">⌨️</span>
                <span className="tab-label">Behavior</span>
                <span className="tab-badge">
                  {behaviorDuration}s/{CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION}s
                </span>
                {isBehaviorComplete && <span className="tab-complete-icon">✓</span>}
              </button>
            </div>

            {/* Tab Content */}
            <div className="capture-tab-content">
              {activeTab === 'face' && (
                <>
                  {isFaceComplete ? (
                    <div className="capture-complete-notice">
                      <div className="complete-icon">✓</div>
                      <h3>Face Capture Complete</h3>
                      <p>You have already captured {faceSamples.length} face samples (required: {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES}).</p>
                      <p className="complete-hint">You can proceed to complete enrollment or recapture if needed.</p>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          // Reset face samples to allow recapture
                          setFaceSamples([]);
                        }}
                      >
                        Recapture Face Samples
                      </Button>
                    </div>
                  ) : (
                    <FaceCapture
                      onComplete={handleFaceComplete}
                      onSamplesUpdate={handleFaceSamplesUpdate}
                      existingSamples={faceSamples}
                    />
                  )}
                </>
              )}
              {activeTab === 'liveness' && (
                <>
                  {isLivenessComplete ? (
                    <div className="capture-complete-notice">
                      <div className="complete-icon">✓</div>
                      <h3>Liveness Capture Complete</h3>
                      <p>You have already completed liveness detection ({displayLivenessDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION}s).</p>
                      <p className="complete-hint">You can proceed to complete enrollment or recapture if needed.</p>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          // Reset liveness data to allow recapture
                          setLivenessData(null);
                        }}
                      >
                        Recapture Liveness Data
                      </Button>
                    </div>
                  ) : (
                    <LivenessCapture
                      onComplete={handleLivenessComplete}
                      onDataUpdate={handleLivenessDataUpdate}
                      existingData={livenessData}
                    />
                  )}
                </>
              )}
              {activeTab === 'behavior' && (
                <>
                  {isBehaviorComplete ? (
                    <div className="capture-complete-notice">
                      <div className="complete-icon">✓</div>
                      <h3>Behavior Capture Complete</h3>
                      <p>You have already captured sufficient behavior data ({behaviorDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION}s).</p>
                      <p className="complete-hint">You can proceed to complete enrollment or recapture if needed.</p>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          // Reset behavior windows to allow recapture
                          setBehaviorWindows([]);
                        }}
                      >
                        Recapture Behavior Data
                      </Button>
                    </div>
                  ) : (
                    <BehaviorCapture
                      onComplete={handleBehaviorComplete}
                      onWindowsUpdate={handleBehaviorWindowsUpdate}
                      existingWindows={behaviorWindows}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="capture-instructions">
          <h3 className="instructions-title">Capture Session Guidelines</h3>
          <div className="instructions-grid">
            <div className="instruction-item">
              <div className="instruction-icon">💡</div>
              <div className="instruction-content">
                <h4>Good Lighting</h4>
                <p>Ensure your face is well-lit and clearly visible</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">📐</div>
              <div className="instruction-content">
                <h4>Face Alignment</h4>
                <p>Keep your face centered and at a neutral angle</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">👀</div>
              <div className="instruction-content">
                <h4>Natural Behavior</h4>
                <p>Blink naturally and move your eyes normally</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">⏱️</div>
              <div className="instruction-content">
                <h4>Session Duration</h4>
                <p>Complete capture session takes 60-120 seconds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="capture-actions">
          <Button
            variant="secondary"
            size="large"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          {isInProgress && (
            <Button
              variant="primary"
              size="large"
              onClick={handleCompleteEnrolment}
              loading={completing}
              disabled={completing || !canCompleteEnrollment}
            >
              {completing ? 'Completing...' : canCompleteEnrollment ? 'Complete Enrollment & Continue' : 'Complete Requirements First'}
            </Button>
          )}
          {isCompleted && (
            <>
              <Button
                variant="primary"
                size="large"
                onClick={async () => {
                  try {
                    // Reset enrollment to allow re-enrollment
                    const result = await startEnrollment();
                    if (result.success) {
                      await loadEnrollmentStatus();
                      logger.info('Re-enrollment started successfully');
                    }
                  } catch (error) {
                    alert(`Error: ${error.message}`);
                  }
                }}
              >
                Re-enroll
              </Button>
              <Button
                variant="success"
                size="large"
                onClick={() => navigate('/app')}
              >
                Go to Protected App →
              </Button>
            </>
          )}
        </div>

        {/* Note */}
        <div className="capture-note">
          <p>
            <strong>Phase 3:</strong> Full data capture implementation with live camera feed,
            real-time quality validation, and interactive capture modules. All captured data is
            automatically saved to IndexedDB and encrypted for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CapturePage;
