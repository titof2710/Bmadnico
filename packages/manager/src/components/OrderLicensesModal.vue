<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Commander des Licences</h2>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <div v-if="processing" class="modal-body loading">
        <div class="spinner"></div>
        <p>Traitement de votre commande...</p>
      </div>

      <div v-else-if="error" class="modal-body error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="error = null" class="btn-retry">Réessayer</button>
      </div>

      <div v-else class="modal-body">
        <!-- Pool Info -->
        <div class="section pool-info">
          <h3>Pool de Licences</h3>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Template:</span>
              <span class="value">{{ pool?.templateId }}</span>
            </div>
            <div class="info-row">
              <span class="label">Disponibles Actuellement:</span>
              <span class="value value-primary">{{ pool?.availableLicenses }} licences</span>
            </div>
            <div class="info-row">
              <span class="label">Total de Licences:</span>
              <span class="value">{{ pool?.totalLicenses }} licences</span>
            </div>
          </div>
        </div>

        <!-- Product Selection -->
        <div class="section">
          <h3>Sélectionner un Produit</h3>
          <div class="product-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              :class="{ 'product-card--selected': selectedProduct?.id === product.id }"
              @click="selectProduct(product)"
            >
              <div class="product-header">
                <span class="product-name">{{ product.name }}</span>
                <span v-if="product.popular" class="badge-popular">Popular</span>
              </div>
              <div class="product-price">
                <span class="price-amount">{{ formatCurrency(product.price) }}</span>
                <span class="price-unit">per license</span>
              </div>
              <div class="product-description">
                {{ product.description }}
              </div>
              <div v-if="selectedProduct?.id === product.id" class="product-check">✓</div>
            </div>
          </div>
        </div>

        <!-- Quantity Selection -->
        <div class="section">
          <h3>Quantité</h3>
          <div class="quantity-controls">
            <button
              @click="decrementQuantity"
              :disabled="quantity <= 1"
              class="btn-quantity"
            >
              −
            </button>
            <input
              v-model.number="quantity"
              type="number"
              min="1"
              max="1000"
              class="quantity-input"
            />
            <button
              @click="incrementQuantity"
              :disabled="quantity >= 1000"
              class="btn-quantity"
            >
              +
            </button>
          </div>
          <p class="quantity-hint">Minimum: 1 licence | Maximum: 1000 licences</p>
        </div>

        <!-- Order Summary -->
        <div class="section">
          <h3>Récapitulatif de la Commande</h3>
          <div class="summary-card">
            <div class="summary-row">
              <span class="summary-label">Produit:</span>
              <span class="summary-value">{{ selectedProduct?.name || 'Non sélectionné' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Quantité:</span>
              <span class="summary-value">{{ quantity }} licences</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Prix par licence:</span>
              <span class="summary-value">{{ formatCurrency(selectedProduct?.price || 0) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-row--total">
              <span class="summary-label">Total:</span>
              <span class="summary-value">{{ formatCurrency(totalPrice) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="section">
          <div class="info-box">
            <div class="info-icon">💳</div>
            <div class="info-content">
              <p class="info-title">Paiement Sécurisé via Stripe</p>
              <p class="info-text">
                Vous serez redirigé vers la page de paiement sécurisée de Stripe. Les licences seront ajoutées à votre pool immédiatement après le paiement réussi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">
          Annuler
        </button>
        <button
          @click="proceedToCheckout"
          :disabled="!selectedProduct || quantity < 1 || processing"
          class="btn btn-primary"
        >
          <span v-if="processing">Traitement en cours...</span>
          <span v-else>Procéder au Paiement ({{ formatCurrency(totalPrice) }})</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface LicensePool {
  poolId: string;
  organizationId: string;
  templateId: string;
  totalLicenses: number;
  availableLicenses: number;
  consumedLicenses: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  popular?: boolean;
}

interface Props {
  show: boolean;
  pool: LicensePool | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'success']);

// Available products
const products = ref<Product[]>([
  {
    id: 'basic',
    name: 'Pack Basique',
    description: 'Licences standard pour évaluations régulières',
    price: 29,
  },
  {
    id: 'professional',
    name: 'Pack Professionnel',
    description: 'Licences améliorées avec support prioritaire',
    price: 49,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Pack Entreprise',
    description: 'Licences premium avec gestionnaire de compte dédié',
    price: 99,
  },
]);

const selectedProduct = ref<Product | null>(null);
const quantity = ref(10);
const processing = ref(false);
const error = ref<string | null>(null);

const totalPrice = computed(() => {
  if (!selectedProduct.value) return 0;
  return selectedProduct.value.price * quantity.value;
});

const selectProduct = (product: Product) => {
  selectedProduct.value = product;
};

const incrementQuantity = () => {
  if (quantity.value < 1000) {
    quantity.value++;
  }
};

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const proceedToCheckout = async () => {
  if (!selectedProduct.value || !props.pool) {
    error.value = 'Veuillez sélectionner un produit';
    return;
  }

  processing.value = true;
  error.value = null;

  try {
    const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: props.pool.organizationId,
        templateId: props.pool.templateId,
        quantity: quantity.value,
        productType: selectedProduct.value.id,
        pricePerLicense: selectedProduct.value.price,
        successUrl: `${window.location.origin}/license-pools?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/license-pools?canceled=true`,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Échec de la création de la session de paiement');
    }

    const data = await response.json();

    // Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Aucune URL de paiement reçue');
    }
  } catch (err: any) {
    console.error('Checkout error:', err);
    error.value = err.message || 'Échec du traitement vers le paiement';
    processing.value = false;
  }
};

const closeModal = () => {
  if (!processing.value) {
    selectedProduct.value = null;
    quantity.value = 10;
    error.value = null;
    emit('close');
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-body.loading,
.modal-body.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.error-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.modal-body.error p {
  color: #ef4444;
  margin-bottom: 16px;
  text-align: center;
}

.section {
  margin-bottom: 32px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.pool-info {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.value-primary {
  color: #3b82f6;
  font-size: 1rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.product-card {
  position: relative;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.product-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.product-card--selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.badge-popular {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.product-price {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.price-amount {
  font-size: 1.75rem;
  font-weight: 700;
  color: #3b82f6;
}

.price-unit {
  font-size: 0.75rem;
  color: #6b7280;
}

.product-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.product-check {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.btn-quantity {
  width: 48px;
  height: 48px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  color: #3b82f6;
}

.btn-quantity:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.btn-quantity:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  flex: 1;
  height: 48px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  color: #111827;
}

.quantity-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.quantity-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.summary-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.summary-row--total {
  margin-top: 8px;
}

.summary-row--total .summary-label,
.summary-row--total .summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.info-box {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.info-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 4px 0;
}

.info-text {
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
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

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
