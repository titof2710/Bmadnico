<template>
  <div class="admin-license-pools-table">
    <!-- Header avec filtres et bouton Créer -->
    <div class="table-header">
      <div class="filters">
        <label>
          Organisation:
          <select v-model="filters.organizationId" @change="applyFilters">
            <option value="">Toutes</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
        </label>
        <label>
          Recherche:
          <input
            v-model="filters.search"
            @input="applyFilters"
            type="text"
            placeholder="Pool ID, produit..."
            class="search-input"
          />
        </label>
      </div>

      <button class="btn-primary" @click="openCreateModal">
        + Créer Pool
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      Chargement des pools...
    </div>

    <!-- Table -->
    <div v-else-if="filteredPools.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Pool ID</th>
            <th>Organisation</th>
            <th>Produit</th>
            <th>Disponibles</th>
            <th>Total</th>
            <th>Consommées</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pool in filteredPools" :key="pool.poolId">
            <td><code>{{ pool.poolId }}</code></td>
            <td>{{ pool.organizationId }}</td>
            <td>{{ pool.productName }}</td>
            <td>{{ pool.availableLicenses }}</td>
            <td>{{ pool.totalPurchased }}</td>
            <td>{{ pool.consumedLicenses }}</td>
            <td>
              <span :class="getStatusClass(pool)">
                {{ getStatusLabel(pool) }}
              </span>
            </td>
            <td class="actions">
              <button @click="openEditModal(pool)" class="btn-sm btn-warning" title="Modifier le seuil d'alerte">
                ✏️ Éditer
              </button>
              <button @click="openAddLicensesModal(pool)" class="btn-sm btn-success" title="Ajouter des licences">
                ➕ Ajouter
              </button>
              <button
                @click="deletePool(pool)"
                class="btn-sm btn-danger"
                :disabled="pool.consumedLicenses > 0"
                :title="pool.consumedLicenses > 0 ? 'Impossible de supprimer un pool avec des licences consommées' : 'Supprimer ce pool'"
              >
                🗑️ Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p v-if="filters.search || filters.organizationId">
        Aucun pool ne correspond à vos critères de recherche.
      </p>
      <p v-else>Aucun pool de licences trouvé.</p>
      <button v-if="!filters.search && !filters.organizationId" class="btn-primary" @click="openCreateModal">
        Créer votre premier pool
      </button>
    </div>

    <!-- Modals -->
    <CreatePoolModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onPoolCreated"
    />

    <AddLicensesModal
      v-if="showAddLicensesModal"
      :pool="selectedPool"
      @close="showAddLicensesModal = false"
      @added="onLicensesAdded"
    />

    <EditPoolModal
      v-if="showEditModal"
      :pool="selectedPool"
      @close="showEditModal = false"
      @updated="onPoolUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CreatePoolModal from './CreatePoolModal.vue';
import AddLicensesModal from './AddLicensesModal.vue';
import EditPoolModal from './EditPoolModal.vue';

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
  isWarning: boolean;
  isDepleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pools = ref<LicensePool[]>([]);
const filteredPools = ref<LicensePool[]>([]);
const loading = ref(false);

const organizations = ref([
  { id: 'demo-org-1', name: 'Acme Corporation' },
  { id: 'demo-org-2', name: 'TechStart SAS' },
  { id: 'demo-org-3', name: 'Global Consulting' },
]);

const filters = ref({
  organizationId: '',
  search: '',
});

const showCreateModal = ref(false);
const showAddLicensesModal = ref(false);
const showEditModal = ref(false);
const selectedPool = ref<LicensePool | null>(null);

async function loadPools() {
  try {
    loading.value = true;
    const token = localStorage.getItem('jwt_token');
    const url = `${API_URL}/api/admin/license-pools`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    pools.value = data.pools || [];
    applyFilters();
  } catch (error) {
    console.error('Failed to load admin license pools:', error);
    alert('Erreur lors du chargement des pools');
    pools.value = [];
    filteredPools.value = [];
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  let result = [...pools.value];

  // Filtrer par organisation
  if (filters.value.organizationId) {
    result = result.filter(p => p.organizationId === filters.value.organizationId);
  }

  // Filtrer par recherche (poolId, productId, productName)
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    result = result.filter(p =>
      p.poolId.toLowerCase().includes(searchLower) ||
      p.productId.toLowerCase().includes(searchLower) ||
      p.productName.toLowerCase().includes(searchLower) ||
      p.organizationId.toLowerCase().includes(searchLower)
    );
  }

  filteredPools.value = result;
}

function getStatusClass(pool: LicensePool): string {
  if (pool.isDepleted) return 'status-critical';
  if (pool.isWarning) return 'status-warning';
  return 'status-healthy';
}

function getStatusLabel(pool: LicensePool): string {
  if (pool.isDepleted) return '🔴 Critique';
  if (pool.isWarning) return '⚠️ Alerte';
  return '✅ Sain';
}

function openCreateModal() {
  showCreateModal.value = true;
}

function openEditModal(pool: LicensePool) {
  selectedPool.value = pool;
  showEditModal.value = true;
}

function openAddLicensesModal(pool: LicensePool) {
  selectedPool.value = pool;
  showAddLicensesModal.value = true;
}

async function deletePool(pool: LicensePool) {
  if (pool.consumedLicenses > 0) {
    alert('Impossible de supprimer un pool avec des licences consommées');
    return;
  }

  if (!confirm(`Confirmer la suppression du pool ${pool.poolId}?\n\nCette action est irréversible.`)) {
    return;
  }

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_URL}/api/admin/license-pools/${pool.poolId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: pool.organizationId,
      }),
    });

    if (response.ok) {
      alert('Pool supprimé avec succès');
      loadPools();
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || error.error}`);
    }
  } catch (error) {
    console.error('Failed to delete pool:', error);
    alert('Erreur lors de la suppression');
  }
}

function onPoolCreated() {
  showCreateModal.value = false;
  loadPools();
}

function onPoolUpdated() {
  showEditModal.value = false;
  loadPools();
}

function onLicensesAdded() {
  showAddLicensesModal.value = false;
  loadPools();
}

onMounted(() => {
  loadPools();
});
</script>

<style scoped>
.admin-license-pools-table {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 16px;
}

.filters label {
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filters select,
.filters .search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 180px;
}

.filters .search-input {
  min-width: 250px;
}

.filters select:focus,
.filters .search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-primary {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.data-table code {
  font-size: 12px;
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
}

.status-healthy {
  color: #28a745;
  font-weight: 600;
}

.status-warning {
  color: #ffc107;
  font-weight: 600;
}

.status-critical {
  color: #dc3545;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 20px;
}
</style>
