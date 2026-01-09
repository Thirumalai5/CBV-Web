/**
 * CBV System - Navigation Bar Component
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from './Button';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🔐</span>
          <span className="navbar-title">CBV System</span>
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link
                to="/capture"
                className={`navbar-link ${isActive('/capture') ? 'active' : ''}`}
              >
                Capture
              </Link>
              <Link
                to="/app"
                className={`navbar-link ${isActive('/app') ? 'active' : ''}`}
              >
                Protected App
              </Link>
              <Link
                to="/settings"
                className={`navbar-link ${isActive('/settings') ? 'active' : ''}`}
              >
                Settings
              </Link>
              <Link
                to="/evaluation"
                className={`navbar-link ${isActive('/evaluation') ? 'active' : ''}`}
              >
                Evaluation
              </Link>
              
              <div className="navbar-user">
                <span className="navbar-user-icon">👤</span>
                <span className="navbar-user-name">{currentUser?.userId || 'User'}</span>
              </div>

              <Button
                variant="outline"
                size="small"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className={`navbar-link ${isActive('/register') ? 'active' : ''}`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
