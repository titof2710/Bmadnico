<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Modifier le Seuil d'Alerte</h2>

      <div class="pool-info">
        <div class="info-row">
          <strong>Pool ID:</strong>
          <code>{{ pool.poolId }}</code>
        </div>
        <div class="info-row">
          <strong>Produit:</strong>
          <span>{{ pool.productName }}</span>
        </div>
        <div class="info-row">
          <strong>Total licences:</strong>
          <span>{{ pool.totalPurchased }}</span>
        </div>
        <div class="info-row">
          <strong>Seuil actuel:</strong>
          <span class="highlight">{{ pool.warningThreshold }} licences</span>
        </div>
      </div>

      <form @submit.prevent="updateThreshold">
        <div class="form-group">
          <label for="warningThreshold">Nouveau seuil d'alerte *</label>
          <input
            id="warningThreshold"
            v-model.number="newThreshold"
            type="number"
            min="0"
            :max="pool.totalPurchased"
            required
          />
          <small>
            Le pool sera en alerte quand les licences disponibles seront ≤ à ce seuil<br>
            Recommandé: {{ Math.floor(pool.totalPurchased * 0.2) }} (20% du total)
          </small>
        </div>

        <div class="preview" v-if="newThreshold !== pool.warningThreshold">
          <p><strong>Aperçu:</strong></p>
          <p>
            Le pool passera en état d'alerte quand il restera
            <strong>{{ newThreshold }} licences ou moins</strong> disponibles.
          </p>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Annuler
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="submitting || newThreshold === pool.warningThreshold"
          >
            {{ submitting ? 'Mise à jour...' : 'Mettre à jour' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LicensePool {
  poolId: string;
  organizationId: string;
  productId: string;
  productName: string;
  availableLicenses: number;
  totalPurchased: number;
  consumedLicenses: number;
  warningThreshold: number;
}

const props = defineProps<{
  pool: LicensePool;
}>();

const emit = defineEmits(['close', 'updated']);

const newThreshold = ref(props.pool.warningThreshold);
const submitting = ref(false);

async function updateThreshold() {
  if (newThreshold.value === props.pool.warningThreshold) {
    alert('Le seuil est identique à l\'actuel');
    return;
  }

  try {
    submitting.value = true;
    const token = localStorage.getItem('jwt_token');

    // Créer événement WarningThresholdUpdated via l'API
    const response = await fetch(
      `${API_URL}/api/admin/license-pools/${props.pool.poolId}/update-threshold`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: props.pool.organizationId,
          newThreshold: newThreshold.value,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      alert('Seuil d\'alerte mis à jour avec succès!');
      emit('updated', data.pool);
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || error.error}`);
    }
  } catch (error) {
    console.error('Failed to update threshold:', error);
    alert('Erreur lors de la mise à jour du seuil');
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
  margin-bottom: 20px;
  color: #333;
}

.pool-info {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row strong {
  color: #555;
}

.info-row code {
  font-size: 12px;
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
}

.info-row .highlight {
  color: #007bff;
  font-weight: 600;
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

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.preview {
  background-color: #e7f3ff;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 3px solid #007bff;
}

.preview p {
  margin: 0;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

.preview strong {
  color: #007bff;
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
