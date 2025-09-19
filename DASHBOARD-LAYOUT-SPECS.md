# 📐 Dashboard Layout Design Specifications

**Document Version**: 1.0.0  
**Created**: 2025-08-12  
**Purpose**: Exact CSS layout specifications for verification dashboard components

## 🎯 Layout Architecture

### CSS Grid Foundation
```css
/* Main dashboard container */
.verification-dashboard {
  display: grid;
  grid-template-rows: 64px 200px 300px 400px auto 100px;
  grid-template-columns: 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background-color: #F9FAFB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Grid area definitions */
.verification-dashboard > * {
  grid-column: 1;
}

.header-nav { grid-row: 1; }
.hero-metrics { grid-row: 2; }
.timeline-section { grid-row: 3; }
.test-grid-section { grid-row: 4; }
.additional-content { grid-row: 5; }
.footer-section { grid-row: 6; }
```

### Responsive Grid System
```css
/* Desktop: 1200px+ */
@media (min-width: 1200px) {
  .verification-dashboard {
    grid-template-columns: 1fr;
    max-width: 1200px;
    gap: 30px;
  }
}

/* Tablet: 768px - 1199px */
@media (min-width: 768px) and (max-width: 1199px) {
  .verification-dashboard {
    grid-template-columns: 1fr;
    max-width: 768px;
    gap: 20px;
    padding: 15px;
  }
  
  .hero-metrics {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 15px;
  }
}

/* Mobile: 320px - 767px */
@media (max-width: 767px) {
  .verification-dashboard {
    grid-template-columns: 1fr;
    max-width: 375px;
    gap: 15px;
    padding: 10px;
  }
  
  .hero-metrics {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
  }
}
```

## 📋 Header Navigation Layout

### Navigation Bar Structure
```css
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Navigation buttons */
.nav-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-button:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.nav-button.active {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #1D4ED8;
}

/* Search and profile */
.nav-search {
  width: 240px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
}

.nav-profile {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3B82F6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}
```

### Responsive Navigation
```css
/* Mobile navigation adjustments */
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
  
  /* Hide non-essential nav items on mobile */
  .nav-button:not(.nav-button-essential) {
    display: none;
  }
}

/* Tablet navigation adjustments */
@media (min-width: 768px) and (max-width: 1199px) {
  .nav-search {
    width: 180px;
  }
}
```

## 📊 Hero Metrics Section Layout

### Metrics Grid Container
```css
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  gap: 20px;
  height: 200px;
}

/* Individual metric cards */
.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Metric card content */
.metric-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
  color: #111827;
}

.metric-label {
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
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

.metric-delta.negative {
  background: #FEE2E2;
  color: #991B1B;
}

.metric-delta.neutral {
  background: #F3F4F6;
  color: #374151;
}
```

### Metric Card Variants
```css
/* System Health Card */
.metric-card.system-health {
  border-left: 4px solid #10B981;
}

.metric-card.system-health .metric-value {
  color: #10B981;
}

/* Tests Passed Card */
.metric-card.tests-passed {
  border-left: 4px solid #3B82F6;
}

.metric-card.tests-passed .metric-value {
  color: #3B82F6;
}

/* Reproducibility Card */
.metric-card.reproducibility {
  border-left: 4px solid #8B5CF6;
}

.metric-card.reproducibility .metric-value {
  color: #8B5CF6;
}

/* QR Codes Card */
.metric-card.qr-codes {
  border-left: 4px solid #F59E0B;
}

.metric-card.qr-codes .metric-value {
  color: #F59E0B;
}
```

## 📈 Timeline Section Layout

### Timeline Container
```css
.timeline-section {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 24px;
  height: 300px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.timeline-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.timeline-controls {
  display: flex;
  gap: 8px;
}

.timeline-control {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #FFFFFF;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeline-control:hover {
  background: #F9FAFB;
}

.timeline-control.active {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #1D4ED8;
}
```

### Timeline Progress Bars
```css
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
  font-size: 14px;
  font-weight: 500;
  color: #374151;
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

/* Phase-specific colors */
.phase-progress-bar.phase-1 {
  --start-color: #EF4444;
  --end-color: #F59E0B;
  width: 25%;
}

.phase-progress-bar.phase-2 {
  --start-color: #F59E0B;
  --end-color: #10B981;
  width: 75%;
}

.phase-progress-bar.phase-3 {
  --start-color: #10B981;
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
  color: #10B981;
}

.phase-metric.baseline {
  color: #6B7280;
}
```

## 🔍 Test Grid Section Layout

### Grid Container
```css
.test-grid-section {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 24px;
  height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.test-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.test-grid-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.test-grid-filters {
  display: flex;
  gap: 8px;
}

.filter-button {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #FFFFFF;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background: #F9FAFB;
}

.filter-button.active {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #1D4ED8;
}
```

### Data Table Layout
```css
.test-grid-table {
  flex: 1;
  overflow: auto;
  border: 1px solid #E5E7EB;
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
  color: #374151;
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.test-table th:hover {
  background: #F3F4F6;
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
  color: #3B82F6;
}

.test-table th.sort-desc::after {
  content: '↓';
  color: #3B82F6;
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
  color: #374151;
  vertical-align: middle;
}
```

### Test Status Indicators
```css
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
```

### Action Buttons
```css
.test-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 4px 8px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  background: #FFFFFF;
  color: #374151;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.action-button.primary {
  background: #3B82F6;
  border-color: #3B82F6;
  color: #FFFFFF;
}

.action-button.primary:hover {
  background: #2563EB;
}

.action-button.danger {
  background: #EF4444;
  border-color: #EF4444;
  color: #FFFFFF;
}

.action-button.danger:hover {
  background: #DC2626;
}
```

## 📱 Responsive Adjustments

### Mobile Table Layout
```css
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
  
  /* Hide non-essential columns on mobile */
  .test-table .column-duration,
  .test-table .column-last-run {
    display: none;
  }
  
  /* Stack action buttons vertically */
  .test-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-button {
    font-size: 11px;
    padding: 3px 6px;
  }
}
```

### Tablet Adjustments
```css
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

## 🎨 Animation Specifications

### Loading States
```css
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
```

### Component Entrance Animations
```css
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

## 🔧 Implementation Checkpoints

### Phase 1: Layout Foundation
- [ ] Implement CSS Grid structure
- [ ] Create responsive breakpoints
- [ ] Build header navigation component
- [ ] Validate layout on all screen sizes

### Phase 2: Metrics Section
- [ ] Build metric card components
- [ ] Implement hover animations
- [ ] Add metric delta indicators
- [ ] Test metric value updates

### Phase 3: Timeline Visualization
- [ ] Create progress bar components
- [ ] Implement gradient animations
- [ ] Add timeline controls
- [ ] Test phase transitions

### Phase 4: Test Grid
- [ ] Build sortable data table
- [ ] Implement status indicators
- [ ] Add filtering functionality
- [ ] Create action button system

---

**Next Steps**: Create the visual testing methodology specification that defines how to validate the implementation against these exact design specifications using OCR and computer vision.