/**
 * CBV System - Entry Point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/context/AuthContext';
import App from './App';
import '@/styles/global.css';

// Get root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render app
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Service Worker update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ New content available, please refresh');
              // You could show a notification to the user here
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA install prompt available');
  // Don't prevent default - let browser show install prompt
  // Stash the event so it can be triggered later if needed
  deferredPrompt = e;
  
  console.log('💡 User can install CBV System as an app');
  console.log('📱 Look for install icon in browser address bar');
});

// Handle successful PWA installation
window.addEventListener('appinstalled', () => {
  console.log('✅ CBV System installed as PWA');
  deferredPrompt = null;
});

// Log PWA display mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('🚀 Running as installed PWA');
} else {
  console.log('🌐 Running in browser');
}
