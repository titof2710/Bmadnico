<template>
  <div>
    <!-- Filters -->
    <div class="mb-6 flex gap-4">
      <select
        v-model="actionTypeFilter"
        class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="">Tous les types d'actions</option>
        <option value="SessionCreated">Session Créée</option>
        <option value="SessionStarted">Session Démarrée</option>
        <option value="ResponseRecorded">Réponse Enregistrée</option>
        <option value="PageCompleted">Page Complétée</option>
        <option value="SessionCompleted">Session Complétée</option>
      </select>
      <button
        @click="$emit('refresh')"
        class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
      >
        🔄 Actualiser
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resource</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organization</th>
            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in filteredLogs"
            :key="log.logId"
            class="border-b border-gray-100 hover:bg-gray-50"
          >
            <td class="py-3 px-4 text-sm text-gray-900">
              {{ formatDate(log.timestamp) }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ log.userId }}
            </td>
            <td class="py-3 px-4 text-sm font-medium text-gray-900">
              {{ formatActionType(log.actionType) }}
            </td>
            <td class="py-3 px-4 text-sm text-gray-600 font-mono text-xs">
              {{ log.resourceId.substring(0, 8) }}...
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">
              {{ log.organizationId }}
            </td>
            <td class="py-3 px-4">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {{ log.result }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredLogs.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-5xl mb-4">📝</div>
        <p class="text-gray-600">Aucun log d'audit trouvé</p>
      </div>
    </div>

    <!-- Pagination Info -->
    <div class="mt-4 text-sm text-gray-600">
      Affichage de {{ filteredLogs.length }} log(s) sur {{ logs.length }} total
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  logs: any[];
}>();

const emit = defineEmits(['refresh']);

const actionTypeFilter = ref('');

const filteredLogs = computed(() => {
  let filtered = props.logs;

  if (actionTypeFilter.value) {
    filtered = filtered.filter(log => log.actionType === actionTypeFilter.value);
  }

  return filtered;
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatActionType(actionType: string): string {
  const map: Record<string, string> = {
    SessionCreated: 'Session Créée',
    SessionStarted: 'Session Démarrée',
    ResponseRecorded: 'Réponse Enregistrée',
    PageCompleted: 'Page Complétée',
    SessionCompleted: 'Session Complétée',
  };
  return map[actionType] || actionType;
}
</script>
