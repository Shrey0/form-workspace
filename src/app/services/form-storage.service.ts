// src/app/services/form-storage.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormConfiguration } from '../models/form-field.interface';

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  configuration: FormConfiguration;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  submissionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormStorageService {
  private readonly STORAGE_KEY = 'dynamic-form-templates';
  private templatesSubject = new BehaviorSubject<FormTemplate[]>([]);

  templates$ = this.templatesSubject.asObservable();

  constructor() {
    this.loadTemplatesFromStorage();
  }

  private loadTemplatesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const templates = parsed.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
          configuration: {
            ...template.configuration,
            createdAt: new Date(template.configuration.createdAt),
            updatedAt: new Date(template.configuration.updatedAt)
          }
        }));
        this.templatesSubject.next(templates);
      } else {
        // Initialize with sample templates
        this.initializeSampleTemplates();
      }
    } catch (error) {
      console.error('Error loading form templates:', error);
      this.initializeSampleTemplates();
    }
  }

  private saveTemplatesToStorage(): void {
    try {
      const templates = this.templatesSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving form templates:', error);
    }
  }

  private initializeSampleTemplates(): void {
    const sampleTemplates: FormTemplate[] = [
      {
        id: 'sample-1',
        name: 'Contact Form',
        description: 'Basic contact form with name, email, and message',
        isPublished: true,
        submissionCount: 15,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        configuration: {
          id: 'contact-form-config',
          name: 'Contact Form',
          description: 'Basic contact form',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          fields: [
            {
              id: 'name-field',
              type: 'text',
              label: 'Full Name',
              required: true,
              placeholder: 'Enter your full name',
              validationRules: [
                { type: 'required', message: 'Name is required' },
                { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' }
              ]
            },
            {
              id: 'email-field',
              type: 'text',
              label: 'Email Address',
              required: true,
              placeholder: 'Enter your email',
              validationRules: [
                { type: 'required', message: 'Email is required' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]
            },
            {
              id: 'message-field',
              type: 'textarea',
              label: 'Message',
              required: true,
              placeholder: 'Enter your message',
              validationRules: [
                { type: 'required', message: 'Message is required' },
                { type: 'minLength', value: 10, message: 'Message must be at least 10 characters' }
              ]
            }
          ]
        }
      },
      {
        id: 'sample-2',
        name: 'Job Application',
        description: 'Comprehensive job application form',
        isPublished: false,
        submissionCount: 0,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        configuration: {
          id: 'job-app-config',
          name: 'Job Application Form',
          description: 'Apply for open positions',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
          fields: [
            {
              id: 'position-field',
              type: 'select',
              label: 'Position Applying For',
              required: true,
              validationRules: [
                { type: 'required', message: 'Please select a position' }
              ],
              options: [
                { value: 'frontend', label: 'Frontend Developer' },
                { value: 'backend', label: 'Backend Developer' },
                { value: 'fullstack', label: 'Full Stack Developer' },
                { value: 'designer', label: 'UI/UX Designer' }
              ]
            },
            {
              id: 'experience-field',
              type: 'radio-group',
              label: 'Years of Experience',
              required: true,
              validationRules: [
                { type: 'required', message: 'Please select your experience level' }
              ],
              options: [
                { value: '0-1', label: '0-1 years' },
                { value: '2-5', label: '2-5 years' },
                { value: '6-10', label: '6-10 years' },
                { value: '10+', label: '10+ years' }
              ]
            },
            {
              id: 'availability-field',
              type: 'date',
              label: 'Available Start Date',
              required: true,
              validationRules: [
                { type: 'required', message: 'Please provide your availability' }
              ]
            }
          ]
        }
      }
    ];

    this.templatesSubject.next(sampleTemplates);
    this.saveTemplatesToStorage();
  }

  getAllTemplates(): FormTemplate[] {
    return this.templatesSubject.value;
  }

  getTemplateById(id: string): FormTemplate | null {
    return this.templatesSubject.value.find(template => template.id === id) || null;
  }

  saveTemplate(formConfig: FormConfiguration, templateName?: string, templateDescription?: string): FormTemplate {
    const templates = this.templatesSubject.value;
    const existingIndex = templates.findIndex(t => t.configuration.id === formConfig.id);
    
    if (existingIndex !== -1) {
      // Update existing template
      const existing = templates[existingIndex];
      const updated: FormTemplate = {
        ...existing,
        name: templateName || existing.name,
        description: templateDescription || existing.description,
        configuration: { ...formConfig, updatedAt: new Date() },
        updatedAt: new Date()
      };
      
      templates[existingIndex] = updated;
      this.templatesSubject.next([...templates]);
      this.saveTemplatesToStorage();
      return updated;
    } else {
      // Create new template
      const newTemplate: FormTemplate = {
        id: this.generateId(),
        name: templateName || formConfig.name || 'Untitled Form',
        description: templateDescription || formConfig.description,
        configuration: { ...formConfig, updatedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
        submissionCount: 0
      };
      
      const updatedTemplates = [...templates, newTemplate];
      this.templatesSubject.next(updatedTemplates);
      this.saveTemplatesToStorage();
      return newTemplate;
    }
  }

  deleteTemplate(templateId: string): boolean {
    const templates = this.templatesSubject.value;
    const filteredTemplates = templates.filter(template => template.id !== templateId);
    
    if (filteredTemplates.length !== templates.length) {
      this.templatesSubject.next(filteredTemplates);
      this.saveTemplatesToStorage();
      return true;
    }
    
    return false;
  }

  duplicateTemplate(templateId: string): FormTemplate | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const duplicated: FormTemplate = {
      ...template,
      id: this.generateId(),
      name: `${template.name} (Copy)`,
      configuration: {
        ...template.configuration,
        id: this.generateId(),
        name: `${template.configuration.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
      submissionCount: 0
    };

    const templates = [...this.templatesSubject.value, duplicated];
    this.templatesSubject.next(templates);
    this.saveTemplatesToStorage();
    return duplicated;
  }

  togglePublishStatus(templateId: string): boolean {
    const templates = this.templatesSubject.value;
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex !== -1) {
      templates[templateIndex] = {
        ...templates[templateIndex],
        isPublished: !templates[templateIndex].isPublished,
        updatedAt: new Date()
      };
      
      this.templatesSubject.next([...templates]);
      this.saveTemplatesToStorage();
      return true;
    }
    
    return false;
  }

  incrementSubmissionCount(templateId: string): void {
    const templates = this.templatesSubject.value;
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex !== -1) {
      templates[templateIndex] = {
        ...templates[templateIndex],
        submissionCount: templates[templateIndex].submissionCount + 1,
        updatedAt: new Date()
      };
      
      this.templatesSubject.next([...templates]);
      this.saveTemplatesToStorage();
    }
  }

  searchTemplates(query: string): FormTemplate[] {
    if (!query.trim()) {
      return this.getAllTemplates();
    }

    const lowercaseQuery = query.toLowerCase();
    return this.templatesSubject.value.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description?.toLowerCase().includes(lowercaseQuery) ||
      template.configuration.fields.some(field => 
        field.label.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  exportTemplate(templateId: string): string | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  importTemplate(templateData: string): FormTemplate | null {
    try {
      const parsed = JSON.parse(templateData);
      
      // Validate the structure
      if (!parsed.configuration || !parsed.configuration.fields) {
        throw new Error('Invalid template format');
      }

      // Create new template with new IDs
      const imported: FormTemplate = {
        ...parsed,
        id: this.generateId(),
        configuration: {
          ...parsed.configuration,
          id: this.generateId(),
          fields: parsed.configuration.fields.map((field: any) => ({
            ...field,
            id: this.generateId()
          }))
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        submissionCount: 0
      };

      const templates = [...this.templatesSubject.value, imported];
      this.templatesSubject.next(templates);
      this.saveTemplatesToStorage();
      
      return imported;
    } catch (error) {
      console.error('Error importing template:', error);
      return null;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}