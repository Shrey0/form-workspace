// src/app/models/form-field.interface.ts
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'min' | 'max';
  value?: any;
  message: string;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface BaseFormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  helpText?: string;
  validationRules: ValidationRule[];
  placeholder?: string;
}

export interface TextInputField extends BaseFormField {
  type: 'text' | 'textarea';
  maxLength?: number;
  minLength?: number;
}

export interface SelectField extends BaseFormField {
  type: 'select';
  options: FieldOption[];
  multiple?: boolean;
}

export interface CheckboxGroupField extends BaseFormField {
  type: 'checkbox-group';
  options: FieldOption[];
}

export interface RadioGroupField extends BaseFormField {
  type: 'radio-group';
  options: FieldOption[];
}

export interface DatePickerField extends BaseFormField {
  type: 'date';
  minDate?: string;
  maxDate?: string;
}

export type FormField = TextInputField | SelectField | CheckboxGroupField | RadioGroupField | DatePickerField;

export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox-group' | 'radio-group' | 'date';

// Type-safe update interfaces
export type FormFieldUpdate = 
  | Partial<Omit<TextInputField, 'type'>>
  | Partial<Omit<SelectField, 'type'>>
  | Partial<Omit<CheckboxGroupField, 'type'>>
  | Partial<Omit<RadioGroupField, 'type'>>
  | Partial<Omit<DatePickerField, 'type'>>;

export interface FormConfiguration {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldTypeDefinition {
  type: FormFieldType;
  label: string;
  icon: string;
  defaultConfig: Partial<FormField>;
}