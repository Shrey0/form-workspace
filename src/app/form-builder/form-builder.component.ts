// src/app/components/form-builder/form-builder.component.ts
import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormField, FormConfiguration, FieldTypeDefinition, FormFieldType, FormFieldUpdate } from '../models/form-field.interface';
import { Subject, takeUntil } from 'rxjs';
import { FieldPropertiesComponent } from '../field-properties/field-properties.component';
import { FieldRendererComponent } from '../field-renderer/field-rendere.component';
import { FormBuilderService } from '../services/form-builder.service';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule, FieldRendererComponent, FieldPropertiesComponent],
  template: `
    <div class="form-builder">
      <!-- Header -->
      <div class="form-builder-header">
        <div class="form-info">
          <h1>{{ currentForm?.name || 'New Form' }}</h1>
          <p>{{ currentForm?.description || 'Create your dynamic form' }}</p>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" (click)="previewMode = !previewMode">
            {{ previewMode ? 'Edit' : 'Preview' }}
          </button>
          <button class="btn btn-primary" (click)="saveForm()">Save Form</button>
        </div>
      </div>

      <div class="form-builder-content">
        <!-- Field Types Toolbar -->
        <div class="field-types-panel" *ngIf="!previewMode">
          <h3>Field Types</h3>
          <div class="field-types-grid">
            <div
              *ngFor="let fieldType of fieldTypes"
              class="field-type-item"
              cdkDrag
              [cdkDragData]="fieldType"
              (click)="addFieldToForm(fieldType.type)"
            >
              <span class="field-icon">{{ fieldType.icon }}</span>
              <span class="field-label">{{ fieldType.label }}</span>
            </div>
          </div>
        </div>

        <!-- Form Canvas -->
        <div class="form-canvas">
          <div class="canvas-header">
            <h3>{{ previewMode ? 'Form Preview' : 'Form Canvas' }}</h3>
            <span class="field-count">{{ currentForm?.fields?.length || 0 }} fields</span>
          </div>
          
          <div
            class="canvas-area"
            [class.preview-mode]="previewMode"
            cdkDropList
            (cdkDropListDropped)="dropField($event)"
            *ngIf="currentForm"
          >
            <div
              *ngFor="let field of currentForm.fields; let i = index"
              class="field-container"
              [class.selected]="selectedField?.id === field.id"
              cdkDrag
              [cdkDragDisabled]="previewMode"
              (click)="selectField(field)"
            >
              <div class="field-actions" *ngIf="!previewMode">
                <button class="btn-icon" (click)="deleteField(field.id); $event.stopPropagation()">
                  <span>🗑️</span>
                </button>
              </div>
              
              <app-field-renderer 
                [field]="field" 
                [isPreview]="previewMode"
                [isSelected]="selectedField?.id === field.id">
              </app-field-renderer>
            </div>

            <div *ngIf="currentForm.fields.length === 0" class="empty-canvas">
              <div class="empty-message">
                <span class="empty-icon">📝</span>
                <h4>Start building your form</h4>
                <p>Drag field types from the left panel or click on them to add fields to your form.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Properties Panel -->
        <div class="properties-panel" *ngIf="!previewMode">
          <app-field-properties 
            [field]="selectedField"
            (fieldUpdated)="updateField($event)">
          </app-field-properties>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-builder {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f7fa;
    }

    .form-builder-header {
      background: white;
      padding: 1rem 2rem;
      border-bottom: 1px solid #e1e5e9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-info h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #2d3748;
    }

    .form-info p {
      margin: 0.25rem 0 0 0;
      color: #718096;
    }

    .form-actions {
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

    .btn-primary:hover {
      background: #3182ce;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .form-builder-content {
      flex: 1;
      display: grid;
      grid-template-columns: 250px 1fr 300px;
      gap: 1rem;
      padding: 1rem;
      overflow: hidden;
    }

    .form-builder-content.preview-mode {
      grid-template-columns: 1fr;
    }

    .field-types-panel {
      background: white;
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid #e1e5e9;
      overflow-y: auto;
    }

    .field-types-panel h3 {
      margin: 0 0 1rem 0;
      color: #2d3748;
      font-size: 1rem;
    }

    .field-types-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-type-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e1e5e9;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .field-type-item:hover {
      border-color: #4299e1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .field-type-item.cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .field-icon {
      font-size: 1.25rem;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #4a5568;
    }

    .form-canvas {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e1e5e9;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .canvas-header {
      padding: 1rem;
      border-bottom: 1px solid #e1e5e9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .canvas-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #2d3748;
    }

    .field-count {
      font-size: 0.875rem;
      color: #718096;
    }

    .canvas-area {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      min-height: 400px;
    }

    .field-container {
      position: relative;
      margin-bottom: 1rem;
      padding: 1rem;
      border: 2px solid transparent;
      border-radius: 0.375rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .field-container:hover {
      border-color: #e1e5e9;
    }

    .field-container.selected {
      border-color: #4299e1;
      background: #f7fafc;
    }

    .field-container.cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .field-actions {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .field-container:hover .field-actions,
    .field-container.selected .field-actions {
      opacity: 1;
    }

    .btn-icon {
      width: 1.5rem;
      height: 1.5rem;
      border: none;
      border-radius: 0.25rem;
      background: #fed7d7;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .btn-icon:hover {
      background: #feb2b2;
    }

    .empty-canvas {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
    }

    .empty-message {
      color: #718096;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-message h4 {
      margin: 0 0 0.5rem 0;
      color: #4a5568;
    }

    .empty-message p {
      margin: 0;
      max-width: 300px;
    }

    .properties-panel {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e1e5e9;
      overflow-y: auto;
    }

    .cdk-drop-list-dragging .field-container:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drag-placeholder {
      opacity: 0.4;
    }

    .cdk-drag-animating {
      transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class FormBuilderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() formSaved = new EventEmitter<FormConfiguration>();

  fieldTypes: FieldTypeDefinition[] = [];
  currentForm: FormConfiguration | null = null;
  selectedField: FormField | null = null;
  previewMode = false;

  constructor(private formBuilderService: FormBuilderService) {}

  ngOnInit(): void {
    this.fieldTypes = this.formBuilderService.getFieldTypes();
    
    // Initialize with a new form
    this.formBuilderService.createNewForm('Untitled Form', 'Description of your form');

    // Subscribe to form changes
    this.formBuilderService.currentForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(form => {
        this.currentForm = form;
      });

    // Subscribe to selected field changes
    this.formBuilderService.selectedField$
      .pipe(takeUntil(this.destroy$))
      .subscribe(field => {
        this.selectedField = field;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addFieldToForm(fieldType: FormFieldType): void {
    const newField = this.formBuilderService.addField(fieldType);
    this.formBuilderService.selectField(newField);
  }

  dropField(event: CdkDragDrop<FormField[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering existing fields
      this.formBuilderService.reorderFields(event.previousIndex, event.currentIndex);
    } else {
      // Adding new field from toolbar
      const fieldType = event.item.data as FieldTypeDefinition;
      this.addFieldToForm(fieldType.type);
    }
  }

  selectField(field: FormField): void {
    this.formBuilderService.selectField(field);
  }

  updateField(updates: FormFieldUpdate): void {
    if (this.selectedField) {
      this.formBuilderService.updateField(this.selectedField.id, updates);
    }
  }

  deleteField(fieldId: string): void {
    this.formBuilderService.deleteField(fieldId);
    if (this.selectedField?.id === fieldId) {
      this.formBuilderService.selectField(null);
    }
  }

  saveForm(): void {
    if (this.currentForm) {
      // Update the form's updatedAt timestamp
      this.currentForm.updatedAt = new Date();
      this.formSaved.emit(this.currentForm);
    }
  }
}