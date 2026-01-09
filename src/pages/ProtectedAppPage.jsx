/**
 * CBV System - Protected App Page
 * Simulated sensitive application with CBV enforcement overlay
 * Phase 6: Integrated with continuous verification
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useVerification } from '@/context/VerificationContext';
import { EnforcementProvider, useEnforcement } from '@/context/EnforcementContext';
import Button from '@/components/common/Button';
import TrustScoreGauge from '@/components/verification/TrustScoreGauge';
import VerificationStatus from '@/components/verification/VerificationStatus';
import BlurOverlay from '@/components/enforcement/BlurOverlay';
import WarningBanner from '@/components/enforcement/WarningBanner';
import ReAuthModal from '@/components/enforcement/ReAuthModal';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import './ProtectedAppPage.css';

const ProtectedAppPageContent = () => {
  const { currentUser } = useAuth();
  const {
    isVerifying,
    trustScore,
    currentState,
    scores,
    status,
    startVerification,
    stopVerification,
    getStateInfo,
  } = useVerification();

  const {
    isReAuthModalOpen,
    openReAuthModal,
    closeReAuthModal,
    handleReAuthSuccess,
  } = useEnforcement();

  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [verificationError, setVerificationError] = useState(null);
  
  const videoRef = useRef(null);

  /**
   * Manual verification control - no auto-start
   */
  useEffect(() => {
    // Cleanup on unmount - stop verification if running
    return () => {
      if (isVerifying) {
        logger.info('Stopping verification on page unmount');
        stopVerification();
      }
    };
  }, [isVerifying, stopVerification]);

  /**
   * Handle initiate verification
   */
  const handleInitiateVerification = async () => {
    if (!currentUser) {
      setVerificationError('No user logged in');
      return;
    }

    try {
      setVerificationError(null);
      logger.info('Initiating verification manually');
      
      // Try to import demo templates, but don't fail if it doesn't work
      try {
        logger.info('Attempting to import demo templates...');
        const demoImportService = (await import('@/services/demo-import.service')).default;
        
        // Check if templates exist
        let hasTemplates = await demoImportService.hasTemplates();
        
        if (!hasTemplates) {
          logger.info('Templates not found, trying to import...');
          const imported = await demoImportService.importDemoTemplates();
          
          if (imported) {
            logger.info('✅ Demo templates imported successfully');
          } else {
            logger.warn('⚠️ Demo template import failed, but continuing anyway');
          }
        } else {
          logger.info('✅ Templates already exist');
        }
      } catch (templateError) {
        logger.warn('Template import failed, but continuing with verification', { 
          error: templateError.message 
        });
      }
      
      // Start verification
      await startVerification(currentUser.userId, videoRef.current);
      logger.info('✅ Verification initiated successfully');
      
    } catch (error) {
      logger.error('Failed to initiate verification', { error: error.message });
      setVerificationError(error.message);
    }
  };

  /**
   * Handle terminate verification
   */
  const handleTerminateVerification = () => {
    try {
      logger.info('Terminating verification manually');
      stopVerification();
      logger.info('✅ Verification terminated successfully');
    } catch (error) {
      logger.error('Failed to terminate verification', { error: error.message });
      setVerificationError(error.message);
    }
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    
    // Check if action is allowed based on current state
    if (currentState === 'RESTRICT' || currentState === 'REAUTH') {
      alert('This action is blocked due to security concerns. Please re-authenticate.');
      return;
    }
    
    if (currentState === 'WATCH') {
      const confirmed = window.confirm(
        'Your trust score is low. Are you sure you want to proceed with this transfer?'
      );
      if (!confirmed) return;
    }
    
    alert(`Transfer of $${transferAmount} to ${recipient} would be processed here (Phase 7 enforcement)`);
  };

  /**
   * Handle re-authentication success
   */
  const handleReAuthComplete = async () => {
    try {
      logger.info('Re-authentication completed successfully');
      
      // Restart verification with fresh trust score
      if (isVerifying) {
        await stopVerification();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await startVerification(currentUser.userId, videoRef.current);
      
      // Call enforcement context handler
      handleReAuthSuccess();
      
      logger.info('Verification restarted after re-authentication');
    } catch (error) {
      logger.error('Failed to restart verification after re-auth', { error: error.message });
    }
  };

  return (
    <div className="protected-app-page">
      {/* Hidden video element for verification */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted
      />

      {/* Phase 7: Warning Banner */}
      <WarningBanner
        currentState={currentState}
        trustScore={trustScore}
        onReAuthenticate={openReAuthModal}
      />

      {/* Phase 7: Re-Authentication Modal */}
      <ReAuthModal
        isOpen={isReAuthModalOpen}
        onSuccess={handleReAuthComplete}
        onCancel={closeReAuthModal}
      />

      {/* Phase 7: Blur Overlay */}
      <BlurOverlay trustScore={trustScore} currentState={currentState}>

      <div className="protected-app-container">
        {/* App Header */}
        <header className="app-header">
          <div className="app-header-content">
            <h1>🏦 Secure Banking Portal</h1>
            <p className="app-subtitle">Protected by Continuous Behavioral Verification</p>
          </div>
          <div className="app-user-info">
            <span className="user-greeting">
              Welcome, {currentUser?.userId || 'User'}
            </span>
            <div className={`verification-badge ${isVerifying ? 'active' : 'inactive'}`}>
              <span className="badge-dot"></span>
              <span className="badge-text">
                {isVerifying ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </header>

        {/* Verification Error */}
        {verificationError && (
          <div className="verification-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">
              Verification Error: {verificationError}
            </span>
            <Button 
              variant="outline" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Verification Control Panel */}
        <div className="verification-control-panel">
          <div className="control-panel-header">
            <h3 className="control-panel-title">Verification Control</h3>
            <div className={`verification-status-indicator ${isVerifying ? 'active' : 'inactive'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {isVerifying ? 'Verification Active' : 'Verification Inactive'}
              </span>
            </div>
          </div>
          <div className="control-panel-content">
            <p className="control-panel-description">
              {isVerifying 
                ? 'Continuous biometric verification is currently running. Your face, liveness, and behavior are being monitored in real-time.'
                : 'Click "Initiate Verification" to start continuous biometric monitoring for enhanced security.'}
            </p>
            <div className="control-panel-actions">
              {!isVerifying ? (
                <Button 
                  variant="primary" 
                  size="large"
                  onClick={handleInitiateVerification}
                >
                  🚀 Initiate Verification
                </Button>
              ) : (
                <Button 
                  variant="danger" 
                  size="large"
                  onClick={handleTerminateVerification}
                >
                  🛑 Terminate Verification
                </Button>
              )}
            </div>
            {isVerifying && (
              <div className="control-panel-info">
                <p className="info-text">
                  Current State: <strong style={{ color: getStateInfo(currentState).color }}>{currentState}</strong> - {getStateInfo(currentState).description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Phase Notice */}
        <div className="phase-notice">
          <div className="notice-icon">✅</div>
          <div className="notice-content">
            <h3 className="notice-title">Phase 6 - Manual Verification Control</h3>
            <p className="notice-text">
              This application supports real-time continuous behavioral verification with manual control.
              Use the buttons above to start or stop verification as needed.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="app-content-grid">
          {/* Trust Score Gauge */}
          <div className="content-card full-width">
            <TrustScoreGauge score={trustScore} state={currentState} size="large" />
          </div>

          {/* Verification Status */}
          <div className="content-card full-width">
            <VerificationStatus 
              isVerifying={isVerifying}
              scores={scores}
              status={status}
            />
          </div>

          {/* Account Overview */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Account Overview</h3>
              <span className="card-icon">💰</span>
            </div>
            <div className="card-content">
              <div className="account-balance">
                <span className="balance-label">Available Balance</span>
                <span className="balance-amount">$12,458.32</span>
              </div>
              <div className="account-details">
                <div className="detail-item">
                  <span className="detail-label">Account Number</span>
                  <span className="detail-value">****-****-1234</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account Type</span>
                  <span className="detail-value">Checking</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <span className="card-icon">📊</span>
            </div>
            <div className="card-content">
              <div className="transactions-list">
                <div className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-merchant">Amazon.com</span>
                    <span className="transaction-date">Dec 15, 2024</span>
                  </div>
                  <span className="transaction-amount negative">-$89.99</span>
                </div>
                <div className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-merchant">Salary Deposit</span>
                    <span className="transaction-date">Dec 14, 2024</span>
                  </div>
                  <span className="transaction-amount positive">+$3,500.00</span>
                </div>
                <div className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-merchant">Grocery Store</span>
                    <span className="transaction-date">Dec 13, 2024</span>
                  </div>
                  <span className="transaction-amount negative">-$124.56</span>
                </div>
                <div className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-merchant">Gas Station</span>
                    <span className="transaction-date">Dec 12, 2024</span>
                  </div>
                  <span className="transaction-amount negative">-$45.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Transfer */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Quick Transfer</h3>
              <span className="card-icon">💸</span>
              {(currentState === 'RESTRICT' || currentState === 'REAUTH') && (
                <span className="card-badge blocked">Blocked</span>
              )}
              {currentState === 'WATCH' && (
                <span className="card-badge warning">Warning</span>
              )}
            </div>
            <div className="card-content">
              <form onSubmit={handleTransfer} className="transfer-form">
                <div className="form-group">
                  <label htmlFor="recipient" className="form-label">
                    Recipient
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    className="form-input"
                    placeholder="Enter recipient name or account"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    className="form-input"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth
                  disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                >
                  {currentState === 'RESTRICT' || currentState === 'REAUTH' 
                    ? 'Transfer Blocked' 
                    : 'Transfer Funds'}
                </Button>
              </form>
            </div>
          </div>

          {/* Security Settings */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Security Settings</h3>
              <span className="card-icon">🔒</span>
            </div>
            <div className="card-content">
              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Continuous Verification</span>
                    <span className="option-description">Real-time biometric monitoring</span>
                  </div>
                  <span className={`option-status ${isVerifying ? 'status-active' : 'status-inactive'}`}>
                    {isVerifying ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Two-Factor Authentication</span>
                    <span className="option-description">Extra security for your account</span>
                  </div>
                  <span className="option-status status-active">Enabled</span>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Transaction Alerts</span>
                    <span className="option-description">Get notified of all transactions</span>
                  </div>
                  <span className="option-status status-active">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sensitive Documents */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Sensitive Documents</h3>
              <span className="card-icon">📄</span>
              {(currentState === 'RESTRICT' || currentState === 'REAUTH') && (
                <span className="card-badge blocked">Blocked</span>
              )}
            </div>
            <div className="card-content">
              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Tax Returns 2024</span>
                    <span className="option-description">Confidential tax information</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="small"
                    disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                  >
                    View
                  </Button>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Account Statements</span>
                    <span className="option-description">Monthly statements</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="small"
                    disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                  >
                    View
                  </Button>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Investment Portfolio</span>
                    <span className="option-description">Stock and bond holdings</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="small"
                    disabled={currentState === 'RESTRICT' || currentState === 'REAUTH'}
                  >
                    View
                  </Button>
                </div>
              </div>
              <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Note:</strong> Document access is controlled by your current trust score.
                Phase 7 will add visual blurring and additional enforcement.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <p><strong>Protected by CBV System v{CONFIG.VERSION}</strong></p>
          <p>Continuous Behavioral Verification - Phase 7 Active</p>
          <p>All biometric data is encrypted and stored locally on your device</p>
        </footer>
      </div>
      </BlurOverlay>
    </div>
  );
};

/**
 * Wrapped component with EnforcementProvider
 */
const ProtectedAppPage = () => {
  return (
    <EnforcementProvider>
      <ProtectedAppPageContent />
    </EnforcementProvider>
  );
};

export default ProtectedAppPage;
