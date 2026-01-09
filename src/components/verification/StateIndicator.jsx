/**
 * CBV System - State Indicator Component
 * Displays current security state with icon and description
 */

import React from 'react';
import './StateIndicator.css';

const StateIndicator = ({ state, stateInfo, compact = false }) => {
  if (!stateInfo) {
    return null;
  }

  return (
    <div className={`state-indicator state-indicator--${state.toLowerCase()} ${compact ? 'state-indicator--compact' : ''}`}>
      <div className="state-indicator__badge" style={{ backgroundColor: stateInfo.color }}>
        <span className="state-indicator__icon">{stateInfo.icon}</span>
        {!compact && <span className="state-indicator__name">{stateInfo.name}</span>}
      </div>
      
      {!compact && (
        <div className="state-indicator__description">
          {stateInfo.description}
        </div>
      )}
    </div>
  );
};

export default StateIndicator;
