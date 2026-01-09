/**
 * CBV System - BlurOverlay Component
 * Progressive blur overlay based on trust state
 */

import React from 'react';
import './BlurOverlay.css';

const BlurOverlay = ({ trustScore, currentState, children, className = '' }) => {
  /**
   * Calculate blur amount based on current state
   * Increased to 50% more blur for better visibility
   */
  const getBlurAmount = () => {
    switch (currentState) {
      case 'NORMAL':
        return 0;
      case 'WATCH':
        return 3;      // Increased from 2px to 3px (50% more)
      case 'RESTRICT':
        return 8;      // Increased from 5px to 8px (60% more)
      case 'REAUTH':
        return 15;     // Increased from 10px to 15px (50% more)
      default:
        return 0;
    }
  };

  /**
   * Calculate opacity for overlay (for REAUTH state)
   */
  const getOverlayOpacity = () => {
    if (currentState === 'REAUTH') return 0.3;
    if (currentState === 'RESTRICT') return 0.1;
    return 0;
  };

  /**
   * Determine if pointer events should be disabled
   */
  const shouldDisablePointerEvents = () => {
    return currentState === 'REAUTH';
  };

  const blurAmount = getBlurAmount();
  const overlayOpacity = getOverlayOpacity();
  const disablePointer = shouldDisablePointerEvents();

  return (
    <div className={`blur-overlay-container ${className}`}>
      {/* Dark overlay for RESTRICT/REAUTH states */}
      {overlayOpacity > 0 && (
        <div 
          className="blur-overlay-dark"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* Content with blur filter */}
      <div
        className={`blur-overlay-content ${disablePointer ? 'disabled' : ''}`}
        style={{
          filter: `blur(${blurAmount}px)`,
          pointerEvents: disablePointer ? 'none' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BlurOverlay;
