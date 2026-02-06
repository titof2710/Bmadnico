<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement des résultats...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-2xl mx-auto">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="text-red-600 text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-red-900 mb-2">Erreur</h2>
        <p class="text-red-700">{{ error }}</p>
        <button
          @click="$router.back()"
          class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retour
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="results" class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Résultats de l'Évaluation</h1>
            <p class="text-gray-600">{{ results.templateName }}</p>
            <p class="text-sm text-gray-500 mt-1">
              Participant : {{ results.participantEmail }}
            </p>
            <p class="text-sm text-gray-500">
              Complété le : {{ formatDate(results.completedAt) }}
            </p>
          </div>
          <button
            @click="$router.back()"
            class="text-gray-600 hover:text-gray-900"
          >
            ← Retour
          </button>
        </div>
      </div>

      <!-- Overall Score Card -->
      <div class="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 mb-6 text-white">
        <div class="text-center">
          <h2 class="text-xl font-semibold mb-2">Score Global</h2>
          <div class="text-6xl font-bold mb-2">{{ results.overall.percentage }}%</div>
          <p class="text-primary-100">
            {{ results.overall.score }} / {{ results.overall.maxScore }} points
          </p>
          <p class="text-sm text-primary-200 mt-2">
            {{ results.totalResponses }} réponses enregistrées
          </p>
        </div>
      </div>

      <!-- Categories -->
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Scores par Catégorie</h2>

        <div
          v-for="category in results.categories"
          :key="category.categoryId"
          class="bg-white rounded-lg shadow-sm p-6"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ category.categoryName }}</h3>
              <p class="text-sm text-gray-500">
                {{ category.questionsAnswered }} / {{ category.totalQuestions }} questions répondues
              </p>
            </div>
            <div class="text-right">
              <div
                class="text-3xl font-bold"
                :class="{
                  'text-green-600': category.percentage >= 75,
                  'text-yellow-600': category.percentage >= 50 && category.percentage < 75,
                  'text-orange-600': category.percentage >= 25 && category.percentage < 50,
                  'text-red-600': category.percentage < 25
                }"
              >
                {{ category.percentage }}%
              </div>
              <p class="text-sm text-gray-500">
                {{ category.score }} / {{ category.maxScore }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div
              class="h-4 rounded-full transition-all duration-500"
              :class="{
                'bg-green-600': category.percentage >= 75,
                'bg-yellow-500': category.percentage >= 50 && category.percentage < 75,
                'bg-orange-500': category.percentage >= 25 && category.percentage < 50,
                'bg-red-500': category.percentage < 25
              }"
              :style="{ width: `${category.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Actions</h3>
        <div class="flex gap-4">
          <button
            class="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold"
            @click="downloadReport"
          >
            📥 Télécharger le Rapport PDF
          </button>
          <button
            class="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold"
            @click="$router.back()"
          >
            Retour au Dashboard
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-4 text-center">
          💡 Le rapport PDF inclut le score global et les détails par catégorie
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const sessionId = route.params.sessionId as string;

const loading = ref(true);
const error = ref<string | null>(null);
const results = ref<any>(null);

onMounted(async () => {
  await loadResults();
});

async function loadResults() {
  try {
    loading.value = true;
    error.value = null;

    const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/results`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Échec du chargement des résultats');
    }

    results.value = await response.json();
  } catch (err: any) {
    error.value = err.message || 'Échec du chargement des résultats';
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function downloadReport() {
  try {
    const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/pdf`);

    if (!response.ok) {
      alert('❌ Erreur lors de la génération du PDF');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${results.value?.participantEmail?.split('@')[0] || 'assessment'}-${sessionId.substring(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('❌ Erreur lors du téléchargement du PDF');
  }
}
</script>
