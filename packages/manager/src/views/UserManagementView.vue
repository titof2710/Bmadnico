<template>
  <div class="user-management">
    <div class="header">
      <div>
        <h1 class="title">👥 Gestion des Utilisateurs</h1>
        <p class="subtitle">Gérez les comptes utilisateurs de votre organisation</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">
        ➕ Nouvel Utilisateur
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="searchQuery"
        @input="filterUsers"
        type="text"
        placeholder="🔍 Rechercher par nom ou email..."
        class="search-input"
      />
      <select v-model="roleFilter" @change="filterUsers" class="filter-select">
        <option value="">Tous les rôles</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="participant">Participant</option>
      </select>
      <select v-model="statusFilter" @change="filterUsers" class="filter-select">
        <option value="">Tous les statuts</option>
        <option value="active">Actif</option>
        <option value="inactive">Inactif</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement des utilisateurs...</p>
    </div>

    <!-- Users Table -->
    <div v-else-if="filteredUsers.length > 0" class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Dernière connexion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.userId">
            <td>
              <div class="user-info">
                <div class="avatar">{{ getInitials(user.name) }}</div>
                <span class="font-semibold">{{ user.name }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['badge', `badge-${getRoleColor(user.role)}`]">
                {{ getRoleText(user.role) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', user.status === 'active' ? 'active' : 'inactive']">
                {{ user.status === 'active' ? '✓ Actif' : '○ Inactif' }}
              </span>
            </td>
            <td class="text-gray-600">
              {{ user.lastLogin ? formatDate(user.lastLogin) : 'Jamais' }}
            </td>
            <td>
              <div class="action-buttons">
                <button @click="editUser(user)" class="btn-action btn-edit">
                  ✏️ Modifier
                </button>
                <button @click="deleteUser(user)" class="btn-action btn-delete">
                  🗑️ Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">👥</div>
      <p>Aucun utilisateur trouvé</p>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showCreateModal || editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</h2>
          <button @click="closeModal" class="close-button">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nom complet *</label>
            <input
              v-model="userForm.name"
              type="text"
              placeholder="Jean Dupont"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input
              v-model="userForm.email"
              type="email"
              placeholder="jean.dupont@exemple.com"
              class="form-control"
              :disabled="!!editingUser"
            />
          </div>

          <div class="form-group">
            <label>Rôle *</label>
            <select v-model="userForm.role" class="form-control">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="participant">Participant</option>
            </select>
          </div>

          <div v-if="!editingUser" class="form-group">
            <label>Mot de passe *</label>
            <input
              v-model="userForm.password"
              type="password"
              placeholder="••••••••"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Statut</label>
            <select v-model="userForm.status" class="form-control">
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            Annuler
          </button>
          <button @click="saveUser" class="btn btn-primary">
            {{ editingUser ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notifications';

interface User {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'participant';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

const notificationStore = useNotificationStore();
const loading = ref(false);
const users = ref<User[]>([]);
const filteredUsers = ref<User[]>([]);
const showCreateModal = ref(false);
const editingUser = ref<User | null>(null);

const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

const userForm = reactive({
  name: '',
  email: '',
  role: 'participant' as 'admin' | 'manager' | 'participant',
  password: '',
  status: 'active' as 'active' | 'inactive',
});

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  loading.value = true;
  console.log('🔍 [DEBUG] loadUsers() called');
  try {
    const token = localStorage.getItem('jwt_token');
    console.log('🔍 [DEBUG] Token:', token ? 'EXISTS' : 'MISSING');

    const response = await fetch('/api/users', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    console.log('🔍 [DEBUG] Response status:', response.status);

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des utilisateurs');
    }

    const data = await response.json();
    console.log('🔍 [DEBUG] Data received:', data);
    console.log('🔍 [DEBUG] Users count:', data.users?.length || 0);

    users.value = data.users || [];
    filteredUsers.value = users.value;

    console.log('🔍 [DEBUG] users.value set to:', users.value.length, 'users');
    console.log('🔍 [DEBUG] filteredUsers.value set to:', filteredUsers.value.length, 'users');
  } catch (error: any) {
    console.error('❌ [ERROR] Erreur chargement utilisateurs:', error);
    notificationStore.error('Erreur', 'Impossible de charger les utilisateurs');

    // Demo data fallback
    users.value = [
      {
        userId: 'user-1',
        name: 'Admin Demo',
        email: 'admin@janus-demo.com',
        role: 'admin',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        userId: 'user-2',
        name: 'Manager Acme',
        email: 'manager@acme-corp.com',
        role: 'manager',
        status: 'active',
        lastLogin: new Date('2024-02-01').toISOString(),
        createdAt: new Date('2024-01-15').toISOString(),
      },
      {
        userId: 'user-3',
        name: 'Jean Dupont',
        email: 'jean.dupont@acme-corp.com',
        role: 'participant',
        status: 'active',
        createdAt: new Date('2024-02-01').toISOString(),
      },
    ];
    filteredUsers.value = users.value;
  } finally {
    loading.value = false;
  }
}

function filterUsers() {
  console.log('🔍 [DEBUG] filterUsers() called');
  console.log('🔍 [DEBUG] users.value:', users.value.length);
  console.log('🔍 [DEBUG] Filters - search:', searchQuery.value, 'role:', roleFilter.value, 'status:', statusFilter.value);

  let filtered = [...users.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  if (roleFilter.value) {
    filtered = filtered.filter(u => u.role === roleFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(u => u.status === statusFilter.value);
  }

  filteredUsers.value = filtered;
  console.log('🔍 [DEBUG] filteredUsers.value after filtering:', filteredUsers.value.length);
}

function editUser(user: User) {
  editingUser.value = user;
  userForm.name = user.name;
  userForm.email = user.email;
  userForm.role = user.role;
  userForm.status = user.status;
  userForm.password = '';
}

async function deleteUser(user: User) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`/api/users/${user.userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression');
    }

    users.value = users.value.filter(u => u.userId !== user.userId);
    filterUsers();
    notificationStore.success('Utilisateur supprimé', `${user.name} a été supprimé avec succès`);
  } catch (error: any) {
    console.error('Erreur suppression:', error);
    notificationStore.error('Erreur', error.message);
  }
}

async function saveUser() {
  // Validation
  if (!userForm.name || !userForm.email) {
    notificationStore.warning('Validation', 'Veuillez remplir tous les champs obligatoires');
    return;
  }

  if (!editingUser.value && !userForm.password) {
    notificationStore.warning('Validation', 'Le mot de passe est obligatoire');
    return;
  }

  try {
    const token = localStorage.getItem('jwt_token');
    const isNew = !editingUser.value;
    const url = isNew
      ? '/api/users'
      : `/api/users/${editingUser.value!.userId}`;

    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        password: userForm.password || undefined,
        status: userForm.status,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'enregistrement');
    }

    const data = await response.json();

    if (isNew) {
      users.value.push(data.user);
      notificationStore.success('Utilisateur créé', `${userForm.name} a été créé avec succès`);
    } else {
      const index = users.value.findIndex(u => u.userId === data.user.userId);
      if (index >= 0) {
        users.value[index] = data.user;
      }
      notificationStore.success('Utilisateur modifié', `${userForm.name} a été mis à jour avec succès`);
    }

    filterUsers();
    closeModal();
  } catch (error: any) {
    console.error('Erreur sauvegarde:', error);
    notificationStore.error('Erreur', 'Impossible d\'enregistrer l\'utilisateur');
  }
}

function closeModal() {
  showCreateModal.value = false;
  editingUser.value = null;
  userForm.name = '';
  userForm.email = '';
  userForm.role = 'participant';
  userForm.password = '';
  userForm.status = 'active';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'purple',
    manager: 'blue',
    participant: 'gray',
  };
  return colors[role] || 'gray';
}

function getRoleText(role: string): string {
  const texts: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    participant: 'Participant',
  };
  return texts[role] || role;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.user-management {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* Filters */
.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.938rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.938rem;
  background: white;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Loading */
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

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: #f9fafb;
}

.users-table th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 0.938rem;
}

.users-table tbody tr:hover {
  background: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.badge-blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.badge-gray {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.813rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.inactive {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #eff6ff;
  color: #3b82f6;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete {
  background: #fee2e2;
  color: #ef4444;
}

.btn-delete:hover {
  background: #fecaca;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 32px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.938rem;
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

/* Modal */
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

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.938rem;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}
</style>
