<template>
  <div v-if="user" class="user-menu">
    <div class="user-info">
      <div class="user-avatar">{{ getRoleIcon(user.role) }}</div>
      <div class="user-details">
        <div class="user-name">{{ user.name }}</div>
        <div class="user-role">{{ getRoleLabel(user.role) }}</div>
      </div>
    </div>
    <button @click="logout" class="btn-logout" title="Se déconnecter">
      🚪 Déconnexion
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'participant';
  organizationId: string;
  organizationName: string;
}

const router = useRouter();
const user = ref<User | null>(null);

onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    user.value = JSON.parse(userStr);
  }
});

const logout = () => {
  // Confirmation
  if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
    // Clear ALL localStorage data (cache included)
    localStorage.clear();

    // Redirect to login
    router.push('/login');
  }
};

const getRoleIcon = (role: string): string => {
  const icons: Record<string, string> = {
    admin: '👑',
    manager: '💼',
    participant: '👤',
  };
  return icons[role] || '👤';
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    participant: 'Participant',
  };
  return labels[role] || role;
};
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 700;
  font-size: 0.938rem;
  color: #111827;
}

.user-role {
  font-size: 0.813rem;
  color: #667eea;
  font-weight: 600;
}

.btn-logout {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-logout:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .user-menu {
    flex-direction: column;
    gap: 12px;
  }

  .btn-logout {
    width: 100%;
  }
}
</style>
