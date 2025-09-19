# User Interface Specification: Development Reality Engine
## Complete UI/UX Design and Component Specifications

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Purpose:** Define all user interfaces, interactions, and visual components

---

## Table of Contents

1. [Interface Overview](#interface-overview)
2. [Design System](#design-system)
3. [Command Line Interface](#command-line-interface)
4. [Web Dashboard](#web-dashboard)
5. [IDE Integrations](#ide-integrations)
6. [Mobile Interface](#mobile-interface)
7. [Accessibility](FinishThisIdea-backup-20250628-193256/docs/ACCESSIBILITY.md)
8. [Interaction Patterns](ObsidianVault/02-Documentation/patterns.md)

## Interface Overview

### Interface Types
1. **CLI (Primary)**: Developer-focused command line interface
2. **Web Dashboard**: Visual monitoring and management
3. **IDE Plugins**: Integrated development environment extensions
4. **API Clients**: Programmatic interfaces
5. **Mobile Apps**: Monitoring on the go

### Design Principles
- **Evidence-First**: Every UI element can show its verification evidence
- **Real-Time Feedback**: Immediate visual response to all actions
- **Progressive Disclosure**: Advanced features revealed as needed
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Dark Mode First**: Developer-friendly default theme

## Design System

### Color Palette
```scss
// Primary Colors
$primary-green: #00D67E;    // Success, verified
$primary-blue: #0066FF;     // Information, active
$primary-yellow: #FFB800;   // Warning, pending
$primary-red: #FF3B30;      // Error, failed

// Neutral Colors
$gray-900: #0A0A0A;         // Background (dark mode)
$gray-800: #1A1A1A;         // Card background
$gray-700: #2A2A2A;         // Borders
$gray-600: #3A3A3A;         // Disabled
$gray-500: #6A6A6A;         // Muted text
$gray-400: #9A9A9A;         // Secondary text
$gray-300: #CACACA;         // Primary text
$gray-200: #EAEAEA;         // Light backgrounds
$gray-100: #FAFAFA;         // Background (light mode)

// Semantic Colors
$success: $primary-green;
$info: $primary-blue;
$warning: $primary-yellow;
$error: $primary-red;
$evidence: #9B59B6;         // Purple for evidence
$verification: #3498DB;     // Blue for verification
```

### Typography
```scss
// Font Stack
$font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
$font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Type Scale
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px

// Line Heights
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.625;
```

### Component Library
```typescript
// Core UI Components
interface UIComponents {
  // Feedback
  Alert: Component<{ type: 'success' | 'info' | 'warning' | 'error' }>;
  Toast: Component<{ message: string; duration?: number }>;
  Progress: Component<{ value: number; max: number }>;
  
  // Evidence
  EvidenceCard: Component<{ evidence: Evidence }>;
  EvidenceViewer: Component<{ evidenceId: string }>;
  VerificationBadge: Component<{ score: number; status: string }>;
  
  // Data Display
  CodeBlock: Component<{ code: string; language: string }>;
  LogViewer: Component<{ logs: LogEntry[] }>;
  MetricChart: Component<{ data: MetricData }>;
  
  // Forms
  CommandInput: Component<{ onSubmit: (cmd: string) => void }>;
  ConfigEditor: Component<{ config: Config }>;
  FileUploader: Component<{ accept: string[] }>;
}
```

## Command Line Interface

### CLI Design
```bash
# Command Structure
dre [global-options] <command> [command-options] [arguments]

# Visual Hierarchy
✓ Success messages in green
ℹ Info messages in blue
⚠ Warnings in yellow
✗ Errors in red
◐ Progress indicators animated
→ Action prompts with arrow
```

### Interactive Mode
```bash
$ dre interactive

┌─────────────────────────────────────────────────────────┐
│  Development Reality Engine - Interactive Mode          │
│  Version 1.0.0 | Connected to: api.dre.dev             │
├─────────────────────────────────────────────────────────┤
│  Recent Operations:                                     │
│  • npm test          [✓ Passed]  2 min ago            │
│  • git commit -m..   [✓ Passed]  5 min ago            │
│  • npm run build     [◐ Running] Started 30s ago      │
├─────────────────────────────────────────────────────────┤
│  Quick Actions:                                         │
│  [1] Wrap Command  [2] View Evidence  [3] Check Status │
│  [4] Configuration [5] Help          [6] Exit          │
└─────────────────────────────────────────────────────────┘

dre> _
```

### Command Output Formatting
```bash
# Wrapped command execution
$ dre wrap npm test

◐ Initializing Development Reality Engine...
  ✓ Bootstrap verification complete
  ✓ Evidence collection ready
  
◐ Executing: npm test
  ├─ Working Directory: /home/user/project
  ├─ Operation ID: op_2kj3h4kj234
  └─ WebSocket: wss://api.dre.dev/ws/op_2kj3h4kj234

 PASS  src/calculator.test.js
  Calculator
    ✓ should add two numbers (3 ms)
    ✓ should subtract two numbers (1 ms)

◐ Collecting Evidence...
  ✓ Visual: 3 screenshots captured
  ✓ Programmatic: Test results collected
  ✓ Behavioral: Performance metrics recorded

◐ Running Verification...
  ├─ Visual:       ████████████████████ 100% [0.98]
  ├─ Programmatic: ████████████████████ 100% [0.99]
  └─ Behavioral:   ████████████████████ 100% [0.97]

✓ Verification Passed (Confidence: 98%)
  
📊 Summary:
  • Duration: 4.2s
  • Evidence: 12 items collected
  • Storage: 1.2 MB
  • View Details: https://dre.dev/operations/op_2kj3h4kj234
```

### Evidence Display
```bash
$ dre evidence show ev_8h3jk4h5jk

╭─ Evidence: ev_8h3jk4h5jk ────────────────────────────────╮
│ Type:       Visual (Screenshot)                          │
│ Operation:  npm test (op_2kj3h4kj234)                   │
│ Captured:   2024-01-20 10:30:15 UTC                    │
│ Size:       248 KB                                      │
│ Hash:       sha256:abcd1234...ef567890                 │
├──────────────────────────────────────────────────────────┤
│ Metadata:                                               │
│   Resolution: 1920x1080                                 │
│   Selector:   #test-results                             │
│   Device:     Chrome 120.0.0                           │
├──────────────────────────────────────────────────────────┤
│ Verification:                                           │
│   ✓ Integrity verified                                  │
│   ✓ Signature valid                                    │
│   ✓ Not tampered                                       │
├──────────────────────────────────────────────────────────┤
│ Actions:                                                │
│   [V]iew  [D]ownload  [S]hare  [R]eport               │
╰──────────────────────────────────────────────────────────╯
```

## Web Dashboard

### Dashboard Layout
```html
<!-- Main Dashboard Structure -->
<div class="dre-dashboard">
  <!-- Header -->
  <header class="dre-header">
    <div class="dre-logo">DRE</div>
    <nav class="dre-nav">
      <a href="#operations">Operations</a>
      <a href="#evidence">Evidence</a>
      <a href="#verification">Verification</a>
      <a href="#analytics">Analytics</a>
    </nav>
    <div class="dre-user-menu">
      <span class="dre-user-name">user@example.com</span>
      <button class="dre-settings">⚙</button>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="dre-main">
    <!-- Sidebar -->
    <aside class="dre-sidebar">
      <div class="dre-quick-actions">
        <button class="dre-action-primary">
          <icon>+</icon> New Operation
        </button>
      </div>
      
      <div class="dre-recent-operations">
        <h3>Recent Operations</h3>
        <ul class="dre-operation-list">
          <!-- Operation items -->
        </ul>
      </div>
    </aside>
    
    <!-- Content Area -->
    <section class="dre-content">
      <!-- Dynamic content based on route -->
    </section>
  </main>
</div>
```

### Operation View
```html
<div class="dre-operation-view">
  <!-- Operation Header -->
  <div class="dre-operation-header">
    <h1>npm test</h1>
    <div class="dre-operation-status success">
      <icon>✓</icon> Verification Passed
    </div>
  </div>
  
  <!-- Operation Timeline -->
  <div class="dre-timeline">
    <div class="dre-timeline-item completed">
      <div class="dre-timeline-marker"></div>
      <div class="dre-timeline-content">
        <h4>Command Started</h4>
        <time>10:30:00</time>
      </div>
    </div>
    <div class="dre-timeline-item completed">
      <div class="dre-timeline-marker"></div>
      <div class="dre-timeline-content">
        <h4>Evidence Collected</h4>
        <time>10:30:15</time>
        <div class="dre-evidence-preview">
          <img src="evidence-thumb.png" />
          <span>+11 more</span>
        </div>
      </div>
    </div>
    <div class="dre-timeline-item completed">
      <div class="dre-timeline-marker"></div>
      <div class="dre-timeline-content">
        <h4>Verification Complete</h4>
        <time>10:30:45</time>
        <div class="dre-verification-scores">
          <div class="dre-score visual">Visual: 0.98</div>
          <div class="dre-score programmatic">Code: 0.99</div>
          <div class="dre-score behavioral">Behavior: 0.97</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Operation Details -->
  <div class="dre-operation-details">
    <div class="dre-detail-section">
      <h3>Command Output</h3>
      <pre class="dre-output">
 PASS  src/calculator.test.js
  Calculator
    ✓ should add two numbers (3 ms)
    ✓ should subtract two numbers (1 ms)
      </pre>
    </div>
    
    <div class="dre-detail-section">
      <h3>Evidence Collection</h3>
      <div class="dre-evidence-grid">
        <!-- Evidence cards -->
      </div>
    </div>
  </div>
</div>
```

### Real-Time Monitoring
```javascript
// WebSocket connection for real-time updates
class DashboardMonitor {
  constructor() {
    this.ws = new WebSocket('wss://api.dre.dev/ws');
    this.charts = new Map();
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.ws.on('operation.started', (data) => {
      this.addOperation(data);
      this.showNotification('New operation started', 'info');
    });
    
    this.ws.on('operation.output', (data) => {
      this.appendOutput(data.operationId, data.text);
    });
    
    this.ws.on('evidence.captured', (data) => {
      this.addEvidence(data);
      this.updateProgressBar(data.operationId);
    });
    
    this.ws.on('verification.completed', (data) => {
      this.showVerificationResult(data);
      this.updateCharts(data);
    });
  }
  
  updateCharts(data) {
    // Update real-time metrics
    this.charts.get('operations').addPoint({
      x: Date.now(),
      y: data.confidence
    });
    
    this.charts.get('verification').update({
      visual: data.scores.visual,
      programmatic: data.scores.programmatic,
      behavioral: data.scores.behavioral
    });
  }
}
```

### Analytics Dashboard
```html
<div class="dre-analytics">
  <!-- Summary Cards -->
  <div class="dre-metric-cards">
    <div class="dre-metric-card">
      <h4>Operations Today</h4>
      <div class="dre-metric-value">247</div>
      <div class="dre-metric-change positive">+12%</div>
    </div>
    <div class="dre-metric-card">
      <h4>Verification Rate</h4>
      <div class="dre-metric-value">98.5%</div>
      <div class="dre-metric-change positive">+2.3%</div>
    </div>
    <div class="dre-metric-card">
      <h4>Avg. Confidence</h4>
      <div class="dre-metric-value">0.97</div>
      <div class="dre-metric-change neutral">±0%</div>
    </div>
    <div class="dre-metric-card">
      <h4>Evidence Storage</h4>
      <div class="dre-metric-value">45.2 GB</div>
      <div class="dre-metric-change warning">+8.5 GB</div>
    </div>
  </div>
  
  <!-- Charts -->
  <div class="dre-charts">
    <div class="dre-chart-container">
      <h3>Operations Over Time</h3>
      <canvas id="operations-chart"></canvas>
    </div>
    <div class="dre-chart-container">
      <h3>Verification Scores</h3>
      <canvas id="verification-chart"></canvas>
    </div>
  </div>
  
  <!-- Detailed Tables -->
  <div class="dre-data-tables">
    <table class="dre-table">
      <thead>
        <tr>
          <th>Command</th>
          <th>Count</th>
          <th>Success Rate</th>
          <th>Avg. Duration</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        <!-- Table rows -->
      </tbody>
    </table>
  </div>
</div>
```

## IDE Integrations

### VS Code Extension UI
```typescript
// Status Bar Item
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
statusBarItem.text = "$(shield) DRE: Ready";
statusBarItem.tooltip = "Development Reality Engine - Click for details";
statusBarItem.command = 'dre.showDashboard';

// Tree View Provider
class DRETreeDataProvider implements vscode.TreeDataProvider<DREItem> {
  getTreeItem(element: DREItem): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.collapsibleState
    );
    
    // Icons based on status
    item.iconPath = new vscode.ThemeIcon(
      element.status === 'passed' ? 'pass' : 
      element.status === 'failed' ? 'error' :
      'circle-outline'
    );
    
    // Context value for commands
    item.contextValue = element.type;
    
    return item;
  }
  
  getChildren(element?: DREItem): DREItem[] {
    if (!element) {
      // Root level - show recent operations
      return this.getRecentOperations();
    }
    
    // Operation level - show evidence
    return this.getOperationEvidence(element.id);
  }
}

// Code Lens Provider
class DRECodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    
    // Add lens above test functions
    const testPattern = /^(test|it|describe)\s*\(/gm;
    let match;
    
    while (match = testPattern.exec(document.getText())) {
      const line = document.positionAt(match.index).line;
      const range = new vscode.Range(line, 0, line, 0);
      
      lenses.push(new vscode.CodeLens(range, {
        title: "▶ Run with DRE",
        command: "dre.runTest",
        arguments: [document.uri, line]
      }));
      
      lenses.push(new vscode.CodeLens(range, {
        title: "📊 View History",
        command: "dre.showTestHistory",
        arguments: [document.uri, line]
      }));
    }
    
    return lenses;
  }
}
```

### IntelliJ Plugin UI
```java
// Tool Window
public class DREToolWindow extends SimpleToolWindowPanel {
  public DREToolWindow() {
    super(true, true);
    
    // Create UI components
    JPanel mainPanel = new JPanel(new BorderLayout());
    
    // Operations list
    DefaultListModel<Operation> listModel = new DefaultListModel<>();
    JBList<Operation> operationsList = new JBList<>(listModel);
    operationsList.setCellRenderer(new OperationCellRenderer());
    
    // Details panel
    JPanel detailsPanel = createDetailsPanel();
    
    // Split pane
    JSplitPane splitPane = new JSplitPane(
      JSplitPane.HORIZONTAL_SPLIT,
      new JBScrollPane(operationsList),
      detailsPanel
    );
    
    mainPanel.add(splitPane, BorderLayout.CENTER);
    setContent(mainPanel);
  }
}

// Gutter Icon Provider
public class DREGutterIconProvider extends GutterIconNavigationHandler {
  @Override
  public Icon getIcon(PsiElement element) {
    if (isTestMethod(element)) {
      VerificationStatus status = getVerificationStatus(element);
      switch (status) {
        case PASSED:
          return AllIcons.RunConfigurations.TestPassed;
        case FAILED:
          return AllIcons.RunConfigurations.TestFailed;
        default:
          return AllIcons.RunConfigurations.TestNotRan;
      }
    }
    return null;
  }
}
```

## Mobile Interface

### Mobile App Design
```swift
// iOS SwiftUI View
struct DREDashboardView: View {
  @StateObject var viewModel = DashboardViewModel()
  
  var body: some View {
    NavigationView {
      ScrollView {
        VStack(spacing: 16) {
          // Summary Cards
          HStack(spacing: 12) {
            MetricCard(
              title: "Today",
              value: "\(viewModel.todayOperations)",
              trend: .up(12)
            )
            MetricCard(
              title: "Success",
              value: "\(viewModel.successRate)%",
              trend: .neutral
            )
          }
          
          // Recent Operations
          VStack(alignment: .leading, spacing: 8) {
            Text("Recent Operations")
              .font(.headline)
            
            ForEach(viewModel.recentOperations) { operation in
              OperationRow(operation: operation)
                .onTapGesture {
                  navigateToOperation(operation)
                }
            }
          }
          
          // Quick Actions
          HStack(spacing: 12) {
            Button(action: { showNewOperation() }) {
              Label("New", systemImage: "plus")
            }
            .buttonStyle(PrimaryButtonStyle())
            
            Button(action: { showScanner() }) {
              Label("Scan QR", systemImage: "qrcode")
            }
            .buttonStyle(SecondaryButtonStyle())
          }
        }
        .padding()
      }
      .navigationTitle("DRE Monitor")
      .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
          Button(action: { showSettings() }) {
            Image(systemName: "gear")
          }
        }
      }
    }
  }
}

// Operation Detail View
struct OperationDetailView: View {
  let operation: Operation
  @State private var selectedTab = 0
  
  var body: some View {
    VStack {
      // Status Header
      OperationStatusHeader(operation: operation)
      
      // Tab View
      Picker("View", selection: $selectedTab) {
        Text("Timeline").tag(0)
        Text("Evidence").tag(1)
        Text("Output").tag(2)
      }
      .pickerStyle(SegmentedPickerStyle())
      .padding(.horizontal)
      
      // Tab Content
      TabView(selection: $selectedTab) {
        TimelineView(operation: operation).tag(0)
        EvidenceGridView(operation: operation).tag(1)
        OutputView(operation: operation).tag(2)
      }
      .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
    }
    .navigationTitle(operation.command)
    .navigationBarTitleDisplayMode(.inline)
  }
}
```

### Push Notifications
```javascript
// Notification Templates
const notificationTemplates = {
  operationComplete: {
    title: 'Operation Complete',
    body: '{{command}} finished with {{status}}',
    icon: 'icon-operation',
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  },
  
  verificationFailed: {
    title: 'Verification Failed',
    body: '{{command}} failed verification (confidence: {{confidence}}%)',
    icon: 'icon-warning',
    urgency: 'high',
    actions: [
      { action: 'investigate', title: 'Investigate' },
      { action: 'retry', title: 'Retry' }
    ]
  },
  
  anomalyDetected: {
    title: 'Anomaly Detected',
    body: 'Unusual pattern in {{metric}} for {{command}}',
    icon: 'icon-alert',
    urgency: 'medium',
    requiresAction: true
  }
};
```

## Accessibility

### WCAG 2.1 Compliance
```css
/* Focus Indicators */
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --color-background: #000;
    --color-text: #FFF;
    --color-border: #FFF;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support
```html
<!-- Semantic HTML -->
<main role="main" aria-label="DRE Dashboard">
  <section aria-labelledby="operations-heading">
    <h2 id="operations-heading">Recent Operations</h2>
    
    <!-- Live Region for Updates -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      <span id="operation-status">Operation npm test completed successfully</span>
    </div>
    
    <!-- Data Table -->
    <table role="table" aria-label="Operations list">
      <caption class="sr-only">
        List of recent operations with their status and verification scores
      </caption>
      <thead>
        <tr>
          <th scope="col">Command</th>
          <th scope="col">Status</th>
          <th scope="col">Confidence</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Table rows -->
      </tbody>
    </table>
  </section>
</main>
```

### Keyboard Navigation
```javascript
// Keyboard shortcut handler
class KeyboardNavigator {
  constructor() {
    this.shortcuts = new Map([
      ['cmd+k', this.openCommandPalette],
      ['cmd+/', this.toggleHelp],
      ['cmd+e', this.focusEvidence],
      ['cmd+o', this.newOperation],
      ['esc', this.closeModal],
      ['?', this.showKeyboardHelp]
    ]);
    
    this.setupListeners();
  }
  
  setupListeners() {
    document.addEventListener('keydown', (e) => {
      const shortcut = this.getShortcut(e);
      const handler = this.shortcuts.get(shortcut);
      
      if (handler) {
        e.preventDefault();
        handler.call(this);
      }
    });
  }
  
  // Tab trap for modals
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }
}
```

## Interaction Patterns

### Loading States
```javascript
// Progressive loading pattern
class ProgressiveLoader {
  constructor(container) {
    this.container = container;
    this.stages = ['skeleton', 'partial', 'complete'];
  }
  
  async load() {
    // Stage 1: Show skeleton
    this.showSkeleton();
    
    // Stage 2: Load critical data
    const criticalData = await this.loadCritical();
    this.showPartial(criticalData);
    
    // Stage 3: Load remaining data
    const fullData = await this.loadRemaining();
    this.showComplete(fullData);
  }
  
  showSkeleton() {
    this.container.innerHTML = `
      <div class="skeleton-loader">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    `;
  }
}
```

### Error Handling UI
```javascript
// User-friendly error display
class ErrorUI {
  static show(error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'dre-error-message';
    
    // Determine error type and user action
    const { title, message, actions } = this.parseError(error);
    
    errorElement.innerHTML = `
      <div class="dre-error-icon">⚠️</div>
      <div class="dre-error-content">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="dre-error-actions">
          ${actions.map(action => `
            <button class="dre-button-${action.type}" 
                    onclick="${action.handler}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(errorElement);
  }
  
  static parseError(error) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to DRE servers. Check your internet connection.',
          actions: [
            { label: 'Retry', type: 'primary', handler: 'DRE.retry()' },
            { label: 'Work Offline', type: 'secondary', handler: 'DRE.offline()' }
          ]
        };
      
      case 'AUTH_EXPIRED':
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          actions: [
            { label: 'Log In', type: 'primary', handler: 'DRE.login()' }
          ]
        };
      
      default:
        return {
          title: 'Something went wrong',
          message: error.message || 'An unexpected error occurred.',
          actions: [
            { label: 'Report Issue', type: 'secondary', handler: 'DRE.report()' },
            { label: 'Dismiss', type: 'ghost', handler: 'this.parentElement.remove()' }
          ]
        };
    }
  }
}
```

### Confirmation Dialogs
```javascript
// Smart confirmation based on action severity
class ConfirmationDialog {
  static async confirm(action) {
    const severity = this.assessSeverity(action);
    
    if (severity === 'low') {
      // No confirmation needed
      return true;
    }
    
    const dialog = this.createDialog(action, severity);
    document.body.appendChild(dialog);
    
    return new Promise((resolve) => {
      dialog.querySelector('.confirm').onclick = () => {
        dialog.remove();
        resolve(true);
      };
      
      dialog.querySelector('.cancel').onclick = () => {
        dialog.remove();
        resolve(false);
      };
    });
  }
  
  static assessSeverity(action) {
    if (action.type === 'delete' || action.type === 'reset') {
      return 'high';
    }
    if (action.affectsOthers || action.cost > 0) {
      return 'medium';
    }
    return 'low';
  }
  
  static createDialog(action, severity) {
    const dialog = document.createElement('div');
    dialog.className = `dre-dialog severity-${severity}`;
    
    dialog.innerHTML = `
      <div class="dre-dialog-backdrop"></div>
      <div class="dre-dialog-content">
        <h2>${action.title}</h2>
        <p>${action.message}</p>
        ${severity === 'high' ? `
          <div class="dre-dialog-warning">
            ⚠️ This action cannot be undone
          </div>
        ` : ''}
        <div class="dre-dialog-actions">
          <button class="cancel">Cancel</button>
          <button class="confirm ${severity}">
            ${action.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    `;
    
    return dialog;
  }
}
```

## Conclusion

This user interface specification ensures that the Development Reality Engine provides an intuitive, accessible, and powerful interface across all platforms. Every interaction is designed to reinforce the core principle of verified development through evidence.

Key design principles:
1. **Evidence visibility** in every interface
2. **Real-time feedback** for all operations
3. **Accessibility first** design approach
4. **Cross-platform consistency** in interactions
5. **Progressive enhancement** for all skill levels

---

**"A great interface makes verification invisible until you need it, then makes it impossible to ignore."**

*User Interface Specification v1.0 - The complete UI/UX design for the Development Reality Engine.*