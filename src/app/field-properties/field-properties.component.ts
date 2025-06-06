// src/app/components/field-properties/field-properties.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { FormField, ValidationRule, FieldOption, SelectField, CheckboxGroupField, RadioGroupField } from '../models/form-field.interface';

@Component({
  selector: 'app-field-properties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="properties-panel">
      <div class="panel-header">
        <h3>Field Properties</h3>
      </div>

      <div class="panel-content" *ngIf="field && propertiesForm; else noSelection">
        <form [formGroup]="propertiesForm" (ngSubmit)="saveChanges()">
          
          <!-- Basic Properties -->
          <div class="property-section">
            <h4>Basic Settings</h4>
            
            <div class="form-group">
              <label for="label">Field Label</label>
              <input
                type="text"
                id="label"
                formControlName="label"
                class="form-input"
                placeholder="Enter field label"
              />
            </div>

            <div class="form-group">
              <label for="placeholder">Placeholder</label>
              <input
                type="text"
                id="placeholder"
                formControlName="placeholder"
                class="form-input"
                placeholder="Enter placeholder text"
              />
            </div>

            <div class="form-group">
              <label for="helpText">Help Text</label>
              <textarea
                id="helpText"
                formControlName="helpText"
                class="form-textarea"
                rows="2"
                placeholder="Optional help text for users"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="required"
                  class="checkbox-input"
                />
                <span>Required field</span>
              </label>
            </div>
          </div>

          <!-- Options Section (for select, checkbox, radio fields) -->
          <div class="property-section" *ngIf="hasOptions()">
            <h4>Options</h4>
            
            <div formArrayName="options" class="options-list">
              <div 
                *ngFor="let optionControl of getOptionsArray().controls; let i = index"
                class="option-item"
                [formGroupName]="i"
              >
                <div class="option-inputs">
                  <input
                    type="text"
                    formControlName="label"
                    placeholder="Option label"
                    class="form-input option-label"
                  />
                  <input
                    type="text"
                    formControlName="value"
                    placeholder="Option value"
                    class="form-input option-value"
                  />
                </div>
                <button 
                  type="button" 
                  class="btn-remove"
                  (click)="removeOption(i)"
                  [disabled]="getOptionsArray().length <= 1"
                >
                  ❌
                </button>
              </div>
            </div>

            <button type="button" class="btn-add-option" (click)="addOption()">
              + Add Option
            </button>
          </div>

          <!-- Validation Rules -->
          <div class="property-section">
            <h4>Validation Rules</h4>
            
            <div formArrayName="validationRules" class="validation-rules">
              <div 
                *ngFor="let ruleControl of getValidationRulesArray().controls; let i = index"
                class="validation-rule"
                [formGroupName]="i"
              >
                <div class="rule-header">
                  <select formControlName="type" class="form-select rule-type">
                    <option value="required">Required</option>
                    <option value="minLength">Minimum Length</option>
                    <option value="maxLength">Maximum Length</option>
                    <option value="pattern">Pattern (Regex)</option>
                    <option value="email">Email</option>
                    <option value="min">Minimum Value</option>
                    <option value="max">Maximum Value</option>
                  </select>
                  <button 
                    type="button" 
                    class="btn-remove-small"
                    (click)="removeValidationRule(i)"
                  >
                    ❌
                  </button>
                </div>

                <input
                  *ngIf="needsValue(ruleControl.get('type')?.value)"
                  type="text"
                  formControlName="value"
                  placeholder="Enter value"
                  class="form-input rule-value"
                />

                <input
                  type="text"
                  formControlName="message"
                  placeholder="Error message"
                  class="form-input rule-message"
                />
              </div>
            </div>

            <button type="button" class="btn-add-rule" (click)="addValidationRule()">
              + Add Validation Rule
            </button>
          </div>

          <!-- Date-specific properties -->
          <div class="property-section" *ngIf="field.type === 'date'">
            <h4>Date Settings</h4>
            
            <div class="form-group">
              <label for="minDate">Minimum Date</label>
              <input
                type="date"
                id="minDate"
                formControlName="minDate"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="maxDate">Maximum Date</label>
              <input
                type="date"
                id="maxDate"
                formControlName="maxDate"
                class="form-input"
              />
            </div>
          </div>

          <!-- Text-specific properties -->
          <div class="property-section" *ngIf="field.type === 'text' || field.type === 'textarea'">
            <h4>Text Settings</h4>
            
            <div class="form-group">
              <label for="minLength">Minimum Length</label>
              <input
                type="number"
                id="minLength"
                formControlName="minLength"
                class="form-input"
                min="0"
              />
            </div>

            <div class="form-group">
              <label for="maxLength">Maximum Length</label>
              <input
                type="number"
                id="maxLength"
                formControlName="maxLength"
                class="form-input"
                min="0"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-save">Save Changes</button>
          </div>
        </form>
      </div>

      <ng-template #noSelection>
        <div class="no-selection">
          <div class="no-selection-content">
            <span class="no-selection-icon">⚙️</span>
            <h4>No Field Selected</h4>
            <p>Select a field from the canvas to edit its properties.</p>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .properties-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      padding: 1rem;
      border-bottom: 1px solid #e1e5e9;
      background: #f8f9fa;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #2d3748;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .property-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f3f4;
    }

    .property-section:last-child {
      border-bottom: none;
    }

    .property-section h4 {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #4a5568;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
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
      font-weight: normal;
      cursor: pointer;
    }

    .checkbox-input {
      width: auto;
      margin: 0;
    }

    .options-list {
      margin-bottom: 1rem;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .option-inputs {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .option-label,
    .option-value {
      margin: 0;
    }

    .btn-remove,
    .btn-remove-small {
      background: #fee2e2;
      border: none;
      border-radius: 0.25rem;
      padding: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: background-color 0.2s;
    }

    .btn-remove:hover:not(:disabled),
    .btn-remove-small:hover {
      background: #fecaca;
    }

    .btn-remove:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-add-option,
    .btn-add-rule {
      width: 100%;
      padding: 0.5rem;
      background: #f0f9ff;
      border: 1px dashed #0ea5e9;
      border-radius: 0.375rem;
      color: #0369a1;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .btn-add-option:hover,
    .btn-add-rule:hover {
      background: #e0f2fe;
      border-color: #0284c7;
    }

    .validation-rules {
      margin-bottom: 1rem;
    }

    .validation-rule {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
    }

    .rule-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .rule-type {
      flex: 1;
      margin: 0;
    }

    .rule-value,
    .rule-message {
      margin-bottom: 0.5rem;
    }

    .rule-message {
      margin-bottom: 0;
    }

    .form-actions {
      padding-top: 1rem;
      border-top: 1px solid #e1e5e9;
    }

    .btn-save {
      width: 100%;
      padding: 0.75rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-save:hover {
      background: #2563eb;
    }

    .no-selection {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #6b7280;
    }

    .no-selection-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .no-selection h4 {
      margin: 0 0 0.5rem 0;
      color: #4b5563;
    }

    .no-selection p {
      margin: 0;
      font-size: 0.875rem;
    }
  `]
})
export class FieldPropertiesComponent implements OnChanges {
  @Input() field: FormField | null = null;
  @Output() fieldUpdated = new EventEmitter<Partial<FormField>>();

  propertiesForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field'] && this.field) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (!this.field) return;

    this.propertiesForm = this.fb.group({
      label: [this.field.label],
      required: [this.field.required],
      helpText: [this.field.helpText || ''],
      placeholder: [this.field.placeholder || ''],
      validationRules: this.fb.array(
        this.field.validationRules.map(rule => this.createValidationRuleGroup(rule))
      ),
      // Type-specific fields
      options: this.fb.array(
        this.hasOptions() ? this.getFieldOptions().map(option => this.createOptionGroup(option)) : []
      ),
      minDate: [(this.field as any).minDate || ''],
      maxDate: [(this.field as any).maxDate || ''],
      minLength: [(this.field as any).minLength || ''],
      maxLength: [(this.field as any).maxLength || '']
    });
  }

  private createValidationRuleGroup(rule: ValidationRule): FormGroup {
    return this.fb.group({
      type: [rule.type],
      value: [rule.value || ''],
      message: [rule.message]
    });
  }

  private createOptionGroup(option: FieldOption): FormGroup {
    return this.fb.group({
      value: [option.value],
      label: [option.label]
    });
  }

  hasOptions(): boolean {
    return this.field?.type === 'select' || 
           this.field?.type === 'checkbox-group' || 
           this.field?.type === 'radio-group';
  }

  getFieldOptions(): FieldOption[] {
    if (this.hasOptions()) {
      return (this.field as SelectField | CheckboxGroupField | RadioGroupField).options || [];
    }
    return [];
  }

  getOptionsArray(): FormArray {
    return this.propertiesForm.get('options') as FormArray;
  }

  getValidationRulesArray(): FormArray {
    return this.propertiesForm.get('validationRules') as FormArray;
  }

  addOption(): void {
    const optionsArray = this.getOptionsArray();
    optionsArray.push(this.createOptionGroup({ value: '', label: '' }));
  }

  removeOption(index: number): void {
    const optionsArray = this.getOptionsArray();
    if (optionsArray.length > 1) {
      optionsArray.removeAt(index);
    }
  }

  addValidationRule(): void {
    const rulesArray = this.getValidationRulesArray();
    rulesArray.push(this.createValidationRuleGroup({
      type: 'required',
      message: 'This field is required'
    }));
  }

  removeValidationRule(index: number): void {
    const rulesArray = this.getValidationRulesArray();
    rulesArray.removeAt(index);
  }

  needsValue(ruleType: string): boolean {
    return ['minLength', 'maxLength', 'pattern', 'min', 'max'].includes(ruleType);
  }

  saveChanges(): void {
    if (!this.propertiesForm.valid || !this.field) return;

    const formValue = this.propertiesForm.value;
    const updates: Partial<FormField> = {
      label: formValue.label,
      required: formValue.required,
      helpText: formValue.helpText,
      placeholder: formValue.placeholder,
      validationRules: formValue.validationRules.filter((rule: any) => rule.type && rule.message)
    };

    // Add type-specific updates
    if (this.hasOptions()) {
      (updates as any).options = formValue.options.filter((option: any) => option.value && option.label);
    }

    if (this.field.type === 'date') {
      if (formValue.minDate) (updates as any).minDate = formValue.minDate;
      if (formValue.maxDate) (updates as any).maxDate = formValue.maxDate;
    }

    if (this.field.type === 'text' || this.field.type === 'textarea') {
      if (formValue.minLength) (updates as any).minLength = formValue.minLength;
      if (formValue.maxLength) (updates as any).maxLength = formValue.maxLength;
    }

    this.fieldUpdated.emit(updates);
  }
}