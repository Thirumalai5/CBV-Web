/**
 * CBV System - Trust Score Gauge Component
 * Visual display of trust score with color coding
 */

import React from 'react';
import './TrustScoreGauge.css';

const TrustScoreGauge = ({ score, state, size = 'medium' }) => {
  // Normalize score to 0-100
  const percentage = Math.round(score * 100);

  // Get color based on state
  const getColor = () => {
    switch (state) {
      case 'NORMAL':
        return '#10b981'; // green
      case 'WATCH':
        return '#f59e0b'; // yellow
      case 'RESTRICT':
        return '#f97316'; // orange
      case 'REAUTH':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const color = getColor();

  // Calculate stroke dash offset for circular progress
  const radius = size === 'large' ? 45 : size === 'small' ? 30 : 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`trust-score-gauge trust-score-gauge--${size}`}>
      <svg className="trust-score-gauge__svg" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          className="trust-score-gauge__background"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          className="trust-score-gauge__progress"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
        />
      </svg>

      {/* Score text */}
      <div className="trust-score-gauge__content">
        <div className="trust-score-gauge__score" style={{ color }}>
          {percentage}
        </div>
        <div className="trust-score-gauge__label">Trust</div>
      </div>
    </div>
  );
};

export default TrustScoreGauge;
