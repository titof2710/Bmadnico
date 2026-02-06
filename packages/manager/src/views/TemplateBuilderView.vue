<template>
  <div class="template-builder">
    <div class="header">
      <h1 class="title">📋 Créateur de Templates</h1>
      <p class="subtitle">Créez et gérez vos templates d'évaluation</p>
    </div>

    <!-- Template List -->
    <div v-if="!editingTemplate" class="templates-list">
      <div class="list-header">
        <h2>Templates Existants</h2>
        <button @click="createNewTemplate" class="btn btn-primary">
          ➕ Nouveau Template
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des templates...</p>
      </div>

      <div v-else class="templates-grid">
        <div
          v-for="template in templates"
          :key="template.templateId"
          class="template-card"
        >
          <div class="template-header">
            <h3>{{ template.name }}</h3>
            <span class="badge" :class="template.published ? 'badge-success' : 'badge-warning'">
              {{ template.published ? 'Publié' : 'Brouillon' }}
            </span>
          </div>
          <p class="template-description">{{ template.description }}</p>
          <div class="template-meta">
            <span>📄 {{ template.totalPages }} pages</span>
            <span>v{{ template.version }}</span>
          </div>
          <div class="template-actions">
            <button @click="editTemplate(template)" class="btn btn-secondary">
              ✏️ Modifier
            </button>
            <button @click="duplicateTemplate(template)" class="btn btn-secondary">
              📋 Dupliquer
            </button>
            <button @click="deleteTemplate(template)" class="btn btn-danger">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Editor -->
    <div v-else class="template-editor">
      <div class="editor-header">
        <button @click="cancelEdit" class="btn btn-secondary">
          ← Retour
        </button>
        <h2>{{ editingTemplate.templateId ? 'Modifier' : 'Nouveau' }} Template</h2>
        <button @click="saveTemplate" class="btn btn-primary">
          💾 Enregistrer
        </button>
      </div>

      <!-- Basic Info -->
      <div class="editor-section">
        <h3>Informations Générales</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Nom du Template *</label>
            <input
              v-model="editingTemplate.name"
              type="text"
              placeholder="Ex: Évaluation du Leadership"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>Version</label>
            <input
              v-model="editingTemplate.version"
              type="text"
              placeholder="1.0"
              class="form-control"
            />
          </div>
          <div class="form-group full-width">
            <label>Description</label>
            <textarea
              v-model="editingTemplate.description"
              placeholder="Décrivez brièvement ce template..."
              class="form-control"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>
              <input v-model="editingTemplate.published" type="checkbox" />
              Publié
            </label>
          </div>
        </div>
      </div>

      <!-- Pages -->
      <div class="editor-section">
        <div class="section-header">
          <h3>Pages ({{ editingTemplate.pages.length }})</h3>
          <button @click="addPage" class="btn btn-secondary">
            ➕ Ajouter une Page
          </button>
        </div>

        <div
          v-for="(page, pageIndex) in editingTemplate.pages"
          :key="pageIndex"
          class="page-editor"
        >
          <div class="page-header">
            <h4>Page {{ pageIndex + 1 }}</h4>
            <div class="page-actions">
              <button
                v-if="pageIndex > 0"
                @click="movePage(pageIndex, -1)"
                class="btn-icon"
                title="Déplacer vers le haut"
              >
                ⬆️
              </button>
              <button
                v-if="pageIndex < editingTemplate.pages.length - 1"
                @click="movePage(pageIndex, 1)"
                class="btn-icon"
                title="Déplacer vers le bas"
              >
                ⬇️
              </button>
              <button
                @click="deletePage(pageIndex)"
                class="btn-icon btn-danger"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Titre de la Page *</label>
              <input
                v-model="page.title"
                type="text"
                placeholder="Ex: Vision & Stratégie"
                class="form-control"
              />
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <input
                v-model="page.description"
                type="text"
                placeholder="Questions sur votre vision..."
                class="form-control"
              />
            </div>
          </div>

          <!-- Questions -->
          <div class="questions-section">
            <div class="section-header">
              <h5>Questions ({{ page.questions.length }})</h5>
              <button @click="addQuestion(pageIndex)" class="btn btn-sm btn-secondary">
                ➕ Ajouter une Question
              </button>
            </div>

            <div
              v-for="(question, qIndex) in page.questions"
              :key="qIndex"
              class="question-editor"
            >
              <div class="question-header">
                <span class="question-number">Q{{ qIndex + 1 }}</span>
                <select v-model="question.type" class="form-control type-select">
                  <option value="single_choice">Choix unique</option>
                  <option value="multiple_choice">Choix multiples</option>
                  <option value="scale">Échelle</option>
                  <option value="text">Texte libre</option>
                </select>
                <div class="question-actions">
                  <label class="checkbox-label">
                    <input v-model="question.required" type="checkbox" />
                    Obligatoire
                  </label>
                  <button
                    @click="deleteQuestion(pageIndex, qIndex)"
                    class="btn-icon btn-danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Texte de la Question *</label>
                <textarea
                  v-model="question.text"
                  placeholder="Posez votre question ici..."
                  class="form-control"
                  rows="2"
                ></textarea>
              </div>

              <!-- Options for choice questions -->
              <div
                v-if="question.type === 'single_choice' || question.type === 'multiple_choice'"
                class="options-section"
              >
                <label>Options</label>
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-row"
                >
                  <input
                    v-model="option.text"
                    type="text"
                    placeholder="Texte de l'option"
                    class="form-control"
                  />
                  <input
                    v-model.number="option.value"
                    type="number"
                    placeholder="Points"
                    class="form-control points-input"
                    min="0"
                    max="10"
                  />
                  <button
                    @click="deleteOption(pageIndex, qIndex, optIndex)"
                    class="btn-icon btn-danger"
                  >
                    ✖️
                  </button>
                </div>
                <button
                  @click="addOption(pageIndex, qIndex)"
                  class="btn btn-sm btn-secondary"
                >
                  ➕ Ajouter une Option
                </button>
              </div>

              <!-- Scale configuration -->
              <div v-if="question.type === 'scale'" class="scale-config">
                <div class="form-row">
                  <div class="form-group">
                    <label>Min</label>
                    <input
                      v-model.number="question.scaleMin"
                      type="number"
                      class="form-control"
                      min="0"
                    />
                  </div>
                  <div class="form-group">
                    <label>Max</label>
                    <input
                      v-model.number="question.scaleMax"
                      type="number"
                      class="form-control"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="editor-section">
        <h3>Aperçu JSON</h3>
        <pre class="json-preview">{{ JSON.stringify(editingTemplate, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notifications';

interface Option {
  id: string;
  text: string;
  value: number;
}

interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'scale' | 'text';
  text: string;
  required: boolean;
  options?: Option[];
  scaleMin?: number;
  scaleMax?: number;
}

interface Page {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface Template {
  templateId: string;
  name: string;
  description: string;
  version: string;
  published: boolean;
  linkedProductId?: string;
  pages: Page[];
  totalPages: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationStore = useNotificationStore();
const templates = ref<Template[]>([]);
const editingTemplate = ref<Template | null>(null);
const loading = ref(false);

onMounted(() => {
  loadTemplates();
});

async function loadTemplates() {
  loading.value = true;
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('/api/templates', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des templates');
    }

    const data = await response.json();
    templates.value = data.templates || [];
  } catch (error: any) {
    console.error('Erreur chargement templates:', error);
    notificationStore.error('Erreur', 'Impossible de charger les templates');
  } finally {
    loading.value = false;
  }
}

function createNewTemplate() {
  editingTemplate.value = {
    templateId: `template-custom-${Date.now()}`,
    name: '',
    description: '',
    version: '1.0',
    published: false,
    pages: [],
    totalPages: 0,
  };
}

function editTemplate(template: Template) {
  editingTemplate.value = JSON.parse(JSON.stringify(template));
}

async function duplicateTemplate(template: Template) {
  const duplicate = JSON.parse(JSON.stringify(template));
  duplicate.templateId = `template-custom-${Date.now()}`;
  duplicate.name = `${template.name} (Copie)`;
  duplicate.published = false;
  delete duplicate.createdAt;
  delete duplicate.updatedAt;

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(duplicate),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la duplication');
    }

    const data = await response.json();
    templates.value.push(data.template);
    notificationStore.success('Template dupliqué', 'Le template a été dupliqué avec succès');
  } catch (error: any) {
    console.error('Erreur duplication:', error);
    notificationStore.error('Erreur', 'Impossible de dupliquer le template');
  }
}

async function deleteTemplate(template: Template) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${template.name}" ?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`/api/templates/${template.templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression');
    }

    templates.value = templates.value.filter(t => t.templateId !== template.templateId);
    notificationStore.success('Template supprimé', 'Le template a été supprimé avec succès');
  } catch (error: any) {
    console.error('Erreur suppression:', error);
    notificationStore.error('Erreur', error.message);
  }
}

function cancelEdit() {
  editingTemplate.value = null;
}

async function saveTemplate() {
  if (!editingTemplate.value) return;

  // Validation
  if (!editingTemplate.value.name) {
    alert('Le nom du template est obligatoire');
    return;
  }

  if (editingTemplate.value.pages.length === 0) {
    alert('Ajoutez au moins une page');
    return;
  }

  // Update totalPages
  editingTemplate.value.totalPages = editingTemplate.value.pages.length;

  try {
    const token = localStorage.getItem('jwt_token');
    const isNew = !templates.value.find(t => t.templateId === editingTemplate.value!.templateId);

    const url = isNew
      ? '/api/templates'
      : `/api/templates/${editingTemplate.value.templateId}`;

    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingTemplate.value),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'enregistrement');
    }

    const data = await response.json();

    // Update local list
    const index = templates.value.findIndex(
      t => t.templateId === data.template.templateId
    );

    if (index >= 0) {
      templates.value[index] = data.template;
    } else {
      templates.value.push(data.template);
    }

    notificationStore.success('Template enregistré', 'Le template a été enregistré avec succès');
    editingTemplate.value = null;
  } catch (error: any) {
    console.error('Erreur sauvegarde:', error);
    notificationStore.error('Erreur', 'Impossible d\'enregistrer le template');
  }
}

function addPage() {
  if (!editingTemplate.value) return;

  const pageNumber = editingTemplate.value.pages.length + 1;
  editingTemplate.value.pages.push({
    id: `page-${pageNumber}`,
    title: `Page ${pageNumber}`,
    description: '',
    questions: [],
  });
}

function deletePage(pageIndex: number) {
  if (!editingTemplate.value) return;
  if (confirm('Supprimer cette page ?')) {
    editingTemplate.value.pages.splice(pageIndex, 1);
  }
}

function movePage(pageIndex: number, direction: number) {
  if (!editingTemplate.value) return;
  const newIndex = pageIndex + direction;
  if (newIndex < 0 || newIndex >= editingTemplate.value.pages.length) return;

  const pages = editingTemplate.value.pages;
  [pages[pageIndex], pages[newIndex]] = [pages[newIndex], pages[pageIndex]];
}

function addQuestion(pageIndex: number) {
  if (!editingTemplate.value) return;

  const page = editingTemplate.value.pages[pageIndex];
  const qNumber = page.questions.length + 1;

  page.questions.push({
    id: `q${Date.now()}`,
    type: 'single_choice',
    text: '',
    required: true,
    options: [
      { id: 'opt1', text: 'Option 1', value: 5 },
      { id: 'opt2', text: 'Option 2', value: 3 },
    ],
  });
}

function deleteQuestion(pageIndex: number, qIndex: number) {
  if (!editingTemplate.value) return;
  if (confirm('Supprimer cette question ?')) {
    editingTemplate.value.pages[pageIndex].questions.splice(qIndex, 1);
  }
}

function addOption(pageIndex: number, qIndex: number) {
  if (!editingTemplate.value) return;

  const question = editingTemplate.value.pages[pageIndex].questions[qIndex];
  if (!question.options) question.options = [];

  const optNumber = question.options.length + 1;
  question.options.push({
    id: `opt${optNumber}`,
    text: `Option ${optNumber}`,
    value: 1,
  });
}

function deleteOption(pageIndex: number, qIndex: number, optIndex: number) {
  if (!editingTemplate.value) return;

  const question = editingTemplate.value.pages[pageIndex].questions[qIndex];
  if (question.options) {
    question.options.splice(optIndex, 1);
  }
}
</script>

<style scoped>
.template-builder {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* Templates List */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  gap: 16px;
}

.loading p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.template-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.template-description {
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.template-meta {
  display: flex;
  gap: 16px;
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.template-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.813rem;
}

.btn-icon {
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

/* Editor */
.template-editor {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f3f4f6;
}

.editor-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
}

.editor-section {
  margin-bottom: 32px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
}

.editor-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.938rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
}

/* Pages */
.page-editor {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 2px solid #e5e7eb;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 8px;
}

/* Questions */
.questions-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.question-editor {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
}

.question-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.type-select {
  flex: 1;
  max-width: 200px;
}

.question-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

/* Options */
.options-section {
  margin-top: 12px;
}

.option-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.option-row .form-control {
  flex: 1;
}

.points-input {
  max-width: 100px;
}

/* Scale */
.scale-config {
  margin-top: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
}

/* JSON Preview */
.json-preview {
  background: #1f2937;
  color: #10b981;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.813rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .template-builder {
    padding: 16px;
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .editor-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .editor-header h2 {
    text-align: left;
  }
}
</style>
