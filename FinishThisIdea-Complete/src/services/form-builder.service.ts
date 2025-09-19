/**
 * Dynamic Form Builder Service
 * Converts documents to forms, tracks analytics, multi-step wizards
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { analyticsService } from './analytics.service';
import { aiService } from './ai.service';
import { prisma } from '../lib/prisma';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'date' | 'time' | 'hidden';
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customValidator?: string; // JS function as string
  };
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  analytics?: {
    trackFocus?: boolean;
    trackChange?: boolean;
    trackTime?: boolean;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  navigation?: {
    showPrevious: boolean;
    showNext: boolean;
    showSkip?: boolean;
  };
  validation?: {
    requireAllFields?: boolean;
    customValidator?: string;
  };
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  version: string;
  type: 'single' | 'multi-step' | 'wizard';
  steps: FormStep[];
  settings?: {
    saveProgress?: boolean;
    showProgressBar?: boolean;
    allowNavigation?: boolean;
    submitButton?: {
      text: string;
      style?: Record<string, any>;
    };
    successMessage?: string;
    redirectUrl?: string;
  };
  styling?: {
    theme: 'default' | 'modern' | 'minimal' | 'dark';
    customCSS?: string;
    fieldLayout?: 'vertical' | 'horizontal' | 'grid';
  };
  analytics?: {
    trackSubmissions?: boolean;
    trackAbandonment?: boolean;
    trackFieldErrors?: boolean;
    trackTimeSpent?: boolean;
    conversionGoal?: string;
  };
  integrations?: {
    webhook?: {
      url: string;
      method: 'POST' | 'PUT';
      headers?: Record<string, string>;
    };
    email?: {
      to: string[];
      subject: string;
      template?: string;
    };
    slack?: {
      webhookUrl: string;
      channel?: string;
    };
    zapier?: {
      webhookUrl: string;
    };
  };
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
  };
  analytics?: {
    timeSpent?: number;
    fieldErrors?: Record<string, number>;
    abandonedAt?: string;
  };
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface FormTemplate {
  id: string;
  name: string;
  category: 'onboarding' | 'survey' | 'registration' | 'feedback' | 'application' | 'checkout' | 'contact';
  description: string;
  schema: FormSchema;
  popularity: number;
  tags: string[];
}

export class FormBuilderService extends EventEmitter {
  private templates: Map<string, FormTemplate> = new Map();
  private activeSubmissions: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default form templates
   */
  private initializeDefaultTemplates(): void {
    const templates: FormTemplate[] = [
      {
        id: 'user-onboarding',
        name: 'User Onboarding',
        category: 'onboarding',
        description: 'Multi-step user onboarding with profile setup',
        popularity: 95,
        tags: ['onboarding', 'user', 'profile', 'wizard'],
        schema: this.createOnboardingTemplate()
      },
      {
        id: 'contact-form',
        name: 'Contact Form',
        category: 'contact',
        description: 'Simple contact form with email integration',
        popularity: 90,
        tags: ['contact', 'email', 'support'],
        schema: this.createContactTemplate()
      },
      {
        id: 'feedback-survey',
        name: 'Feedback Survey',
        category: 'survey',
        description: 'Customer feedback survey with ratings',
        popularity: 85,
        tags: ['survey', 'feedback', 'ratings'],
        schema: this.createFeedbackTemplate()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Create onboarding template
   */
  private createOnboardingTemplate(): FormSchema {
    return {
      id: 'onboarding-form',
      name: 'User Onboarding',
      version: '1.0.0',
      type: 'wizard',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome! Let\'s get started',
          description: 'Tell us a bit about yourself',
          fields: [
            {
              id: 'fullName',
              type: 'text',
              name: 'fullName',
              label: 'Full Name',
              placeholder: 'John Doe',
              required: true,
              validation: {
                minLength: 2,
                pattern: '^[a-zA-Z\\s]+$'
              }
            },
            {
              id: 'email',
              type: 'email',
              name: 'email',
              label: 'Email Address',
              placeholder: 'john@example.com',
              required: true
            }
          ],
          navigation: {
            showPrevious: false,
            showNext: true
          }
        },
        {
          id: 'profile',
          title: 'Create your profile',
          fields: [
            {
              id: 'company',
              type: 'text',
              name: 'company',
              label: 'Company Name',
              placeholder: 'Acme Inc.',
              required: false
            },
            {
              id: 'role',
              type: 'select',
              name: 'role',
              label: 'Your Role',
              required: true,
              options: [
                { value: 'developer', label: 'Developer' },
                { value: 'designer', label: 'Designer' },
                { value: 'manager', label: 'Product Manager' },
                { value: 'other', label: 'Other' }
              ]
            },
            {
              id: 'teamSize',
              type: 'select',
              name: 'teamSize',
              label: 'Team Size',
              options: [
                { value: '1', label: 'Just me' },
                { value: '2-5', label: '2-5 people' },
                { value: '6-20', label: '6-20 people' },
                { value: '20+', label: '20+ people' }
              ]
            }
          ],
          navigation: {
            showPrevious: true,
            showNext: true
          }
        },
        {
          id: 'preferences',
          title: 'Set your preferences',
          fields: [
            {
              id: 'notifications',
              type: 'checkbox',
              name: 'notifications',
              label: 'Send me product updates',
              defaultValue: true
            },
            {
              id: 'newsletter',
              type: 'checkbox',
              name: 'newsletter',
              label: 'Subscribe to newsletter',
              defaultValue: true
            }
          ],
          navigation: {
            showPrevious: true,
            showNext: false
          }
        }
      ],
      settings: {
        saveProgress: true,
        showProgressBar: true,
        submitButton: {
          text: 'Complete Onboarding'
        },
        successMessage: 'Welcome aboard! Redirecting to your dashboard...',
        redirectUrl: '/dashboard'
      },
      analytics: {
        trackSubmissions: true,
        trackAbandonment: true,
        trackTimeSpent: true,
        conversionGoal: 'onboarding_completed'
      }
    };
  }

  /**
   * Create contact template
   */
  private createContactTemplate(): FormSchema {
    return {
      id: 'contact-form',
      name: 'Contact Us',
      version: '1.0.0',
      type: 'single',
      steps: [{
        id: 'contact',
        title: 'Get in Touch',
        fields: [
          {
            id: 'name',
            type: 'text',
            name: 'name',
            label: 'Your Name',
            required: true
          },
          {
            id: 'email',
            type: 'email',
            name: 'email',
            label: 'Email Address',
            required: true
          },
          {
            id: 'subject',
            type: 'text',
            name: 'subject',
            label: 'Subject',
            required: true
          },
          {
            id: 'message',
            type: 'textarea',
            name: 'message',
            label: 'Message',
            required: true,
            validation: {
              minLength: 10
            }
          }
        ],
        navigation: {
          showPrevious: false,
          showNext: false
        }
      }],
      settings: {
        submitButton: {
          text: 'Send Message'
        },
        successMessage: 'Thank you! We\'ll get back to you soon.'
      }
    };
  }

  /**
   * Create feedback template
   */
  private createFeedbackTemplate(): FormSchema {
    return {
      id: 'feedback-form',
      name: 'Feedback Survey',
      version: '1.0.0',
      type: 'single',
      steps: [{
        id: 'feedback',
        title: 'We value your feedback',
        fields: [
          {
            id: 'rating',
            type: 'radio',
            name: 'rating',
            label: 'How would you rate your experience?',
            required: true,
            options: [
              { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
              { value: '4', label: '⭐⭐⭐⭐ Good' },
              { value: '3', label: '⭐⭐⭐ Average' },
              { value: '2', label: '⭐⭐ Poor' },
              { value: '1', label: '⭐ Very Poor' }
            ]
          },
          {
            id: 'feedback',
            type: 'textarea',
            name: 'feedback',
            label: 'Additional Comments',
            placeholder: 'Tell us more about your experience...',
            required: false
          }
        ],
        navigation: {
          showPrevious: false,
          showNext: false
        }
      }]
    };
  }

  /**
   * Generate form from document
   */
  async generateFormFromDocument(document: {
    content: string;
    type?: string;
    context?: any;
  }): Promise<FormSchema> {
    logger.info('Generating form from document', { 
      contentLength: document.content.length,
      type: document.type 
    });

    try {
      // Use AI to analyze document and extract form requirements
      const analysis = await aiService.analyzeDocument(document.content, {
        task: 'extract_form_requirements',
        includeFields: true,
        includeValidation: true,
        includeFlow: true
      });

      // Convert AI analysis to form schema
      const formSchema = this.convertAnalysisToFormSchema(analysis);

      // Track form generation
      await analyticsService.trackEvent({
        name: 'form_generated_from_document',
        properties: {
          documentType: document.type,
          fieldCount: formSchema.steps.reduce((acc, step) => acc + step.fields.length, 0),
          stepCount: formSchema.steps.length,
          formType: formSchema.type
        }
      });

      return formSchema;
    } catch (error) {
      logger.error('Failed to generate form from document', { error });
      throw error;
    }
  }

  /**
   * Convert AI analysis to form schema
   */
  private convertAnalysisToFormSchema(analysis: any): FormSchema {
    const formId = `form-${Date.now()}`;
    
    return {
      id: formId,
      name: analysis.title || 'Generated Form',
      description: analysis.description,
      version: '1.0.0',
      type: analysis.steps?.length > 1 ? 'wizard' : 'single',
      steps: this.generateFormSteps(analysis),
      settings: {
        saveProgress: analysis.steps?.length > 1,
        showProgressBar: analysis.steps?.length > 1,
        submitButton: {
          text: analysis.submitButtonText || 'Submit'
        },
        successMessage: analysis.successMessage
      },
      analytics: {
        trackSubmissions: true,
        trackAbandonment: true,
        trackFieldErrors: true,
        trackTimeSpent: true
      }
    };
  }

  /**
   * Generate form steps from AI analysis
   */
  private generateFormSteps(analysis: any): FormStep[] {
    if (analysis.steps) {
      return analysis.steps.map((step: any, index: number) => ({
        id: step.id || `step-${index}`,
        title: step.title,
        description: step.description,
        fields: this.generateFormFields(step.fields || analysis.fields),
        navigation: {
          showPrevious: index > 0,
          showNext: index < analysis.steps.length - 1
        }
      }));
    }

    // Single step form
    return [{
      id: 'main',
      title: analysis.title || 'Form',
      fields: this.generateFormFields(analysis.fields),
      navigation: {
        showPrevious: false,
        showNext: false
      }
    }];
  }

  /**
   * Generate form fields from AI analysis
   */
  private generateFormFields(fields: any[]): FormField[] {
    return fields.map(field => ({
      id: field.id || field.name,
      type: this.mapFieldType(field.type),
      name: field.name,
      label: field.label || this.humanizeFieldName(field.name),
      placeholder: field.placeholder,
      required: field.required || false,
      validation: field.validation,
      options: field.options,
      defaultValue: field.defaultValue,
      analytics: {
        trackFocus: true,
        trackChange: true,
        trackTime: field.important || false
      }
    }));
  }

  /**
   * Map AI field type to form field type
   */
  private mapFieldType(aiType: string): FormField['type'] {
    const typeMap: Record<string, FormField['type']> = {
      'string': 'text',
      'email': 'email',
      'password': 'password',
      'number': 'number',
      'integer': 'number',
      'boolean': 'checkbox',
      'select': 'select',
      'multiselect': 'checkbox',
      'text': 'textarea',
      'date': 'date',
      'time': 'time',
      'file': 'file'
    };

    return typeMap[aiType] || 'text';
  }

  /**
   * Humanize field name
   */
  private humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Create form from template
   */
  async createFormFromTemplate(templateId: string, customizations?: Partial<FormSchema>): Promise<FormSchema> {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Clone template schema
    const formSchema = JSON.parse(JSON.stringify(template.schema));
    
    // Apply customizations
    if (customizations) {
      Object.assign(formSchema, customizations);
    }

    // Generate unique ID
    formSchema.id = `${templateId}-${Date.now()}`;

    // Track template usage
    await analyticsService.trackEvent({
      name: 'form_created_from_template',
      properties: {
        templateId,
        templateCategory: template.category,
        customized: !!customizations
      }
    });

    return formSchema;
  }

  /**
   * Validate form submission
   */
  async validateSubmission(formSchema: FormSchema, data: Record<string, any>): Promise<{
    valid: boolean;
    errors: Record<string, string>;
  }> {
    const errors: Record<string, string> = {};
    
    // Validate each step
    for (const step of formSchema.steps) {
      for (const field of step.fields) {
        const value = data[field.name];
        
        // Required field validation
        if (field.required && !value) {
          errors[field.name] = `${field.label} is required`;
          continue;
        }
        
        // Type-specific validation
        if (value && field.validation) {
          const error = this.validateFieldValue(field, value);
          if (error) {
            errors[field.name] = error;
          }
        }
        
        // Conditional field validation
        if (field.conditional && !this.evaluateCondition(field.conditional, data)) {
          delete data[field.name]; // Remove conditional field if condition not met
        }
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate field value
   */
  private validateFieldValue(field: FormField, value: any): string | null {
    const validation = field.validation!;
    
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `${field.label} format is invalid`;
      }
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${field.label} must be at most ${validation.maxLength} characters`;
    }
    
    if (validation.min && Number(value) < validation.min) {
      return `${field.label} must be at least ${validation.min}`;
    }
    
    if (validation.max && Number(value) > validation.max) {
      return `${field.label} must be at most ${validation.max}`;
    }
    
    return null;
  }

  /**
   * Evaluate conditional field
   */
  private evaluateCondition(condition: FormField['conditional'], data: Record<string, any>): boolean {
    if (!condition) return true;
    
    const fieldValue = data[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  }

  /**
   * Submit form
   */
  async submitForm(formId: string, data: Record<string, any>, metadata?: any): Promise<FormSubmission> {
    const submissionId = `submission-${Date.now()}`;
    const startTime = this.activeSubmissions.get(`${formId}-start`);
    const timeSpent = startTime ? Date.now() - startTime : undefined;
    
    const submission: FormSubmission = {
      id: submissionId,
      formId,
      data,
      metadata: {
        ...metadata,
        sessionId: metadata?.sessionId || `session-${Date.now()}`
      },
      analytics: {
        timeSpent
      },
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save submission
    await this.saveSubmission(submission);
    
    // Track submission
    await analyticsService.trackEvent({
      name: 'form_submitted',
      properties: {
        formId,
        fieldCount: Object.keys(data).length,
        timeSpent
      }
    });
    
    // Process integrations
    await this.processIntegrations(formId, submission);
    
    // Update status
    submission.status = 'completed';
    await this.updateSubmission(submission);
    
    this.emit('form:submitted', submission);
    
    return submission;
  }

  /**
   * Save form submission
   */
  private async saveSubmission(submission: FormSubmission): Promise<void> {
    // In a real implementation, this would save to database
    logger.info('Saving form submission', { 
      submissionId: submission.id,
      formId: submission.formId 
    });
  }

  /**
   * Update form submission
   */
  private async updateSubmission(submission: FormSubmission): Promise<void> {
    submission.updatedAt = new Date();
    await this.saveSubmission(submission);
  }

  /**
   * Process form integrations
   */
  private async processIntegrations(formId: string, submission: FormSubmission): Promise<void> {
    // This would handle webhook, email, Slack, etc. integrations
    logger.info('Processing form integrations', { formId, submissionId: submission.id });
  }

  /**
   * Track form analytics
   */
  async trackFormAnalytics(formId: string, event: string, data?: any): Promise<void> {
    await analyticsService.trackEvent({
      name: `form_${event}`,
      properties: {
        formId,
        ...data
      }
    });
    
    // Special handling for form start
    if (event === 'started') {
      this.activeSubmissions.set(`${formId}-start`, Date.now());
    }
  }

  /**
   * Get form analytics
   */
  async getFormAnalytics(formId: string, timeframe?: { start: Date; end: Date }): Promise<{
    submissions: number;
    conversionRate: number;
    abandonmentRate: number;
    averageTimeSpent: number;
    fieldErrors: Record<string, number>;
    dropoffPoints: Array<{ step: string; count: number }>;
  }> {
    // This would fetch real analytics data
    return {
      submissions: 150,
      conversionRate: 0.65,
      abandonmentRate: 0.35,
      averageTimeSpent: 120000, // 2 minutes
      fieldErrors: {
        email: 23,
        phone: 15
      },
      dropoffPoints: [
        { step: 'profile', count: 45 },
        { step: 'preferences', count: 20 }
      ]
    };
  }

  /**
   * Export form schema
   */
  exportFormSchema(formSchema: FormSchema, format: 'json' | 'yaml' | 'html'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(formSchema, null, 2);
      
      case 'yaml':
        // Would use js-yaml
        return '# YAML export not implemented';
      
      case 'html':
        return this.generateHTMLForm(formSchema);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate HTML form
   */
  private generateHTMLForm(formSchema: FormSchema): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${formSchema.name}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    /* Form styles */
    .form-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .form-step { display: none; }
    .form-step.active { display: block; }
    .form-field { margin-bottom: 20px; }
    .form-label { display: block; margin-bottom: 5px; font-weight: bold; }
    .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .form-button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .progress-bar { height: 4px; background: #ddd; margin-bottom: 20px; }
    .progress-fill { height: 100%; background: #007bff; transition: width 0.3s; }
  </style>
</head>
<body>
  <div class="form-container">
    <h1>${formSchema.name}</h1>
    ${formSchema.description ? `<p>${formSchema.description}</p>` : ''}
    
    ${formSchema.settings?.showProgressBar ? '<div class="progress-bar"><div class="progress-fill" id="progress"></div></div>' : ''}
    
    <form id="dynamicForm">
`;

    // Generate form steps
    formSchema.steps.forEach((step, index) => {
      html += `
      <div class="form-step ${index === 0 ? 'active' : ''}" data-step="${step.id}">
        <h2>${step.title}</h2>
        ${step.description ? `<p>${step.description}</p>` : ''}
        
        ${step.fields.map(field => this.generateHTMLField(field)).join('\n')}
        
        <div class="form-navigation">
          ${step.navigation?.showPrevious ? '<button type="button" class="form-button" onclick="previousStep()">Previous</button>' : ''}
          ${step.navigation?.showNext ? '<button type="button" class="form-button" onclick="nextStep()">Next</button>' : ''}
          ${!step.navigation?.showNext && index === formSchema.steps.length - 1 ? `<button type="submit" class="form-button">${formSchema.settings?.submitButton?.text || 'Submit'}</button>` : ''}
        </div>
      </div>
`;
    });

    html += `
    </form>
  </div>
  
  <script>
    // Form navigation logic
    let currentStep = 0;
    const steps = document.querySelectorAll('.form-step');
    
    function showStep(index) {
      steps.forEach((step, i) => {
        step.classList.toggle('active', i === index);
      });
      updateProgress();
    }
    
    function nextStep() {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    }
    
    function previousStep() {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    }
    
    function updateProgress() {
      const progress = document.getElementById('progress');
      if (progress) {
        progress.style.width = ((currentStep + 1) / steps.length * 100) + '%';
      }
    }
    
    // Form submission
    document.getElementById('dynamicForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      console.log('Form submitted:', data);
      alert('${formSchema.settings?.successMessage || 'Form submitted successfully!'}');
    });
  </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generate HTML field
   */
  private generateHTMLField(field: FormField): string {
    let html = `<div class="form-field">
  <label class="form-label" for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>`;

    switch (field.type) {
      case 'select':
        html += `<select class="form-input" id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''}>
    <option value="">Select...</option>
    ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n')}
  </select>`;
        break;

      case 'textarea':
        html += `<textarea class="form-input" id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''}>${field.defaultValue || ''}</textarea>`;
        break;

      case 'checkbox':
        html += `<input type="checkbox" id="${field.id}" name="${field.name}" ${field.defaultValue ? 'checked' : ''}>`;
        break;

      case 'radio':
        html += field.options?.map(opt => `
    <label><input type="radio" name="${field.name}" value="${opt.value}" ${field.required ? 'required' : ''}> ${opt.label}</label>`).join('<br>') || '';
        break;

      default:
        html += `<input class="form-input" type="${field.type}" id="${field.id}" name="${field.name}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.required ? 'required' : ''} ${field.defaultValue ? `value="${field.defaultValue}"` : ''}>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Get all templates
   */
  getTemplates(): FormTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by category
   */
  getTemplatesByCategory(category: FormTemplate['category']): FormTemplate[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): FormTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getTemplates().filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
}

// Export singleton instance
export const formBuilderService = new FormBuilderService();