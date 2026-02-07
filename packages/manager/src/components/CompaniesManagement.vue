<template>
  <div>
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-gray-900">Gestion des Client Companies</h3>
      <button
        @click="showCreateModal = true"
        class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold"
      >
        ➕ Nouvelle Company
      </button>
    </div>

    <!-- Companies Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Company Name</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact Email</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Representatives</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Consultants</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="company in companies"
            :key="company.companyId"
            class="border-b border-gray-100 hover:bg-gray-50"
          >
            <td class="py-3 px-4 text-sm font-medium text-gray-900">
              {{ company.companyName }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ company.contactEmail }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-900">
              {{ company.userCount }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ company.representativeCount }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ company.consultantCount }}
            </td>
            <td class="py-3 px-4">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ company.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex gap-2">
                <button
                  @click="viewCompany(company)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  👁️ Voir
                </button>
                <button
                  @click="manageUsers(company)"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  👥 Users
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="companies.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-5xl mb-4">🏢</div>
        <p class="text-gray-600">Aucune company enregistrée</p>
      </div>
    </div>

    <!-- Create Company Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Créer une Nouvelle Company</h3>

        <div class="space-y-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom de la Company</label>
            <input
              v-model="newCompany.companyName"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email de Contact</label>
            <input
              v-model="newCompany.contactEmail"
              type="email"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="contact@acme.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email du Representative</label>
            <input
              v-model="newCompany.representativeEmail"
              type="email"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="john@acme.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom du Representative</label>
            <input
              v-model="newCompany.representativeName"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="createCompany"
            :disabled="creating"
            class="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ creating ? 'Création...' : 'Créer' }}
          </button>
          <button
            @click="showCreateModal = false"
            class="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Users Management Modal -->
    <div
      v-if="showUsersModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showUsersModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          Gérer les Utilisateurs - {{ selectedCompany?.companyName }}
        </h3>

        <!-- Add User Form -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-semibold text-gray-900 mb-3">Ajouter un Utilisateur</h4>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <input
              v-model="newUser.email"
              type="email"
              placeholder="Email"
              class="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              v-model="newUser.fullName"
              type="text"
              placeholder="Nom complet"
              class="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div class="flex gap-3">
            <select
              v-model="newUser.role"
              class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="representative">Representative</option>
              <option value="consultant">Consultant</option>
            </select>
            <button
              @click="addUser"
              class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-sm"
            >
              Ajouter
            </button>
          </div>
        </div>

        <!-- Users List -->
        <div class="space-y-2">
          <div
            v-for="user in selectedCompany?.users"
            :key="user.userId"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">{{ user.fullName }}</p>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="user.role === 'representative' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'"
              >
                {{ user.role === 'representative' ? '👔 Representative' : '💼 Consultant' }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button
            @click="showUsersModal = false"
            class="w-full border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  companies: any[];
}>();

const emit = defineEmits(['refresh']);

const showCreateModal = ref(false);
const showUsersModal = ref(false);
const creating = ref(false);
const selectedCompany = ref<any>(null);

const newCompany = ref({
  companyName: '',
  contactEmail: '',
  representativeEmail: '',
  representativeName: '',
});

const newUser = ref({
  email: '',
  fullName: '',
  role: 'consultant' as 'representative' | 'consultant',
});

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || '${API_URL}';

async function createCompany() {
  try {
    creating.value = true;

    const response = await fetch(`${API_URL}/api/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCompany.value),
    });

    if (!response.ok) throw new Error('Failed to create company');

    showCreateModal.value = false;
    newCompany.value = {
      companyName: '',
      contactEmail: '',
      representativeEmail: '',
      representativeName: '',
    };

    emit('refresh');
  } catch (error) {
    console.error('Failed to create company:', error);
    alert('Échec de la création de la company');
  } finally {
    creating.value = false;
  }
}

function viewCompany(company: any) {
  alert(`Company: ${company.companyName}\nUsers: ${company.userCount}\nRepresentatives: ${company.representativeCount}\nConsultants: ${company.consultantCount}\nStatus: ${company.isActive ? 'Active' : 'Inactive'}`);
}

function manageUsers(company: any) {
  selectedCompany.value = company;
  showUsersModal.value = true;
}

async function addUser() {
  if (!newUser.value.email || !newUser.value.fullName) {
    alert('Email et nom complet requis');
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/companies/${selectedCompany.value.companyId}/users`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser.value),
      }
    );

    if (!response.ok) throw new Error('Failed to add user');

    newUser.value = {
      email: '',
      fullName: '',
      role: 'consultant',
    };

    emit('refresh');

    // Reload company details
    const companyResponse = await fetch(
      `${API_URL}/api/companies/${selectedCompany.value.companyId}`
    );
    selectedCompany.value = await companyResponse.json();
  } catch (error) {
    console.error('Failed to add user:', error);
    alert('Échec de l\'ajout de l\'utilisateur');
  }
}
</script>
