// src/app/components/form-list/form-list.component.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormStorageService, FormTemplate } from '../services/form-storage.service';
import { FormConfiguration } from '../models/form-field.interface';


@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="header-content">
          <h1>Form Templates</h1>
          <p>Manage and organize your dynamic forms</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="createNewForm()">
            <span class="btn-icon">➕</span>
            Create New Form
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-section">
        <div class="search-bar">
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search forms by name, description, or field labels..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-buttons">
          <button 
            class="filter-btn"
            [class.active]="currentFilter === 'all'"
            (click)="setFilter('all')"
          >
            All ({{ getTotalCount() }})
          </button>
          <button 
            class="filter-btn"
            [class.active]="currentFilter === 'published'"
            (click)="setFilter('published')"
          >
            Published ({{ getPublishedCount() }})
          </button>
          <button 
            class="filter-btn"
            [class.active]="currentFilter === 'draft'"
            (click)="setFilter('draft')"
          >
            Drafts ({{ getDraftCount() }})
          </button>
        </div>
      </div>

      <!-- Form Templates Grid -->
      <div class="templates-grid" *ngIf="filteredTemplates.length > 0; else noTemplates">
        <div 
          *ngFor="let template of filteredTemplates" 
          class="template-card"
          [class.published]="template.isPublished"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="template-info">
              <h3 class="template-name">{{ template.name }}</h3>
              <p class="template-description" *ngIf="template.description">
                {{ template.description }}
              </p>
              <div class="template-meta">
                <span class="field-count">{{ template.configuration.fields.length }} fields</span>
                <span class="separator">•</span>
                <span class="submission-count">{{ template.submissionCount }} submissions</span>
              </div>
            </div>
            
            <div class="card-status">
              <span class="status-badge" [class.published]="template.isPublished">
                {{ template.isPublished ? 'Published' : 'Draft' }}
              </span>
            </div>
          </div>

          <!-- Field Preview -->
          <div class="field-preview">
            <div class="field-list">
              <div 
                *ngFor="let field of template.configuration.fields | slice:0:3" 
                class="field-item"
              >
                <span class="field-type">{{ getFieldTypeIcon(field.type) }}</span>
                <span class="field-label">{{ field.label }}</span>
                <span class="field-required" *ngIf="field.required">*</span>
              </div>
              <div 
                *ngIf="template.configuration.fields.length > 3" 
                class="field-item more-fields"
              >
                +{{ template.configuration.fields.length - 3 }} more
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <div class="date-info">
              <small>Updated {{ getRelativeDate(template.updatedAt) }}</small>
            </div>
            
            <div class="card-actions">
              <button 
                class="action-btn preview"
                (click)="previewForm(template)"
                title="Preview Form"
              >
                👁️
              </button>
              <button 
                class="action-btn edit"
                (click)="editForm(template)"
                title="Edit Form"
              >
                ✏️
              </button>
              <button 
                class="action-btn duplicate"
                (click)="duplicateForm(template)"
                title="Duplicate Form"
              >
                📋
              </button>
              <button 
                class="action-btn publish"
                (click)="togglePublish(template)"
                [title]="template.isPublished ? 'Unpublish Form' : 'Publish Form'"
              >
                {{ template.isPublished ? '📤' : '📥' }}
              </button>
              <button 
                class="action-btn delete"
                (click)="deleteForm(template)"
                title="Delete Form"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Templates State -->
      <ng-template #noTemplates>
        <div class="no-templates">
          <div class="no-templates-content">
            <span class="no-templates-icon">📝</span>
            <h3>{{ getNoTemplatesTitle() }}</h3>
            <p>{{ getNoTemplatesMessage() }}</p>
            <button class="btn btn-primary" (click)="createNewForm()">
              Create Your First Form
            </button>
          </div>
        </div>
      </ng-template>

      <!-- Import/Export Section -->
      <div class="import-export-section">
        <div class="section-header">
          <h3>Import / Export</h3>
        </div>
        <div class="import-export-actions">
          <input
            type="file"
            accept=".json"
            (change)="onFileSelected($event)"
            #fileInput
            style="display: none"
          />
          <button class="btn btn-secondary" (click)="fileInput.click()">
            📁 Import Template
          </button>
          <button 
            class="btn btn-secondary" 
            (click)="exportAllTemplates()"
            [disabled]="templates.length === 0"
          >
            💾 Export All Templates
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-list-container {
      min-height: 100vh;
      background: #f5f7fa;
      padding: 2rem;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      background: white;
      padding: 2rem;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
    }

    .header-content p {
      margin: 0;
      color: #718096;
      font-size: 1.125rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: #4299e1;
      color: white;
    }

    .btn-primary:hover {
      background: #3182ce;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .btn-icon {
      font-size: 1rem;
    }

    .search-section {
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .search-bar {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #a0aec0;
      font-size: 1.25rem;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 0.375rem;
      color: #4a5568;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .filter-btn:hover {
      border-color: #cbd5e0;
      background: #f7fafc;
    }

    .filter-btn.active {
      background: #4299e1;
      color: white;
      border-color: #4299e1;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .template-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .template-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .template-card.published {
      border-color: #48bb78;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .template-name {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2d3748;
    }

    .template-description {
      margin: 0 0 0.5rem 0;
      color: #718096;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .template-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #a0aec0;
    }

    .separator {
      color: #e2e8f0;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fed7d7;
      color: #c53030;
    }

    .status-badge.published {
      background: #c6f6d5;
      color: #22543d;
    }

    .field-preview {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 0.5rem;
    }

    .field-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .field-type {
      font-size: 1rem;
    }

    .field-label {
      color: #4a5568;
      flex: 1;
    }

    .field-required {
      color: #e53e3e;
      font-weight: 600;
    }

    .more-fields {
      color: #718096;
      font-style: italic;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .date-info {
      color: #a0aec0;
      font-size: 0.75rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .action-btn.preview {
      background: #bee3f8;
      color: #2b6cb0;
    }

    .action-btn.edit {
      background: #fbb6ce;
      color: #b83280;
    }

    .action-btn.duplicate {
      background: #d6f5d6;
      color: #276749;
    }

    .action-btn.publish {
      background: #fad5a5;
      color: #b7791f;
    }

    .action-btn.delete {
      background: #fed7d7;
      color: #c53030;
    }

    .action-btn:hover {
      transform: scale(1.1);
    }

    .no-templates {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: white;
      border-radius: 0.75rem;
      margin-bottom: 2rem;
    }

    .no-templates-content {
      text-align: center;
      max-width: 400px;
    }

    .no-templates-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .no-templates-content h3 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
      font-size: 1.5rem;
    }

    .no-templates-content p {
      margin: 0 0 1.5rem 0;
      color: #718096;
      line-height: 1.6;
    }

    .import-export-section {
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-header h3 {
      margin: 0 0 1rem 0;
      color: #2d3748;
      font-size: 1.125rem;
    }

    .import-export-actions {
      display: flex;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .form-list-container {
        padding: 1rem;
      }

      .list-header {
        flex-direction: column;
        gap: 1rem;
      }

      .templates-grid {
        grid-template-columns: 1fr;
      }

      .filter-buttons {
        flex-wrap: wrap;
      }

      .import-export-actions {
        flex-direction: column;
      }
    }
  `]
})
export class FormListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() editForm1 = new EventEmitter<FormConfiguration>();
  @Output() previewForm1 = new EventEmitter<FormTemplate>();
  @Output() createNew = new EventEmitter<void>();

  templates: FormTemplate[] = [];
  filteredTemplates: FormTemplate[] = [];
  currentFilter: 'all' | 'published' | 'draft' = 'all';
  searchControl = new FormControl('');

  constructor(private formStorageService: FormStorageService) {}

  ngOnInit(): void {
    // Subscribe to templates
    this.formStorageService.templates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(templates => {
        this.templates = templates;
        this.applyFilters();
      });

    // Setup search
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyFilters(): void {
    let filtered = [...this.templates];

    // Apply status filter
    if (this.currentFilter === 'published') {
      filtered = filtered.filter(t => t.isPublished);
    } else if (this.currentFilter === 'draft') {
      filtered = filtered.filter(t => !t.isPublished);
    }

    // Apply search filter
    const searchTerm = this.searchControl.value?.toLowerCase().trim();
    if (searchTerm) {
      filtered = this.formStorageService.searchTemplates(searchTerm)
        .filter(template => {
          if (this.currentFilter === 'published') return template.isPublished;
          if (this.currentFilter === 'draft') return !template.isPublished;
          return true;
        });
    }

    // Sort by updated date (newest first)
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    this.filteredTemplates = filtered;
  }

  setFilter(filter: 'all' | 'published' | 'draft'): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  getTotalCount(): number {
    return this.templates.length;
  }

  getPublishedCount(): number {
    return this.templates.filter(t => t.isPublished).length;
  }

  getDraftCount(): number {
    return this.templates.filter(t => !t.isPublished).length;
  }

  getNoTemplatesTitle(): string {
    if (this.currentFilter === 'published') return 'No Published Forms';
    if (this.currentFilter === 'draft') return 'No Draft Forms';
    if (this.searchControl.value?.trim()) return 'No Forms Found';
    return 'No Forms Yet';
  }

  getNoTemplatesMessage(): string {
    if (this.currentFilter === 'published') {
      return 'You haven\'t published any forms yet. Create and publish a form to get started.';
    }
    if (this.currentFilter === 'draft') {
      return 'All your forms are published. Create a new form to start working on drafts.';
    }
    if (this.searchControl.value?.trim()) {
      return 'Try adjusting your search terms or filters to find what you\'re looking for.';
    }
    return 'Get started by creating your first dynamic form. You can build forms with various field types and share them with others.';
  }

  createNewForm(): void {
    this.createNew.emit();
  }

  editForm(template: FormTemplate): void {
    this.editForm1.emit(template.configuration);
  }

  previewForm(template: FormTemplate): void {
    this.previewForm1.emit(template);
  }

  duplicateForm(template: FormTemplate): void {
    const duplicated = this.formStorageService.duplicateTemplate(template.id);
    if (duplicated) {
      // Optionally show success message
      console.log('Form duplicated successfully');
    }
  }

  togglePublish(template: FormTemplate): void {
    this.formStorageService.togglePublishStatus(template.id);
  }

  deleteForm(template: FormTemplate): void {
    if (confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      this.formStorageService.deleteTemplate(template.id);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const imported = this.formStorageService.importTemplate(content);
        
        if (imported) {
          alert(`Successfully imported "${imported.name}"`);
        } else {
          alert('Failed to import template. Please check the file format.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid JSON file.');
    }
    
    // Reset input
    input.value = '';
  }

  exportAllTemplates(): void {
    const exportData = {
      exportDate: new Date().toISOString(),
      templates: this.templates
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getFieldTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'text': '📝',
      'textarea': '📄',
      'select': '📋',
      'checkbox-group': '☑️',
      'radio-group': '🔘',
      'date': '📅'
    };
    return icons[type] || '📝';
  }

  getRelativeDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }
}