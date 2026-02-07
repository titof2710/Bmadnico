<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Notification Toast -->
    <Transition name="slide-down">
      <div
        v-if="showNotification"
        class="fixed top-4 right-4 z-50 max-w-md"
      >
        <div
          class="notification-toast"
          :class="`notification-toast--${notificationType}`"
        >
          <div class="notification-content">
            <span class="notification-icon">
              {{ notificationType === 'success' ? '✓' : notificationType === 'error' ? '✕' : 'ℹ' }}
            </span>
            <p class="notification-message">{{ notificationMessage }}</p>
          </div>
          <button @click="closeNotification" class="notification-close">✕</button>
        </div>
      </div>
    </Transition>

    <!-- Header -->
    <header class="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-white">Gestion des Pools de Licences</h1>
            <p class="text-primary-100 mt-1">Gérer vos pools de licences et vos commandes</p>
          </div>
          <div class="flex items-center gap-4">
            <button
              @click="$router.push('/')"
              class="text-white hover:text-primary-100 text-sm"
            >
              ← Retour au Dashboard
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement des pools de licences...</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Consumption Chart -->
        <ConsumptionRateChart :organization-id="organizationId" />

        <!-- License Pool Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <LicensePoolCard
            v-for="pool in pools"
            :key="pool.poolId"
            :pool="pool"
            @order="openOrderModal"
            @configure="openThresholdModal"
            @view-details="viewPoolDetails"
          />
        </div>

        <!-- Empty State -->
        <div v-if="pools.length === 0" class="text-center py-12 bg-white rounded-lg shadow-sm">
          <div class="text-gray-400 text-5xl mb-4">📦</div>
          <p class="text-gray-600 mb-4">Aucun pool de licences configuré</p>
          <button
            @click="createPool"
            class="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold"
          >
            ➕ Créer un Pool de Licences
          </button>
        </div>

        <!-- Order History Section -->
        <OrderHistoryTable
          :orders="orders"
          :loading="loadingOrders"
          :error="ordersError"
          @refresh="loadOrders"
          @view-details="viewOrderDetails"
        />
      </div>
    </main>

    <!-- Threshold Configuration Modal -->
    <div
      v-if="showThresholdModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeThresholdModal"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Configurer le Seuil d'Alerte</h3>
        <p class="text-sm text-gray-600 mb-4">
          Pool : <span class="font-semibold">{{ selectedPool?.templateId }}</span>
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Seuil d'Alerte (%)
          </label>
          <input
            v-model.number="newThreshold"
            type="number"
            min="0"
            max="100"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Vous serez alerté quand la consommation atteint ce pourcentage
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="saveThreshold"
            :disabled="savingThreshold"
            class="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ savingThreshold ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          <button
            @click="closeThresholdModal"
            class="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Order Licenses Modal -->
    <OrderLicensesModal
      :show="showOrderModal"
      :pool="selectedPool"
      @close="closeOrderModal"
      @success="handleOrderSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LicensePoolCard from '../components/LicensePoolCard.vue';
import OrderLicensesModal from '../components/OrderLicensesModal.vue';
import OrderHistoryTable from '../components/OrderHistoryTable.vue';
import ConsumptionRateChart from '../components/ConsumptionRateChart.vue';
import UserMenu from '../components/UserMenu.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const pools = ref<any[]>([]);
const orders = ref<any[]>([]);
const loadingOrders = ref(false);
const ordersError = ref<string | null>(null);

const showThresholdModal = ref(false);
const showOrderModal = ref(false);
const selectedPool = ref<any>(null);
const newThreshold = ref(75);
const savingThreshold = ref(false);

// Notification state
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error' | 'info'>('success');

// Get organizationId from logged in user
const getOrganizationId = (): string => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    return user.organizationId || 'org-demo-001';
  }
  return 'org-demo-001';
};

const organizationId = ref(getOrganizationId());

onMounted(async () => {
  // Check for payment callback parameters
  const success = route.query.success;
  const canceled = route.query.canceled;
  const sessionId = route.query.session_id;

  if (success === 'true' && sessionId) {
    // Payment succeeded
    await handlePaymentSuccess(sessionId as string);
  } else if (canceled === 'true') {
    // Payment canceled
    showNotificationMessage('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.', 'info');
  }

  // Load data
  await Promise.all([loadPools(), loadOrders()]);
  loading.value = false;

  // Clean up URL parameters
  if (success || canceled) {
    router.replace({ query: {} });
  }
});

async function handlePaymentSuccess(sessionId: string) {
  showNotificationMessage('🎉 Paiement réussi! Vos licences ont été ajoutées à votre pool.', 'success');

  // In demo mode, we simulate adding licenses
  console.log('Payment session:', sessionId);
}

function showNotificationMessage(message: string, type: 'success' | 'error' | 'info' = 'success') {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    showNotification.value = false;
  }, 5000);
}

function closeNotification() {
  showNotification.value = false;
}

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function loadPools() {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_URL}/api/license-pools`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    pools.value = data.pools || [];
  } catch (error) {
    console.error('Failed to load license pools:', error);
    pools.value = [];
  }
}

async function loadOrders() {
  loadingOrders.value = true;
  ordersError.value = null;

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_URL}/api/payments/orders?organizationId=${organizationId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    orders.value = data.orders || [];
  } catch (error: any) {
    console.error('Failed to load orders:', error);
    ordersError.value = error.message || 'Failed to load orders';
    orders.value = [];
  } finally {
    loadingOrders.value = false;
  }
}

function openThresholdModal(pool: any) {
  selectedPool.value = pool;
  newThreshold.value = pool.warningThreshold;
  showThresholdModal.value = true;
}

function closeThresholdModal() {
  showThresholdModal.value = false;
  selectedPool.value = null;
}

async function saveThreshold() {
  if (!selectedPool.value) return;

  savingThreshold.value = true;

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(
      `${API_URL}/api/license-pools/${selectedPool.value.poolId}/threshold`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ threshold: newThreshold.value }),
      }
    );

    if (!response.ok) throw new Error('Failed to update threshold');

    await loadPools();
    closeThresholdModal();
  } catch (error) {
    console.error('Failed to save threshold:', error);
    alert('Échec de la mise à jour du seuil');
  } finally {
    savingThreshold.value = false;
  }
}

function openOrderModal(pool: any) {
  selectedPool.value = pool;
  showOrderModal.value = true;
}

function closeOrderModal() {
  showOrderModal.value = false;
  selectedPool.value = null;
}

async function handleOrderSuccess() {
  await Promise.all([loadPools(), loadOrders()]);
  closeOrderModal();
}

function viewPoolDetails(pool: any) {
  alert(`Détails du Pool :\n\nTemplate : ${pool.templateId}\nOrganisation : ${pool.organizationId}\nDisponibles : ${pool.availableLicenses}\nTotal : ${pool.totalLicenses}\nConsommées : ${pool.consumedLicenses}\nSeuil : ${pool.warningThreshold}%`);
}

function viewOrderDetails(order: any) {
  alert(`Détails de la Commande :\n\nID Commande : ${order.orderId}\nProduit : ${order.productType}\nQuantité : ${order.quantity}\nMontant : $${order.amount}\nStatut : ${order.status}\nCréée le : ${new Date(order.createdAt).toLocaleString('fr-FR')}`);
}

function createPool() {
  alert('La création de pools est disponible dans l\'interface Administration Plateforme');
}
</script>

<style scoped>
/* Notification Toast Styles */
.notification-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  background: white;
  min-width: 320px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-toast--success {
  border-left: 4px solid #10b981;
}

.notification-toast--error {
  border-left: 4px solid #ef4444;
}

.notification-toast--info {
  border-left: 4px solid #3b82f6;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.notification-toast--success .notification-icon {
  background: #d1fae5;
  color: #065f46;
}

.notification-toast--error .notification-icon {
  background: #fee2e2;
  color: #991b1b;
}

.notification-toast--info .notification-icon {
  background: #dbeafe;
  color: #1e40af;
}

.notification-message {
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.notification-close {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
  margin-left: 12px;
}

.notification-close:hover {
  color: #111827;
}

/* Transition for notification */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateX(400px);
  opacity: 0;
}
</style>
