/**
 * CBV System - Evaluation Context
 * Global state management for evaluation and testing
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useVerification } from './VerificationContext';
import scenarioRunnerService from '@/services/evaluation/scenario-runner.service';
import performanceMonitorService from '@/services/evaluation/performance-monitor.service';
import securityAnalyzerService from '@/services/evaluation/security-analyzer.service';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';

const EvaluationContext = createContext(null);

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
};

export const EvaluationProvider = ({ children }) => {
  // Evaluation state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [progress, setProgress] = useState(0);
  const [scenarios, setScenarios] = useState(CONFIG.SCENARIOS);
  
  // Results state
  const [scenarioResults, setScenarioResults] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [securityMetrics, setSecurityMetrics] = useState({});
  
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  
  // Get verification context
  const { currentState, trustScore, isVerifying } = useVerification();

  /**
   * Initialize evaluation services
   */
  useEffect(() => {
    // Set up scenario runner callbacks
    scenarioRunnerService.on('progress', (progressData) => {
      setProgress(progressData.progress);
    });

    scenarioRunnerService.on('stateChange', (state) => {
      // Record state changes for analysis
      securityAnalyzerService.recordStateTransition(
        state.previousState || 'UNKNOWN',
        state.currentState,
        state.trustScore,
        'scenario_event'
      );
    });

    scenarioRunnerService.on('complete', (result) => {
      setScenarioResults(prev => [...prev, result]);
      
      // Analyze scenario result
      securityAnalyzerService.analyzeScenario(
        { name: result.scenario },
        result.finalState,
        result.expectedState,
        result.finalTrustScore
      );
    });

    // Set up performance monitor callbacks
    performanceMonitorService.on('metric', (metric) => {
      setPerformanceMetrics(prev => ({
        ...prev,
        [metric.type]: metric.data,
      }));
    });

    performanceMonitorService.on('alert', (alert) => {
      logger.warn('Performance alert', alert);
    });

    return () => {
      // Cleanup
      scenarioRunnerService.reset();
      performanceMonitorService.reset();
    };
  }, []);

  /**
   * Start full evaluation
   */
  const startEvaluation = useCallback(async () => {
    if (isRunning) {
      logger.warn('Evaluation already running');
      return;
    }

    logger.info('Starting full evaluation');

    setIsRunning(true);
    setScenarioResults([]);
    setProgress(0);

    // Start monitoring
    performanceMonitorService.start();
    securityAnalyzerService.start();

    try {
      // Run all scenarios sequentially
      const scenarioNames = Object.keys(scenarios);
      
      for (let i = 0; i < scenarioNames.length; i++) {
        const scenarioName = scenarioNames[i];
        setCurrentScenario(scenarioName);
        
        logger.info(`Running scenario ${i + 1}/${scenarioNames.length}: ${scenarioName}`);
        
        await scenarioRunnerService.runScenario(scenarioName);
        
        // Wait between scenarios
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      logger.info('Full evaluation completed');
    } catch (error) {
      logger.error('Evaluation failed', { error: error.message });
    } finally {
      // Stop monitoring
      performanceMonitorService.stop();
      securityAnalyzerService.stop();

      setIsRunning(false);
      setCurrentScenario(null);
      setProgress(100);
    }
  }, [isRunning, scenarios]);

  /**
   * Run single scenario
   */
  const runScenario = useCallback(async (scenarioName) => {
    if (isRunning) {
      logger.warn('Cannot run scenario while evaluation is running');
      return;
    }

    logger.info(`Running single scenario: ${scenarioName}`);

    setIsRunning(true);
    setCurrentScenario(scenarioName);
    setProgress(0);

    // Start monitoring
    performanceMonitorService.start();
    securityAnalyzerService.start();

    try {
      const result = await scenarioRunnerService.runScenario(scenarioName);
      logger.info(`Scenario completed: ${scenarioName}`, { result });
      return result;
    } catch (error) {
      logger.error(`Scenario failed: ${scenarioName}`, { error: error.message });
      throw error;
    } finally {
      // Stop monitoring
      performanceMonitorService.stop();
      securityAnalyzerService.stop();

      setIsRunning(false);
      setCurrentScenario(null);
      setProgress(100);
    }
  }, [isRunning]);

  /**
   * Pause evaluation
   */
  const pauseEvaluation = useCallback(() => {
    if (isRunning && !isPaused) {
      scenarioRunnerService.pause();
      setIsPaused(true);
      logger.info('Evaluation paused');
    }
  }, [isRunning, isPaused]);

  /**
   * Resume evaluation
   */
  const resumeEvaluation = useCallback(() => {
    if (isRunning && isPaused) {
      scenarioRunnerService.resume();
      setIsPaused(false);
      logger.info('Evaluation resumed');
    }
  }, [isRunning, isPaused]);

  /**
   * Stop evaluation
   */
  const stopEvaluation = useCallback(() => {
    if (isRunning) {
      scenarioRunnerService.stop();
      performanceMonitorService.stop();
      securityAnalyzerService.stop();
      
      setIsRunning(false);
      setIsPaused(false);
      setCurrentScenario(null);
      
      logger.info('Evaluation stopped');
    }
  }, [isRunning]);

  /**
   * Reset evaluation
   */
  const resetEvaluation = useCallback(() => {
    scenarioRunnerService.reset();
    performanceMonitorService.reset();
    securityAnalyzerService.reset();
    
    setScenarioResults([]);
    setPerformanceMetrics({});
    setSecurityMetrics({});
    setProgress(0);
    setCurrentScenario(null);
    
    logger.info('Evaluation reset');
  }, []);

  /**
   * Get evaluation results
   */
  const getResults = useCallback(() => {
    return {
      scenarios: scenarioResults,
      performance: performanceMonitorService.getAllStatistics(),
      security: securityAnalyzerService.generateReport(),
    };
  }, [scenarioResults]);

  /**
   * Export results
   */
  const exportResults = useCallback((format = 'json') => {
    const results = getResults();

    if (format === 'json') {
      const json = JSON.stringify(results, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbv-evaluation-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csv = securityAnalyzerService.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbv-evaluation-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    logger.info('Results exported', { format });
  }, [getResults]);

  /**
   * Start demo mode
   */
  const startDemo = useCallback(() => {
    setIsDemoMode(true);
    setDemoStep(0);
    logger.info('Demo mode started');
  }, []);

  /**
   * Stop demo mode
   */
  const stopDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoStep(0);
    logger.info('Demo mode stopped');
  }, []);

  /**
   * Next demo step
   */
  const nextDemoStep = useCallback(() => {
    setDemoStep(prev => prev + 1);
  }, []);

  /**
   * Previous demo step
   */
  const prevDemoStep = useCallback(() => {
    setDemoStep(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Get current performance metrics
   */
  const getCurrentMetrics = useCallback(() => {
    return performanceMonitorService.getCurrentMetrics();
  }, []);

  /**
   * Get security grade
   */
  const getSecurityGrade = useCallback(() => {
    return securityAnalyzerService.getGrade();
  }, []);

  const value = {
    // State
    isRunning,
    isPaused,
    currentScenario,
    progress,
    scenarios,
    scenarioResults,
    performanceMetrics,
    securityMetrics,
    isDemoMode,
    demoStep,

    // Actions
    startEvaluation,
    runScenario,
    pauseEvaluation,
    resumeEvaluation,
    stopEvaluation,
    resetEvaluation,
    getResults,
    exportResults,
    startDemo,
    stopDemo,
    nextDemoStep,
    prevDemoStep,
    getCurrentMetrics,
    getSecurityGrade,

    // Computed
    totalScenarios: Object.keys(scenarios).length,
    completedScenarios: scenarioResults.length,
    isComplete: scenarioResults.length === Object.keys(scenarios).length && !isRunning,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export default EvaluationContext;
