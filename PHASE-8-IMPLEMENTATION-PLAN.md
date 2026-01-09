# Phase 8 — Evaluation Harness and Demo Script

## Overview

Phase 8 implements an automated evaluation system to test and demonstrate the CBV System's capabilities across various security scenarios. This phase includes scenario automation, performance benchmarking, security analysis, and demo preparation.

**Status**: 🚧 **IN PROGRESS**  
**Estimated Time**: 6-8 hours  
**Priority**: High (Final Phase)

---

## Objectives

### Primary Goals
1. ✅ Automated scenario testing
2. ✅ Performance benchmarking
3. ✅ Security analysis and metrics
4. ✅ Demo script automation
5. ✅ Comprehensive reporting

### Success Criteria
- [ ] All 5 evaluation scenarios automated
- [ ] Performance metrics collected and analyzed
- [ ] Security metrics calculated
- [ ] Demo mode with automated scenarios
- [ ] Comprehensive evaluation report generated

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   EVALUATION HARNESS                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Scenario    │  │ Performance  │  │  Security    │    │
│  │   Runner     │  │  Monitor     │  │  Analyzer    │    │
│  │              │  │              │  │              │    │
│  │ • Legitimate │  │ • CPU Usage  │  │ • False +/-  │    │
│  │ • Shoulder   │  │ • Memory     │  │ • Response   │    │
│  │ • Handover   │  │ • FPS        │  │   Time       │    │
│  │ • Camera Off │  │ • Latency    │  │ • Accuracy   │    │
│  │ • Recovery   │  │ • Network    │  │ • Coverage   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                           ↓                                 │
│                  ┌──────────────┐                          │
│                  │   Reporter   │                          │
│                  │              │                          │
│                  │ • Metrics    │                          │
│                  │ • Charts     │                          │
│                  │ • Export     │                          │
│                  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Components to Implement

### 1. Scenario Runner Service
**File**: `app/src/services/evaluation/scenario-runner.service.js`

**Features**:
- Automated scenario execution
- State simulation (camera off, face change, etc.)
- Timeline control
- Event injection
- Progress tracking

**Scenarios**:
1. **Legitimate Use** (60s)
   - Owner uses app normally
   - Expected: NORMAL state maintained
   - Trust score: > 0.7

2. **Shoulder Surfing** (30s)
   - Owner looks away from camera
   - Expected: WATCH state triggered
   - Trust score: 0.5-0.7

3. **Handover Attack** (30s)
   - Different person takes over
   - Expected: REAUTH state triggered
   - Trust score: < 0.3

4. **Camera Blocked** (20s)
   - Camera is covered/disabled
   - Expected: RESTRICT state triggered
   - Trust score: 0.3-0.5

5. **Recovery** (30s)
   - Owner returns after handover
   - Expected: Return to NORMAL
   - Trust score: > 0.7

### 2. Performance Monitor Service
**File**: `app/src/services/evaluation/performance-monitor.service.js`

**Metrics**:
- CPU usage (%)
- Memory usage (MB)
- FPS (frames per second)
- Inference time (ms)
- Network requests
- Storage usage
- Battery impact (if available)

**Features**:
- Real-time monitoring
- Historical data collection
- Statistical analysis
- Threshold alerts
- Export to CSV/JSON

### 3. Security Analyzer Service
**File**: `app/src/services/evaluation/security-analyzer.service.js`

**Metrics**:
- False positive rate
- False negative rate
- True positive rate
- True negative rate
- Response time to threats
- Recovery time
- Accuracy score

**Analysis**:
- Confusion matrix
- ROC curve data
- Precision/Recall
- F1 score
- Attack detection rate

### 4. Evaluation Context
**File**: `app/src/context/EvaluationContext.jsx`

**State Management**:
- Current scenario
- Running status
- Collected metrics
- Analysis results
- Demo mode

**API**:
```javascript
const {
  isRunning,
  currentScenario,
  scenarios,
  metrics,
  results,
  startEvaluation,
  stopEvaluation,
  runScenario,
  exportResults,
  resetEvaluation,
} = useEvaluation();
```

### 5. Evaluation Page
**File**: `app/src/pages/EvaluationPage.jsx`

**Sections**:
1. **Scenario Control**
   - Scenario selection
   - Start/Stop buttons
   - Progress indicator
   - Timeline visualization

2. **Live Metrics**
   - Real-time performance graphs
   - Trust score chart
   - State transitions
   - Event log

3. **Results Dashboard**
   - Summary statistics
   - Performance charts
   - Security metrics
   - Comparison tables

4. **Export Options**
   - PDF report
   - CSV data
   - JSON export
   - Screenshots

### 6. Demo Mode Component
**File**: `app/src/components/evaluation/DemoMode.jsx`

**Features**:
- Automated demo playback
- Narration text
- Highlighted features
- Smooth transitions
- Pause/Resume controls

**Demo Script**:
1. Introduction (10s)
2. Registration flow (30s)
3. Capture session (60s)
4. Verification demo (90s)
5. Attack scenarios (120s)
6. Recovery demo (30s)
7. Conclusion (10s)

### 7. Metrics Visualizer Component
**File**: `app/src/components/evaluation/MetricsVisualizer.jsx`

**Charts**:
- Trust score timeline
- State transition diagram
- Performance graphs
- Security metrics
- Comparison charts

**Libraries**:
- Chart.js or Recharts
- D3.js for advanced visualizations

### 8. Report Generator Service
**File**: `app/src/services/evaluation/report-generator.service.js`

**Features**:
- PDF generation
- HTML report
- Markdown export
- Charts and tables
- Executive summary

**Report Sections**:
1. Executive Summary
2. Test Configuration
3. Scenario Results
4. Performance Analysis
5. Security Analysis
6. Recommendations
7. Appendices

---

## Implementation Steps

### Step 1: Scenario Runner (2 hours)
```javascript
// app/src/services/evaluation/scenario-runner.service.js

class ScenarioRunner {
  constructor() {
    this.scenarios = CONFIG.SCENARIOS;
    this.currentScenario = null;
    this.isRunning = false;
    this.startTime = null;
    this.events = [];
  }

  async runScenario(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    this.currentScenario = scenario;
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Execute scenario timeline
    await this.executeTimeline(scenario);
    
    this.isRunning = false;
    return this.collectResults();
  }

  async executeTimeline(scenario) {
    // Simulate events based on scenario
    // e.g., camera off, face change, behavior anomaly
  }

  collectResults() {
    return {
      scenario: this.currentScenario.name,
      duration: Date.now() - this.startTime,
      events: this.events,
      finalState: this.getFinalState(),
      trustScore: this.getFinalTrustScore(),
    };
  }
}
```

### Step 2: Performance Monitor (1.5 hours)
```javascript
// app/src/services/evaluation/performance-monitor.service.js

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      fps: [],
      inferenceTime: [],
    };
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, 1000); // Collect every second
  }

  collectMetrics() {
    // Collect performance data
    const memory = performance.memory;
    const fps = this.calculateFPS();
    
    this.metrics.memory.push({
      timestamp: Date.now(),
      used: memory.usedJSHeapSize / 1048576, // MB
      total: memory.totalJSHeapSize / 1048576,
    });
    
    this.metrics.fps.push({
      timestamp: Date.now(),
      value: fps,
    });
  }

  getStatistics() {
    return {
      memory: this.calculateStats(this.metrics.memory),
      fps: this.calculateStats(this.metrics.fps),
      inferenceTime: this.calculateStats(this.metrics.inferenceTime),
    };
  }
}
```

### Step 3: Security Analyzer (1.5 hours)
```javascript
// app/src/services/evaluation/security-analyzer.service.js

class SecurityAnalyzer {
  constructor() {
    this.results = {
      truePositives: 0,
      trueNegatives: 0,
      falsePositives: 0,
      falseNegatives: 0,
    };
  }

  analyzeScenario(scenario, actualState, expectedState) {
    if (actualState === expectedState) {
      if (expectedState === 'NORMAL') {
        this.results.trueNegatives++;
      } else {
        this.results.truePositives++;
      }
    } else {
      if (expectedState === 'NORMAL') {
        this.results.falsePositives++;
      } else {
        this.results.falseNegatives++;
      }
    }
  }

  calculateMetrics() {
    const { truePositives, trueNegatives, falsePositives, falseNegatives } = this.results;
    const total = truePositives + trueNegatives + falsePositives + falseNegatives;
    
    return {
      accuracy: (truePositives + trueNegatives) / total,
      precision: truePositives / (truePositives + falsePositives),
      recall: truePositives / (truePositives + falseNegatives),
      f1Score: 2 * (precision * recall) / (precision + recall),
      falsePositiveRate: falsePositives / (falsePositives + trueNegatives),
      falseNegativeRate: falseNegatives / (falseNegatives + truePositives),
    };
  }
}
```

### Step 4: Evaluation Context (1 hour)
```javascript
// app/src/context/EvaluationContext.jsx

export const EvaluationProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [results, setResults] = useState([]);

  const startEvaluation = async () => {
    setIsRunning(true);
    // Start all scenarios
    for (const scenario of Object.keys(CONFIG.SCENARIOS)) {
      await runScenario(scenario);
    }
    setIsRunning(false);
  };

  const runScenario = async (scenarioName) => {
    setCurrentScenario(scenarioName);
    const result = await scenarioRunner.runScenario(scenarioName);
    setResults(prev => [...prev, result]);
  };

  return (
    <EvaluationContext.Provider value={{
      isRunning,
      currentScenario,
      metrics,
      results,
      startEvaluation,
      runScenario,
    }}>
      {children}
    </EvaluationContext.Provider>
  );
};
```

### Step 5: Evaluation Page (2 hours)
```jsx
// app/src/pages/EvaluationPage.jsx

const EvaluationPage = () => {
  const {
    isRunning,
    currentScenario,
    results,
    startEvaluation,
    exportResults,
  } = useEvaluation();

  return (
    <div className="evaluation-page">
      <header>
        <h1>🧪 CBV System Evaluation</h1>
        <p>Automated testing and performance analysis</p>
      </header>

      {/* Scenario Control */}
      <section className="scenario-control">
        <h2>Evaluation Control</h2>
        <Button onClick={startEvaluation} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Start Full Evaluation'}
        </Button>
        {isRunning && (
          <div className="progress">
            <span>Running: {currentScenario}</span>
            <ProgressBar />
          </div>
        )}
      </section>

      {/* Live Metrics */}
      <section className="live-metrics">
        <h2>Live Metrics</h2>
        <MetricsVisualizer />
      </section>

      {/* Results Dashboard */}
      <section className="results-dashboard">
        <h2>Results</h2>
        <ResultsTable results={results} />
        <Button onClick={exportResults}>Export Report</Button>
      </section>
    </div>
  );
};
```

---

## Testing Scenarios

### Scenario 1: Legitimate Use
**Duration**: 60 seconds  
**Description**: Owner uses app normally  
**Expected State**: NORMAL  
**Expected Trust**: > 0.7

**Timeline**:
- 0-60s: Normal face detection
- 0-60s: Normal behavior patterns
- 0-60s: Regular blinks and micro-movements

**Success Criteria**:
- Trust score remains > 0.7
- State stays NORMAL
- No false alarms

### Scenario 2: Shoulder Surfing
**Duration**: 30 seconds  
**Description**: Owner looks away  
**Expected State**: WATCH  
**Expected Trust**: 0.5-0.7

**Timeline**:
- 0-10s: Normal operation
- 10-25s: Face absent/looking away
- 25-30s: Face returns

**Success Criteria**:
- Trust drops to WATCH range
- Warning banner appears
- Recovers when face returns

### Scenario 3: Handover Attack
**Duration**: 30 seconds  
**Description**: Different person takes over  
**Expected State**: REAUTH  
**Expected Trust**: < 0.3

**Timeline**:
- 0-10s: Owner using app
- 10-30s: Different face detected

**Success Criteria**:
- Trust drops below 0.3
- REAUTH state triggered
- Re-auth modal opens
- Access blocked

### Scenario 4: Camera Blocked
**Duration**: 20 seconds  
**Description**: Camera covered  
**Expected State**: RESTRICT  
**Expected Trust**: 0.3-0.5

**Timeline**:
- 0-5s: Normal operation
- 5-15s: Camera blocked
- 15-20s: Camera unblocked

**Success Criteria**:
- Trust drops to RESTRICT range
- Blur overlay increases
- Forms blocked
- Recovers when camera unblocked

### Scenario 5: Recovery
**Duration**: 30 seconds  
**Description**: Owner returns after handover  
**Expected State**: NORMAL  
**Expected Trust**: > 0.7

**Timeline**:
- 0-10s: REAUTH state (from handover)
- 10-15s: Re-authentication
- 15-30s: Normal operation

**Success Criteria**:
- Re-auth successful
- Trust resets to 0.7+
- Returns to NORMAL state
- 60s monitoring period active

---

## Performance Benchmarks

### Target Metrics
| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| CPU Usage | < 10% | < 20% | > 20% |
| Memory | < 100 MB | < 200 MB | > 200 MB |
| FPS | > 25 | > 15 | < 15 |
| Inference Time | < 50ms | < 100ms | > 100ms |
| Response Time | < 2s | < 5s | > 5s |
| Battery Impact | < 5% | < 10% | > 10% |

### Measurement Points
1. **Idle State**: No verification running
2. **Active Verification**: Normal operation
3. **High Load**: All modalities active
4. **Enforcement**: Blur + blocking active
5. **Re-Authentication**: Modal open

---

## Security Metrics

### Detection Rates
- **True Positive Rate**: > 95% (attacks detected)
- **True Negative Rate**: > 95% (legitimate use allowed)
- **False Positive Rate**: < 5% (false alarms)
- **False Negative Rate**: < 5% (missed attacks)

### Response Times
- **Attack Detection**: < 2 seconds
- **State Transition**: < 1 second
- **Enforcement Activation**: < 500ms
- **Re-Auth Prompt**: < 1 second

### Coverage
- **Face Recognition**: 100% of time
- **Liveness Detection**: 100% of time
- **Behavior Analysis**: 100% of time
- **Trust Score Updates**: Every 500ms

---

## Demo Script

### Full Demo (5 minutes)

**Act 1: Introduction (30s)**
- Show login screen
- Explain CBV concept
- Highlight key features

**Act 2: Registration (45s)**
- Demonstrate enrollment flow
- Show face capture (50 samples)
- Show liveness detection (30s)
- Show behavior capture (optional)

**Act 3: Normal Operation (60s)**
- Login to protected app
- Show verification active
- Display trust score (NORMAL)
- Demonstrate app features

**Act 4: Attack Scenarios (90s)**
- **Shoulder Surfing** (30s)
  - Look away from camera
  - Show WATCH state
  - Show warning banner
  
- **Handover Attack** (30s)
  - Different person appears
  - Show REAUTH state
  - Show blur overlay
  - Show re-auth modal
  
- **Camera Blocked** (30s)
  - Cover camera
  - Show RESTRICT state
  - Show form blocking

**Act 5: Recovery (30s)**
- Complete re-authentication
- Show trust score reset
- Return to normal operation
- Show recovery monitoring

**Act 6: Conclusion (15s)**
- Summary of features
- Performance metrics
- Security benefits

---

## Deliverables

### Code Deliverables
1. ✅ Scenario Runner Service
2. ✅ Performance Monitor Service
3. ✅ Security Analyzer Service
4. ✅ Evaluation Context
5. ✅ Evaluation Page
6. ✅ Demo Mode Component
7. ✅ Metrics Visualizer
8. ✅ Report Generator

### Documentation Deliverables
1. ✅ Phase 8 Implementation Plan (this file)
2. ✅ Evaluation Guide
3. ✅ Demo Script
4. ✅ Performance Report
5. ✅ Security Analysis Report
6. ✅ User Study Materials

### Report Deliverables
1. ✅ Executive Summary
2. ✅ Technical Report
3. ✅ Performance Benchmarks
4. ✅ Security Analysis
5. ✅ Recommendations
6. ✅ Future Work

---

## Timeline

### Day 1 (4 hours)
- ✅ Scenario Runner Service (2h)
- ✅ Performance Monitor Service (1.5h)
- ✅ Security Analyzer Service (1.5h)

### Day 2 (4 hours)
- ✅ Evaluation Context (1h)
- ✅ Evaluation Page (2h)
- ✅ Demo Mode Component (1h)

### Day 3 (2 hours)
- ✅ Metrics Visualizer (1h)
- ✅ Report Generator (1h)

### Day 4 (2 hours)
- ✅ Testing and refinement
- ✅ Documentation
- ✅ Final report

**Total: 12 hours** (can be compressed to 6-8 hours)

---

## Success Criteria

### Functional Requirements
- [ ] All 5 scenarios automated
- [ ] Performance metrics collected
- [ ] Security metrics calculated
- [ ] Demo mode functional
- [ ] Reports generated

### Quality Requirements
- [ ] < 10% CPU overhead
- [ ] < 100 MB memory usage
- [ ] > 95% detection accuracy
- [ ] < 2s response time
- [ ] Comprehensive documentation

### User Experience
- [ ] Easy to run evaluation
- [ ] Clear visualizations
- [ ] Exportable results
- [ ] Professional reports
- [ ] Demo mode impressive

---

## Next Steps

1. **Implement Scenario Runner** (Priority: High)
2. **Implement Performance Monitor** (Priority: High)
3. **Implement Security Analyzer** (Priority: High)
4. **Create Evaluation Page** (Priority: Medium)
5. **Add Demo Mode** (Priority: Medium)
6. **Generate Reports** (Priority: Low)

---

## Status

🚧 **Phase 8: IN PROGRESS**

**Ready to implement!**

---

**Document Version**: 1.0  
**Created**: January 8, 2026  
**Status**: Planning Complete, Ready for Implementation  
**Estimated Completion**: 6-8 hours
