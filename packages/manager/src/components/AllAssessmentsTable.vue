<template>
  <div>
    <!-- Search and Filters -->
    <div class="mb-6 space-y-4">
      <div class="flex flex-wrap gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par email, ID, company..."
          class="flex-1 min-w-[250px] border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <select
          v-model="statusFilter"
          class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="active">En cours</option>
          <option value="completed">Terminé</option>
          <option value="expired">Expiré</option>
          <option value="suspended">Suspendu</option>
        </select>
        <button
          @click="exportCSV"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          📥 Export CSV
        </button>
        <button
          @click="$emit('refresh')"
          class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          🔄 Actualiser
        </button>
      </div>

      <!-- Pagination Controls -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Lignes par page:</span>
          <select
            v-model="itemsPerPage"
            class="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span class="text-sm text-gray-600">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Company</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Participant</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Template</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Créé le</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="session in paginatedSessions"
            :key="session.sessionId"
            class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            @click="viewDetails(session)"
          >
            <td class="py-3 px-4 text-sm text-gray-900">
              {{ session.organizationId || 'N/A' }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-900">
              {{ session.participantEmail }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ session.templateId }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ session.currentPage }} / {{ session.totalPages }}
            </td>
            <td class="py-3 px-4">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(session.status)"
              >
                {{ getStatusText(session.status) }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ formatDate(session.createdAt) }}
            </td>
            <td class="py-3 px-4" @click.stop>
              <div class="flex gap-2">
                <button
                  @click="viewDetails(session)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  title="View details"
                >
                  🔍
                </button>
                <button
                  v-if="session.status === 'completed'"
                  @click="downloadPDF(session)"
                  class="text-green-600 hover:text-green-700 text-sm font-medium"
                  title="Download PDF"
                >
                  📄
                </button>
                <button
                  v-if="session.status === 'completed'"
                  @click="viewResults(session)"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  title="View results"
                >
                  📊
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredSessions.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-5xl mb-4">📋</div>
        <p class="text-gray-600">Aucun assessment trouvé</p>
      </div>
    </div>

    <!-- Pagination Info -->
    <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
      <span>
        Affichage de {{ paginatedSessions.length }} assessment(s) sur {{ filteredSessions.length }} filtrés
        ({{ sessions.length}} total)
      </span>
    </div>

    <!-- Detail Modal -->
    <AssessmentDetailModal
      :show="showDetailModal"
      :session-id="selectedSessionId"
      @close="closeDetailModal"
      @refresh="$emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AssessmentDetailModal from './AssessmentDetailModal.vue';

const props = defineProps<{
  sessions: any[];
}>();

const emit = defineEmits(['refresh']);

const searchQuery = ref('');
const statusFilter = ref('');
const itemsPerPage = ref(25);
const currentPage = ref(1);
const showDetailModal = ref(false);
const selectedSessionId = ref<string | null>(null);

const filteredSessions = computed(() => {
  let filtered = props.sessions;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s =>
      (s.participantEmail && s.participantEmail.toLowerCase().includes(query)) ||
      (s.sessionId && s.sessionId.toLowerCase().includes(query)) ||
      (s.organizationId && s.organizationId.toLowerCase().includes(query)) ||
      (s.templateId && s.templateId.toLowerCase().includes(query))
    );
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(s => s.status === statusFilter.value);
  }

  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredSessions.value.length / itemsPerPage.value);
});

const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSessions.value.slice(start, end);
});

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: 'En attente',
    active: 'En cours',
    completed: 'Terminé',
    expired: 'Expiré',
    suspended: 'Suspendu',
  };
  return texts[status] || status;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function viewDetails(session: any) {
  selectedSessionId.value = session.sessionId;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedSessionId.value = null;
}

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function downloadPDF(session: any) {
  window.open(`${API_URL}/api/sessions/${session.sessionId}/pdf`, '_blank');
}

function viewResults(session: any) {
  window.open(`/results/${session.sessionId}`, '_blank');
}

function exportCSV() {
  const headers = ['Session ID', 'Participant Email', 'Template', 'Status', 'Progress', 'Created At'];
  const rows = filteredSessions.value.map(s => [
    s.sessionId,
    s.participantEmail,
    s.templateId,
    s.status,
    `${s.currentPage}/${s.totalPages}`,
    formatDate(s.createdAt),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assessments-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
