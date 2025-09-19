# 🧩 Visual Component Library Documentation

**Document Version**: 1.0.0  
**Created**: 2025-08-12  
**Purpose**: Comprehensive catalog of reusable UI components for verification dashboard system

## 🎯 Component Library Philosophy

### Design System Principles
- **Consistency**: Every component follows the same visual language
- **Reusability**: Components work across multiple contexts  
- **Accessibility**: WCAG 2.1 AA compliance built into every component
- **Scalability**: Components adapt to different screen sizes and data volumes
- **Testability**: Every component can be visually validated with OCR and computer vision

### Implementation Standards
- **Semantic HTML**: Proper markup for screen readers and SEO
- **CSS Grid/Flexbox**: Modern layout techniques for precise control  
- **CSS Custom Properties**: Maintainable theming system
- **Progressive Enhancement**: Graceful degradation across browsers
- **Performance Optimized**: Minimal CSS and optimal rendering

## 🎨 Color System

### Primary Color Palette
```css
/* Exact values from VISUAL-VERIFICATION-WIREFRAMES.md */
:root {
  /* Status Colors */
  --success-green: #10B981;      /* RGB(16, 185, 129) */
  --error-red: #EF4444;          /* RGB(239, 68, 68) */
  --warning-yellow: #F59E0B;     /* RGB(245, 158, 11) */
  --info-blue: #3B82F6;          /* RGB(59, 130, 246) */
  
  /* Neutral Colors */
  --background: #F9FAFB;         /* RGB(249, 250, 251) */
  --card-background: #FFFFFF;    /* RGB(255, 255, 255) */
  --text-primary: #111827;       /* RGB(17, 24, 39) */
  --text-secondary: #6B7280;     /* RGB(107, 114, 128) */
  --border: #E5E7EB;             /* RGB(229, 231, 235) */
  
  /* Extended Palette */
  --purple: #8B5CF6;             /* RGB(139, 92, 246) */
  --orange: #F97316;             /* RGB(249, 115, 22) */
  --teal: #14B8A6;               /* RGB(20, 184, 166) */
  --pink: #EC4899;               /* RGB(236, 72, 153) */
}
```

### Color Usage Guidelines
```css
/* Success states */
.component-success {
  color: var(--success-green);
  background: #D1FAE5;
}

/* Error states */
.component-error {
  color: var(--error-red);
  background: #FEE2E2;
}

/* Warning states */
.component-warning {
  color: var(--warning-yellow);
  background: #FEF3C7;
}

/* Information states */
.component-info {
  color: var(--info-blue);
  background: #DBEAFE;
}
```

## 📚 Typography System

### Font Specifications
```css
:root {
  /* Font Families */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  
  /* Font Sizes */
  --text-xs: 12px;     /* Small labels, badges */
  --text-sm: 14px;     /* Body text, buttons */
  --text-base: 16px;   /* Default text size */
  --text-lg: 18px;     /* Navigation, larger text */
  --text-xl: 20px;     /* Section headings */
  --text-2xl: 24px;    /* Page headings */
  --text-3xl: 36px;    /* Metric values */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Components
```html
<!-- Heading Hierarchy -->
<h1 class="heading-1">Page Title</h1>
<h2 class="heading-2">Section Title</h2>
<h3 class="heading-3">Subsection Title</h3>

<!-- Text Variants -->
<p class="text-body">Regular body text for content</p>
<p class="text-caption">Caption text for descriptions</p>
<p class="text-label">Label text for form fields</p>
<code class="text-code">Monospace code text</code>

<!-- Text States -->
<p class="text-success">Success message text</p>
<p class="text-error">Error message text</p>
<p class="text-warning">Warning message text</p>
<p class="text-muted">Muted secondary text</p>
```

```css
/* Typography Component Styles */
.heading-1 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin-bottom: 24px;
}

.heading-2 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin-bottom: 16px;
}

.heading-3 {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  margin-bottom: 12px;
}

.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.text-caption {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.text-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: #F3F4F6;
  padding: 2px 4px;
  border-radius: 4px;
}

.text-success {
  color: var(--success-green);
  font-weight: var(--font-medium);
}

.text-error {
  color: var(--error-red);
  font-weight: var(--font-medium);
}

.text-warning {
  color: var(--warning-yellow);
  font-weight: var(--font-medium);
}

.text-muted {
  color: var(--text-secondary);
}
```

## 🔘 Button Components

### Button Variants
```html
<!-- Primary Actions -->
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>

<!-- Status Buttons -->
<button class="btn btn-success">Success Action</button>
<button class="btn btn-danger">Danger Action</button>
<button class="btn btn-warning">Warning Action</button>

<!-- Size Variants -->
<button class="btn btn-primary btn-sm">Small Button</button>
<button class="btn btn-primary">Default Button</button>
<button class="btn btn-primary btn-lg">Large Button</button>

<!-- State Variants -->
<button class="btn btn-primary" disabled>Disabled Button</button>
<button class="btn btn-primary btn-loading">
  <span class="btn-spinner"></span>
  Loading...
</button>

<!-- Icon Buttons -->
<button class="btn btn-primary">
  <span class="btn-icon">📊</span>
  With Icon
</button>

<button class="btn btn-icon-only" aria-label="Settings">
  <span class="btn-icon">⚙️</span>
</button>
```

### Button Styles
```css
/* Base Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-family: var(--font-family);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.btn:focus {
  outline: 2px solid var(--info-blue);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Button Variants */
.btn-primary {
  background: var(--info-blue);
  border-color: var(--info-blue);
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
  border-color: #2563EB;
}

.btn-secondary {
  background: var(--card-background);
  border-color: var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.btn-success {
  background: var(--success-green);
  border-color: var(--success-green);
  color: white;
}

.btn-success:hover {
  background: #059669;
  border-color: #059669;
}

.btn-danger {
  background: var(--error-red);
  border-color: var(--error-red);
  color: white;
}

.btn-danger:hover {
  background: #DC2626;
  border-color: #DC2626;
}

.btn-warning {
  background: var(--warning-yellow);
  border-color: var(--warning-yellow);
  color: white;
}

.btn-warning:hover {
  background: #D97706;
  border-color: #D97706;
}

/* Button Sizes */
.btn-sm {
  padding: 4px 8px;
  font-size: var(--text-xs);
}

.btn-lg {
  padding: 12px 24px;
  font-size: var(--text-base);
}

/* Icon-only Buttons */
.btn-icon-only {
  padding: 8px;
  width: 36px;
  height: 36px;
}

.btn-icon-only.btn-sm {
  padding: 4px;
  width: 28px;
  height: 28px;
}

.btn-icon-only.btn-lg {
  padding: 12px;
  width: 48px;
  height: 48px;
}

/* Loading State */
.btn-loading {
  pointer-events: none;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Icon Styling */
.btn-icon {
  font-size: 16px;
  line-height: 1;
}
```

## 📊 Status Badge Components

### Status Badge Variants
```html
<!-- Test Status Badges -->
<span class="badge badge-passed">PASSED</span>
<span class="badge badge-failed">FAILED</span>
<span class="badge badge-warning">WARNING</span>
<span class="badge badge-running">RUNNING</span>
<span class="badge badge-pending">PENDING</span>

<!-- Metric Status Badges -->
<span class="badge badge-success">SUCCESS</span>
<span class="badge badge-error">ERROR</span>
<span class="badge badge-info">INFO</span>

<!-- Count Badges -->
<span class="badge badge-count">8</span>
<span class="badge badge-count badge-success">12</span>
<span class="badge badge-count badge-error">3</span>

<!-- Delta Badges -->
<span class="badge badge-delta badge-positive">
  <span class="delta-icon">▲</span>
  <span class="delta-text">+50%</span>
</span>

<span class="badge badge-delta badge-negative">
  <span class="delta-icon">▼</span>
  <span class="delta-text">-25%</span>
</span>
```

### Status Badge Styles
```css
/* Base Badge Styles */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
  white-space: nowrap;
}

/* Status Badge Variants */
.badge-passed {
  background: #D1FAE5;
  color: #065F46;
}

.badge-passed::before {
  content: '✓';
  font-size: 14px;
  font-weight: normal;
}

.badge-failed {
  background: #FEE2E2;
  color: #991B1B;
}

.badge-failed::before {
  content: '✗';
  font-size: 14px;
  font-weight: normal;
}

.badge-warning {
  background: #FEF3C7;
  color: #92400E;
}

.badge-warning::before {
  content: '⚠';
  font-size: 14px;
  font-weight: normal;
}

.badge-running {
  background: #DBEAFE;
  color: #1E40AF;
  animation: pulse 2s infinite;
}

.badge-running::before {
  content: '⟳';
  font-size: 14px;
  font-weight: normal;
  animation: spin 1s linear infinite;
}

.badge-pending {
  background: #F3F4F6;
  color: #6B7280;
}

.badge-pending::before {
  content: '⏳';
  font-size: 14px;
  font-weight: normal;
}

.badge-success {
  background: #D1FAE5;
  color: #065F46;
}

.badge-error {
  background: #FEE2E2;
  color: #991B1B;
}

.badge-info {
  background: #DBEAFE;
  color: #1E40AF;
}

/* Count Badge Styles */
.badge-count {
  background: var(--text-secondary);
  color: white;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  justify-content: center;
}

.badge-count.badge-success {
  background: var(--success-green);
}

.badge-count.badge-error {
  background: var(--error-red);
}

/* Delta Badge Styles */
.badge-delta {
  padding: 2px 6px;
  font-size: var(--text-xs);
}

.badge-delta.badge-positive {
  background: #D1FAE5;
  color: #065F46;
}

.badge-delta.badge-negative {
  background: #FEE2E2;
  color: #991B1B;
}

.badge-delta.badge-neutral {
  background: #F3F4F6;
  color: #374151;
}

.delta-icon {
  font-size: 10px;
}

.delta-text {
  font-weight: var(--font-semibold);
}
```

## 📋 Card Components

### Card Variants
```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-content">
    <p>Card content goes here.</p>
  </div>
</div>

<!-- Metric Card -->
<div class="card metric-card">
  <div class="metric-content">
    <div class="metric-value">75%</div>
    <div class="metric-label">System Health</div>
    <div class="metric-delta positive">
      <span class="delta-icon">▲</span>
      <span class="delta-text">+50%</span>
    </div>
  </div>
  <div class="metric-accent" style="--accent-color: var(--success-green);"></div>
</div>

<!-- Action Card -->
<div class="card action-card">
  <div class="card-header">
    <h3 class="card-title">Quick Actions</h3>
    <button class="btn btn-icon-only" aria-label="More options">
      <span class="btn-icon">⋯</span>
    </button>
  </div>
  <div class="card-content">
    <div class="action-grid">
      <button class="action-item">
        <span class="action-icon">🔄</span>
        <span class="action-label">Rerun Tests</span>
      </button>
      <button class="action-item">
        <span class="action-icon">📊</span>
        <span class="action-label">View Logs</span>
      </button>
    </div>
  </div>
</div>

<!-- Status Card -->
<div class="card status-card status-card-success">
  <div class="status-icon">✅</div>
  <div class="status-content">
    <div class="status-title">All Tests Passing</div>
    <div class="status-description">System is healthy and operational</div>
  </div>
</div>
```

### Card Styles
```css
/* Base Card Styles */
.card {
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-content {
  padding: 20px;
}

/* Metric Card Styles */
.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  min-height: 120px;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 1;
}

.metric-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: 1;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.metric-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.metric-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-color, var(--info-blue));
}

/* Action Card Styles */
.action-card .card-content {
  padding: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-item:hover {
  background: #F9FAFB;
  border-color: var(--info-blue);
}

.action-icon {
  font-size: 24px;
}

.action-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-align: center;
}

/* Status Card Styles */
.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.status-icon {
  font-size: 32px;
  line-height: 1;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.status-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Status Card Variants */
.status-card-success {
  background: #F0FDF4;
  border-color: var(--success-green);
}

.status-card-error {
  background: #FEF2F2;
  border-color: var(--error-red);
}

.status-card-warning {
  background: #FFFBEB;
  border-color: var(--warning-yellow);
}
```

## 📊 Progress Components

### Progress Bar Variants
```html
<!-- Basic Progress Bar -->
<div class="progress">
  <div class="progress-bar" style="width: 75%;" role="progressbar" 
       aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  </div>
</div>

<!-- Labeled Progress Bar -->
<div class="progress progress-labeled">
  <div class="progress-label">
    <span class="progress-title">Test Coverage</span>
    <span class="progress-value">75%</span>
  </div>
  <div class="progress-track">
    <div class="progress-bar" style="width: 75%;"></div>
  </div>
</div>

<!-- Status Progress Bars -->
<div class="progress progress-success">
  <div class="progress-bar" style="width: 90%;"></div>
</div>

<div class="progress progress-warning">
  <div class="progress-bar" style="width: 60%;"></div>
</div>

<div class="progress progress-error">
  <div class="progress-bar" style="width: 30%;"></div>
</div>

<!-- Gradient Progress Bar -->
<div class="progress progress-gradient">
  <div class="progress-bar" style="width: 75%;" 
       data-start-color="#EF4444" data-end-color="#10B981">
  </div>
</div>

<!-- Multi-segment Progress -->
<div class="progress progress-multi">
  <div class="progress-segment progress-success" style="width: 45%;"></div>
  <div class="progress-segment progress-warning" style="width: 25%;"></div>
  <div class="progress-segment progress-error" style="width: 15%;"></div>
</div>

<!-- Timeline Progress -->
<div class="timeline-progress">
  <div class="timeline-phase">
    <div class="phase-label">Phase 1: Analysis</div>
    <div class="phase-progress">
      <div class="phase-progress-bar" style="width: 100%;"></div>
    </div>
    <div class="phase-metric">25% Health</div>
  </div>
  
  <div class="timeline-phase">
    <div class="phase-label">Phase 2: Fixes</div>
    <div class="phase-progress">
      <div class="phase-progress-bar" style="width: 100%;"></div>
    </div>
    <div class="phase-metric">75% Health</div>
  </div>
  
  <div class="timeline-phase">
    <div class="phase-label">Phase 3: Verification</div>
    <div class="phase-progress">
      <div class="phase-progress-bar" style="width: 80%;"></div>
    </div>
    <div class="phase-metric">In Progress</div>
  </div>
</div>
```

### Progress Component Styles
```css
/* Basic Progress Bar */
.progress {
  width: 100%;
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: var(--info-blue);
  border-radius: 4px;
  transition: width 0.6s ease;
  position: relative;
}

/* Labeled Progress Bar */
.progress-labeled {
  height: auto;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.progress-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
}

.progress-track {
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

/* Status Progress Variants */
.progress-success .progress-bar {
  background: var(--success-green);
}

.progress-warning .progress-bar {
  background: var(--warning-yellow);
}

.progress-error .progress-bar {
  background: var(--error-red);
}

/* Gradient Progress */
.progress-gradient .progress-bar {
  background: linear-gradient(90deg, var(--start-color, #EF4444) 0%, var(--end-color, #10B981) 100%);
}

/* Multi-segment Progress */
.progress-multi {
  display: flex;
  height: 8px;
  gap: 2px;
}

.progress-segment {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.progress-segment.progress-success {
  background: var(--success-green);
}

.progress-segment.progress-warning {
  background: var(--warning-yellow);
}

.progress-segment.progress-error {
  background: var(--error-red);
}

/* Timeline Progress */
.timeline-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-phase {
  display: flex;
  align-items: center;
  gap: 16px;
}

.phase-label {
  min-width: 180px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.phase-progress {
  flex: 1;
  height: 24px;
  background: #F3F4F6;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.phase-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--success-green) 0%, #059669 100%);
  border-radius: 12px;
  transition: width 0.8s ease;
}

.phase-metric {
  min-width: 120px;
  text-align: right;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--success-green);
}

/* Size Variants */
.progress-sm {
  height: 4px;
}

.progress-sm .progress-bar {
  border-radius: 2px;
}

.progress-lg {
  height: 12px;
}

.progress-lg .progress-bar {
  border-radius: 6px;
}

.progress-xl {
  height: 16px;
}

.progress-xl .progress-bar {
  border-radius: 8px;
}
```

## 📊 Data Table Components

### Table Variants
```html
<!-- Basic Data Table -->
<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th class="sortable" data-sort="name">Name</th>
        <th class="sortable" data-sort="status">Status</th>
        <th class="sortable" data-sort="value">Value</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="table-cell-primary">Item 1</span></td>
        <td><span class="badge badge-passed">PASSED</span></td>
        <td><span class="table-cell-numeric">245ms</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm">View</button>
            <button class="btn btn-sm btn-secondary">Edit</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Compact Table -->
<div class="table-container">
  <table class="data-table data-table-compact">
    <thead>
      <tr>
        <th>Service</th>
        <th>Status</th>
        <th>Response Time</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row-success">
        <td>API Service</td>
        <td><span class="status-dot status-dot-success"></span>Online</td>
        <td>142ms</td>
      </tr>
      <tr class="table-row-error">
        <td>Database</td>
        <td><span class="status-dot status-dot-error"></span>Offline</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Expandable Table Rows -->
<div class="table-container">
  <table class="data-table data-table-expandable">
    <thead>
      <tr>
        <th width="40"></th>
        <th>Test Name</th>
        <th>Status</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row-expandable">
        <td>
          <button class="expand-toggle" aria-label="Expand details">
            <span class="expand-icon">▶</span>
          </button>
        </td>
        <td>Integration Test</td>
        <td><span class="badge badge-passed">PASSED</span></td>
        <td>1.2s</td>
      </tr>
      <tr class="table-row-expanded" style="display: none;">
        <td colspan="4">
          <div class="expanded-content">
            <p>Detailed test results and logs would appear here.</p>
            <pre class="code-block">
              ✓ API endpoint responds correctly
              ✓ Database connection established
              ✓ Authentication working
            </pre>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Table Component Styles
```css
/* Table Container */
.table-container {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-background);
}

/* Base Table Styles */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  line-height: 1.5;
}

.data-table thead {
  background: #F9FAFB;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  user-select: none;
}

.data-table th.sortable {
  cursor: pointer;
  position: relative;
  padding-right: 32px;
}

.data-table th.sortable:hover {
  background: #F3F4F6;
}

.data-table th.sortable::after {
  content: '↕';
  position: absolute;
  right: 8px;
  color: #9CA3AF;
  font-size: 12px;
}

.data-table th.sort-asc::after {
  content: '↑';
  color: var(--info-blue);
}

.data-table th.sort-desc::after {
  content: '↓';
  color: var(--info-blue);
}

.data-table tbody tr {
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.15s ease;
}

.data-table tbody tr:hover {
  background: #F9FAFB;
}

.data-table tbody tr:nth-child(even) {
  background: #FAFAFA;
}

.data-table tbody tr:nth-child(even):hover {
  background: #F3F4F6;
}

.data-table td {
  padding: 12px 16px;
  color: var(--text-primary);
  vertical-align: middle;
}

/* Table Cell Variants */
.table-cell-primary {
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.table-cell-secondary {
  color: var(--text-secondary);
}

.table-cell-numeric {
  font-family: var(--font-mono);
  text-align: right;
}

/* Table Row States */
.table-row-success {
  border-left: 3px solid var(--success-green);
}

.table-row-error {
  border-left: 3px solid var(--error-red);
}

.table-row-warning {
  border-left: 3px solid var(--warning-yellow);
}

/* Compact Table */
.data-table-compact th,
.data-table-compact td {
  padding: 8px 12px;
}

.data-table-compact {
  font-size: var(--text-xs);
}

/* Table Actions */
.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Status Dots */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot-success {
  background: var(--success-green);
}

.status-dot-error {
  background: var(--error-red);
}

.status-dot-warning {
  background: var(--warning-yellow);
}

.status-dot-info {
  background: var(--info-blue);
}

/* Expandable Rows */
.expand-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.expand-toggle:hover {
  color: var(--text-primary);
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.table-row-expandable.expanded .expand-icon {
  transform: rotate(90deg);
}

.expanded-content {
  padding: 16px;
  background: #F9FAFB;
  border-top: 1px solid var(--border);
}

.code-block {
  background: #1F2937;
  color: #F9FAFB;
  padding: 12px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  overflow-x: auto;
}

/* Responsive Table */
@media (max-width: 767px) {
  .data-table {
    font-size: var(--text-xs);
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  /* Hide non-essential columns on mobile */
  .data-table .column-hide-mobile {
    display: none;
  }
}
```

## 🎯 Form Components

### Form Input Variants
```html
<!-- Text Inputs -->
<div class="form-group">
  <label class="form-label" for="username">Username</label>
  <input type="text" id="username" class="form-input" placeholder="Enter username">
</div>

<div class="form-group">
  <label class="form-label" for="email">Email</label>
  <input type="email" id="email" class="form-input form-input-error" 
         placeholder="Enter email" aria-describedby="email-error">
  <div id="email-error" class="form-error">Please enter a valid email address</div>
</div>

<div class="form-group">
  <label class="form-label" for="search">Search</label>
  <div class="input-with-icon">
    <span class="input-icon input-icon-left">🔍</span>
    <input type="search" id="search" class="form-input" placeholder="Search tests...">
  </div>
</div>

<!-- Select Dropdown -->
<div class="form-group">
  <label class="form-label" for="status">Filter by Status</label>
  <select id="status" class="form-select">
    <option value="">All Statuses</option>
    <option value="passed">Passed</option>
    <option value="failed">Failed</option>
    <option value="warning">Warning</option>
  </select>
</div>

<!-- Checkbox and Radio -->
<div class="form-group">
  <label class="form-label">Notification Preferences</label>
  <div class="form-checkboxes">
    <label class="checkbox-item">
      <input type="checkbox" class="form-checkbox" checked>
      <span class="checkbox-label">Email notifications</span>
    </label>
    <label class="checkbox-item">
      <input type="checkbox" class="form-checkbox">
      <span class="checkbox-label">SMS notifications</span>
    </label>
  </div>
</div>

<div class="form-group">
  <label class="form-label">Test Environment</label>
  <div class="form-radios">
    <label class="radio-item">
      <input type="radio" name="environment" class="form-radio" value="dev" checked>
      <span class="radio-label">Development</span>
    </label>
    <label class="radio-item">
      <input type="radio" name="environment" class="form-radio" value="staging">
      <span class="radio-label">Staging</span>
    </label>
    <label class="radio-item">
      <input type="radio" name="environment" class="form-radio" value="prod">
      <span class="radio-label">Production</span>
    </label>
  </div>
</div>

<!-- Toggle Switch -->
<div class="form-group">
  <label class="toggle-switch">
    <input type="checkbox" class="toggle-input">
    <span class="toggle-slider"></span>
    <span class="toggle-label">Enable auto-refresh</span>
  </label>
</div>
```

### Form Component Styles
```css
/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: 6px;
}

/* Text Inputs */
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-family: var(--font-family);
  background: var(--card-background);
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--info-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.form-input:disabled {
  background: #F9FAFB;
  color: var(--text-secondary);
  cursor: not-allowed;
}

/* Input States */
.form-input-error {
  border-color: var(--error-red);
}

.form-input-error:focus {
  border-color: var(--error-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input-success {
  border-color: var(--success-green);
}

.form-input-success:focus {
  border-color: var(--success-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Input with Icons */
.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 16px;
  pointer-events: none;
}

.input-icon-left {
  left: 12px;
}

.input-icon-right {
  right: 12px;
}

.input-with-icon .form-input {
  padding-left: 40px;
}

.input-with-icon.has-icon-right .form-input {
  padding-right: 40px;
}

/* Select Dropdown */
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-family: var(--font-family);
  background: var(--card-background);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--info-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Checkboxes and Radios */
.form-checkboxes,
.form-radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox,
.form-radio {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border);
  background: var(--card-background);
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-checkbox {
  border-radius: 4px;
}

.form-radio {
  border-radius: 50%;
}

.form-checkbox:checked,
.form-radio:checked {
  background: var(--info-blue);
  border-color: var(--info-blue);
}

.form-checkbox:checked::after {
  content: '✓';
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-radio:checked::after {
  content: '';
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  margin: 4px;
}

.checkbox-label,
.radio-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
}

/* Toggle Switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #D1D5DB;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-input:checked + .toggle-slider {
  background: var(--info-blue);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

/* Form Validation */
.form-error {
  font-size: var(--text-xs);
  color: var(--error-red);
  margin-top: 4px;
}

.form-success {
  font-size: var(--text-xs);
  color: var(--success-green);
  margin-top: 4px;
}

.form-help {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Input Sizes */
.form-input-sm {
  padding: 6px 10px;
  font-size: var(--text-xs);
}

.form-input-lg {
  padding: 12px 16px;
  font-size: var(--text-base);
}
```

## 🎨 Utility Classes

### Spacing Utilities
```css
/* Margin utilities */
.m-0 { margin: 0; }
.m-1 { margin: 4px; }
.m-2 { margin: 8px; }
.m-3 { margin: 12px; }
.m-4 { margin: 16px; }
.m-5 { margin: 20px; }
.m-6 { margin: 24px; }

.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-5 { margin-top: 20px; }
.mt-6 { margin-top: 24px; }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-5 { margin-bottom: 20px; }
.mb-6 { margin-bottom: 24px; }

/* Padding utilities */
.p-0 { padding: 0; }
.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }

.pt-0 { padding-top: 0; }
.pt-1 { padding-top: 4px; }
.pt-2 { padding-top: 8px; }
.pt-3 { padding-top: 12px; }
.pt-4 { padding-top: 16px; }
.pt-5 { padding-top: 20px; }
.pt-6 { padding-top: 24px; }

.pb-0 { padding-bottom: 0; }
.pb-1 { padding-bottom: 4px; }
.pb-2 { padding-bottom: 8px; }
.pb-3 { padding-bottom: 12px; }
.pb-4 { padding-bottom: 16px; }
.pb-5 { padding-bottom: 20px; }
.pb-6 { padding-bottom: 24px; }
```

### Layout Utilities
```css
/* Display utilities */
.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-block { display: inline-block; }
.d-flex { display: flex; }
.d-grid { display: grid; }

/* Flexbox utilities */
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }

/* Grid utilities */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-5 { gap: 20px; }
.gap-6 { gap: 24px; }

/* Text alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Positioning */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Width and height */
.w-full { width: 100%; }
.w-auto { width: auto; }
.h-full { height: 100%; }
.h-auto { height: auto; }

/* Overflow */
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
```

### Responsive Utilities
```css
/* Responsive visibility */
@media (max-width: 767px) {
  .hidden-mobile { display: none !important; }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .hidden-tablet { display: none !important; }
}

@media (min-width: 1200px) {
  .hidden-desktop { display: none !important; }
}

@media (min-width: 768px) {
  .hidden-mobile-up { display: none !important; }
}

@media (max-width: 1199px) {
  .hidden-desktop-down { display: none !important; }
}

/* Responsive text sizes */
@media (max-width: 767px) {
  .text-responsive {
    font-size: var(--text-sm);
  }
}

@media (min-width: 768px) {
  .text-responsive {
    font-size: var(--text-base);
  }
}

/* Responsive spacing */
@media (max-width: 767px) {
  .p-responsive { padding: 12px; }
  .m-responsive { margin: 8px; }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .p-responsive { padding: 16px; }
  .m-responsive { margin: 12px; }
}

@media (min-width: 1200px) {
  .p-responsive { padding: 20px; }
  .m-responsive { margin: 16px; }
}
```

## 🎯 Implementation Guidelines

### Component Usage Best Practices

1. **Consistency**: Always use components from this library instead of creating custom ones
2. **Accessibility**: Include proper ARIA labels and semantic markup
3. **Responsiveness**: Test components at all breakpoints
4. **Performance**: Use CSS custom properties for theming
5. **Validation**: Verify visual implementation with OCR testing

### Testing Components

```javascript
// Example component test
describe('Button Component', () => {
  it('should render with correct colors', async () => {
    const button = await page.$('.btn-primary');
    const backgroundColor = await page.evaluate(
      el => getComputedStyle(el).backgroundColor,
      button
    );
    expect(backgroundColor).toBe('rgb(59, 130, 246)'); // --info-blue
  });
  
  it('should be accessible', async () => {
    const button = await page.$('.btn-primary');
    const contrast = await checkContrastRatio(button);
    expect(contrast).toBeGreaterThan(4.5); // WCAG AA
  });
});
```

### Component Documentation Template

For each new component, include:

1. **HTML Structure**: Semantic markup example
2. **CSS Styles**: Complete styling with variables
3. **Variants**: Different states and sizes
4. **Accessibility**: ARIA attributes and keyboard support
5. **Responsive**: Behavior at different breakpoints
6. **Usage**: When and how to use the component

---

**This component library ensures consistent, accessible, and visually validated UI components across the entire verification dashboard system.**