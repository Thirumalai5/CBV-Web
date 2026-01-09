/**
 * CBV System - Evaluation Page
 * Automated testing and performance analysis interface
 */

import React, { useState, useEffect } from 'react';
import { useEvaluation } from '@/context/EvaluationContext';
import { useVerification } from '@/context/VerificationContext';
import Button from '@/components/common/Button';
import CONFIG from '@/utils/config';
import './EvaluationPage.css';

const EvaluationPage = () => {
  const {
    isRunning,
    isPaused,
    currentScenario,
    progress,
    scenarios,
    scenarioResults,
    performanceMetrics,
    startEvaluation,
    runScenario,
    pauseEvaluation,
    resumeEvaluation,
    stopEvaluation,
    resetEvaluation,
    exportResults,
    getResults,
    getSecurityGrade,
    totalScenarios,
    completedScenarios,
    isComplete,
  } = useEvaluation();

  const { currentState, trustScore, isVerifying } = useVerification();

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // Update results when evaluation completes
  useEffect(() => {
    if (isComplete) {
      const evalResults = getResults();
      setResults(evalResults);
      setShowResults(true);
    }
  }, [isComplete, getResults]);

  /**
   * Handle run single scenario
   */
  const handleRunScenario = async (scenarioName) => {
    try {
      await runScenario(scenarioName);
    } catch (error) {
      console.error('Failed to run scenario:', error);
    }
  };

  /**
   * Handle export
   */
  const handleExport = (format) => {
    exportResults(format);
  };

  /**
   * Format duration
   */
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get scenario status
   */
  const getScenarioStatus = (scenarioName) => {
    const result = scenarioResults.find(r => r.scenario === scenarioName);
    if (!result) return 'pending';
    return result.success ? 'passed' : 'failed';
  };

  /**
   * Get security grade
   */
  const securityGrade = results ? getSecurityGrade() : null;

  return (
    <div className="evaluation-page">
      {/* Header */}
      <header className="evaluation-header">
        <div className="header-content">
          <h1>🧪 CBV System Evaluation</h1>
          <p className="header-subtitle">
            Automated testing and performance analysis for continuous behavioral verification
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Scenarios</span>
            <span className="stat-value">{completedScenarios}/{totalScenarios}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className={`stat-value status-${isRunning ? 'running' : 'idle'}`}>
              {isRunning ? 'Running' : isComplete ? 'Complete' : 'Idle'}
            </span>
          </div>
          {securityGrade && (
            <div className="stat-item">
              <span className="stat-label">Grade</span>
              <span className="stat-value" style={{ color: securityGrade.color }}>
                {securityGrade.grade}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Control Panel */}
      <section className="control-panel">
        <div className="panel-header">
          <h2>Evaluation Control</h2>
          <div className="control-actions">
            {!isRunning ? (
              <>
                <Button
                  variant="primary"
                  size="large"
                  onClick={startEvaluation}
                  disabled={isRunning}
                >
                  🚀 Start Full Evaluation
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetEvaluation}
                  disabled={isRunning || scenarioResults.length === 0}
                >
                  🔄 Reset
                </Button>
              </>
            ) : (
              <>
                {!isPaused ? (
                  <Button variant="warning" onClick={pauseEvaluation}>
                    ⏸️ Pause
                  </Button>
                ) : (
                  <Button variant="primary" onClick={resumeEvaluation}>
                    ▶️ Resume
                  </Button>
                )}
                <Button variant="danger" onClick={stopEvaluation}>
                  ⏹️ Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">
                Running: {currentScenario || 'Initializing...'}
              </span>
              <span className="progress-percentage">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Scenarios Grid */}
      <section className="scenarios-section">
        <h2>Test Scenarios</h2>
        <div className="scenarios-grid">
          {Object.entries(scenarios).map(([key, scenario]) => {
            const status = getScenarioStatus(scenario.name);
            const result = scenarioResults.find(r => r.scenario === scenario.name);

            return (
              <div
                key={key}
                className={`scenario-card status-${status}`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="scenario-header">
                  <h3>{scenario.name}</h3>
                  <span className={`scenario-status status-${status}`}>
                    {status === 'passed' && '✅'}
                    {status === 'failed' && '❌'}
                    {status === 'pending' && '⏳'}
                  </span>
                </div>
                <p className="scenario-description">{scenario.description}</p>
                <div className="scenario-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{scenario.duration}s</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expected:</span>
                    <span className="detail-value">{scenario.expectedState}</span>
                  </div>
                  {result && (
                    <div className="detail-item">
                      <span className="detail-label">Actual:</span>
                      <span className="detail-value">{result.finalState}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunScenario(scenario.name);
                  }}
                  disabled={isRunning}
                >
                  Run Scenario
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Metrics */}
      {isRunning && (
        <section className="metrics-section">
          <h2>Live Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💾</div>
              <div className="metric-content">
                <div className="metric-label">Memory Usage</div>
                <div className="metric-value">
                  {performanceMetrics.memory
                    ? `${performanceMetrics.memory.usedJSHeapSize.toFixed(1)} MB`
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎬</div>
              <div className="metric-content">
                <div className="metric-label">FPS</div>
                <div className="metric-value">
                  {performanceMetrics.fps ? performanceMetrics.fps.value : 'N/A'}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <div className="metric-label">Inference Time</div>
                <div className="metric-value">
                  {performanceMetrics.inferenceTime
                    ? `${performanceMetrics.inferenceTime.value.toFixed(0)}ms`
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-label">Trust Score</div>
                <div className="metric-value">
                  {(trustScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Dashboard */}
      {showResults && results && (
        <section className="results-section">
          <div className="results-header">
            <h2>Evaluation Results</h2>
            <div className="export-buttons">
              <Button
                variant="outline"
                size="small"
                onClick={() => handleExport('json')}
              >
                📄 Export JSON
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleExport('csv')}
              >
                📊 Export CSV
              </Button>
            </div>
          </div>

          {/* Security Metrics */}
          <div className="results-grid">
            <div className="result-card">
              <h3>Security Analysis</h3>
              <div className="security-summary">
                <div className="grade-display">
                  <div className="grade-label">Overall Grade</div>
                  <div
                    className="grade-value"
                    style={{ color: securityGrade?.color }}
                  >
                    {securityGrade?.grade}
                  </div>
                </div>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span>Accuracy:</span>
                    <span>{results.security.summary.accuracy}</span>
                  </div>
                  <div className="metric-row">
                    <span>Precision:</span>
                    <span>{results.security.summary.precision}</span>
                  </div>
                  <div className="metric-row">
                    <span>Recall:</span>
                    <span>{results.security.summary.recall}</span>
                  </div>
                  <div className="metric-row">
                    <span>F1 Score:</span>
                    <span>{results.security.summary.f1Score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="result-card">
              <h3>Confusion Matrix</h3>
              <div className="confusion-matrix">
                <div className="matrix-row">
                  <div className="matrix-cell header"></div>
                  <div className="matrix-cell header">Predicted Positive</div>
                  <div className="matrix-cell header">Predicted Negative</div>
                </div>
                <div className="matrix-row">
                  <div className="matrix-cell header">Actual Positive</div>
                  <div className="matrix-cell tp">
                    {results.security.confusionMatrix.truePositives}
                  </div>
                  <div className="matrix-cell fn">
                    {results.security.confusionMatrix.falseNegatives}
                  </div>
                </div>
                <div className="matrix-row">
                  <div className="matrix-cell header">Actual Negative</div>
                  <div className="matrix-cell fp">
                    {results.security.confusionMatrix.falsePositives}
                  </div>
                  <div className="matrix-cell tn">
                    {results.security.confusionMatrix.trueNegatives}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="result-card">
              <h3>Performance Summary</h3>
              <div className="performance-summary">
                {results.performance.memory && (
                  <div className="perf-item">
                    <span className="perf-label">Memory (Avg):</span>
                    <span className="perf-value">
                      {results.performance.memory.avg.toFixed(1)} MB
                    </span>
                  </div>
                )}
                {results.performance.fps && (
                  <div className="perf-item">
                    <span className="perf-label">FPS (Avg):</span>
                    <span className="perf-value">
                      {results.performance.fps.avg.toFixed(1)}
                    </span>
                  </div>
                )}
                {results.performance.inferenceTime && (
                  <div className="perf-item">
                    <span className="perf-label">Inference (Avg):</span>
                    <span className="perf-value">
                      {results.performance.inferenceTime.avg.toFixed(0)}ms
                    </span>
                  </div>
                )}
                <div className="perf-item">
                  <span className="perf-label">Total Duration:</span>
                  <span className="perf-value">
                    {formatDuration(results.performance.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="evaluation-footer">
        <p>
          <strong>CBV System Evaluation v{CONFIG.VERSION}</strong>
        </p>
        <p>Automated testing for continuous behavioral verification</p>
      </footer>
    </div>
  );
};

export default EvaluationPage;
