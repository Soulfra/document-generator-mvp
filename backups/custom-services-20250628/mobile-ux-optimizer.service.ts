import { promises as fs } from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

export interface MobileUXAnalysisRequest {
  urls: string[];
  devices: MobileDevice[];
  analysisType: 'basic' | 'comprehensive' | 'performance';
  includeScreenshots: boolean;
  customViewports?: ViewportConfig[];
}

export interface MobileDevice {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  userAgent: string;
}

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

export interface UXIssue {
  type: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'touch' | 'layout' | 'performance' | 'accessibility' | 'content';
  title: string;
  description: string;
  element?: string;
  selector?: string;
  screenshot?: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  speedIndex: number;
}

export interface MobileUXReport {
  url: string;
  device: string;
  timestamp: string;
  overallScore: number;
  issues: UXIssue[];
  performanceMetrics: PerformanceMetrics;
  screenshots: {
    desktop: string;
    mobile: string;
    tablet?: string;
  };
  recommendations: {
    quick_wins: UXIssue[];
    high_impact: UXIssue[];
    long_term: UXIssue[];
  };
  responsive_design: {
    score: number;
    breakpoints_detected: string[];
    layout_issues: string[];
  };
  touch_targets: {
    score: number;
    too_small: number;
    too_close: number;
    recommendations: string[];
  };
  content_optimization: {
    text_readability: number;
    image_optimization: number;
    form_usability: number;
  };
}

export interface OptimizationResult {
  success: boolean;
  reports: MobileUXReport[];
  summary: {
    total_issues: number;
    critical_issues: number;
    avg_performance_score: number;
    avg_mobile_score: number;
  };
  actionable_recommendations: string[];
  generated_css?: string;
  generated_js?: string;
}

export class MobileUXOptimizerService {
  private static readonly COMMON_DEVICES: MobileDevice[] = [
    {
      name: 'iPhone 14',
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    },
    {
      name: 'Samsung Galaxy S21',
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      isMobile: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    },
    {
      name: 'iPad Air',
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
      isMobile: false,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    }
  ];

  async optimizeMobileUX(request: MobileUXAnalysisRequest): Promise<OptimizationResult> {
    const reports: MobileUXReport[] = [];
    const browser = await puppeteer.launch({ headless: true });

    try {
      for (const url of request.urls) {
        for (const device of request.devices) {
          const report = await this.analyzePageForDevice(browser, url, device, request);
          reports.push(report);
        }
      }

      const summary = this.generateSummary(reports);
      const recommendations = this.generateActionableRecommendations(reports);

      return {
        success: true,
        reports,
        summary,
        actionable_recommendations: recommendations,
        generated_css: await this.generateOptimizedCSS(reports),
        generated_js: await this.generateOptimizedJS(reports)
      };

    } finally {
      await browser.close();
    }
  }

  private async analyzePageForDevice(
    browser: puppeteer.Browser,
    url: string,
    device: MobileDevice,
    request: MobileUXAnalysisRequest
  ): Promise<MobileUXReport> {
    const page = await browser.newPage();

    try {
      // Set device emulation
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.isMobile
      });

      await page.setUserAgent(device.userAgent);

      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Analyze different aspects
      const issues = await this.detectUXIssues(page, device);
      const performanceMetrics = await this.measurePerformance(page);
      const responsiveDesign = await this.analyzeResponsiveDesign(page);
      const touchTargets = await this.analyzeTouchTargets(page);
      const contentOptimization = await this.analyzeContentOptimization(page);

      // Take screenshots if requested
      const screenshots = request.includeScreenshots 
        ? await this.takeScreenshots(page, url, device)
        : { desktop: '', mobile: '' };

      const overallScore = this.calculateOverallScore(
        issues,
        performanceMetrics,
        responsiveDesign,
        touchTargets,
        contentOptimization
      );

      const recommendations = this.categorizeRecommendations(issues);

      return {
        url,
        device: device.name,
        timestamp: new Date().toISOString(),
        overallScore,
        issues,
        performanceMetrics,
        screenshots,
        recommendations,
        responsive_design: responsiveDesign,
        touch_targets: touchTargets,
        content_optimization: contentOptimization
      };

    } finally {
      await page.close();
    }
  }

  private async detectUXIssues(page: puppeteer.Page, device: MobileDevice): Promise<UXIssue[]> {
    const issues: UXIssue[] = [];

    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const clickableElements = document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]');
      const smallTargets = [];

      clickableElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Touch targets should be at least 44px (recommended 48px)
        if (rect.width < 44 || rect.height < 44) {
          smallTargets.push({
            index,
            width: rect.width,
            height: rect.height,
            selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className ? `.${element.className.split(' ')[0]}` : ''),
            text: element.textContent?.substring(0, 50) || ''
          });
        }
      });

      return smallTargets;
    });

    touchTargets.forEach(target => {
      issues.push({
        type: 'major',
        category: 'touch',
        title: 'Touch Target Too Small',
        description: `Touch target is ${target.width}x${target.height}px, smaller than recommended 44x44px minimum`,
        selector: target.selector,
        recommendation: 'Increase padding or min-width/min-height to at least 44px',
        impact: 'high',
        effort: 'low'
      });
    });

    // Check text readability
    const textIssues = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      const readabilityIssues = [];

      textElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseInt(computedStyle.fontSize);
        const lineHeight = parseFloat(computedStyle.lineHeight);

        // Text should be at least 16px on mobile
        if (fontSize < 16) {
          readabilityIssues.push({
            index,
            fontSize,
            selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className ? `.${element.className.split(' ')[0]}` : ''),
            issue: 'small_text'
          });
        }

        // Line height should be at least 1.4
        if (lineHeight < 1.4 && lineHeight !== 0) {
          readabilityIssues.push({
            index,
            lineHeight,
            selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className ? `.${element.className.split(' ')[0]}` : ''),
            issue: 'poor_line_height'
          });
        }
      });

      return readabilityIssues;
    });

    textIssues.forEach(issue => {
      if (issue.issue === 'small_text') {
        issues.push({
          type: 'major',
          category: 'content',
          title: 'Text Too Small for Mobile',
          description: `Text is ${issue.fontSize}px, smaller than recommended 16px minimum for mobile`,
          selector: issue.selector,
          recommendation: 'Increase font-size to at least 16px for mobile screens',
          impact: 'medium',
          effort: 'low'
        });
      } else if (issue.issue === 'poor_line_height') {
        issues.push({
          type: 'minor',
          category: 'content',
          title: 'Poor Line Height',
          description: `Line height is ${issue.lineHeight}, should be at least 1.4 for readability`,
          selector: issue.selector,
          recommendation: 'Set line-height to at least 1.4 for better readability',
          impact: 'low',
          effort: 'low'
        });
      }
    });

    // Check horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      issues.push({
        type: 'critical',
        category: 'layout',
        title: 'Horizontal Scrolling Detected',
        description: 'Page content extends beyond viewport width, requiring horizontal scrolling',
        recommendation: 'Use responsive design techniques, check for fixed widths, and ensure content fits viewport',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Check form usability
    const formIssues = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const issues = [];

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
          const label = form.querySelector(`label[for="${input.id}"]`) || input.closest('label');
          
          if (!label && input.type !== 'hidden' && input.type !== 'submit') {
            issues.push({
              selector: input.tagName.toLowerCase() + (input.id ? `#${input.id}` : '') + (input.name ? `[name="${input.name}"]` : ''),
              issue: 'missing_label'
            });
          }

          // Check input size for mobile
          const rect = input.getBoundingClientRect();
          if (rect.height < 44) {
            issues.push({
              selector: input.tagName.toLowerCase() + (input.id ? `#${input.id}` : '') + (input.name ? `[name="${input.name}"]` : ''),
              issue: 'small_input',
              height: rect.height
            });
          }
        });
      });

      return issues;
    });

    formIssues.forEach(issue => {
      if (issue.issue === 'missing_label') {
        issues.push({
          type: 'major',
          category: 'accessibility',
          title: 'Form Input Missing Label',
          description: 'Form input does not have an associated label',
          selector: issue.selector,
          recommendation: 'Add a label element or aria-label attribute for better accessibility',
          impact: 'medium',
          effort: 'low'
        });
      } else if (issue.issue === 'small_input') {
        issues.push({
          type: 'major',
          category: 'touch',
          title: 'Form Input Too Small',
          description: `Form input height is ${issue.height}px, smaller than recommended 44px`,
          selector: issue.selector,
          recommendation: 'Increase input height/padding to at least 44px for better touch interaction',
          impact: 'medium',
          effort: 'low'
        });
      }
    });

    return issues;
  }

  private async measurePerformance(page: puppeteer.Page): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = 0; // Would need additional setup for real LCP measurement
      
      return {
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: 0, // Would need additional setup
        firstInputDelay: 0, // Would need additional setup
        timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
        speedIndex: 0 // Would need additional setup
      };
    });

    return metrics;
  }

  private async analyzeResponsiveDesign(page: puppeteer.Page): Promise<{ score: number; breakpoints_detected: string[]; layout_issues: string[] }> {
    const analysis = await page.evaluate(() => {
      // Check for common responsive patterns
      const styleSheets = Array.from(document.styleSheets);
      const breakpoints = [];
      const layoutIssues = [];

      // Look for media queries
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              const mediaRule = rule as CSSMediaRule;
              breakpoints.push(mediaRule.conditionText);
            }
          });
        } catch (e) {
          // Cross-origin stylesheet
        }
      });

      // Check for viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        layoutIssues.push('Missing viewport meta tag');
      }

      // Check for fixed widths
      const elementsWithFixedWidth = document.querySelectorAll('[style*="width:"][style*="px"]');
      if (elementsWithFixedWidth.length > 0) {
        layoutIssues.push(`${elementsWithFixedWidth.length} elements with fixed pixel widths detected`);
      }

      return {
        breakpoints: [...new Set(breakpoints)],
        layoutIssues
      };
    });

    const score = Math.max(0, 100 - (analysis.layoutIssues.length * 20));

    return {
      score,
      breakpoints_detected: analysis.breakpoints,
      layout_issues: analysis.layoutIssues
    };
  }

  private async analyzeTouchTargets(page: puppeteer.Page): Promise<{ score: number; too_small: number; too_close: number; recommendations: string[] }> {
    const analysis = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]');
      let tooSmall = 0;
      let tooClose = 0;
      const recommendations = [];

      const elementRects = Array.from(interactiveElements).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          rect,
          center: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          }
        };
      });

      // Check sizes
      elementRects.forEach(({ element, rect }) => {
        if (rect.width < 44 || rect.height < 44) {
          tooSmall++;
        }
      });

      // Check proximity
      elementRects.forEach((current, i) => {
        elementRects.slice(i + 1).forEach(other => {
          const distance = Math.sqrt(
            Math.pow(current.center.x - other.center.x, 2) +
            Math.pow(current.center.y - other.center.y, 2)
          );
          
          if (distance < 48) { // 48px recommended minimum distance
            tooClose++;
          }
        });
      });

      if (tooSmall > 0) {
        recommendations.push(`Increase size of ${tooSmall} touch targets to at least 44x44px`);
      }
      if (tooClose > 0) {
        recommendations.push(`Increase spacing between ${tooClose} touch targets (minimum 8px)`);
      }

      return { tooSmall, tooClose, recommendations };
    });

    const totalElements = await page.evaluate(() => 
      document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]').length
    );

    const score = Math.max(0, 100 - ((analysis.tooSmall + analysis.tooClose) / totalElements * 100));

    return {
      score,
      too_small: analysis.tooSmall,
      too_close: analysis.tooClose,
      recommendations: analysis.recommendations
    };
  }

  private async analyzeContentOptimization(page: puppeteer.Page): Promise<{ text_readability: number; image_optimization: number; form_usability: number }> {
    const analysis = await page.evaluate(() => {
      // Text readability
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let readableTextCount = 0;
      
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight);
        
        if (fontSize >= 16 && (lineHeight >= 1.4 || lineHeight === 0)) {
          readableTextCount++;
        }
      });

      const textReadability = textElements.length > 0 ? (readableTextCount / textElements.length) * 100 : 100;

      // Image optimization
      const images = document.querySelectorAll('img');
      let optimizedImages = 0;

      images.forEach(img => {
        const hasAlt = img.hasAttribute('alt');
        const hasResponsive = img.hasAttribute('srcset') || img.style.maxWidth === '100%';
        
        if (hasAlt && hasResponsive) {
          optimizedImages++;
        }
      });

      const imageOptimization = images.length > 0 ? (optimizedImages / images.length) * 100 : 100;

      // Form usability
      const forms = document.querySelectorAll('form');
      let usableForms = 0;

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        let hasLabels = true;
        let appropriateSize = true;

        inputs.forEach(input => {
          if (input.type === 'hidden' || input.type === 'submit') return;
          
          const label = form.querySelector(`label[for="${input.id}"]`) || input.closest('label');
          if (!label) hasLabels = false;

          const rect = input.getBoundingClientRect();
          if (rect.height < 44) appropriateSize = false;
        });

        if (hasLabels && appropriateSize) {
          usableForms++;
        }
      });

      const formUsability = forms.length > 0 ? (usableForms / forms.length) * 100 : 100;

      return {
        text_readability: textReadability,
        image_optimization: imageOptimization,
        form_usability: formUsability
      };
    });

    return analysis;
  }

  private async takeScreenshots(page: puppeteer.Page, url: string, device: MobileDevice): Promise<{ desktop: string; mobile: string; tablet?: string }> {
    const screenshots = {
      desktop: '',
      mobile: '',
      tablet: undefined
    };

    // Mobile screenshot (current state)
    const mobileScreenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    screenshots.mobile = `data:image/png;base64,${mobileScreenshot.toString('base64')}`;

    // Desktop screenshot
    await page.setViewport({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle2' });
    const desktopScreenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    screenshots.desktop = `data:image/png;base64,${desktopScreenshot.toString('base64')}`;

    // Restore mobile viewport
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile
    });

    return screenshots;
  }

  private calculateOverallScore(
    issues: UXIssue[],
    performance: PerformanceMetrics,
    responsive: any,
    touchTargets: any,
    content: any
  ): number {
    const criticalIssues = issues.filter(i => i.type === 'critical').length;
    const majorIssues = issues.filter(i => i.type === 'major').length;
    const minorIssues = issues.filter(i => i.type === 'minor').length;

    const issueScore = Math.max(0, 100 - (criticalIssues * 25 + majorIssues * 10 + minorIssues * 5));
    const performanceScore = performance.firstContentfulPaint < 2000 ? 100 : Math.max(0, 100 - (performance.firstContentfulPaint - 2000) / 100);
    
    return Math.round((issueScore * 0.4 + performanceScore * 0.2 + responsive.score * 0.2 + touchTargets.score * 0.1 + ((content.text_readability + content.image_optimization + content.form_usability) / 3) * 0.1));
  }

  private categorizeRecommendations(issues: UXIssue[]): { quick_wins: UXIssue[]; high_impact: UXIssue[]; long_term: UXIssue[] } {
    return {
      quick_wins: issues.filter(i => i.effort === 'low' && i.impact !== 'low'),
      high_impact: issues.filter(i => i.impact === 'high'),
      long_term: issues.filter(i => i.effort === 'high' || i.type === 'suggestion')
    };
  }

  private generateSummary(reports: MobileUXReport[]): { total_issues: number; critical_issues: number; avg_performance_score: number; avg_mobile_score: number } {
    const totalIssues = reports.reduce((sum, report) => sum + report.issues.length, 0);
    const criticalIssues = reports.reduce((sum, report) => sum + report.issues.filter(i => i.type === 'critical').length, 0);
    const avgMobileScore = reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length;
    const avgPerformanceScore = reports.reduce((sum, report) => {
      return sum + (report.performanceMetrics.firstContentfulPaint < 2000 ? 100 : Math.max(0, 100 - (report.performanceMetrics.firstContentfulPaint - 2000) / 100));
    }, 0) / reports.length;

    return {
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      avg_performance_score: Math.round(avgPerformanceScore),
      avg_mobile_score: Math.round(avgMobileScore)
    };
  }

  private generateActionableRecommendations(reports: MobileUXReport[]): string[] {
    const recommendations = new Set<string>();

    reports.forEach(report => {
      report.recommendations.quick_wins.forEach(issue => {
        recommendations.add(issue.recommendation);
      });
      
      report.recommendations.high_impact.forEach(issue => {
        recommendations.add(issue.recommendation);
      });
    });

    return Array.from(recommendations);
  }

  private async generateOptimizedCSS(reports: MobileUXReport[]): Promise<string> {
    const cssRules = [];

    // Add common mobile optimizations
    cssRules.push(`
/* Mobile UX Optimizations Generated by FinishThisIdea */

/* Ensure viewport is set */
@viewport {
  width: device-width;
  initial-scale: 1;
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
}

/* Touch target sizing */
a, button, input, select, textarea, [onclick], [role="button"] {
  min-height: 44px;
  min-width: 44px;
  padding: 8px;
}

/* Readable text on mobile */
@media (max-width: 768px) {
  body {
    font-size: 16px;
    line-height: 1.4;
  }
  
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
  }
}

/* Form improvements */
input, select, textarea {
  font-size: 16px; /* Prevents zoom on iOS */
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

/* Prevent horizontal scrolling */
* {
  box-sizing: border-box;
}

.container {
  max-width: 100%;
  overflow-x: hidden;
}
`);

    return cssRules.join('\n');
  }

  private async generateOptimizedJS(reports: MobileUXReport[]): Promise<string> {
    return `
/* Mobile UX JavaScript Optimizations Generated by FinishThisIdea */

(function() {
  'use strict';

  // Add touch feedback for interactive elements
  function addTouchFeedback() {
    const interactiveElements = document.querySelectorAll('a, button, [onclick], [role="button"]');
    
    interactiveElements.forEach(element => {
      element.addEventListener('touchstart', function() {
        this.style.opacity = '0.7';
      });
      
      element.addEventListener('touchend', function() {
        this.style.opacity = '';
      });
    });
  }

  // Improve form validation for mobile
  function improveMobileForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        // Add better mobile keyboard types
        if (input.type === 'email' && !input.getAttribute('inputmode')) {
          input.setAttribute('inputmode', 'email');
        }
        if (input.type === 'tel' && !input.getAttribute('inputmode')) {
          input.setAttribute('inputmode', 'tel');
        }
        if (input.type === 'number' && !input.getAttribute('inputmode')) {
          input.setAttribute('inputmode', 'numeric');
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addTouchFeedback();
      improveMobileForms();
    });
  } else {
    addTouchFeedback();
    improveMobileForms();
  }
})();
`;
  }

  static getCommonDevices(): MobileDevice[] {
    return [...this.COMMON_DEVICES];
  }
}

export const mobileUXOptimizer = new MobileUXOptimizerService();