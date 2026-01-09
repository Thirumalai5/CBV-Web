/**
 * CBV System - Enrollment Progress Component
 * Displays enrollment progress and requirements
 */

import React from 'react';
import './EnrollmentProgress.css';
import CONFIG from '@/utils/config';

const EnrollmentProgress = ({ enrollmentStatus }) => {
  if (!enrollmentStatus) {
    return null;
  }

  const { status, progress = {}, requirements } = enrollmentStatus;
  const { REQUIREMENTS } = CONFIG.ENROLLMENT;

  // Ensure progress has default values with proper NaN handling
  const currentProgress = {
    faceSamples: Number(progress.faceSamples) || 0,
    livenessDuration: Number(progress.livenessDuration) || 0,
    behaviorDuration: Number(progress.behaviorDuration) || 0,
  };

  // Debug log
  console.log('📊 EnrollmentProgress rendering:', {
    status,
    progress,
    currentProgress,
    requirements
  });

  // Calculate overall progress percentage (handle NaN)
  const faceProgress = Math.min(100, (currentProgress.faceSamples / REQUIREMENTS.MIN_FACE_SAMPLES) * 100) || 0;
  const livenessProgress = Math.min(100, (currentProgress.livenessDuration / REQUIREMENTS.MIN_LIVENESS_DURATION) * 100) || 0;
  const behaviorProgress = Math.min(100, (currentProgress.behaviorDuration / REQUIREMENTS.MIN_BEHAVIOR_DURATION) * 100) || 0;
  const overallProgress = ((faceProgress + livenessProgress + behaviorProgress) / 3) || 0;

  const getStatusBadge = () => {
    const badges = {
      not_started: { text: 'Not Started', className: 'status-badge-gray' },
      in_progress: { text: 'In Progress', className: 'status-badge-blue' },
      completed: { text: 'Completed', className: 'status-badge-green' },
    };
    return badges[status] || badges.not_started;
  };

  const badge = getStatusBadge();

  return (
    <div className="enrollment-progress">
      <div className="enrollment-header">
        <h3>Enrollment Progress</h3>
        <span className={`status-badge ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <div className="overall-progress">
        <div className="progress-label">
          <span>Overall Progress</span>
          <span className="progress-percentage">{Math.round(overallProgress)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="requirements-list">
        <h4>Requirements</h4>
        
        <div className="requirement-item">
          <div className="requirement-header">
            <span className="requirement-name">
              {currentProgress.faceSamples >= REQUIREMENTS.MIN_FACE_SAMPLES ? '✓' : '○'} Face Samples
            </span>
            <span className="requirement-count">
              {currentProgress.faceSamples} / {REQUIREMENTS.MIN_FACE_SAMPLES}
            </span>
          </div>
          <div className="progress-bar small">
            <div 
              className={`progress-fill ${currentProgress.faceSamples >= REQUIREMENTS.MIN_FACE_SAMPLES ? 'complete' : ''}`}
              style={{ width: `${faceProgress}%` }}
            />
          </div>
        </div>

        <div className="requirement-item">
          <div className="requirement-header">
            <span className="requirement-name">
              {currentProgress.livenessDuration >= REQUIREMENTS.MIN_LIVENESS_DURATION ? '✓' : '○'} Liveness Duration
            </span>
            <span className="requirement-count">
              {currentProgress.livenessDuration}s / {REQUIREMENTS.MIN_LIVENESS_DURATION}s
            </span>
          </div>
          <div className="progress-bar small">
            <div 
              className={`progress-fill ${currentProgress.livenessDuration >= REQUIREMENTS.MIN_LIVENESS_DURATION ? 'complete' : ''}`}
              style={{ width: `${livenessProgress}%` }}
            />
          </div>
        </div>

        <div className="requirement-item">
          <div className="requirement-header">
            <span className="requirement-name">
              {currentProgress.behaviorDuration >= REQUIREMENTS.MIN_BEHAVIOR_DURATION ? '✓' : '○'} Behavior Duration
            </span>
            <span className="requirement-count">
              {currentProgress.behaviorDuration}s / {REQUIREMENTS.MIN_BEHAVIOR_DURATION}s
            </span>
          </div>
          <div className="progress-bar small">
            <div 
              className={`progress-fill ${currentProgress.behaviorDuration >= REQUIREMENTS.MIN_BEHAVIOR_DURATION ? 'complete' : ''}`}
              style={{ width: `${behaviorProgress}%` }}
            />
          </div>
        </div>
      </div>

      {requirements && !requirements.met && requirements.missing && requirements.missing.length > 0 && (
        <div className="requirements-missing">
          <h5>Missing Requirements:</h5>
          <ul>
            {requirements.missing.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {requirements && requirements.met && (
        <div className="requirements-met">
          <p>✓ All requirements met! You can complete enrollment.</p>
        </div>
      )}
    </div>
  );
};

export default EnrollmentProgress;
