/**
 * CBV System - Registration Page
 * User authentication and enrollment session creation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/capture';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!formData.userId.trim() || !formData.password.trim()) {
        throw new Error('Please enter both User ID and Password');
      }

      logger.info('Attempting login', { userId: formData.userId });

      // Attempt login
      const result = await login(formData.userId, formData.password);

      if (result.success) {
        logger.info('Login successful, redirecting to capture page');
        // Navigate to capture page or the page they were trying to access
        const from = location.state?.from?.pathname || '/capture';
        navigate(from, { replace: true });
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err) {
      logger.error('Login error', { error: err.message });
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({
      userId: CONFIG.DEMO_CREDENTIALS.USER_ID,
      password: CONFIG.DEMO_CREDENTIALS.PASSWORD,
    });
    setError('');
  };

  if (authLoading) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          {/* Header */}
          <div className="registration-header">
            <div className="registration-icon">🔐</div>
            <h1 className="registration-title">User Registration</h1>
            <p className="registration-subtitle">
              Enter your credentials to begin the enrollment process
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="registration-form">
            {error && (
              <div className="form-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="userId" className="form-label">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your user ID"
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Login & Start Enrollment'}
            </Button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="registration-demo">
            <div className="demo-divider">
              <span>Demo Credentials</span>
            </div>
            <div className="demo-credentials">
              <div className="demo-credential">
                <span className="demo-label">User ID:</span>
                <code className="demo-value">{CONFIG.DEMO_CREDENTIALS.USER_ID}</code>
              </div>
              <div className="demo-credential">
                <span className="demo-label">Password:</span>
                <code className="demo-value">{CONFIG.DEMO_CREDENTIALS.PASSWORD}</code>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={handleFillDemo}
              disabled={loading}
              fullWidth
            >
              Fill Demo Credentials
            </Button>
          </div>

          {/* Info */}
          <div className="registration-info">
            <h3 className="info-title">What happens next?</h3>
            <ol className="info-list">
              <li>
                <strong>Authentication:</strong> Your credentials will be validated against
                the demo user account.
              </li>
              <li>
                <strong>Session Creation:</strong> An enrollment session will be created
                with a unique session ID.
              </li>
              <li>
                <strong>Key Derivation:</strong> An encryption key will be derived from
                your password using PBKDF2.
              </li>
              <li>
                <strong>Data Capture:</strong> You'll be guided through capturing face,
                liveness, and behavioral data.
              </li>
            </ol>
          </div>

          {/* Security Note */}
          <div className="registration-security">
            <div className="security-icon">🔒</div>
            <div className="security-content">
              <h4 className="security-title">Privacy & Security</h4>
              <p className="security-text">
                All biometric data is encrypted and stored locally on your device.
                No data is transmitted to external servers. Your password is used
                to derive an encryption key and is never stored in plain text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
