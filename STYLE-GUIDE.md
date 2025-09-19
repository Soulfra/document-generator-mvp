# Document Generator Style Guide

## Overview

The Document Generator project uses a unified CSS framework that provides consistent styling across all 393+ HTML interfaces. This guide documents the design system, components, and best practices.

## CSS Architecture

### File Structure

```
styles/
├── master.css                # Main import file - use this
├── unified-framework.css     # Dark theme framework (default)
├── design-system.css         # Light theme variables
├── components.css            # Reusable UI components
├── layouts.css               # Layout patterns
├── animations.css            # Animation library
├── themes/
│   ├── light.css            # Light theme overrides
│   └── dark.css             # Dark theme enhancements
└── component-gallery.html    # Live component examples
```

### Using the Master CSS

Always import the master CSS file in your HTML:

```html
<!-- Master CSS - Includes everything -->
<link rel="stylesheet" href="styles/master.css">

<!-- Theme Toggle Script -->
<script src="styles/theme-toggle.js"></script>
```

## Design System

### Color Palette

#### Dark Theme (Default)
- Primary Background: `#0a0a0a`
- Secondary Background: `#1a1a2e`
- Tertiary Background: `#16213e`
- Accent Color: `#00ff88`
- Link Color: `#00ffff`

#### Light Theme
- Primary Background: `#ffffff`
- Text Primary: `#111827`
- Accent: `#2563eb`

#### Status Colors
- Online/Success: `#00ff88`
- Offline/Error: `#ff4444`
- Warning: `#ffff00`
- Processing: `#00ffff`

### Typography

```css
/* Font Stack */
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Courier New', 'Monaco', 'Consolas', monospace;

/* Font Sizes */
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-xxl: 32px;
```

### Spacing System

Based on 8px grid:
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-xxl`: 48px

## Component Classes

### Buttons

```html
<!-- Primary Button -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary</button>

<!-- Danger Button -->
<button class="btn btn-danger">Delete</button>

<!-- Outline Button -->
<button class="btn btn-outline">Cancel</button>

<!-- Size Variants -->
<button class="btn btn-primary btn-large">Large</button>
<button class="btn btn-primary btn-small">Small</button>
```

### Forms

```html
<div class="form-group">
    <label class="form-label">Input Label</label>
    <input type="text" class="form-input" placeholder="Enter text...">
</div>

<div class="form-group">
    <label class="form-label">Select</label>
    <select class="form-input">
        <option>Option 1</option>
        <option>Option 2</option>
    </select>
</div>
```

### Panels & Cards

```html
<!-- Basic Panel -->
<div class="panel">
    <div class="panel-header">
        <h3>Panel Title</h3>
    </div>
    <p>Panel content</p>
</div>

<!-- Card Component -->
<div class="card">
    <div class="card-header">
        <h4 class="card-title">Card Title</h4>
    </div>
    <div class="card-body">
        Content
    </div>
    <div class="card-footer">
        Footer
    </div>
</div>
```

### Status Indicators

```html
<!-- Status Dots -->
<span class="status-indicator status-online"></span> Online
<span class="status-indicator status-offline"></span> Offline
<span class="status-indicator status-processing"></span> Processing

<!-- Progress Bar -->
<div class="progress-bar">
    <div class="progress-fill" style="width: 60%;"></div>
</div>
```

### Alerts

```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-danger">Error message</div>
<div class="alert alert-info">Information</div>
```

## Layout Patterns

### Dashboard Grid Layout

```html
<div class="dashboard-grid">
    <div class="dashboard-header">Header</div>
    <div class="dashboard-sidebar">Sidebar</div>
    <div class="dashboard-main">Main Content</div>
    <div class="dashboard-aside">Aside</div>
    <div class="dashboard-footer">Footer</div>
</div>
```

### Responsive Grid

```html
<div class="grid grid-3 gap-md">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
</div>
```

### Flexbox Utilities

```html
<div class="flex justify-between items-center gap-md">
    <div>Left</div>
    <div>Right</div>
</div>
```

## Theme Switching

### Automatic Theme Toggle

The theme toggle button is automatically added to all pages that include `theme-toggle.js`. Users' theme preference is saved in localStorage.

### Manual Theme Control

```javascript
// Toggle theme programmatically
toggleTheme();

// Listen for theme changes
window.addEventListener('themeChanged', (e) => {
    console.log('Theme changed to:', e.detail.theme);
});
```

### Force Specific Theme

```html
<!-- Force dark theme -->
<body class="dashboard-dark">

<!-- Force light theme -->
<body class="light-theme">

<!-- Custom gradients -->
<body class="dashboard-gradient-purple">  <!-- SoulFRA style -->
<body class="dashboard-gradient-blue">    <!-- ColdStartKit style -->
```

## Animation Classes

### Entrance Animations

```html
<div class="fade-in">Fades in</div>
<div class="slide-in">Slides in from left</div>
<div class="scale-in">Scales in</div>
<div class="fade-in-up">Fades in from bottom</div>
```

### Hover Effects

```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
<div class="hover-glow">Glows on hover</div>
```

### Loading States

```html
<!-- Spinners -->
<div class="spinner spinner-sm"></div>
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>

<!-- Skeleton Loading -->
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-text"></div>
```

## Utility Classes

### Spacing
- Padding: `.p-0`, `.p-sm`, `.p-md`, `.p-lg`
- Margin: `.m-0`, `.m-sm`, `.m-md`, `.m-lg`
- Specific: `.mb-md`, `.mt-lg`, `.space-y-4`

### Display
- `.hidden`, `.visible`, `.invisible`
- `.block`, `.inline-block`, `.flex`, `.grid`
- `.relative`, `.absolute`, `.fixed`, `.sticky`

### Sizing
- `.w-full`, `.h-full`, `.min-h-screen`

### Text
- Size: `.text-xs`, `.text-sm`, `.text-lg`, `.text-xl`
- Color: `.text-primary`, `.text-secondary`, `.text-accent`
- Alignment: `.text-center`, `.text-left`, `.text-right`
- Font: `.text-mono`, `.font-semibold`, `.font-bold`

## Accessibility Features

### Focus States

All interactive elements have visible focus indicators:

```css
*:focus {
    outline: 2px solid var(--text-accent);
    outline-offset: 2px;
}
```

### Screen Reader Support

```html
<!-- Use semantic HTML -->
<nav role="navigation">
<main role="main">
<button aria-label="Close dialog">

<!-- Hide decorative elements -->
<span class="sr-only">Screen reader only text</span>
```

### High Contrast Mode

The framework automatically adjusts for high contrast mode preferences.

### Reduced Motion

Animations are disabled for users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
}
```

## Best Practices

### 1. Use Semantic HTML
Always use proper HTML elements for their intended purpose.

### 2. Maintain Consistency
Use the design system variables instead of hard-coding values.

### 3. Mobile-First
Design for mobile devices first, then enhance for larger screens.

### 4. Performance
- Minimize custom CSS
- Use utility classes when possible
- Lazy load heavy components

### 5. Accessibility
- Ensure color contrast ratios meet WCAG standards
- Provide keyboard navigation
- Include ARIA labels where needed

## Migrating Existing Interfaces

To update an existing interface to use the unified design system:

1. Replace all CSS imports with:
   ```html
   <link rel="stylesheet" href="styles/master.css">
   ```

2. Add theme toggle support:
   ```html
   <script src="styles/theme-toggle.js"></script>
   ```

3. Replace inline styles with utility classes

4. Update color values to use CSS variables

5. Test in both light and dark themes

## Special Effects

For advanced UI effects, import from the devex components:

```css
/* In your custom styles */
@import url('../devex/web/components/ui/modern-checkbox.css');
@import url('../devex/web/components/ui/waves.css');
```

## Component Gallery

View live examples of all components:
[Open Component Gallery](styles/component-gallery.html)

## Questions or Issues?

If you encounter any styling issues or need new components, please:
1. Check the component gallery for existing solutions
2. Review the unified-framework.css for available utilities
3. Consider if a new utility class would benefit multiple interfaces

---

Last Updated: 2025-08-28
Version: 1.0.0