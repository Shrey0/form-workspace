/* eslint-disable @typescript-eslint/no-empty-function */
// src/app/components/field-renderer/field-renderer.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField, TextInputField, SelectField, CheckboxGroupField, RadioGroupField, DatePickerField } from '../models/form-field.interface';

@Component({
  selector: 'app-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FieldRendererComponent),
      multi: true
    }
  ],
  template: `
    <div class="field-wrapper" [class.preview-mode]="isPreview" [class.selected]="isSelected">
      <!-- Field Label -->
      <label class="field-label" [class.required]="field.required">
        {{ field.label }}
        <span class="required-indicator" *ngIf="field.required">*</span>
      </label>

      <!-- Help Text -->
      <div class="help-text" *ngIf="field.helpText">
        {{ field.helpText }}
      </div>

      <!-- Text Input -->
      <input
        *ngIf="field.type === 'text'"
        type="text"
        class="form-input"
        [placeholder]="field.placeholder || ''"
        [formControl]="formControl"
        [readonly]="!isPreview"
      />

      <!-- Textarea -->
      <textarea
        *ngIf="field.type === 'textarea'"
        class="form-textarea"
        [placeholder]="field.placeholder || ''"
        [formControl]="formControl"
        [readonly]="!isPreview"
        rows="3"
      ></textarea>

      <!-- Select Dropdown -->
      <select
        *ngIf="field.type === 'select'"
        class="form-select"
        [formControl]="formControl"
        [disabled]="!isPreview"
      >
        <option value="" disabled>Select an option...</option>
        <option 
          *ngFor="let option of getSelectField().options" 
          [value]="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Checkbox Group -->
      <div *ngIf="field.type === 'checkbox-group'" class="checkbox-group">
        <label 
          *ngFor="let option of getCheckboxGroupField().options; let i = index"
          class="checkbox-label"
        >
          <input
            type="checkbox"
            class="checkbox-input"
            [value]="option.value"
            [disabled]="!isPreview"
            (change)="onCheckboxChange(option.value, $event)"
          />
          <span class="checkbox-text">{{ option.label }}</span>
        </label>
      </div>

      <!-- Radio Group -->
      <div *ngIf="field.type === 'radio-group'" class="radio-group">
        <label 
          *ngFor="let option of getRadioGroupField().options"
          class="radio-label"
        >
          <input
            type="radio"
            class="radio-input"
            [name]="field.id"
            [value]="option.value"
            [formControl]="formControl"
            [disabled]="!isPreview"
          />
          <span class="radio-text">{{ option.label }}</span>
        </label>
      </div>

      <!-- Date Picker -->
      <input
        *ngIf="field.type === 'date'"
        type="date"
        class="form-input"
        [formControl]="formControl"
        [readonly]="!isPreview"
        [min]="getDateField().minDate"
        [max]="getDateField().maxDate"
      />

      <!-- Validation Messages -->
      <div class="validation-messages" *ngIf="isPreview && formControl.invalid && formControl.touched">
        <div *ngFor="let rule of field.validationRules" class="validation-message">
          {{ getValidationMessage(rule) }}
        </div>
      </div>

      <!-- Field Type Badge (Design Mode) -->
      <div class="field-type-badge" *ngIf="!isPreview">
        {{ getFieldTypeLabel() }}
      </div>
    </div>
  `,
  styles: [`
    .field-wrapper {
      position: relative;
      margin-bottom: 0.5rem;
    }

    .field-wrapper.preview-mode {
      margin-bottom: 1.5rem;
    }

    .field-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .required-indicator {
      color: #ef4444;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input[readonly],
    .form-textarea[readonly],
    .form-select[disabled] {
      background-color: #f9fafb;
      cursor: default;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .checkbox-group,
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-label,
    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      margin-bottom: 0;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .checkbox-input,
    .radio-input {
      width: auto;
      margin: 0;
    }

    .checkbox-input[disabled],
    .radio-input[disabled] {
      cursor: default;
    }

    .checkbox-text,
    .radio-text {
      color: #374151;
    }

    .validation-messages {
      margin-top: 0.25rem;
    }

    .validation-message {
      font-size: 0.75rem;
      color: #ef4444;
    }

    .field-type-badge {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .field-wrapper.selected .field-type-badge {
      background: #059669;
    }

    .preview-mode .field-type-badge {
      display: none;
    }
  `]
})
export class FieldRendererComponent implements ControlValueAccessor {
  @Input() field!: FormField;
  @Input() isPreview = false;
  @Input() isSelected = false;

  formControl = new FormControl<string[]>([]);

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.formControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }

  // Type-specific getters
  getTextInputField(): TextInputField {
    return this.field as TextInputField;
  }

  getSelectField(): SelectField {
    return this.field as SelectField;
  }

  getCheckboxGroupField(): CheckboxGroupField {
    return this.field as CheckboxGroupField;
  }

  getRadioGroupField(): RadioGroupField {
    return this.field as RadioGroupField;
  }

  getDateField(): DatePickerField {
    return this.field as DatePickerField;
  }

  onCheckboxChange(value: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentValues = this.formControl.value || [];
    
    if (target.checked) {
      this.formControl.setValue([...currentValues, value]);
    } else {
      this.formControl.setValue(currentValues.filter((v: string) => v !== value));
    }
  }

  getFieldTypeLabel(): string {
    const typeLabels: { [key: string]: string } = {
      'text': 'Text',
      'textarea': 'Textarea',
      'select': 'Select',
      'checkbox-group': 'Checkbox',
      'radio-group': 'Radio',
      'date': 'Date'
    };
    return typeLabels[this.field.type] || this.field.type;
  }

  getValidationMessage(rule: any): string {
    return rule.message || `${rule.type} validation failed`;
  }
}