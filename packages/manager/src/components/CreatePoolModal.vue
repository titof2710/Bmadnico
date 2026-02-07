<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Créer un Pool de Licences</h2>

      <form @submit.prevent="createPool">
        <div class="form-group">
          <label for="organizationId">Organisation *</label>
          <select
            id="organizationId"
            v-model="form.organizationId"
            required
          >
            <option value="">Sélectionner une organisation...</option>
            <option value="demo-org-1">Acme Corporation</option>
            <option value="demo-org-2">TechStart SAS</option>
            <option value="demo-org-3">Global Consulting</option>
          </select>
        </div>

        <div class="form-group">
          <label for="productId">Produit ID *</label>
          <input
            id="productId"
            v-model="form.productId"
            type="text"
            required
            placeholder="template-001"
          />
          <small>Identifiant unique du produit/template</small>
        </div>

        <div class="form-group">
          <label for="productName">Nom du Produit *</label>
          <input
            id="productName"
            v-model="form.productName"
            type="text"
            required
            placeholder="Évaluation du Leadership"
          />
          <small>Nom descriptif du produit</small>
        </div>

        <div class="form-group">
          <label for="initialLicenses">Nombre de Licences Initiales *</label>
          <input
            id="initialLicenses"
            v-model.number="form.initialLicenses"
            type="number"
            min="1"
            required
          />
          <small>Minimum: 1 licence</small>
        </div>

        <div class="form-group">
          <label for="warningThreshold">Seuil d'Alerte</label>
          <input
            id="warningThreshold"
            v-model.number="form.warningThreshold"
            type="number"
            min="0"
            placeholder="Auto (20% du total)"
          />
          <small>Laisser vide pour calcul automatique (20% du total)</small>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Création...' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const emit = defineEmits(['close', 'created']);

const form = ref({
  organizationId: '',
  productId: '',
  productName: '',
  initialLicenses: 10,
  warningThreshold: null as number | null,
});

const submitting = ref(false);

async function createPool() {
  try {
    submitting.value = true;
    const token = localStorage.getItem('jwt_token');

    const payload: Record<string, unknown> = {
      organizationId: form.value.organizationId,
      productId: form.value.productId,
      productName: form.value.productName,
      initialLicenses: form.value.initialLicenses,
    };

    // Ajouter warningThreshold seulement si fourni
    if (form.value.warningThreshold !== null && form.value.warningThreshold !== undefined) {
      payload.warningThreshold = form.value.warningThreshold;
    }

    const response = await fetch(`${API_URL}/api/admin/license-pools`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      alert('Pool créé avec succès!');
      emit('created', data.pool);
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || error.error}`);
    }
  } catch (error) {
    console.error('Failed to create pool:', error);
    alert('Erreur lors de la création du pool');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

h2 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
