// src/app/components/form-preview/form-preview.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FormTemplate } from '../services/form-storage.service';
import { FormField, ValidationRule } from '../models/form-field.interface';

interface FormSubmission {
  id: string;
  templateId: string;
  templateName: string;
  formData: any;
  submittedAt: Date;
  validationErrors?: string[];
}

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-preview-container">
      <!-- Header -->
      <div class="preview-header">
        <div class="header-content">
        <button class="back-btn" (click)="goBack.emit()">
            ← Back
          </button>
          <div class="form-info">
            <h1>{{ template?.name }}</h1>
            <p *ngIf="template?.description">{{ template.description }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-secondary" 
            (click)="resetForm()"
            [disabled]="!previewForm?.dirty"
          >
            Reset Form
          </button>
          <button 
            class="btn btn-secondary" 
            (click)="fillSampleData()"
          >
            Fill Sample Data
          </button>
          <button 
            class="btn btn-primary" 
            (click)="editTemplate.emit()"
          >
            Edit Template
          </button>
        </div>
      </div>

      <!-- Form Container -->
      <div class="form-container">
        <div class="form-wrapper">
          <!-- Form Title -->
          <div class="form-title-section">
            <h2>{{ template?.configuration.name }}</h2>
            <p *ngIf="template?.configuration.description" class="form-description">
              {{ template.configuration.description }}
            </p>
            <div class="form-meta">
              <span class="field-count">{{ template?.configuration.fields.length }} fields</span>
              <span class="separator">•</span>
              <span class="required-count">{{ getRequiredFieldsCount() }} required</span>
            </div>
          </div>

          <!-- Actual Form -->
          <form [formGroup]="previewForm" (ngSubmit)="onSubmit()" *ngIf="previewForm" class="preview-form">
            <div *ngFor="let field of template?.configuration.fields" class="form-field">
              <!-- Text Input -->
              <div *ngIf="field.type === 'text'" class="field-group">
                <label [for]="field.id" class="field-label">
                  {{ field.label }}
                  <span class="required-indicator" *ngIf="field.required">*</span>
                </label>
                <input
                  [id]="field.id"
                  type="text"
                  [formControlName]="field.id"
                  [placeholder]="field.placeholder || ''"
                  class="form-input"
                  [class.error]="isFieldInvalid(field.id)"
                />
                <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                  <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                    {{ error }}
                  </div>
                </div>
              </div>

              <!-- Textarea -->
              <div *ngIf="field.type === 'textarea'" class="field-group">
                <label [for]="field.id" class="field-label">
                  {{ field.label }}
                  <span class="required-indicator" *ngIf="field.required">*</span>
                </label>
                <textarea
                  [id]="field.id"
                  [formControlName]="field.id"
                  [placeholder]="field.placeholder || ''"
                  class="form-textarea"
                  [class.error]="isFieldInvalid(field.id)"
                  rows="4"
                ></textarea>
                <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                  <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                    {{ error }}
                  </div>
                </div>
              </div>

              <!-- Select -->
              <div *ngIf="field.type === 'select'" class="field-group">
                <label [for]="field.id" class="field-label">
                  {{ field.label }}
                  <span class="required-indicator" *ngIf="field.required">*</span>
                </label>
                <select
                  [id]="field.id"
                  [formControlName]="field.id"
                  class="form-select"
                  [class.error]="isFieldInvalid(field.id)"
                >
                  <option value="" disabled>Select an option...</option>
                  <option 
                    *ngFor="let option of getSelectField(field).options" 
                    [value]="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                  <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                    {{ error }}
                  </div>
                </div>
              </div>

              <!-- Radio Group -->
              <div *ngIf="field.type === 'radio-group'" class="field-group">
                <fieldset class="radio-fieldset">
                  <legend class="field-label">
                    {{ field.label }}
                    <span class="required-indicator" *ngIf="field.required">*</span>
                  </legend>
                  <div class="radio-group" [class.error]="isFieldInvalid(field.id)">
                    <label 
                      *ngFor="let option of getRadioField(field).options"
                      class="radio-label"
                    >
                      <input
                        type="radio"
                        [name]="field.id"
                        [value]="option.value"
                        [formControlName]="field.id"
                        class="radio-input"
                      />
                      <span class="radio-text">{{ option.label }}</span>
                    </label>
                  </div>
                  <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                  <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                    <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                      {{ error }}
                    </div>
                  </div>
                </fieldset>
              </div>

              <!-- Checkbox Group -->
              <div *ngIf="field.type === 'checkbox-group'" class="field-group">
                <fieldset class="checkbox-fieldset">
                  <legend class="field-label">
                    {{ field.label }}
                    <span class="required-indicator" *ngIf="field.required">*</span>
                  </legend>
                  <div class="checkbox-group" [class.error]="isFieldInvalid(field.id)">
                    <label 
                      *ngFor="let option of getCheckboxField(field).options; let i = index"
                      class="checkbox-label"
                    >
                      <input
                        type="checkbox"
                        [value]="option.value"
                        (change)="onCheckboxChange(field.id, option.value, $event)"
                        class="checkbox-input"
                      />
                      <span class="checkbox-text">{{ option.label }}</span>
                    </label>
                  </div>
                  <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                  <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                    <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                      {{ error }}
                    </div>
                  </div>
                </fieldset>
              </div>

              <!-- Date -->
              <div *ngIf="field.type === 'date'" class="field-group">
                <label [for]="field.id" class="field-label">
                  {{ field.label }}
                  <span class="required-indicator" *ngIf="field.required">*</span>
                </label>
                <input
                  [id]="field.id"
                  type="date"
                  [formControlName]="field.id"
                  class="form-input"
                  [class.error]="isFieldInvalid(field.id)"
                  [min]="getDateField(field).minDate"
                  [max]="getDateField(field).maxDate"
                />
                <div class="help-text" *ngIf="field.helpText">{{ field.helpText }}</div>
                <div class="error-messages" *ngIf="isFieldInvalid(field.id)">
                  <div *ngFor="let error of getFieldErrors(field.id)" class="error-message">
                    {{ error }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="form-submit">
              <button 
                type="submit" 
                class="btn btn-primary btn-large"
                [disabled]="previewForm.invalid || isSubmitting"
              >
                <span *ngIf="!isSubmitting">Submit Form</span>
                <span *ngIf="isSubmitting">Submitting...</span>
              </button>
              <div class="submit-info">
                <span *ngIf="previewForm.invalid" class="validation-summary">
                  Please correct {{ getErrorCount() }} error(s) before submitting
                </span>
                <span *ngIf="previewForm.valid" class="validation-summary success">
                  Form is ready to submit
                </span>
              </div>
            </div>
          </form>
        </div>

        <!-- Form Status Sidebar -->
        <div class="form-status-sidebar">
          <div class="status-section">
            <h3>Form Status</h3>
            <div class="status-items">
              <div class="status-item">
                <span class="status-label">Validation:</span>
                <span class="status-value" [class.success]="previewForm?.valid" [class.error]="previewForm?.invalid">
                  {{ previewForm?.valid ? 'Valid' : 'Invalid' }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Touched:</span>
                <span class="status-value">{{ previewForm?.touched ? 'Yes' : 'No' }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Dirty:</span>
                <span class="status-value">{{ previewForm?.dirty ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>

          <div class="status-section">
            <h3>Field Status</h3>
            <div class="field-status-list">
              <div 
                *ngFor="let field of template?.configuration.fields" 
                class="field-status-item"
              >
                <div class="field-status-header">
                  <span class="field-name">{{ field.label }}</span>
                  <span 
                    class="field-status-indicator"
                    [class.valid]="!isFieldInvalid(field.id)"
                    [class.invalid]="isFieldInvalid(field.id)"
                  >
                    {{ isFieldInvalid(field.id) ? '❌' : '✅' }}
                  </span>
                </div>
                <div class="field-value" *ngIf="getFieldValue(field.id)">
                  <small>{{ getFieldValue(field.id) }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="status-section">
            <h3>Submission History</h3>
            <div class="submission-count">
              <span class="count-number">{{ template?.submissionCount || 0 }}</span>
              <span class="count-label">submissions</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Modal -->
      <div class="modal-overlay" *ngIf="showSuccessModal" (click)="closeSuccessModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Form Submitted Successfully! 🎉</h3>
          </div>
          <div class="modal-body">
            <p>Your form has been submitted and the data has been recorded.</p>
            <div class="submitted-data">
              <h4>Submitted Data:</h4>
              <pre>{{ lastSubmissionData | json }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeSuccessModal()">Close</button>
            <button class="btn btn-primary" (click)="submitAnother()">Submit Another</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-preview-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .preview-header {
      background: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      background: #e2e8f0;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      color: #4a5568;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .back-btn:hover {
      background: #cbd5e0;
    }

    .form-info h1 {
      margin: 0;
      color: #2d3748;
      font-size: 1.5rem;
    }

    .form-info p {
      margin: 0.25rem 0 0 0;
      color: #718096;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
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

    .btn-secondary:hover:not(:disabled) {
      background: #cbd5e0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-large {
      padding: 0.75rem 2rem;
      font-size: 1.125rem;
    }

    .form-container {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 2rem;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .form-wrapper {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .form-title-section {
      padding: 2rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8f9fa;
    }

    .form-title-section h2 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
      font-size: 1.75rem;
    }

    .form-description {
      margin: 0 0 1rem 0;
      color: #718096;
      line-height: 1.6;
    }

    .form-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #a0aec0;
    }

    .separator {
      color: #e2e8f0;
    }

    .preview-form {
      padding: 2rem;
    }

    .form-field {
      margin-bottom: 2rem;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label,
    legend {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      margin: 0;
    }

    .required-indicator {
      color: #ef4444;
      margin-left: 0.25rem;
    }

    .form-input,
    .form-textarea,
    .form-select {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error,
    .form-textarea.error,
    .form-select.error {
      border-color: #ef4444;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .radio-fieldset,
    .checkbox-fieldset {
      border: none;
      padding: 0;
      margin: 0;
    }

    .radio-group,
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .radio-group.error,
    .checkbox-group.error {
      padding: 0.5rem;
      border: 1px solid #ef4444;
      border-radius: 0.375rem;
      background: #fef2f2;
    }

    .radio-label,
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal;
    }

    .radio-input,
    .checkbox-input {
      margin: 0;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      font-style: italic;
    }

    .error-messages {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .error-message {
      font-size: 0.75rem;
      color: #ef4444;
      background: #fef2f2;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      border-left: 3px solid #ef4444;
    }

    .form-submit {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .submit-info {
      margin-top: 1rem;
    }

    .validation-summary {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      display: inline-block;
    }

    .validation-summary:not(.success) {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .validation-summary.success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .form-status-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .status-section {
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .status-section h3 {
      margin: 0 0 1rem 0;
      color: #2d3748;
      font-size: 1rem;
      font-weight: 600;
    }

    .status-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .status-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .status-value.success {
      color: #059669;
    }

    .status-value.error {
      color: #dc2626;
    }

    .field-status-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-status-item {
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .field-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .field-name {
      font-weight: 500;
      color: #374151;
    }

    .field-status-indicator.valid {
      color: #059669;
    }

    .field-status-indicator.invalid {
      color: #dc2626;
    }

    .field-value {
      margin-top: 0.25rem;
      color: #6b7280;
      word-break: break-all;
    }

    .submission-count {
      text-align: center;
    }

    .count-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #3b82f6;
    }

    .count-label {
      font-size: 0.875rem;
      color: #6b7280;
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

    .modal-content {
      background: white;
      border-radius: 0.5rem;
      padding: 2rem;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }

    .modal-header h3 {
      margin: 0 0 1rem 0;
      color: #2d3748;
    }

    .modal-body p {
      margin: 0 0 1rem 0;
      color: #4a5568;
    }

    .submitted-data {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
    }

    .submitted-data h4 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
      font-size: 0.875rem;
    }

    .submitted-data pre {
      margin: 0;
      font-size: 0.75rem;
      color: #4a5568;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      justify-content: flex-end;
    }

    @media (max-width: 1024px) {
      .form-container {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-status-sidebar {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .preview-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-actions {
        flex-wrap: wrap;
      }

      .form-container {
        padding: 1rem;
      }
    }
  `]
})
export class FormPreviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() template: FormTemplate | null = null;
  @Output() goBack = new EventEmitter<void>();
  @Output() editTemplate = new EventEmitter<FormTemplate>();

  previewForm!: FormGroup;
  isSubmitting = false;
  showSuccessModal = false;
  lastSubmissionData: any = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    if (this.template) {
      this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    if (!this.template) return;

    const formControls: { [key: string]: AbstractControl } = {};

    this.template.configuration.fields.forEach(field => {
      const validators = this.buildValidators(field);
      const initialValue = field.type === 'checkbox-group' ? [] : '';
      
      formControls[field.id] = this.fb.control(initialValue, validators);
    });

    this.previewForm = this.fb.group(formControls);
  }

  private buildValidators(field: FormField): any[] {
    const validators: any[] = [];

    field.validationRules.forEach(rule => {
      switch (rule.type) {
        case 'required':
          validators.push(Validators.required);
          break;
        case 'minLength':
          if (rule.value) validators.push(Validators.minLength(rule.value));
          break;
        case 'maxLength':
          if (rule.value) validators.push(Validators.maxLength(rule.value));
          break;
        case 'email':
          validators.push(Validators.email);
          break;
        case 'pattern':
          if (rule.value) validators.push(Validators.pattern(rule.value));
          break;
        case 'min':
          if (rule.value) validators.push(Validators.min(rule.value));
          break;
        case 'max':
          if (rule.value) validators.push(Validators.max(rule.value));
          break;
      }
    });

    return validators;
  }

  onCheckboxChange(fieldId: string, optionValue: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const control = this.previewForm.get(fieldId);
    
    if (control) {
      const currentValues = control.value || [];
      
      if (target.checked) {
        control.setValue([...currentValues, optionValue]);
      } else {
        control.setValue(currentValues.filter((value: string) => value !== optionValue));
      }
    }
  }

  onSubmit(): void {
    if (this.previewForm.valid && this.template) {
      this.isSubmitting = true;
      
      // Simulate form submission
      setTimeout(() => {
        const submission: FormSubmission = {
          id: this.generateId(),
          templateId: this.template!.id,
          templateName: this.template!.name,
          formData: this.previewForm.value,
          submittedAt: new Date()
        };

        // Store the submission data
        this.lastSubmissionData = submission.formData;
        
        // In a real app, you would send this to a backend
        console.log('Form submitted:', submission);
        
        this.isSubmitting = false;
        this.showSuccessModal = true;
        
        // Mark form as submitted
        this.previewForm.markAsPristine();
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      this.previewForm.markAllAsTouched();
    }
  }

  resetForm(): void {
    this.previewForm.reset();
    this.buildForm();
  }

  fillSampleData(): void {
    if (!this.template) return;

    this.template.configuration.fields.forEach(field => {
      const control = this.previewForm.get(field.id);
      if (!control) return;

      switch (field.type) {
        case 'text':
          control.setValue(this.getSampleTextValue(field.label));
          break;
        case 'textarea':
          control.setValue(`This is a sample ${field.label.toLowerCase()} with multiple lines of text content.`);
          break;
        case 'select':
          const selectField = field as any;
          if (selectField.options?.length > 0) {
            control.setValue(selectField.options[0].value);
          }
          break;
        case 'radio-group':
          const radioField = field as any;
          if (radioField.options?.length > 0) {
            control.setValue(radioField.options[0].value);
          }
          break;
        case 'checkbox-group':
          const checkboxField = field as any;
          if (checkboxField.options?.length > 0) {
            control.setValue([checkboxField.options[0].value]);
          }
          break;
        case 'date':
          control.setValue(new Date().toISOString().split('T')[0]);
          break;
      }
    });

    this.previewForm.markAsDirty();
  }

  private getSampleTextValue(label: string): string {
    const samples: { [key: string]: string } = {
      'name': 'John Doe',
      'email': 'john.doe@example.com',
      'phone': '+1 (555) 123-4567',
      'address': '123 Main Street, City, State 12345',
      'company': 'Acme Corporation',
      'title': 'Software Engineer',
      'website': 'https://example.com'
    };

    const lowerLabel = label.toLowerCase();
    for (const key in samples) {
      if (lowerLabel.includes(key)) {
        return samples[key];
      }
    }

    return `Sample ${label}`;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  submitAnother(): void {
    this.showSuccessModal = false;
    this.resetForm();
  }

  isFieldInvalid(fieldId: string): boolean {
    const control = this.previewForm.get(fieldId);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldErrors(fieldId: string): string[] {
    const control = this.previewForm.get(fieldId);
    const field = this.template?.configuration.fields.find(f => f.id === fieldId);
    
    if (!control || !field || control.valid) return [];

    const errors: string[] = [];
    
    if (control.errors) {
      // Get custom error messages from validation rules
      field.validationRules.forEach(rule => {
        if (control.errors![rule.type]) {
          errors.push(rule.message);
        }
      });
      
      // Fallback to default error messages
      if (errors.length === 0) {
        Object.keys(control.errors).forEach(errorType => {
          switch (errorType) {
            case 'required':
              errors.push(`${field.label} is required`);
              break;
            case 'email':
              errors.push('Please enter a valid email address');
              break;
            case 'minlength':
              errors.push(`Minimum length is ${control.errors![errorType].requiredLength}`);
              break;
            case 'maxlength':
              errors.push(`Maximum length is ${control.errors![errorType].requiredLength}`);
              break;
            default:
              errors.push(`${field.label} is invalid`);
          }
        });
      }
    }

    return errors;
  }

  getFieldValue(fieldId: string): string {
    const value = this.previewForm.get(fieldId)?.value;
    if (!value) return '';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  }

  getErrorCount(): number {
    let count = 0;
    Object.keys(this.previewForm.controls).forEach(key => {
      if (this.isFieldInvalid(key)) {
        count++;
      }
    });
    return count;
  }

  getRequiredFieldsCount(): number {
    return this.template?.configuration.fields.filter(field => field.required).length || 0;
  }

  // Type helpers
  getSelectField(field: FormField): any {
    return field;
  }

  getRadioField(field: FormField): any {
    return field;
  }

  getCheckboxField(field: FormField): any {
    return field;
  }

  getDateField(field: FormField): any {
    return field;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}