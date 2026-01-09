/**
 * CBV System - Helper Utilities
 * Common utility functions used across the application
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export const generateId = () => {
  return uuidv4();
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Calculate time difference in seconds
 */
export const timeDiff = (start, end = Date.now()) => {
  return (end - start) / 1000;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Normalize value to 0-1 range
 */
export const normalize = (value, min, max) => {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
};

/**
 * Calculate Exponential Moving Average
 */
export const calculateEMA = (current, previous, alpha) => {
  return alpha * current + (1 - alpha) * previous;
};

/**
 * Calculate mean of an array
 */
export const mean = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

/**
 * Calculate standard deviation
 */
export const std = (arr) => {
  if (arr.length === 0) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(mean(squareDiffs));
};

/**
 * Calculate cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
};

/**
 * Calculate Euclidean distance between two vectors
 */
export const euclideanDistance = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2);
  }

  return Math.sqrt(sum);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Sleep/delay function
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Download data as file
 */
export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert canvas to blob
 */
export const canvasToBlob = (canvas, type = 'image/jpeg', quality = 0.95) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
};

/**
 * Convert blob to base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 to blob
 */
export const base64ToBlob = (base64, type = 'image/jpeg') => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type });
};

/**
 * Check if browser supports required features
 */
export const checkBrowserSupport = () => {
  const support = {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webCrypto: !!(window.crypto && window.crypto.subtle),
    indexedDB: !!window.indexedDB,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
  };

  support.all = Object.values(support).every(Boolean);

  return support;
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browser = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browser, version, userAgent: ua };
};

/**
 * Calculate FPS
 */
export class FPSCounter {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
  }

  tick() {
    const now = performance.now();
    this.frames.push(now);

    // Keep only last second of frames
    const oneSecondAgo = now - 1000;
    this.frames = this.frames.filter(time => time > oneSecondAgo);

    this.lastTime = now;
    return this.frames.length;
  }

  getFPS() {
    return this.frames.length;
  }

  reset() {
    this.frames = [];
    this.lastTime = performance.now();
  }
}

/**
 * Performance timer
 */
export class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = performance.now();
    return this;
  }

  stop() {
    this.endTime = performance.now();
    return this;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return this.endTime - this.startTime;
  }

  log() {
    console.log(`${this.name}: ${this.getDuration().toFixed(2)}ms`);
    return this;
  }
}

export default {
  generateId,
  formatTimestamp,
  timeDiff,
  clamp,
  normalize,
  calculateEMA,
  mean,
  std,
  cosineSimilarity,
  euclideanDistance,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  sleep,
  retry,
  formatBytes,
  downloadFile,
  canvasToBlob,
  blobToBase64,
  base64ToBlob,
  checkBrowserSupport,
  getBrowserInfo,
  FPSCounter,
  PerformanceTimer,
};
