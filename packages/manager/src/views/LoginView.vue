<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🚀 Janus Platform</h1>
        <p class="subtitle">Sélectionnez un compte pour la démonstration</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Connexion en cours...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="error = null" class="btn-retry">Réessayer</button>
      </div>

      <div v-else class="accounts-grid">
        <div
          v-for="account in accounts"
          :key="account.email"
          class="account-card"
          :class="`account-card--${account.role}`"
          @click="loginWithAccount(account)"
        >
          <div class="account-icon">
            {{ getRoleIcon(account.role) }}
          </div>
          <div class="account-info">
            <h3 class="account-name">{{ account.name }}</h3>
            <p class="account-role">{{ getRoleLabel(account.role) }}</p>
            <p class="account-org">{{ account.organizationName }}</p>
          </div>
          <div class="account-email">
            {{ account.email }}
          </div>
          <div class="account-hover">
            Cliquer pour se connecter →
          </div>
        </div>
      </div>

      <div class="login-footer">
        <p class="demo-notice">
          ⚠️ Mode Démonstration - Comptes de test uniquement
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'participant';
  organizationName: string;
}

const router = useRouter();
const accounts = ref<DemoAccount[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch demo accounts on mount
onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/demo-accounts`);
    const data = await response.json();
    accounts.value = data.accounts;
  } catch (err) {
    console.error('Failed to fetch demo accounts:', err);
    error.value = 'Impossible de charger les comptes de démo';
  }
});

// Login with selected account
const loginWithAccount = async (account: DemoAccount) => {
  loading.value = true;
  error.value = null;

  try {
    // Clear all previous cache before login
    localStorage.clear();

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Échec de la connexion');
    }

    const data = await response.json();

    // Store token and user info in localStorage
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect based on role
    redirectByRole(data.user.role);
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.message || 'Erreur lors de la connexion';
    loading.value = false;
  }
};

// Redirect user based on their role
const redirectByRole = (role: string) => {
  switch (role) {
    case 'admin':
      router.push('/admin');
      break;
    case 'manager':
      router.push('/license-pools');
      break;
    case 'participant':
      // Participants don't have access to the manager portal
      alert('Le compte participant n\'a pas accès au portail de gestion. Utilisez le portail de test à l\'adresse http://localhost:5177');
      // Clear login and return to login page
      localStorage.clear();
      break;
    default:
      router.push('/login');
  }
};

// Get icon for role
const getRoleIcon = (role: string): string => {
  const icons: Record<string, string> = {
    admin: '👑',
    manager: '💼',
    participant: '👤',
  };
  return icons[role] || '👤';
};

// Get label for role
const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'Administrateur Plateforme',
    manager: 'Gestionnaire',
    participant: 'Participant',
  };
  return labels[role] || role;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 900px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state p {
  color: #ef4444;
  font-size: 1.125rem;
  margin-bottom: 20px;
}

.btn-retry {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.account-card {
  position: relative;
  padding: 30px;
  border: 3px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  overflow: hidden;
}

.account-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.account-card:hover::before {
  transform: scaleX(1);
}

.account-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

.account-card--admin {
  border-color: #fbbf24;
}

.account-card--admin:hover {
  border-color: #f59e0b;
  box-shadow: 0 20px 40px rgba(251, 191, 36, 0.3);
}

.account-card--manager {
  border-color: #3b82f6;
}

.account-card--manager:hover {
  border-color: #2563eb;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
}

.account-card--participant {
  border-color: #10b981;
}

.account-card--participant:hover {
  border-color: #059669;
  box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
}

.account-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  text-align: center;
}

.account-info {
  text-align: center;
  margin-bottom: 15px;
}

.account-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.account-role {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 5px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-org {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.account-email {
  text-align: center;
  font-size: 0.813rem;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  margin-top: 15px;
}

.account-hover {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  font-weight: 600;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.account-card:hover .account-hover {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.demo-notice {
  font-size: 0.875rem;
  color: #f59e0b;
  margin: 0;
  font-weight: 600;
}

@media (max-width: 768px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 2rem;
  }

  .accounts-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .account-card {
    padding: 20px;
  }
}
</style>
