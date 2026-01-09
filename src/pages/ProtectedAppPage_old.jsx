/**
 * CBV System - Protected App Page
 * Simulated sensitive application with CBV enforcement overlay
 * (Placeholder for Phase 6-7 implementation)
 */

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import CONFIG, { getStateColor } from '@/utils/config';
import './ProtectedAppPage.css';

const ProtectedAppPage = () => {
  const { currentUser, session } = useAuth();
  
  // Placeholder state for CBV (will be implemented in Phase 6)
  const [trustScore] = useState(1.0);
  const [currentState] = useState('NORMAL');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleTransfer = (e) => {
    e.preventDefault();
    alert('Transfer functionality will be implemented with enforcement in Phase 7');
  };

  return (
    <div className="protected-app-page">
      {/* CBV Enforcement Overlay (Placeholder for Phase 6-7) */}
      {currentState !== 'NORMAL' && (
        <div className={`cbv-overlay ${currentState.toLowerCase()}`}>
          <div className="overlay-content">
            <div className="overlay-icon">
              {currentState === 'WATCH' && '⚠️'}
              {currentState === 'RESTRICT' && '🚫'}
              {currentState === 'REAUTH' && '🔒'}
            </div>
            <h2 className="overlay-title">
              {currentState === 'WATCH' && 'Verification Warning'}
              {currentState === 'RESTRICT' && 'Access Restricted'}
              {currentState === 'REAUTH' && 'Re-authentication Required'}
            </h2>
            <p className="overlay-message">
              {currentState === 'WATCH' && 'Unusual activity detected. Please verify your identity.'}
              {currentState === 'RESTRICT' && 'High-risk actions are blocked. Please re-authenticate.'}
              {currentState === 'REAUTH' && 'Your session requires re-authentication to continue.'}
            </p>
            <div className="overlay-trust">
              <span className="trust-label">Trust Score:</span>
              <span 
                className="trust-value" 
                style={{ color: getStateColor(currentState) }}
              >
                {(trustScore * 100).toFixed(0)}%
              </span>
            </div>
            {currentState === 'REAUTH' && (
              <Button variant="primary" size="large">
                Re-authenticate Now
              </Button>
            )}
          </div>
        </div>
      )}

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
          </div>
        </header>

        {/* Phase Notice */}
        <div className="phase-notice">
          <div className="notice-icon">ℹ️</div>
          <div className="notice-content">
            <h3 className="notice-title">Phase 1 - Protected App Demo</h3>
            <p className="notice-text">
              This is a simulated banking application to demonstrate the protected content.
              Full CBV runtime verification and enforcement will be implemented in <strong>Phase 6-7</strong>.
            </p>
            <p className="notice-text">
              Currently showing: <strong>NORMAL</strong> state with full access.
              In later phases, this will dynamically change based on continuous verification.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="app-content-grid">
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
                  />
                </div>
                <Button type="submit" variant="primary" fullWidth>
                  Transfer Funds
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
                    <span className="option-title">Two-Factor Authentication</span>
                    <span className="option-description">Extra security for your account</span>
                  </div>
                  <span className="option-status status-active">Enabled</span>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Biometric Login</span>
                    <span className="option-description">Face and fingerprint recognition</span>
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

          {/* Trust Monitor (Placeholder) */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">CBV Trust Monitor</h3>
              <span className="card-icon">🛡️</span>
            </div>
            <div className="card-content">
              <div className="trust-display">
                <div className="trust-gauge">
                  <div className="gauge-background"></div>
                  <div 
                    className="gauge-fill" 
                    style={{ width: `${(1 - trustScore) * 100}%` }}
                  ></div>
                </div>
                <div className="trust-info">
                  <span className="trust-percentage">{(trustScore * 100).toFixed(0)}%</span>
                  <span 
                    className={`trust-state state-${currentState.toLowerCase()}`}
                  >
                    {currentState}
                  </span>
                </div>
              </div>
              <div className="trust-details">
                <div className="detail-row">
                  <span className="detail-label">Face Match</span>
                  <span className="detail-value">100%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Liveness</span>
                  <span className="detail-value">100%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Behavior</span>
                  <span className="detail-value">100%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Session Duration</span>
                  <span className="detail-value">Active</span>
                </div>
              </div>
              <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Note:</strong> Real-time verification will be implemented in Phase 6.
              </div>
            </div>
          </div>

          {/* Documents (Sensitive Content) */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Sensitive Documents</h3>
              <span className="card-icon">📄</span>
            </div>
            <div className="card-content">
              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Tax Returns 2024</span>
                    <span className="option-description">Confidential tax information</span>
                  </div>
                  <Button variant="outline" size="small">View</Button>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Account Statements</span>
                    <span className="option-description">Monthly statements</span>
                  </div>
                  <Button variant="outline" size="small">View</Button>
                </div>
                <div className="security-option">
                  <div className="option-info">
                    <span className="option-title">Investment Portfolio</span>
                    <span className="option-description">Stock and bond holdings</span>
                  </div>
                  <Button variant="outline" size="small">View</Button>
                </div>
              </div>
              <div style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Note:</strong> These sections will be blurred/restricted in WATCH/RESTRICT states (Phase 7).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <p><strong>Protected by CBV System v{CONFIG.VERSION}</strong></p>
          <p>Continuous Behavioral Verification - Master's Thesis Project</p>
          <p>All biometric data is encrypted and stored locally on your device</p>
        </footer>
      </div>
    </div>
  );
};

export default ProtectedAppPage;
