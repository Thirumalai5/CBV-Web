/**
 * CBV System - Home Page
 * Landing page with project overview and navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import CONFIG from '@/utils/config';
import { checkBrowserSupport } from '@/utils/helpers';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const browserSupport = checkBrowserSupport();

  const handleStartRegistration = () => {
    navigate('/register');
  };

  const handleGoToVerification = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-icon">🔐</div>
          <h1 className="hero-title">Continuous Behavioral Verification System</h1>
          <p className="hero-subtitle">
            Advanced browser-based biometric authentication combining face recognition,
            liveness detection, and behavioral biometrics for continuous user verification.
          </p>
          <p className="hero-description">
            Master's Thesis Project - Demonstrating real-time, privacy-preserving
            authentication that adapts to user behavior and detects anomalies.
          </p>
        </section>

        {/* Features Grid */}
        <section className="home-features">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3 className="feature-title">Face Recognition</h3>
              <p className="feature-description">
                Real-time face detection and matching using state-of-the-art
                deep learning models running entirely in your browser.
              </p>
              <ul className="feature-list">
                <li>BlazeFace detection</li>
                <li>MobileFaceNet embeddings</li>
                <li>Quality checks (lighting, blur, alignment)</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3 className="feature-title">Liveness Detection</h3>
              <p className="feature-description">
                Prevent spoofing attacks with advanced liveness verification
                through natural eye movements and micro-motions.
              </p>
              <ul className="feature-list">
                <li>Blink detection (EAR analysis)</li>
                <li>Micro-motion tracking</li>
                <li>Temporal consistency checks</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⌨️</div>
              <h3 className="feature-title">Behavioral Biometrics</h3>
              <p className="feature-description">
                Unique typing and mouse patterns create an additional layer
                of continuous authentication.
              </p>
              <ul className="feature-list">
                <li>Keystroke dynamics (dwell/flight times)</li>
                <li>Mouse movement patterns</li>
                <li>One-class anomaly detection</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure Storage</h3>
              <p className="feature-description">
                All biometric data is encrypted locally using Web Crypto API
                and never leaves your device.
              </p>
              <ul className="feature-list">
                <li>AES-GCM encryption</li>
                <li>PBKDF2 key derivation</li>
                <li>IndexedDB persistence</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Adaptive Trust</h3>
              <p className="feature-description">
                Dynamic trust scoring with smooth state transitions and
                hysteresis to prevent false alarms.
              </p>
              <ul className="feature-list">
                <li>Multi-modal fusion</li>
                <li>Exponential moving average</li>
                <li>State machine (NORMAL/WATCH/RESTRICT/REAUTH)</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Real-time Enforcement</h3>
              <p className="feature-description">
                Automatic protection mechanisms that blur content and restrict
                actions when anomalies are detected.
              </p>
              <ul className="feature-list">
                <li>Content blurring</li>
                <li>Action blocking</li>
                <li>Graceful recovery</li>
              </ul>
            </div>
          </div>
        </section>

        {/* System Status */}
        <section className="home-status">
          <h2 className="section-title">System Status</h2>
          <div className="status-card">
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Camera Access:</span>
                <span className={`status-value ${browserSupport.camera ? 'status-success' : 'status-error'}`}>
                  {browserSupport.camera ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Web Crypto API:</span>
                <span className={`status-value ${browserSupport.webCrypto ? 'status-success' : 'status-error'}`}>
                  {browserSupport.webCrypto ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">IndexedDB:</span>
                <span className={`status-value ${browserSupport.indexedDB ? 'status-success' : 'status-error'}`}>
                  {browserSupport.indexedDB ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">WebGL:</span>
                <span className={`status-value ${browserSupport.webGL ? 'status-success' : 'status-error'}`}>
                  {browserSupport.webGL ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
            </div>
            
            {!browserSupport.all && (
              <div className="status-warning">
                <strong>⚠️ Warning:</strong> Some features may not be available in your browser.
                For the best experience, please use a modern browser like Chrome, Edge, or Firefox.
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="home-cta">
          <h2 className="section-title">Get Started</h2>
          <p className="cta-description">
            {isAuthenticated
              ? 'You are already registered. Access the protected application or continue with data capture.'
              : 'Register with the demo credentials to begin the enrollment process and experience continuous behavioral verification.'}
          </p>
          <div className="cta-buttons">
            <Button
              variant="primary"
              size="large"
              onClick={handleStartRegistration}
            >
              {isAuthenticated ? 'Continue Registration' : 'Start Registration'}
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={handleGoToVerification}
            >
              Go to Verification
            </Button>
          </div>
          
          {!isAuthenticated && (
            <div className="cta-credentials">
              <p className="credentials-title">Demo Credentials:</p>
              <div className="credentials-box">
                <div className="credential-item">
                  <span className="credential-label">User ID:</span>
                  <code className="credential-value">{CONFIG.DEMO_CREDENTIALS.USER_ID}</code>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Password:</span>
                  <code className="credential-value">{CONFIG.DEMO_CREDENTIALS.PASSWORD}</code>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Project Info */}
        <section className="home-info">
          <div className="info-card">
            <h3>About This Project</h3>
            <p>
              This is a Master's thesis project demonstrating a novel approach to continuous
              authentication using multiple biometric modalities. The system runs entirely
              in the browser, ensuring privacy and security by keeping all biometric data
              on the user's device.
            </p>
            <p>
              <strong>Current Phase:</strong> Phase 1 - UX Flow and Navigation Skeleton
            </p>
            <p>
              <strong>Version:</strong> {CONFIG.VERSION}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
