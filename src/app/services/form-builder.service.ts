// src/app/services/form-builder.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormField, FormConfiguration, FieldTypeDefinition, FormFieldType, FormFieldUpdate } from '../models/form-field.interface';

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  public currentFormSubject = new BehaviorSubject<FormConfiguration | null>(null);
  private selectedFieldSubject = new BehaviorSubject<FormField | null>(null);

  currentForm$ = this.currentFormSubject.asObservable();
  selectedField$ = this.selectedFieldSubject.asObservable();

  private fieldTypes: FieldTypeDefinition[] = [
    {
      type: 'text',
      label: 'Text Input',
      icon: '📝',
      defaultConfig: {
        type: 'text',
        label: 'Text Field',
        required: false,
        validationRules: [],
        placeholder: 'Enter text...'
      }
    },
    {
      type: 'textarea',
      label: 'Text Area',
      icon: '📄',
      defaultConfig: {
        type: 'textarea',
        label: 'Text Area',
        required: false,
        validationRules: [],
        placeholder: 'Enter text...'
      }
    },
    {
      type: 'select',
      label: 'Dropdown',
      icon: '📋',
      defaultConfig: {
        type: 'select',
        label: 'Select Field',
        required: false,
        validationRules: [],
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ]
      }
    },
    {
      type: 'checkbox-group',
      label: 'Checkbox Group',
      icon: '☑️',
      defaultConfig: {
        type: 'checkbox-group',
        label: 'Checkbox Group',
        required: false,
        validationRules: [],
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ]
      }
    },
    {
      type: 'radio-group',
      label: 'Radio Group',
      icon: '🔘',
      defaultConfig: {
        type: 'radio-group',
        label: 'Radio Group',
        required: false,
        validationRules: [],
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ]
      }
    },
    {
      type: 'date',
      label: 'Date Picker',
      icon: '📅',
      defaultConfig: {
        type: 'date',
        label: 'Date Field',
        required: false,
        validationRules: []
      }
    }
  ];

  getFieldTypes(): FieldTypeDefinition[] {
    return this.fieldTypes;
  }

  createNewForm(name: string, description?: string): FormConfiguration {
    const newForm: FormConfiguration = {
      id: this.generateId(),
      name,
      description,
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.currentFormSubject.next(newForm);
    return newForm;
  }

  addField(fieldType: FormFieldType): FormField {
    const fieldDefinition = this.fieldTypes.find(ft => ft.type === fieldType);
    if (!fieldDefinition) {
      throw new Error(`Unknown field type: ${fieldType}`);
    }

    const newField: FormField = {
      id: this.generateId(),
      ...fieldDefinition.defaultConfig
    } as FormField;

    const currentForm = this.currentFormSubject.value;
    if (currentForm) {
      currentForm.fields.push(newField);
      currentForm.updatedAt = new Date();
      this.currentFormSubject.next(currentForm);
    }

    return newField;
  }

  updateField(fieldId: string, updates: FormFieldUpdate): void {
    const currentForm = this.currentFormSubject.value;
    if (!currentForm) return;

    const fieldIndex = currentForm.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex !== -1) {
      const currentField = currentForm.fields[fieldIndex];
      
      // Create a new field object with updates, preserving the original type
      const updatedField: FormField = {
        ...currentField,
        ...updates,
        // Ensure the type never changes
        type: currentField.type,
        id: currentField.id
      } as FormField;
      
      currentForm.fields[fieldIndex] = updatedField;
      currentForm.updatedAt = new Date();
      this.currentFormSubject.next(currentForm);
      
      // Update selected field if it's the one being updated
      const selectedField = this.selectedFieldSubject.value;
      if (selectedField && selectedField.id === fieldId) {
        this.selectedFieldSubject.next(updatedField);
      }
    }
  }

  deleteField(fieldId: string): void {
    const currentForm = this.currentFormSubject.value;
    if (!currentForm) return;

    currentForm.fields = currentForm.fields.filter(f => f.id !== fieldId);
    currentForm.updatedAt = new Date();
    this.currentFormSubject.next(currentForm);
  }

  reorderFields(fromIndex: number, toIndex: number): void {
    const currentForm = this.currentFormSubject.value;
    if (!currentForm) return;

    const fields = [...currentForm.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    
    currentForm.fields = fields;
    currentForm.updatedAt = new Date();
    this.currentFormSubject.next(currentForm);
  }

  selectField(field: FormField | null): void {
    this.selectedFieldSubject.next(field);
  }

  getCurrentForm(): FormConfiguration | null {
    return this.currentFormSubject.value;
  }

  getSelectedField(): FormField | null {
    return this.selectedFieldSubject.value;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}