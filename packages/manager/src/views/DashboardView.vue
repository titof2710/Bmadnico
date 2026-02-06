<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Tableau de Bord Janus</h1>
            <p class="text-gray-600 mt-1">Gérer les sessions d'évaluation et suivre les participants</p>
          </div>
          <div class="flex items-center gap-4">
            <button
              @click="$router.push('/templates')"
              class="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-lg"
            >
              📋 Templates
            </button>
            <button
              @click="$router.push('/license-pools')"
              class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg"
            >
              📦 Licences
            </button>
            <button
              @click="$router.push('/users')"
              class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-lg"
            >
              👥 Utilisateurs
            </button>
            <button
              @click="$router.push('/admin')"
              class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg"
            >
              🔧 Platform Admin
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu Principal -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Carte de Création de Session -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Créer une Nouvelle Session</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email du Participant
            </label>
            <input
              v-model="newSession.participantEmail"
              type="email"
              placeholder="participant@exemple.com"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Modèle
            </label>
            <select
              v-model="newSession.templateId"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="template-001">Évaluation du Leadership</option>
            </select>
          </div>
        </div>

        <button
          @click="createSession"
          :disabled="!newSession.participantEmail || creating"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ creating ? 'Création...' : 'Créer la Session' }}
        </button>

        <!-- Message de Succès -->
        <div v-if="createdSessionUrl" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 class="font-semibold text-green-900 mb-2">✅ Session Créée !</h3>
          <p class="text-sm text-green-800 mb-2">Partagez ce lien avec le participant :</p>
          <div class="flex gap-2">
            <input
              :value="createdSessionUrl"
              readonly
              class="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm"
            />
            <button
              @click="copyUrl"
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              {{ copied ? 'Copié !' : 'Copier' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Liste des Sessions -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">Sessions Récentes</h2>
          <button
            @click="loadSessions"
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            🔄 Actualiser
          </button>
        </div>

        <!-- Search and Filters -->
        <div class="mb-6 space-y-4">
          <div class="flex gap-4">
            <!-- Search Bar -->
            <div class="flex-1">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="🔍 Rechercher par email participant..."
                  class="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  @input="filterSessions"
                />
                <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              @change="filterSessions"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">En cours</option>
              <option value="completed">Terminé</option>
              <option value="expired">Expiré</option>
              <option value="suspended">Suspendu</option>
            </select>

            <!-- Template Filter -->
            <select
              v-model="templateFilter"
              class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              @change="filterSessions"
            >
              <option value="">Tous les templates</option>
              <option value="template-001">template-001</option>
              <option value="template-002">template-002</option>
              <option value="template-003">template-003</option>
            </select>

            <!-- Clear Filters -->
            <button
              v-if="searchQuery || statusFilter || templateFilter"
              @click="clearFilters"
              class="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ✕ Effacer
            </button>
          </div>

          <!-- Results count -->
          <div class="text-sm text-gray-600">
            {{ filteredSessions.length }} session(s) affichée(s)
            <span v-if="filteredSessions.length !== allSessions.length">
              sur {{ allSessions.length }} au total
            </span>
          </div>
        </div>

        <!-- Chargement -->
        <div v-if="loading" class="text-center py-8 text-gray-500">
          Chargement des sessions...
        </div>

        <!-- Tableau des Sessions -->
        <div v-else-if="sessions.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Participant
                </th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Modèle
                </th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Statut
                </th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Progression
                </th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Créé le
                </th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="session in filteredSessions"
                :key="session.sessionId"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 text-sm text-gray-900">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="session.status === 'active'"
                      class="live-indicator"
                      title="Session en cours"
                    ></span>
                    <span>{{ session.participantEmail }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ session.templateId }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusClass(session.status)"
                    >
                      {{ getStatusText(session.status) }}
                    </span>
                    <span
                      v-if="session.status === 'active'"
                      class="live-badge"
                    >
                      LIVE
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ session.currentPage }} / {{ session.totalPages }}
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ formatDate(session.createdAt) }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex gap-2">
                    <button
                      @click="viewSession(session)"
                      class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Voir
                    </button>
                    <button
                      v-if="session.status === 'completed'"
                      @click="viewResults(session)"
                      class="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      📊 Résultats
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- État Vide -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 text-5xl mb-4">📋</div>
          <p class="text-gray-600">Aucune session pour le moment. Créez votre première session ci-dessus !</p>
        </div>

        <!-- Pagination Controls -->
        <div v-if="sessions.length > 0 && totalPages > 1" class="flex justify-between items-center mt-6 pt-4 border-t">
          <div class="text-sm text-gray-600">
            Affichage {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalItems) }} sur {{ totalItems }} sessions
          </div>
          <div class="flex gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>

            <div class="flex gap-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-4 py-2 border rounded-lg',
                  page === currentPage
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { apiService } from '../services/api';
import UserMenu from '../components/UserMenu.vue';

interface Session {
  sessionId: string;
  participantEmail: string;
  templateId: string;
  status: string;
  currentPage: number;
  totalPages: number;
  createdAt: string;
  sessionToken: string;
}

const loading = ref(false);
const creating = ref(false);
const sessions = ref<Session[]>([]);
const allSessions = ref<Session[]>([]);
const filteredSessions = ref<Session[]>([]);

// Search and filter states
const searchQuery = ref('');
const statusFilter = ref('');
const templateFilter = ref('');

// Pagination states
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalPages = ref(1);
const totalItems = ref(0);

const newSession = reactive({
  participantEmail: '',
  templateId: 'template-001',
});

const createdSessionUrl = ref('');
const copied = ref(false);

async function loadSessions() {
  try {
    loading.value = true;
    const data = await apiService.getSessions({
      page: currentPage.value,
      limit: itemsPerPage.value,
      status: statusFilter.value || undefined,
      search: searchQuery.value || undefined,
    });
    sessions.value = data.sessions;
    allSessions.value = data.sessions;
    filteredSessions.value = data.sessions;

    if (data.pagination) {
      currentPage.value = data.pagination.page;
      totalPages.value = data.pagination.totalPages;
      totalItems.value = data.pagination.total;
    }
  } catch (error) {
    console.error('Échec du chargement des sessions:', error);
  } finally {
    loading.value = false;
  }
}

function filterSessions() {
  // Reset to page 1 when filtering
  currentPage.value = 1;
  loadSessions();
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadSessions();
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadSessions();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadSessions();
  }
}

function clearFilters() {
  searchQuery.value = '';
  statusFilter.value = '';
  templateFilter.value = '';
  filterSessions();
}

async function createSession() {
  try {
    creating.value = true;
    const result = await apiService.createSession({
      participantEmail: newSession.participantEmail,
      templateId: newSession.templateId,
      expiresInHours: 72,
    });

    createdSessionUrl.value = result.accessUrl;
    newSession.participantEmail = '';

    // Recharger les sessions
    await loadSessions();
  } catch (error) {
    console.error('Échec de la création de la session:', error);
    alert('Échec de la création de la session. Veuillez réessayer.');
  } finally {
    creating.value = false;
  }
}

function copyUrl() {
  navigator.clipboard.writeText(createdSessionUrl.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function viewSession(session: Session) {
  const url = `http://localhost:5177/session/${session.sessionToken}`;
  window.open(url, '_blank');
}

function viewResults(session: Session) {
  window.location.href = `/results/${session.sessionId}`;
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: 'En attente',
    active: 'En cours',
    completed: 'Terminé',
    expired: 'Expiré',
  };
  return texts[status] || status;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Compute visible page numbers for pagination
const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is less than max
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Show current page and surrounding pages
    let start = Math.max(1, currentPage.value - 2);
    let end = Math.min(totalPages.value, currentPage.value + 2);

    // Adjust if at the beginning or end
    if (currentPage.value <= 3) {
      end = maxVisible;
    } else if (currentPage.value >= totalPages.value - 2) {
      start = totalPages.value - maxVisible + 1;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
/* Live indicator - pulsing green dot */
.live-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

/* Live badge */
.live-badge {
  display: inline-block;
  padding: 2px 6px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 4px;
  animation: liveBadgePulse 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

@keyframes liveBadgePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}
</style>
