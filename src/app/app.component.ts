// src/app/app.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { FormBuilderService } from './services/form-builder.service';
import { FormStorageService, FormTemplate } from './services/form-storage.service';
import { FormConfiguration } from './models/form-field.interface';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormListComponent } from './form-list/form-list-component';
import { FormPreviewComponent } from './form-preview/form-preview.component';

type AppView = 'list' | 'builder' | 'preview';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, FormBuilderComponent, FormListComponent, FormPreviewComponent],
  template: `
    <div class="app">
      <!-- Navigation Bar -->
      <nav class="app-nav" *ngIf="currentView !== 'preview'">
        <div class="nav-content">
          <div class="nav-brand">
            <h1>Dynamic Form Builder</h1>
            <span class="version">v2.0</span>
          </div>
          <div class="nav-menu">
            <button 
              class="nav-item"
              [class.active]="currentView === 'list'"
              (click)="navigateToList()"
            >
              📋 Form Templates
            </button>
            <button 
              class="nav-item"
              [class.active]="currentView === 'builder'"
              (click)="navigateToBuilder()"
            >
              ⚡ Form Builder
            </button>
          </div>
        </div>
      </nav>

      <!-- Form List View -->
      <app-form-list
        *ngIf="currentView === 'list'"
        (editForm1)="editForm($event)"
        (previewForm1)="previewForm($event)"
        (createNew)="createNewForm()"
      ></app-form-list>

      <!-- Form Builder View -->
      <app-form-builder
        *ngIf="currentView === 'builder'"
        (formSaved)="onFormSaved($event)"
      ></app-form-builder>

      <!-- Form Preview View -->
      <app-form-preview
        *ngIf="currentView === 'preview'"
        [template]="selectedTemplate"
        (goBack)="navigateToList()"
        (editTemplate)="editTemplateFromPreview($event)"
      ></app-form-preview>

      <!-- Save Form Modal -->
      <div class="modal-overlay" *ngIf="showSaveModal" (click)="closeSaveModal()">
        <div class="save-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isUpdatingExisting ? 'Update' : 'Save' }} Form Template</h3>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="formName">Form Name</label>
              <input
                type="text"
                id="formName"
                [(ngModel)]="saveFormData.name"
                class="form-input"
                placeholder="Enter form name"
              />
            </div>
            <div class="form-group">
              <label for="formDescription">Description (Optional)</label>
              <textarea
                id="formDescription"
                [(ngModel)]="saveFormData.description"
                class="form-textarea"
                rows="3"
                placeholder="Enter form description"
              ></textarea>
            </div>
            <div class="form-group" *ngIf="!isUpdatingExisting">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="saveFormData.publish"
                />
                <span>Publish form immediately</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeSaveModal()">Cancel</button>
            <button 
              class="btn btn-primary" 
              (click)="saveFormTemplate()"
              [disabled]="!saveFormData.name?.trim()"
            >
              {{ isUpdatingExisting ? 'Update' : 'Save' }} Template
            </button>
          </div>
        </div>
      </div>

      <!-- Success Notification -->
      <div class="notification success" *ngIf="showSuccessNotification">
        <div class="notification-content">
          <span class="notification-icon">✅</span>
          <span class="notification-message">{{ successMessage }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
    }

    .app-nav {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .nav-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
    }

    .version {
      background: #4299e1;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .nav-menu {
      display: flex;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      color: #4a5568;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .nav-item:hover {
      background: #f7fafc;
      color: #2d3748;
    }

    .nav-item.active {
      background: #4299e1;
      color: white;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .save-modal {
      background: white;
      border-radius: 0.5rem;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      color: #2d3748;
      font-size: 1.25rem;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal !important;
    }

    .checkbox-label input {
      margin: 0;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4299e1;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3182ce;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .notification {
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1100;
      animation: slideIn 0.3s ease-out;
    }

    .notification.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .notification-icon {
      font-size: 1.25rem;
    }

    .notification-message {
      font-weight: 500;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .nav-content {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
      }

      .nav-menu {
        width: 100%;
        justify-content: center;
      }

      .save-modal {
        margin: 1rem;
        width: calc(100% - 2rem);
      }

      .notification {
        top: 1rem;
        right: 1rem;
        left: 1rem;
      }
    }
  `]
})
export class AppComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  currentView: AppView = 'list';
  selectedTemplate: FormTemplate | null = null;
  showSaveModal = false;
  showSuccessNotification = false;
  successMessage = '';
  isUpdatingExisting = false;

  saveFormData = {
    name: '',
    description: '',
    publish: false
  };

  constructor(
    private formBuilderService: FormBuilderService,
    private formStorageService: FormStorageService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToList(): void {
    this.currentView = 'list';
    this.selectedTemplate = null;
  }

  navigateToBuilder(): void {
    this.currentView = 'builder';
    this.selectedTemplate = null;
  }

  navigateToPreview(template: FormTemplate): void {
    this.currentView = 'preview';
    this.selectedTemplate = template;
  }

  createNewForm(): void {
    // Create a new form in the builder
    this.formBuilderService.createNewForm('Untitled Form', 'Description of your form');
    this.navigateToBuilder();
  }

  editForm(formConfig: FormConfiguration): void {
    // Load the form configuration into the builder
    this.formBuilderService.currentFormSubject.next(formConfig);
    this.navigateToBuilder();
  }

  previewForm(template: FormTemplate): void {
    this.navigateToPreview(template);
  }

  editTemplateFromPreview(template: FormTemplate): void {
    this.editForm(template.configuration);
  }

  onFormSaved(formConfig: FormConfiguration): void {
    // Check if this is an update to an existing template
    const existingTemplate = this.formStorageService.getAllTemplates()
      .find(template => template.configuration.id === formConfig.id);
    
    this.isUpdatingExisting = !!existingTemplate;
    
    if (existingTemplate) {
      // Pre-fill with existing data
      this.saveFormData = {
        name: existingTemplate.name,
        description: existingTemplate.description || '',
        publish: existingTemplate.isPublished
      };
    } else {
      // Reset for new form
      this.saveFormData = {
        name: formConfig.name || 'Untitled Form',
        description: formConfig.description || '',
        publish: false
      };
    }
    
    this.showSaveModal = true;
  }

  closeSaveModal(): void {
    this.showSaveModal = false;
  }

  saveFormTemplate(): void {
    const currentForm = this.formBuilderService.getCurrentForm();
    if (!currentForm || !this.saveFormData.name?.trim()) return;

    try {
      const savedTemplate = this.formStorageService.saveTemplate(
        currentForm,
        this.saveFormData.name.trim(),
        this.saveFormData.description?.trim()
      );

      // Update publish status if needed
      if (!this.isUpdatingExisting && this.saveFormData.publish) {
        this.formStorageService.togglePublishStatus(savedTemplate.id);
      }

      this.showSuccessMessage(
        this.isUpdatingExisting 
          ? `Template "${savedTemplate.name}" updated successfully!`
          : `Template "${savedTemplate.name}" saved successfully!`
      );

      this.closeSaveModal();
      this.navigateToList();
    } catch (error) {
      console.error('Error saving template:', error);
      // In a real app, show an error notification
    }
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccessNotification = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showSuccessNotification = false;
    }, 3000);
  }
}