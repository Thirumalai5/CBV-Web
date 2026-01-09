/**
 * CBV System - Main App Component
 * Optimized with code splitting and lazy loading
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VerificationProvider } from '@/context/VerificationContext';
import { EvaluationProvider } from '@/context/EvaluationContext';
import Navbar from '@/components/common/Navbar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DebugPanel from '@/components/debug/DebugPanel';
import CONFIG, { validateConfig } from '@/utils/config';
import logger from '@/utils/logger';
import { checkBrowserSupport, getBrowserInfo } from '@/utils/helpers';
import storageService from '@/services/storage.service';
import './App.css';

// Lazy load pages for better initial load performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const RegistrationPage = lazy(() => import('@/pages/RegistrationPage'));
const CapturePage = lazy(() => import('@/pages/CapturePage'));
const ProtectedAppPage = lazy(() => import('@/pages/ProtectedAppPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const EvaluationPage = lazy(() => import('@/pages/EvaluationPage'));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="page-loading">
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading page...</p>
    </div>
  </div>
);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [debugMetrics, setDebugMetrics] = useState({
    fps: 0,
    inferenceTime: 0,
    trustScore: 1.0,
    currentState: 'NORMAL',
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      logger.info('Initializing CBV System...', { version: CONFIG.VERSION });

      // Validate configuration
      const configValidation = validateConfig();
      if (!configValidation.valid) {
        throw new Error(`Configuration errors: ${configValidation.errors.join(', ')}`);
      }
      logger.info('Configuration validated');

      // Check browser support
      const support = checkBrowserSupport();
      
      if (!support.all) {
        const missing = Object.entries(support)
          .filter(([key, value]) => key !== 'all' && !value)
          .map(([key]) => key);
        
        logger.warn('Some features not supported', { missing });
        
        if (!support.camera || !support.webCrypto || !support.indexedDB) {
          throw new Error(
            `Required features not supported: ${missing.join(', ')}. ` +
            'Please use a modern browser like Chrome, Edge, or Firefox.'
          );
        }
      }

      // Log browser info
      const browserInfo = getBrowserInfo();
      logger.info('Browser detected', browserInfo);

      // Initialize storage
      await storageService.init();
      logger.info('Storage initialized');

      // Get storage stats
      const stats = await storageService.getStats();
      logger.info('Storage stats', stats);

      // Auto-import demo templates for Phase 6 testing
      try {
        const demoImportService = (await import('@/services/demo-import.service')).default;
        const templatesReady = await demoImportService.autoImportIfNeeded();
        
        if (templatesReady) {
          logger.info('✅ Demo templates ready for Phase 6 testing');
        } else {
          logger.warn('⚠️ Demo templates not available - verification may fail');
        }
      } catch (error) {
        logger.warn('Demo template import skipped', { error: error.message });
      }

      setIsInitialized(true);
      logger.info('CBV System initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize app', { error: error.message });
      setInitError(error.message);
    }
  };

  if (initError) {
    return (
      <div className="app-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h1>Initialization Error</h1>
          <p>{initError}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Initializing CBV System...</h2>
          <p>Please wait while we set up the application</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <VerificationProvider>
        <EvaluationProvider>
          <div className="app">
            <Navbar />
            
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route 
                  path="/capture" 
                  element={
                    <ProtectedRoute>
                      <CapturePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/app" 
                  element={
                    <ProtectedRoute>
                      <ProtectedAppPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/evaluation" 
                  element={
                    <ProtectedRoute>
                      <EvaluationPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Suspense>

            {/* Debug Panel */}
            <DebugPanel
              fps={debugMetrics.fps}
              inferenceTime={debugMetrics.inferenceTime}
              trustScore={debugMetrics.trustScore}
              currentState={debugMetrics.currentState}
              isVisible={CONFIG.DEBUG.ENABLED}
            />
          </div>
        </EvaluationProvider>
      </VerificationProvider>
    </Router>
  );
}

export default App;
