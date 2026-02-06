<template>
  <div class="order-history-container">
    <div class="table-header">
      <h3>Historique des Commandes</h3>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par ID, Statut..."
          class="search-input"
        />
        <button @click="$emit('refresh')" class="btn-refresh" title="Rafraîchir">
          🔄
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de l'historique des commandes...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('refresh')" class="btn-retry">Réessayer</button>
    </div>

    <div v-else class="table-container">
      <table class="orders-table">
        <thead>
          <tr>
            <th>ID Commande</th>
            <th>Date</th>
            <th>Produit</th>
            <th>Quantité</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in filteredOrders"
            :key="order.orderId"
            class="order-row"
          >
            <td class="order-id">
              <span class="id-text">{{ formatOrderId(order.orderId) }}</span>
            </td>
            <td class="order-date">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="order-product">
              <div class="product-info">
                <span class="product-name">{{ order.productType }}</span>
                <span class="template-id">{{ order.templateId }}</span>
              </div>
            </td>
            <td class="order-quantity">
              <span class="quantity-badge">{{ order.quantity }} licences</span>
            </td>
            <td class="order-amount">
              <span class="amount-value">{{ formatCurrency(order.amount) }}</span>
            </td>
            <td class="order-status">
              <span
                class="status-badge"
                :class="`status-badge--${order.status}`"
              >
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td class="order-actions">
              <button
                v-if="order.status === 'pending' && order.paymentUrl"
                @click="openPaymentUrl(order.paymentUrl)"
                class="btn-action btn-primary"
                title="Compléter le paiement"
              >
                💳
              </button>
              <button
                v-if="order.status === 'completed' && order.receiptUrl"
                @click="openReceiptUrl(order.receiptUrl)"
                class="btn-action btn-secondary"
                title="Voir le reçu"
              >
                🧾
              </button>
              <button
                @click="$emit('view-details', order)"
                class="btn-action btn-info"
                title="Voir les détails"
              >
                🔍
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>Aucune commande trouvée</p>
        <p class="empty-hint">Vos commandes de licences apparaîtront ici</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredOrders.length > 0" class="table-footer">
      <div class="pagination-info">
        Affichage de {{ paginatedOrders.length }} sur {{ filteredOrders.length }} commandes
      </div>
      <div class="pagination-controls">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="btn-page"
        >
          ← Précédent
        </button>
        <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          Suivant →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Order {
  orderId: string;
  organizationId: string;
  templateId: string;
  productType: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentUrl?: string;
  receiptUrl?: string;
  createdAt: string | Date;
}

interface Props {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

defineEmits(['refresh', 'view-details']);

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const filteredOrders = computed(() => {
  let filtered = props.orders;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(order =>
      order.orderId.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.productType.toLowerCase().includes(query) ||
      order.templateId.toLowerCase().includes(query)
    );
  }

  // Sort by date descending (most recent first)
  return filtered.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage);
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

const formatOrderId = (orderId: string): string => {
  // Format: ORDER-XXXXX (show last 8 chars)
  return orderId.length > 12 ? `...${orderId.slice(-8)}` : orderId;
};

const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: 'En attente',
    completed: 'Complétée',
    failed: 'Échouée',
    refunded: 'Remboursée',
  };
  return texts[status] || status;
};

const openPaymentUrl = (url: string) => {
  window.open(url, '_blank');
};

const openReceiptUrl = (url: string) => {
  window.open(url, '_blank');
};
</script>

<style scoped>
.order-history-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.table-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-refresh {
  width: 40px;
  height: 40px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-height: 300px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #ef4444;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.orders-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orders-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.orders-table tbody tr:hover {
  background: #f9fafb;
}

.orders-table td {
  padding: 16px;
  font-size: 0.875rem;
  color: #111827;
}

.order-id .id-text {
  font-family: monospace;
  color: #6b7280;
  font-size: 0.813rem;
}

.order-date {
  color: #6b7280;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #111827;
}

.template-id {
  font-size: 0.75rem;
  color: #6b7280;
}

.quantity-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.813rem;
  font-weight: 600;
}

.amount-value {
  font-weight: 700;
  color: #111827;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge--completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge--failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge--refunded {
  background: #f3f4f6;
  color: #374151;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action:hover {
  transform: scale(1.1);
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #10b981;
  color: white;
}

.btn-secondary:hover {
  background: #059669;
}

.btn-info {
  background: #6b7280;
  color: white;
}

.btn-info:hover {
  background: #4b5563;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 8px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-page {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
  min-width: 100px;
  text-align: center;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .orders-table {
    font-size: 0.813rem;
  }

  .orders-table th,
  .orders-table td {
    padding: 8px;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
