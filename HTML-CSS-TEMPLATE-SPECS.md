# 🔧 HTML/CSS Template Implementation Specifications

**Document Version**: 1.0.0  
**Created**: 2025-08-12  
**Purpose**: Exact HTML structure and CSS implementation from visual wireframe specifications

## 🎯 Implementation Philosophy

### Pixel-Perfect Standards
- **Every measurement** from DASHBOARD-LAYOUT-SPECS.md implemented exactly
- **Every color** from VISUAL-VERIFICATION-WIREFRAMES.md matched precisely  
- **Every responsive breakpoint** behavior defined and tested
- **Every component** built as reusable template with exact styling

### Code Quality Requirements
- **Semantic HTML5** structure for accessibility
- **CSS Grid/Flexbox** for precise layout control
- **CSS Custom Properties** for maintainable theming
- **Progressive Enhancement** for cross-browser compatibility
- **Performance Optimized** with minimal DOM depth

## 📄 Complete HTML Document Template

### Base Document Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Document Generator - Visual Verification Dashboard">
  <title>Document Generator - Verification Dashboard</title>
  
  <!-- Preload critical fonts -->
  <link rel="preload" href="data:," as="font" crossorigin>
  
  <!-- Critical CSS (inline for performance) -->
  <style>
    /* CSS Custom Properties - Exact values from specifications */
    :root {
      /* Colors from VISUAL-VERIFICATION-WIREFRAMES.md */
      --success-green: #10B981;      /* RGB(16, 185, 129) */
      --error-red: #EF4444;          /* RGB(239, 68, 68) */
      --warning-yellow: #F59E0B;     /* RGB(245, 158, 11) */
      --info-blue: #3B82F6;          /* RGB(59, 130, 246) */
      
      --background: #F9FAFB;         /* RGB(249, 250, 251) */
      --card-background: #FFFFFF;    /* RGB(255, 255, 255) */
      --text-primary: #111827;       /* RGB(17, 24, 39) */
      --text-secondary: #6B7280;     /* RGB(107, 114, 128) */
      --border: #E5E7EB;             /* RGB(229, 231, 235) */
      
      /* Typography from specifications */
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      
      /* Layout measurements from DASHBOARD-LAYOUT-SPECS.md */
      --dashboard-max-width: 1200px;
      --dashboard-gap: 30px;
      --dashboard-padding: 20px;
      --card-border-radius: 10px;
      --metric-card-height: 120px;
      --metric-card-gap: 20px;
    }
    
    /* CSS Reset and Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text-primary);
      line-height: 1.6;
      font-size: 16px;
    }
    
    /* Main dashboard grid - exact from DASHBOARD-LAYOUT-SPECS.md */
    .verification-dashboard {
      display: grid;
      grid-template-rows: 64px 200px 300px 400px auto 100px;
      grid-template-columns: 1fr;
      gap: var(--dashboard-gap);
      max-width: var(--dashboard-max-width);
      margin: 0 auto;
      padding: var(--dashboard-padding);
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <!-- Main Dashboard Container -->
  <div class="verification-dashboard">
    <!-- Header Navigation -->
    <header class="header-nav">
      <!-- Header content template -->
    </header>
    
    <!-- Hero Metrics Section -->
    <section class="hero-metrics">
      <!-- Metrics cards template -->
    </section>
    
    <!-- Timeline Section -->
    <section class="timeline-section">
      <!-- Timeline visualization template -->
    </section>
    
    <!-- Test Grid Section -->
    <section class="test-grid-section">
      <!-- Test results table template -->
    </section>
    
    <!-- Additional Content -->
    <section class="additional-content">
      <!-- QR codes, bitmap visualization, etc. -->
    </section>
    
    <!-- Footer -->
    <footer class="footer-section">
      <!-- Footer content template -->
    </footer>
  </div>
  
  <!-- JavaScript for interactivity -->
  <script src="verification-dashboard.js"></script>
</body>
</html>
```

## 🧭 Header Navigation Template

### HTML Structure
```html
<header class="header-nav" role="banner">
  <nav class="nav-container" aria-label="Main navigation">
    <div class="nav-left">
      <a href="#" class="nav-logo" aria-label="Document Generator Home">
        <span class="logo-icon">📊</span>
        <span class="logo-text">Verification</span>
      </a>
      
      <ul class="nav-menu" role="menubar">
        <li role="none">
          <a href="#" class="nav-button nav-button-essential active" role="menuitem" aria-current="page">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard</span>
          </a>
        </li>
        <li role="none">
          <a href="#tests" class="nav-button" role="menuitem">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Tests</span>
          </a>
        </li>
        <li role="none">
          <a href="#qr-codes" class="nav-button" role="menuitem">
            <span class="nav-icon">🔐</span>
            <span class="nav-text">QR Codes</span>
          </a>
        </li>
        <li role="none">
          <a href="#logs" class="nav-button" role="menuitem">
            <span class="nav-icon">📋</span>
            <span class="nav-text">Logs</span>
          </a>
        </li>
        <li role="none">
          <a href="#settings" class="nav-button" role="menuitem">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Settings</span>
          </a>
        </li>
      </ul>
    </div>
    
    <div class="nav-right">
      <div class="nav-search-container">
        <input type="search" class="nav-search" placeholder="Search tests..." aria-label="Search verification tests">
        <span class="search-icon">🔍</span>
      </div>
      
      <button class="nav-profile" aria-label="User profile menu">
        <span class="profile-avatar">👤</span>
      </button>
    </div>
  </nav>
</header>
```

### CSS Implementation
```css
/* Header Navigation - exact measurements from DASHBOARD-LAYOUT-SPECS.md */
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: var(--card-border-radius);
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  grid-row: 1;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 18px;
}

.logo-icon {
  font-size: 24px;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
}

.nav-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-button:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
  color: var(--text-primary);
}

.nav-button:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

.nav-button.active {
  background: #EFF6FF;
  border-color: var(--info-blue);
  color: #1D4ED8;
}

.nav-icon {
  font-size: 16px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-search-container {
  position: relative;
}

.nav-search {
  width: 240px;
  height: 36px;
  padding: 0 12px 0 40px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--font-family);
  background: var(--card-background);
}

.nav-search:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: -1px;
  border-color: var(--info-blue);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--text-secondary);
  pointer-events: none;
}

.nav-profile {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--info-blue);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-profile:hover {
  background: #2563EB;
}

.nav-profile:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

/* Responsive navigation - exact breakpoints from specifications */
@media (max-width: 767px) {
  .header-nav {
    padding: 0 15px;
    height: 56px;
  }
  
  .nav-left {
    gap: 10px;
  }
  
  .nav-search {
    width: 120px;
  }
  
  .nav-button:not(.nav-button-essential) {
    display: none;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-button {
    padding: 8px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .nav-search {
    width: 180px;
  }
}
```

## 📊 Hero Metrics Section Template

### HTML Structure
```html
<section class="hero-metrics" role="region" aria-labelledby="metrics-heading">
  <h2 id="metrics-heading" class="sr-only">System Verification Metrics</h2>
  
  <!-- System Health Metric -->
  <div class="metric-card system-health" role="img" aria-label="System Health: 75%, up 50%">
    <div class="metric-content">
      <div class="metric-value" data-testid="system-health-value">75%</div>
      <div class="metric-label">System Health</div>
      <div class="metric-delta positive" aria-label="Improvement: up 50%">
        <span class="delta-icon">▲</span>
        <span class="delta-text">+50%</span>
      </div>
    </div>
    <div class="metric-accent"></div>
  </div>
  
  <!-- Tests Passed Metric -->
  <div class="metric-card tests-passed" role="img" aria-label="Tests Passed: 9 of 12, up 6">
    <div class="metric-content">
      <div class="metric-value" data-testid="tests-passed-value">9/12</div>
      <div class="metric-label">Tests Passed</div>
      <div class="metric-delta positive" aria-label="Improvement: up 6 tests">
        <span class="delta-icon">▲</span>
        <span class="delta-text">+6</span>
      </div>
    </div>
    <div class="metric-accent"></div>
  </div>
  
  <!-- Reproducibility Metric -->
  <div class="metric-card reproducibility" role="img" aria-label="Reproducibility: 100%, perfect">
    <div class="metric-content">
      <div class="metric-value" data-testid="reproducibility-value">100%</div>
      <div class="metric-label">Reproducibility</div>
      <div class="metric-delta perfect" aria-label="Status: Perfect">
        <span class="delta-icon">✅</span>
        <span class="delta-text">Perfect</span>
      </div>
    </div>
    <div class="metric-accent"></div>
  </div>
  
  <!-- QR Codes Metric -->
  <div class="metric-card qr-codes" role="img" aria-label="QR Codes Generated: 8, secure">
    <div class="metric-content">
      <div class="metric-value" data-testid="qr-codes-value">8</div>
      <div class="metric-label">QR Codes</div>
      <div class="metric-delta secure" aria-label="Status: Secure">
        <span class="delta-icon">🔐</span>
        <span class="delta-text">Secure</span>
      </div>
    </div>
    <div class="metric-accent"></div>
  </div>
</section>
```

### CSS Implementation
```css
/* Hero Metrics - exact measurements from DASHBOARD-LAYOUT-SPECS.md */
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  gap: var(--metric-card-gap);
  height: 200px;
  grid-row: 2;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: var(--card-border-radius);
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  height: var(--metric-card-height);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 1;
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.metric-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 8px;
}

.metric-delta {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-delta.positive {
  background: #D1FAE5;
  color: #065F46;
}

.metric-delta.perfect {
  background: #D1FAE5;
  color: #065F46;
}

.metric-delta.secure {
  background: #FEF3C7;
  color: #92400E;
}

.metric-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-color);
}

/* Metric card variants with exact border colors from specifications */
.metric-card.system-health {
  --accent-color: var(--success-green);
}

.metric-card.system-health .metric-value {
  color: var(--success-green);
}

.metric-card.tests-passed {
  --accent-color: var(--info-blue);
}

.metric-card.tests-passed .metric-value {
  color: var(--info-blue);
}

.metric-card.reproducibility {
  --accent-color: #8B5CF6;
}

.metric-card.reproducibility .metric-value {
  color: #8B5CF6;
}

.metric-card.qr-codes {
  --accent-color: var(--warning-yellow);
}

.metric-card.qr-codes .metric-value {
  color: var(--warning-yellow);
}

/* Responsive metrics - exact breakpoints from DASHBOARD-LAYOUT-SPECS.md */
@media (min-width: 768px) and (max-width: 1199px) {
  .hero-metrics {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 15px;
    height: 240px;
  }
}

@media (max-width: 767px) {
  .hero-metrics {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
    height: 400px;
  }
}
```

## 📈 Timeline Section Template

### HTML Structure
```html
<section class="timeline-section" role="region" aria-labelledby="timeline-heading">
  <div class="timeline-header">
    <h2 id="timeline-heading" class="timeline-title">System Improvement Timeline</h2>
    <div class="timeline-controls">
      <button class="timeline-control active" data-phase="all">All Phases</button>
      <button class="timeline-control" data-phase="1">Phase 1</button>
      <button class="timeline-control" data-phase="2">Phase 2</button>
      <button class="timeline-control" data-phase="3">Phase 3</button>
    </div>
  </div>
  
  <div class="timeline-content">
    <!-- Phase 1: Baseline -->
    <div class="timeline-phase" data-phase="1">
      <div class="phase-label">
        <div class="phase-name">Phase 1: Baseline Analysis</div>
        <div class="phase-description">Initial system assessment</div>
      </div>
      <div class="phase-progress">
        <div class="phase-progress-bar phase-1" 
             role="progressbar" 
             aria-valuenow="25" 
             aria-valuemin="0" 
             aria-valuemax="100"
             aria-label="Phase 1 completion: 25%">
        </div>
      </div>
      <div class="phase-metric baseline">25% Health</div>
    </div>
    
    <!-- Phase 2: Fixes -->
    <div class="timeline-phase" data-phase="2">
      <div class="phase-label">
        <div class="phase-name">Phase 2: Fixes Applied</div>
        <div class="phase-description">Critical issues resolved</div>
      </div>
      <div class="phase-progress">
        <div class="phase-progress-bar phase-2" 
             role="progressbar" 
             aria-valuenow="75" 
             aria-valuemin="0" 
             aria-valuemax="100"
             aria-label="Phase 2 completion: 75%">
        </div>
      </div>
      <div class="phase-metric improvement">75% Health</div>
    </div>
    
    <!-- Phase 3: Verification -->
    <div class="timeline-phase" data-phase="3">
      <div class="phase-label">
        <div class="phase-name">Phase 3: QR Generation</div>
        <div class="phase-description">Verification system deployed</div>
      </div>
      <div class="phase-progress">
        <div class="phase-progress-bar phase-3" 
             role="progressbar" 
             aria-valuenow="100" 
             aria-valuemin="0" 
             aria-valuemax="100"
             aria-label="Phase 3 completion: 100%">
        </div>
      </div>
      <div class="phase-metric success">100% Reproducible</div>
    </div>
  </div>
</section>
```

### CSS Implementation
```css
/* Timeline Section - exact measurements from DASHBOARD-LAYOUT-SPECS.md */
.timeline-section {
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: var(--card-border-radius);
  padding: 24px;
  height: 300px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  grid-row: 3;
  display: flex;
  flex-direction: column;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.timeline-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.timeline-controls {
  display: flex;
  gap: 8px;
}

.timeline-control {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: var(--card-background);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family);
}

.timeline-control:hover {
  background: #F9FAFB;
}

.timeline-control:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

.timeline-control.active {
  background: #EFF6FF;
  border-color: var(--info-blue);
  color: #1D4ED8;
}

.timeline-content {
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.timeline-phase {
  display: flex;
  align-items: center;
  height: 60px;
  position: relative;
}

.phase-label {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.phase-description {
  font-size: 12px;
  color: var(--text-secondary);
}

.phase-progress {
  flex: 1;
  height: 24px;
  background: #F3F4F6;
  border-radius: 12px;
  margin: 0 16px;
  position: relative;
  overflow: hidden;
}

.phase-progress-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 0.8s ease-in-out;
  position: relative;
  background: linear-gradient(90deg, var(--start-color) 0%, var(--end-color) 100%);
}

/* Phase-specific colors and animations from DASHBOARD-LAYOUT-SPECS.md */
.phase-progress-bar.phase-1 {
  --start-color: var(--error-red);
  --end-color: var(--warning-yellow);
  width: 25%;
}

.phase-progress-bar.phase-2 {
  --start-color: var(--warning-yellow);
  --end-color: var(--success-green);
  width: 75%;
}

.phase-progress-bar.phase-3 {
  --start-color: var(--success-green);
  --end-color: #059669;
  width: 100%;
}

.phase-metric {
  min-width: 120px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
}

.phase-metric.improvement {
  color: var(--success-green);
}

.phase-metric.baseline {
  color: var(--text-secondary);
}

.phase-metric.success {
  color: var(--success-green);
}

/* Responsive timeline adjustments */
@media (max-width: 767px) {
  .timeline-section {
    padding: 16px;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .timeline-phase {
    flex-direction: column;
    height: auto;
    gap: 8px;
    padding: 12px 0;
  }
  
  .phase-label {
    min-width: auto;
    text-align: center;
  }
  
  .phase-progress {
    width: 100%;
    margin: 0;
  }
  
  .phase-metric {
    text-align: center;
    min-width: auto;
  }
}
```

## 🔍 Test Grid Section Template

### HTML Structure
```html
<section class="test-grid-section" role="region" aria-labelledby="test-grid-heading">
  <div class="test-grid-header">
    <h2 id="test-grid-heading" class="test-grid-title">Test Results Overview</h2>
    <div class="test-grid-filters">
      <button class="filter-button active" data-filter="all">All Tests</button>
      <button class="filter-button" data-filter="passed">Passed</button>
      <button class="filter-button" data-filter="failed">Failed</button>
      <button class="filter-button" data-filter="critical">Critical</button>
    </div>
  </div>
  
  <div class="test-grid-table" role="region" aria-label="Test results table">
    <table class="test-table" role="table">
      <thead>
        <tr>
          <th class="sortable" data-sort="name" role="columnheader" tabindex="0">
            Test Name
          </th>
          <th class="sortable" data-sort="status" role="columnheader" tabindex="0">
            Status
          </th>
          <th class="sortable column-duration" data-sort="duration" role="columnheader" tabindex="0">
            Duration
          </th>
          <th class="sortable column-last-run" data-sort="lastRun" role="columnheader" tabindex="0">
            Last Run
          </th>
          <th role="columnheader">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr data-test-status="passed">
          <td>
            <span class="test-name">Document Processing Flow</span>
          </td>
          <td>
            <span class="test-status passed" aria-label="Test passed">
              PASSED
            </span>
          </td>
          <td class="column-duration">245ms</td>
          <td class="column-last-run">2 minutes ago</td>
          <td>
            <div class="test-actions">
              <a href="#" class="action-button" aria-label="View Document Processing Flow test details">View</a>
              <button class="action-button" aria-label="Rerun Document Processing Flow test">Rerun</button>
            </div>
          </td>
        </tr>
        
        <tr data-test-status="passed">
          <td>
            <span class="test-name">AI Service Fallback Chain</span>
          </td>
          <td>
            <span class="test-status passed" aria-label="Test passed">
              PASSED
            </span>
          </td>
          <td class="column-duration">189ms</td>
          <td class="column-last-run">2 minutes ago</td>
          <td>
            <div class="test-actions">
              <a href="#" class="action-button" aria-label="View AI Service test details">View</a>
              <button class="action-button" aria-label="Rerun AI Service test">Rerun</button>
            </div>
          </td>
        </tr>
        
        <tr data-test-status="failed">
          <td>
            <span class="test-name">System Bus Service</span>
          </td>
          <td>
            <span class="test-status failed" aria-label="Test failed">
              FAILED
            </span>
          </td>
          <td class="column-duration">—</td>
          <td class="column-last-run">2 minutes ago</td>
          <td>
            <div class="test-actions">
              <a href="#" class="action-button danger" aria-label="Debug System Bus Service test">Debug</a>
              <button class="action-button" aria-label="Rerun System Bus Service test">Rerun</button>
            </div>
          </td>
        </tr>
        
        <!-- Additional test rows would be generated dynamically -->
      </tbody>
    </table>
  </div>
</section>
```

### CSS Implementation
```css
/* Test Grid Section - exact measurements from DASHBOARD-LAYOUT-SPECS.md */
.test-grid-section {
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: var(--card-border-radius);
  padding: 24px;
  height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  grid-row: 4;
}

.test-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.test-grid-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.test-grid-filters {
  display: flex;
  gap: 8px;
}

.filter-button {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: var(--card-background);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family);
}

.filter-button:hover {
  background: #F9FAFB;
}

.filter-button:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

.filter-button.active {
  background: #EFF6FF;
  border-color: var(--info-blue);
  color: #1D4ED8;
}

.test-grid-table {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.test-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.test-table thead {
  background: #F9FAFB;
  position: sticky;
  top: 0;
  z-index: 1;
}

.test-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  position: relative;
}

.test-table th:hover {
  background: #F3F4F6;
}

.test-table th:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: -2px;
}

.test-table th.sortable::after {
  content: '↕';
  position: absolute;
  right: 8px;
  color: #9CA3AF;
  font-size: 12px;
}

.test-table th.sort-asc::after {
  content: '↑';
  color: var(--info-blue);
}

.test-table th.sort-desc::after {
  content: '↓';
  color: var(--info-blue);
}

.test-table tbody tr {
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.2s ease;
}

.test-table tbody tr:hover {
  background: #F9FAFB;
}

.test-table tbody tr:nth-child(even) {
  background: #FAFAFA;
}

.test-table tbody tr:nth-child(even):hover {
  background: #F3F4F6;
}

.test-table td {
  padding: 12px 16px;
  color: var(--text-secondary);
  vertical-align: middle;
}

.test-name {
  font-weight: 500;
  color: var(--text-primary);
}

/* Test status indicators - exact colors from specifications */
.test-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.test-status.passed {
  background: #D1FAE5;
  color: #065F46;
}

.test-status.passed::before {
  content: '✓';
  font-size: 14px;
}

.test-status.failed {
  background: #FEE2E2;
  color: #991B1B;
}

.test-status.failed::before {
  content: '✗';
  font-size: 14px;
}

.test-status.warning {
  background: #FEF3C7;
  color: #92400E;
}

.test-status.warning::before {
  content: '⚠';
  font-size: 14px;
}

.test-status.running {
  background: #DBEAFE;
  color: #1E40AF;
  animation: pulse 2s infinite;
}

.test-status.running::before {
  content: '⟳';
  font-size: 14px;
  animation: spin 1s linear infinite;
}

.test-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 4px 8px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  background: var(--card-background);
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family);
}

.action-button:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.action-button:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

.action-button.primary {
  background: var(--info-blue);
  border-color: var(--info-blue);
  color: var(--card-background);
}

.action-button.primary:hover {
  background: #2563EB;
}

.action-button.danger {
  background: var(--error-red);
  border-color: var(--error-red);
  color: var(--card-background);
}

.action-button.danger:hover {
  background: #DC2626;
}

/* Responsive table adjustments */
@media (max-width: 767px) {
  .test-grid-section {
    padding: 16px;
  }
  
  .test-table {
    font-size: 12px;
  }
  
  .test-table th,
  .test-table td {
    padding: 8px 12px;
  }
  
  .column-duration,
  .column-last-run {
    display: none;
  }
  
  .test-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-button {
    font-size: 11px;
    padding: 3px 6px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .test-grid-section {
    padding: 20px;
  }
  
  .test-table {
    font-size: 13px;
  }
  
  .test-table th,
  .test-table td {
    padding: 10px 14px;
  }
}
```

## 🎨 Animation Keyframes

### CSS Animations
```css
/* Animation keyframes from DASHBOARD-LAYOUT-SPECS.md */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Component entrance animations with exact delays */
.metric-card {
  animation: fadeIn 0.6s ease-out;
}

.metric-card:nth-child(1) { animation-delay: 0.1s; }
.metric-card:nth-child(2) { animation-delay: 0.2s; }
.metric-card:nth-child(3) { animation-delay: 0.3s; }
.metric-card:nth-child(4) { animation-delay: 0.4s; }

.timeline-phase {
  animation: slideIn 0.8s ease-out;
}

.timeline-phase:nth-child(1) { animation-delay: 0.2s; }
.timeline-phase:nth-child(2) { animation-delay: 0.4s; }
.timeline-phase:nth-child(3) { animation-delay: 0.6s; }

.test-table tbody tr {
  animation: fadeIn 0.4s ease-out;
}
```

## 🔧 Implementation Checklist

### Pre-Implementation Verification
- [ ] **All measurements** match DASHBOARD-LAYOUT-SPECS.md exactly
- [ ] **All colors** match VISUAL-VERIFICATION-WIREFRAMES.md exactly
- [ ] **Typography** follows specification font sizes and weights
- [ ] **Responsive breakpoints** implemented as specified
- [ ] **Accessibility attributes** included (ARIA, roles, labels)

### Testing Requirements
- [ ] **Visual regression testing** with baseline screenshots
- [ ] **Cross-browser compatibility** across Chrome, Firefox, Safari, Edge
- [ ] **Responsive design testing** at all specified breakpoints
- [ ] **Keyboard navigation** working for all interactive elements
- [ ] **Screen reader testing** with proper announcements

---

**This template provides the exact HTML structure and CSS implementation needed to build the verification dashboard according to our pixel-perfect specifications.**