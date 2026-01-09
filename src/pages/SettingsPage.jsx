/**
 * CBV System - Settings Page
 * User settings, data management, and system configuration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import exportService from '@/services/export.service';
import storageService from '@/services/storage.service';
import Button from '@/components/common/Button';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, session, logout, getEnrollmentStatus, startEnrollment } = useAuth();
  const [stats, setStats] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [exportPreview, setExportPreview] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isReenrolling, setIsReenrolling] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showReenrollConfirm, setShowReenrollConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load statistics on mount
  useEffect(() => {
    loadStats();
    loadEnrollmentData();
    loadExportPreview();
  }, []);

  const loadStats = async () => {
    try {
      const storageStats = await storageService.getStats();
      setStats(storageStats);
    } catch (err) {
      logger.error('Failed to load stats', { error: err.message });
    }
  };

  const loadEnrollmentData = async () => {
    try {
      const result = await getEnrollmentStatus();
      if (result.success) {
        setEnrollmentData(result.data);
        
        // Also load actual captured data counts
        if (currentUser?.userId) {
          const faceSamples = await storageService.getFaceSamplesByUser(currentUser.userId);
          const db = await storageService.ensureDB();
          const livenessSamples = await db.getAllFromIndex(
            storageService.stores.LIVENESS_SAMPLES,
            'userId',
            currentUser.userId
          );
          const behaviorWindows = await db.getAllFromIndex(
            storageService.stores.BEHAVIOR_WINDOWS,
            'userId',
            currentUser.userId
          );

          // Calculate behavior duration
          const windowSize = CONFIG.CAPTURE.BEHAVIOR.WINDOW_SIZE / 1000;
          const behaviorDuration = Math.min(
            behaviorWindows.length * windowSize,
            CONFIG.CAPTURE.BEHAVIOR.MAX_DURATION
          );

          // Get liveness duration - check multiple possible field names
          let livenessDuration = 0;
          if (livenessSamples.length > 0) {
            const latestLiveness = livenessSamples[livenessSamples.length - 1];
            // Try different possible field names
            livenessDuration = latestLiveness.duration || 
                              latestLiveness.features?.duration || 
                              latestLiveness.metadata?.duration ||
                              0;
            
            console.log('📊 Latest liveness sample:', latestLiveness);
            console.log('📊 Extracted liveness duration:', livenessDuration);
          }

          setEnrollmentData(prev => ({
            ...prev,
            actualData: {
              faceSamples: faceSamples.length,
              livenessDuration: Math.floor(livenessDuration),
              behaviorDuration: behaviorDuration,
              behaviorWindows: behaviorWindows.length,
            }
          }));
        }
      }
    } catch (err) {
      logger.error('Failed to load enrollment data', { error: err.message });
    }
  };

  const loadExportPreview = async () => {
    if (!currentUser?.userId) return;

    try {
      const preview = await exportService.getExportPreview(currentUser.userId);
      setExportPreview(preview);
    } catch (err) {
      logger.error('Failed to load export preview', { error: err.message });
    }
  };

  const handleExport = async () => {
    if (!currentUser?.userId) {
      setError('No user logged in');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await exportService.exportAndDownload(currentUser.userId);
      
      setSuccess(
        `Data exported successfully! File: ${result.filename} (${exportService.formatFileSize(result.size)})`
      );
      
      logger.info('Data exported successfully', result);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
      logger.error('Export failed', { error: err.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentUser?.userId) {
      setError('No user logged in');
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text);

      logger.info('Importing data...', { 
        filename: file.name,
        size: file.size,
        hasMetadata: !!data.metadata,
        hasFaceTemplate: !!data.faceTemplate,
        hasBehaviorBaseline: !!data.behaviorBaseline
      });

      // Import using export service
      await exportService.importData(currentUser.userId, data);

      setSuccess(`Data imported successfully from ${file.name}! Reloading...`);
      logger.info('Data imported successfully');

      // Reload stats and enrollment data
      setTimeout(async () => {
        await loadStats();
        await loadEnrollmentData();
        await loadExportPreview();
      }, 1000);

    } catch (err) {
      setError(`Import failed: ${err.message}`);
      logger.error('Import failed', { error: err.message });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handlePurgeConfirm = () => {
    setShowPurgeConfirm(true);
    setError(null);
    setSuccess(null);
  };

  const handlePurgeCancel = () => {
    setShowPurgeConfirm(false);
  };

  const handlePurge = async () => {
    if (!currentUser?.userId) {
      setError('No user logged in');
      return;
    }

    setIsPurging(true);
    setError(null);
    setSuccess(null);

    try {
      // Clear all user data
      await storageService.clearUserData(currentUser.userId);
      
      setSuccess('All data purged successfully! You will be logged out.');
      
      logger.info('Data purged successfully', { userId: currentUser.userId });

      // Logout after 2 seconds
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError(`Purge failed: ${err.message}`);
      logger.error('Purge failed', { error: err.message });
    } finally {
      setIsPurging(false);
      setShowPurgeConfirm(false);
    }
  };

  const handleReenrollConfirm = () => {
    setShowReenrollConfirm(true);
    setError(null);
    setSuccess(null);
  };

  const handleReenrollCancel = () => {
    setShowReenrollConfirm(false);
  };

  const handleReenroll = async () => {
    setIsReenrolling(true);
    setError(null);
    setSuccess(null);

    try {
      // Start new enrollment session
      const result = await startEnrollment();
      
      if (result.success) {
        setSuccess('Re-enrollment started! Redirecting to capture page...');
        logger.info('Re-enrollment started', { userId: currentUser.userId });

        // Redirect to capture page after 1 second
        setTimeout(() => {
          navigate('/capture');
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to start re-enrollment');
      }
    } catch (err) {
      setError(`Re-enrollment failed: ${err.message}`);
      logger.error('Re-enrollment failed', { error: err.message });
    } finally {
      setIsReenrolling(false);
      setShowReenrollConfirm(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        {/* User Info Section */}
        <section className="settings-section">
          <h2>User Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{currentUser?.userId || 'Not logged in'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Enrollment Status:</span>
              <span className={`info-value status-${enrollmentData?.status || 'unknown'}`}>
                {enrollmentData?.status || 'Unknown'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Session ID:</span>
              <span className="info-value">{session?.sessionId?.substring(0, 8) || 'No active session'}...</span>
            </div>
          </div>
        </section>

        {/* Enrollment Data Section */}
        {enrollmentData && enrollmentData.status === CONFIG.ENROLLMENT.STATUS.COMPLETED && (
          <section className="settings-section enrollment-section">
            <div className="section-header">
              <h2>Enrollment Data</h2>
              <span className="status-badge status-completed">✓ Completed</span>
            </div>
            <p className="section-description">
              Your biometric data has been successfully captured and saved. You can view your enrollment details below.
            </p>

            {enrollmentData.actualData && (
              <div className="enrollment-data-grid">
                <div className="enrollment-data-card">
                  <div className="data-icon">👤</div>
                  <div className="data-content">
                    <div className="data-label">Face Samples</div>
                    <div className="data-value">
                      {enrollmentData.actualData.faceSamples} / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES}
                    </div>
                    <div className="data-status">
                      {enrollmentData.actualData.faceSamples >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES ? (
                        <span className="status-complete">✓ Complete</span>
                      ) : (
                        <span className="status-incomplete">Incomplete</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="enrollment-data-card">
                  <div className="data-icon">👁️</div>
                  <div className="data-content">
                    <div className="data-label">Liveness Duration</div>
                    <div className="data-value">
                      {enrollmentData.actualData.livenessDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION}s
                    </div>
                    <div className="data-status">
                      {enrollmentData.actualData.livenessDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION ? (
                        <span className="status-complete">✓ Complete</span>
                      ) : (
                        <span className="status-incomplete">Incomplete</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="enrollment-data-card">
                  <div className="data-icon">⌨️</div>
                  <div className="data-content">
                    <div className="data-label">Behavior Duration</div>
                    <div className="data-value">
                      {enrollmentData.actualData.behaviorDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION}s
                    </div>
                    <div className="data-sub-value">
                      ({enrollmentData.actualData.behaviorWindows} windows captured)
                    </div>
                    <div className="data-status">
                      {enrollmentData.actualData.behaviorDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION ? (
                        <span className="status-complete">✓ Complete</span>
                      ) : (
                        <span className="status-incomplete">Incomplete</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="enrollment-actions">
              <Button
                variant="primary"
                onClick={handleReenrollConfirm}
                disabled={isReenrolling}
              >
                Re-enroll (Update Data)
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/capture')}
              >
                View Capture Page
              </Button>
            </div>
          </section>
        )}

        {/* In Progress Enrollment */}
        {enrollmentData && enrollmentData.status === CONFIG.ENROLLMENT.STATUS.IN_PROGRESS && (
          <section className="settings-section enrollment-section">
            <div className="section-header">
              <h2>Enrollment In Progress</h2>
              <span className="status-badge status-in-progress">⏳ In Progress</span>
            </div>
            <p className="section-description">
              Your enrollment is currently in progress. Continue capturing data to complete your enrollment.
            </p>

            {enrollmentData.actualData && (
              <div className="enrollment-progress-summary">
                <div className="progress-item">
                  <span className="progress-label">Face Samples:</span>
                  <span className="progress-value">
                    {enrollmentData.actualData.faceSamples} / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES}
                    {enrollmentData.actualData.faceSamples >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES && ' ✓'}
                  </span>
                </div>
                <div className="progress-item">
                  <span className="progress-label">Liveness Duration:</span>
                  <span className="progress-value">
                    {enrollmentData.actualData.livenessDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION}s
                    {enrollmentData.actualData.livenessDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION && ' ✓'}
                  </span>
                </div>
                <div className="progress-item">
                  <span className="progress-label">Behavior Duration:</span>
                  <span className="progress-value">
                    {enrollmentData.actualData.behaviorDuration}s / {CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION}s
                    {enrollmentData.actualData.behaviorDuration >= CONFIG.ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_DURATION && ' ✓'}
                  </span>
                </div>
              </div>
            )}

            <div className="enrollment-actions">
              <Button
                variant="primary"
                onClick={() => navigate('/capture')}
              >
                Continue Enrollment
              </Button>
            </div>
          </section>
        )}

        {/* Not Started */}
        {enrollmentData && enrollmentData.status === CONFIG.ENROLLMENT.STATUS.NOT_STARTED && (
          <section className="settings-section enrollment-section">
            <div className="section-header">
              <h2>Enrollment Not Started</h2>
              <span className="status-badge status-not-started">⚪ Not Started</span>
            </div>
            <p className="section-description">
              You haven't started the enrollment process yet. Click below to begin capturing your biometric data.
            </p>

            <div className="enrollment-actions">
              <Button
                variant="primary"
                onClick={() => navigate('/capture')}
              >
                Start Enrollment
              </Button>
            </div>
          </section>
        )}

        {/* Storage Statistics */}
        {stats && (
          <section className="settings-section">
            <h2>Storage Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📸</div>
                <div className="stat-content">
                  <div className="stat-label">Face Samples</div>
                  <div className="stat-value">{stats.FACE_SAMPLES || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div className="stat-content">
                  <div className="stat-label">Liveness Samples</div>
                  <div className="stat-value">{stats.LIVENESS_SAMPLES || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⌨️</div>
                <div className="stat-content">
                  <div className="stat-label">Behavior Windows</div>
                  <div className="stat-value">{stats.BEHAVIOR_WINDOWS || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-label">Log Entries</div>
                  <div className="stat-value">{stats.LOGS || 0}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Export Data Section */}
        <section className="settings-section">
          <h2>Export Data</h2>
          <p className="section-description">
            Export all your enrollment data as a JSON file. This includes face samples,
            liveness data, behavior patterns, and logs.
          </p>

          {exportPreview && (
            <div className="export-preview">
              <h3>Export Preview</h3>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-label">Face Samples:</span>
                  <span className="preview-value">{exportPreview.statistics.faceSamples}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Liveness Samples:</span>
                  <span className="preview-value">{exportPreview.statistics.livenessSamples}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Behavior Windows:</span>
                  <span className="preview-value">{exportPreview.statistics.behaviorWindows}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Estimated Size:</span>
                  <span className="preview-value">
                    {exportService.formatFileSize(exportPreview.estimatedSize)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || !currentUser}
              loading={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
            
            <div className="import-button-wrapper">
              <input
                ref={(input) => {
                  if (input) {
                    input.importFileInput = input;
                  }
                }}
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting || !currentUser}
                style={{ display: 'none' }}
                id="import-file-input"
              />
              <Button
                variant="secondary"
                onClick={() => document.getElementById('import-file-input')?.click()}
                disabled={isImporting || !currentUser}
                loading={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        </section>

        {/* Purge Data Section */}
        <section className="settings-section danger-section">
          <h2>Danger Zone</h2>
          <p className="section-description warning">
            ⚠️ Warning: These actions are irreversible!
          </p>

          <div className="danger-actions">
            <div className="danger-action">
              <div className="danger-info">
                <h3>Purge All Data</h3>
                <p>
                  Permanently delete all your enrollment data, including face samples,
                  liveness data, behavior patterns, templates, and logs. You will be
                  logged out and will need to re-enroll.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handlePurgeConfirm}
                disabled={isPurging || !currentUser}
              >
                Purge All Data
              </Button>
            </div>
          </div>
        </section>

        {/* Feedback Messages */}
        {error && (
          <div className="message message-error">
            <span className="message-icon">❌</span>
            <span className="message-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="message message-success">
            <span className="message-icon">✅</span>
            <span className="message-text">{success}</span>
          </div>
        )}
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Data Purge</h2>
            <p className="modal-warning">
              ⚠️ Are you absolutely sure you want to delete all your data?
            </p>
            <p className="modal-description">
              This action will permanently delete:
            </p>
            <ul className="modal-list">
              <li>All face samples ({stats?.FACE_SAMPLES || 0})</li>
              <li>All liveness samples ({stats?.LIVENESS_SAMPLES || 0})</li>
              <li>All behavior windows ({stats?.BEHAVIOR_WINDOWS || 0})</li>
              <li>All templates and baselines</li>
              <li>All logs ({stats?.LOGS || 0})</li>
            </ul>
            <p className="modal-warning">
              This action cannot be undone. You will be logged out and will need to
              re-enroll from scratch.
            </p>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={handlePurgeCancel}
                disabled={isPurging}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handlePurge}
                disabled={isPurging}
                loading={isPurging}
              >
                {isPurging ? 'Purging...' : 'Yes, Delete Everything'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Re-enrollment Confirmation Modal */}
      {showReenrollConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Re-enrollment</h2>
            <p className="modal-description">
              🔄 You are about to start a new enrollment session.
            </p>
            <p className="modal-description">
              This will:
            </p>
            <ul className="modal-list">
              <li>Start a new enrollment session</li>
              <li>Allow you to update your biometric data</li>
              <li>Keep your existing data until you complete the new enrollment</li>
              <li>Redirect you to the capture page</li>
            </ul>
            <p className="modal-info">
              💡 Your current enrollment data will remain accessible until you complete
              the new enrollment process.
            </p>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={handleReenrollCancel}
                disabled={isReenrolling}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReenroll}
                disabled={isReenrolling}
                loading={isReenrolling}
              >
                {isReenrolling ? 'Starting...' : 'Start Re-enrollment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
