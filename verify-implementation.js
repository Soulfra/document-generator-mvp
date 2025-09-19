#!/usr/bin/env node

/**
 * Implementation Verification Script
 * 
 * Verifies that HTML/CSS implementation matches design specifications exactly
 * Checks code compliance against DESIGN-IMPLEMENTATION-CHECKLIST.md
 * 
 * Usage:
 *   node verify-implementation.js --url http://localhost:3000 --check all
 *   node verify-implementation.js --url http://localhost:3000 --check html
 *   node verify-implementation.js --url http://localhost:3000 --check css
 *   node verify-implementation.js --url http://localhost:3000 --check accessibility
 * 
 * Created: 2025-08-12
 * Version: 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

// Specifications from our design documents
const IMPLEMENTATION_SPECS = {
  // CSS Custom Properties from HTML-CSS-TEMPLATE-SPECS.md
  cssVariables: {
    '--success-green': '#10B981',
    '--error-red': '#EF4444',
    '--warning-yellow': '#F59E0B',
    '--info-blue': '#3B82F6',
    '--background': '#F9FAFB',
    '--card-background': '#FFFFFF',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': '#E5E7EB',
    '--font-family': '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    '--dashboard-max-width': '1200px',
    '--dashboard-gap': '30px',
    '--card-border-radius': '10px',
    '--metric-card-height': '120px'
  },

  // Required HTML structure from HTML-CSS-TEMPLATE-SPECS.md
  requiredElements: [
    {
      selector: '.verification-dashboard',
      required: true,
      description: 'Main dashboard container'
    },
    {
      selector: '.header-nav',
      required: true,
      description: 'Header navigation section'
    },
    {
      selector: '.hero-metrics',
      required: true,
      description: 'Hero metrics section'
    },
    {
      selector: '.timeline-section',
      required: true,
      description: 'Timeline visualization section'
    },
    {
      selector: '.test-grid-section',
      required: true,
      description: 'Test results grid section'
    },
    {
      selector: '.metric-card',
      required: true,
      description: 'Metric cards'
    },
    {
      selector: '.test-table',
      required: true,
      description: 'Test results table'
    }
  ],

  // Grid layout specifications from DASHBOARD-LAYOUT-SPECS.md
  gridLayout: {
    '.verification-dashboard': {
      display: 'grid',
      'grid-template-rows': '64px 200px 300px 400px auto 100px',
      'grid-template-columns': '1fr',
      gap: '30px',
      'max-width': '1200px'
    },
    '.hero-metrics': {
      display: 'grid',
      'grid-template-columns': 'repeat(4, 1fr)',
      gap: '20px',
      height: '200px'
    }
  },

  // Accessibility requirements from DESIGN-IMPLEMENTATION-CHECKLIST.md
  accessibilityRules: [
    {
      rule: 'color-contrast',
      level: 'AA',
      description: 'Text contrast meets WCAG 2.1 AA standards'
    },
    {
      rule: 'button-name',
      level: 'A',
      description: 'All buttons have accessible names'
    },
    {
      rule: 'heading-order',
      level: 'AA',
      description: 'Heading levels are in logical order'
    },
    {
      rule: 'landmark-one-main',
      level: 'AA',
      description: 'Page has one main landmark'
    },
    {
      rule: 'region',
      level: 'AA',
      description: 'All content is contained in landmarks'
    }
  ],

  // Component specifications from VISUAL-COMPONENT-LIBRARY.md
  componentSpecs: {
    '.btn': {
      'border-radius': '6px',
      'font-size': '14px',
      'font-weight': '500',
      'transition': 'all 0.2s ease'
    },
    '.badge': {
      'border-radius': '6px',
      'font-size': '12px',
      'font-weight': '600',
      'text-transform': 'uppercase'
    },
    '.metric-card': {
      'border-radius': '10px',
      'padding': '20px',
      'height': '120px',
      'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.1)'
    }
  },

  // Responsive breakpoints from design specifications
  responsiveBreakpoints: [
    {
      name: 'mobile',
      maxWidth: 767,
      requirements: [
        {
          selector: '.hero-metrics',
          property: 'grid-template-columns',
          value: '1fr'
        },
        {
          selector: '.nav-button:not(.nav-button-essential)',
          property: 'display',
          value: 'none'
        }
      ]
    },
    {
      name: 'tablet',
      minWidth: 768,
      maxWidth: 1199,
      requirements: [
        {
          selector: '.hero-metrics',
          property: 'grid-template-columns',
          value: 'repeat(2, 1fr)'
        }
      ]
    },
    {
      name: 'desktop',
      minWidth: 1200,
      requirements: [
        {
          selector: '.hero-metrics',
          property: 'grid-template-columns',
          value: 'repeat(4, 1fr)'
        }
      ]
    }
  ],

  // Performance requirements
  performance: {
    firstContentfulPaint: 1500,  // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,   // unitless
    firstInputDelay: 100,         // ms
    totalPageSize: 1024,          // KB
    totalRequests: 50,            // count
    javascriptSize: 200,          // KB
    cssSize: 100                  // KB
  }
};

class ImplementationVerifier {
  constructor(options = {}) {
    this.config = { ...IMPLEMENTATION_SPECS, ...options };
    this.browser = null;
    this.page = null;
    this.outputDir = path.join(process.cwd(), 'implementation-verification');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async initialize() {
    console.log('🔧 Initializing Implementation Verifier...');
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    console.log('✅ Browser initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async verifyHTMLStructure(url) {
    console.log('📄 Verifying HTML structure...');
    
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Wait for dashboard to load
      await this.page.waitForSelector('.verification-dashboard', { timeout: 10000 });
      
      // Check required elements
      for (const elementSpec of this.config.requiredElements) {
        results.totalChecks++;
        
        try {
          const element = await this.page.$(elementSpec.selector);
          const exists = element !== null;
          
          if (exists) {
            results.passedChecks++;
            
            // Check semantic correctness
            const tagName = await this.page.evaluate(
              (sel) => document.querySelector(sel)?.tagName.toLowerCase(),
              elementSpec.selector
            );
            
            results.details.push({
              selector: elementSpec.selector,
              description: elementSpec.description,
              exists: true,
              tagName,
              passed: true
            });
          } else {
            results.failedChecks.push({
              selector: elementSpec.selector,
              description: elementSpec.description,
              error: 'Element not found'
            });
            
            results.details.push({
              selector: elementSpec.selector,
              description: elementSpec.description,
              exists: false,
              passed: false
            });
          }
        } catch (error) {
          results.failedChecks.push({
            selector: elementSpec.selector,
            description: elementSpec.description,
            error: error.message
          });
        }
      }
      
      // Verify semantic markup
      const semanticChecks = await this.verifySemanticMarkup();
      results.totalChecks += semanticChecks.totalChecks;
      results.passedChecks += semanticChecks.passedChecks;
      results.failedChecks.push(...semanticChecks.failedChecks);
      results.details.push(...semanticChecks.details);
      
      const accuracy = (results.passedChecks / results.totalChecks) * 100;
      console.log(`📄 HTML Structure: ${results.passedChecks}/${results.totalChecks} checks passed (${accuracy.toFixed(1)}%)`);
      
      return results;
    } catch (error) {
      console.error('❌ HTML structure verification failed:', error.message);
      return { ...results, error: error.message };
    }
  }

  async verifyCSSImplementation(url) {
    console.log('🎨 Verifying CSS implementation...');
    
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Check CSS custom properties
      const customPropsResult = await this.verifyCSSCustomProperties();
      results.totalChecks += customPropsResult.totalChecks;
      results.passedChecks += customPropsResult.passedChecks;
      results.failedChecks.push(...customPropsResult.failedChecks);
      results.details.push(...customPropsResult.details);
      
      // Check grid layout implementation
      const gridResult = await this.verifyGridLayout();
      results.totalChecks += gridResult.totalChecks;
      results.passedChecks += gridResult.passedChecks;
      results.failedChecks.push(...gridResult.failedChecks);
      results.details.push(...gridResult.details);
      
      // Check component styling
      const componentResult = await this.verifyComponentStyling();
      results.totalChecks += componentResult.totalChecks;
      results.passedChecks += componentResult.passedChecks;
      results.failedChecks.push(...componentResult.failedChecks);
      results.details.push(...componentResult.details);
      
      const accuracy = (results.passedChecks / results.totalChecks) * 100;
      console.log(`🎨 CSS Implementation: ${results.passedChecks}/${results.totalChecks} checks passed (${accuracy.toFixed(1)}%)`);
      
      return results;
    } catch (error) {
      console.error('❌ CSS implementation verification failed:', error.message);
      return { ...results, error: error.message };
    }
  }

  async verifyAccessibility(url) {
    console.log('♿ Verifying accessibility compliance...');
    
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Inject axe-core
      await this.page.addScriptTag({ path: require.resolve('axe-core') });
      
      // Run accessibility audit
      const axeResults = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run(document, {
            rules: {
              'color-contrast': { enabled: true },
              'button-name': { enabled: true },
              'heading-order': { enabled: true },
              'landmark-one-main': { enabled: true },
              'region': { enabled: true }
            }
          }, (err, results) => {
            resolve(results);
          });
        });
      });
      
      // Process axe results
      results.totalChecks = axeResults.passes.length + axeResults.violations.length;
      results.passedChecks = axeResults.passes.length;
      
      for (const violation of axeResults.violations) {
        results.failedChecks.push({
          rule: violation.id,
          description: violation.description,
          impact: violation.impact,
          nodes: violation.nodes.length,
          help: violation.help
        });
      }
      
      // Check keyboard navigation
      const keyboardResult = await this.verifyKeyboardNavigation();
      results.totalChecks += keyboardResult.totalChecks;
      results.passedChecks += keyboardResult.passedChecks;
      results.failedChecks.push(...keyboardResult.failedChecks);
      
      // Check ARIA attributes
      const ariaResult = await this.verifyARIAAttributes();
      results.totalChecks += ariaResult.totalChecks;
      results.passedChecks += ariaResult.passedChecks;
      results.failedChecks.push(...ariaResult.failedChecks);
      
      const accuracy = (results.passedChecks / results.totalChecks) * 100;
      console.log(`♿ Accessibility: ${results.passedChecks}/${results.totalChecks} checks passed (${accuracy.toFixed(1)}%)`);
      
      return { ...results, axeResults };
    } catch (error) {
      console.error('❌ Accessibility verification failed:', error.message);
      return { ...results, error: error.message };
    }
  }

  async verifyResponsiveDesign(url) {
    console.log('📱 Verifying responsive design...');
    
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    try {
      for (const breakpoint of this.config.responsiveBreakpoints) {
        console.log(`  Testing ${breakpoint.name} breakpoint...`);
        
        // Set viewport for breakpoint
        let width;
        if (breakpoint.maxWidth && breakpoint.minWidth) {
          width = Math.floor((breakpoint.maxWidth + breakpoint.minWidth) / 2);
        } else if (breakpoint.maxWidth) {
          width = breakpoint.maxWidth - 50;
        } else {
          width = breakpoint.minWidth + 50;
        }
        
        await this.page.setViewport({ width, height: 800 });
        await this.page.goto(url, { waitUntil: 'networkidle0' });
        
        // Check requirements for this breakpoint
        for (const requirement of breakpoint.requirements) {
          results.totalChecks++;
          
          try {
            const actualValue = await this.page.evaluate((selector, property) => {
              const element = document.querySelector(selector);
              if (!element) return null;
              
              const styles = window.getComputedStyle(element);
              return styles.getPropertyValue(property);
            }, requirement.selector, requirement.property);
            
            const matches = actualValue === requirement.value;
            
            if (matches) {
              results.passedChecks++;
            } else {
              results.failedChecks.push({
                breakpoint: breakpoint.name,
                selector: requirement.selector,
                property: requirement.property,
                expected: requirement.value,
                actual: actualValue
              });
            }
            
            results.details.push({
              breakpoint: breakpoint.name,
              selector: requirement.selector,
              property: requirement.property,
              expected: requirement.value,
              actual: actualValue,
              passed: matches
            });
          } catch (error) {
            results.failedChecks.push({
              breakpoint: breakpoint.name,
              selector: requirement.selector,
              error: error.message
            });
          }
        }
      }
      
      const accuracy = (results.passedChecks / results.totalChecks) * 100;
      console.log(`📱 Responsive Design: ${results.passedChecks}/${results.totalChecks} checks passed (${accuracy.toFixed(1)}%)`);
      
      return results;
    } catch (error) {
      console.error('❌ Responsive design verification failed:', error.message);
      return { ...results, error: error.message };
    }
  }

  async verifyPerformance(url) {
    console.log('⚡ Verifying performance...');
    
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    try {
      // Enable performance tracking
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          transferSize: navigation.transferSize
        };
      });
      
      // Check performance against requirements
      const perfChecks = [
        {
          name: 'First Contentful Paint',
          actual: metrics.firstContentfulPaint,
          threshold: this.config.performance.firstContentfulPaint,
          unit: 'ms'
        },
        {
          name: 'Page Size',
          actual: metrics.transferSize / 1024, // Convert to KB
          threshold: this.config.performance.totalPageSize,
          unit: 'KB'
        }
      ];
      
      for (const check of perfChecks) {
        results.totalChecks++;
        
        const passed = check.actual <= check.threshold;
        
        if (passed) {
          results.passedChecks++;
        } else {
          results.failedChecks.push({
            metric: check.name,
            actual: `${check.actual.toFixed(1)}${check.unit}`,
            threshold: `${check.threshold}${check.unit}`,
            passed: false
          });
        }
        
        results.details.push({
          metric: check.name,
          actual: check.actual,
          threshold: check.threshold,
          unit: check.unit,
          passed
        });
      }
      
      const accuracy = (results.passedChecks / results.totalChecks) * 100;
      console.log(`⚡ Performance: ${results.passedChecks}/${results.totalChecks} checks passed (${accuracy.toFixed(1)}%)`);
      
      return results;
    } catch (error) {
      console.error('❌ Performance verification failed:', error.message);
      return { ...results, error: error.message };
    }
  }

  // Helper methods
  async verifySemanticMarkup() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    // Check for proper heading hierarchy
    const headings = await this.page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent.trim(),
        id: h.id || null
      }));
    });
    
    results.totalChecks++;
    
    // Verify heading order
    let headingOrderValid = true;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i-1].level + 1) {
        headingOrderValid = false;
        break;
      }
    }
    
    if (headingOrderValid) {
      results.passedChecks++;
    } else {
      results.failedChecks.push({
        check: 'heading-hierarchy',
        description: 'Heading levels should not skip levels'
      });
    }
    
    // Check for proper landmarks
    const landmarks = await this.page.evaluate(() => {
      return {
        main: document.querySelectorAll('main, [role="main"]').length,
        navigation: document.querySelectorAll('nav, [role="navigation"]').length,
        banner: document.querySelectorAll('header, [role="banner"]').length,
        contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length
      };
    });
    
    results.totalChecks++;
    
    if (landmarks.main === 1) {
      results.passedChecks++;
    } else {
      results.failedChecks.push({
        check: 'main-landmark',
        description: 'Page should have exactly one main landmark',
        actual: landmarks.main
      });
    }
    
    return results;
  }

  async verifyCSSCustomProperties() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    for (const [property, expectedValue] of Object.entries(this.config.cssVariables)) {
      results.totalChecks++;
      
      try {
        const actualValue = await this.page.evaluate((prop) => {
          return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
        }, property);
        
        const matches = actualValue === expectedValue;
        
        if (matches) {
          results.passedChecks++;
        } else {
          results.failedChecks.push({
            property,
            expected: expectedValue,
            actual: actualValue
          });
        }
        
        results.details.push({
          property,
          expected: expectedValue,
          actual: actualValue,
          passed: matches
        });
      } catch (error) {
        results.failedChecks.push({
          property,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async verifyGridLayout() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    for (const [selector, expectedStyles] of Object.entries(this.config.gridLayout)) {
      for (const [property, expectedValue] of Object.entries(expectedStyles)) {
        results.totalChecks++;
        
        try {
          const actualValue = await this.page.evaluate((sel, prop) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            return getComputedStyle(element).getPropertyValue(prop);
          }, selector, property);
          
          const matches = actualValue === expectedValue;
          
          if (matches) {
            results.passedChecks++;
          } else {
            results.failedChecks.push({
              selector,
              property,
              expected: expectedValue,
              actual: actualValue
            });
          }
        } catch (error) {
          results.failedChecks.push({
            selector,
            property,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  async verifyComponentStyling() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    for (const [selector, expectedStyles] of Object.entries(this.config.componentSpecs)) {
      const elements = await this.page.$$(selector);
      
      if (elements.length === 0) {
        results.failedChecks.push({
          selector,
          error: 'No elements found with selector'
        });
        continue;
      }
      
      // Check first element
      for (const [property, expectedValue] of Object.entries(expectedStyles)) {
        results.totalChecks++;
        
        try {
          const actualValue = await this.page.evaluate((el, prop) => {
            return getComputedStyle(el).getPropertyValue(prop);
          }, elements[0], property);
          
          const matches = actualValue === expectedValue;
          
          if (matches) {
            results.passedChecks++;
          } else {
            results.failedChecks.push({
              selector,
              property,
              expected: expectedValue,
              actual: actualValue
            });
          }
        } catch (error) {
          results.failedChecks.push({
            selector,
            property,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  async verifyKeyboardNavigation() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    // Test tab navigation
    results.totalChecks++;
    
    try {
      // Find all focusable elements
      const focusableElements = await this.page.evaluate(() => {
        const focusable = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return Array.from(document.querySelectorAll(focusable)).length;
      });
      
      if (focusableElements > 0) {
        results.passedChecks++;
        results.details.push({
          check: 'focusable-elements',
          count: focusableElements,
          passed: true
        });
      } else {
        results.failedChecks.push({
          check: 'focusable-elements',
          description: 'No focusable elements found'
        });
      }
    } catch (error) {
      results.failedChecks.push({
        check: 'keyboard-navigation',
        error: error.message
      });
    }
    
    return results;
  }

  async verifyARIAAttributes() {
    const results = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: [],
      details: []
    };
    
    // Check for required ARIA attributes
    const ariaChecks = [
      {
        selector: 'button',
        attribute: 'aria-label',
        description: 'Buttons should have aria-label when text is not descriptive'
      },
      {
        selector: '[role="progressbar"]',
        attribute: 'aria-valuenow',
        description: 'Progress bars should have aria-valuenow'
      },
      {
        selector: '[role="region"]',
        attribute: 'aria-labelledby',
        description: 'Regions should have aria-labelledby'
      }
    ];
    
    for (const check of ariaChecks) {
      results.totalChecks++;
      
      try {
        const hasAttribute = await this.page.evaluate((sel, attr) => {
          const elements = document.querySelectorAll(sel);
          return Array.from(elements).some(el => el.hasAttribute(attr));
        }, check.selector, check.attribute);
        
        if (hasAttribute) {
          results.passedChecks++;
        } else {
          results.failedChecks.push({
            selector: check.selector,
            attribute: check.attribute,
            description: check.description
          });
        }
      } catch (error) {
        results.failedChecks.push({
          selector: check.selector,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async runCompleteVerification(url, checkType = 'all') {
    const results = {
      timestamp: new Date().toISOString(),
      url,
      checkType,
      results: {},
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        successRate: 0
      }
    };
    
    try {
      console.log(`🔍 Running ${checkType} implementation verification for: ${url}`);
      
      if (checkType === 'all' || checkType === 'html') {
        results.results.htmlStructure = await this.verifyHTMLStructure(url);
      }
      
      if (checkType === 'all' || checkType === 'css') {
        results.results.cssImplementation = await this.verifyCSSImplementation(url);
      }
      
      if (checkType === 'all' || checkType === 'accessibility') {
        results.results.accessibility = await this.verifyAccessibility(url);
      }
      
      if (checkType === 'all' || checkType === 'responsive') {
        results.results.responsiveDesign = await this.verifyResponsiveDesign(url);
      }
      
      if (checkType === 'all' || checkType === 'performance') {
        results.results.performance = await this.verifyPerformance(url);
      }
      
      // Calculate summary
      results.summary = this.calculateSummary(results.results);
      
      // Generate report
      const reportPath = await this.generateVerificationReport(results);
      console.log(`📊 Verification report generated: ${reportPath}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Implementation verification failed:', error.message);
      results.error = error.message;
      return results;
    }
  }

  calculateSummary(results) {
    let totalChecks = 0;
    let passedChecks = 0;
    
    for (const result of Object.values(results)) {
      if (result.totalChecks) {
        totalChecks += result.totalChecks;
        passedChecks += result.passedChecks;
      }
    }
    
    const successRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    
    return {
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      successRate
    };
  }

  async generateVerificationReport(results) {
    const reportPath = path.join(this.outputDir, `implementation-verification_${this.timestamp}.json`);
    
    const report = {
      executive_summary: {
        overall_compliance: results.summary.successRate >= 95,
        compliance_rate: `${results.summary.successRate.toFixed(1)}%`,
        checks_passed: results.summary.passedChecks,
        checks_failed: results.summary.failedChecks,
        timestamp: results.timestamp
      },
      
      detailed_results: results.results,
      
      recommendations: this.generateRecommendations(results.results),
      
      artifacts: {
        report_generated: results.timestamp,
        verification_type: results.checkType
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    for (const [category, result] of Object.entries(results)) {
      if (result.failedChecks && result.failedChecks.length > 0) {
        recommendations.push({
          category,
          priority: 'high',
          issues: result.failedChecks.length,
          description: `Fix ${result.failedChecks.length} failed checks in ${category}`
        });
      }
    }
    
    return recommendations;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const url = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
  const check = args.find(arg => arg.startsWith('--check='))?.split('=')[1] || 'all';
  
  console.log('🔧 Implementation Verification Tool');
  console.log('===================================');
  console.log(`URL: ${url}`);
  console.log(`Check Type: ${check}`);
  console.log('');
  
  const verifier = new ImplementationVerifier();
  
  try {
    await verifier.initialize();
    
    const results = await verifier.runCompleteVerification(url, check);
    
    console.log('');
    console.log('✅ Verification complete!');
    console.log(`📊 Overall Compliance: ${results.summary.successRate.toFixed(1)}%`);
    console.log(`✅ Checks Passed: ${results.summary.passedChecks}`);
    console.log(`❌ Checks Failed: ${results.summary.failedChecks}`);
    
    if (results.summary.successRate < 95) {
      console.log('');
      console.log('⚠️  Implementation does not meet quality standards');
      console.log('   Review the generated report for detailed recommendations');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await verifier.cleanup();
  }
}

// Export for programmatic use
module.exports = ImplementationVerifier;

// Run CLI if called directly
if (require.main === module) {
  main();
}