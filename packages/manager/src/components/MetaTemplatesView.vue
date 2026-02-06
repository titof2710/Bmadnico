<template>
  <div>
    <h3 class="text-lg font-bold text-gray-900 mb-4">Meta-Templates Disponibles</h3>

    <!-- Templates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-lg font-bold text-gray-900">{{ template.name }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ template.description }}</p>
          </div>
          <div class="flex gap-2">
            <span
              v-if="template.published"
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
            >
              ✓ Publié
            </span>
            <span
              v-if="template.productAssociated"
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              💎 Produit
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Langue:</span>
            <span class="font-medium text-gray-900">{{ template.language.toUpperCase() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Version:</span>
            <span class="font-medium text-gray-900">{{ template.version }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Questions totales:</span>
            <span class="font-medium text-gray-900">{{ template.totalQuestions }}</span>
          </div>
        </div>

        <!-- Sub-Templates -->
        <div class="border-t border-gray-200 pt-4">
          <h5 class="text-sm font-semibold text-gray-700 mb-2">Composition:</h5>
          <div class="space-y-2">
            <div
              v-for="sub in template.subTemplates"
              :key="sub.id"
              class="flex justify-between items-center text-sm bg-gray-50 rounded px-3 py-2"
            >
              <span class="text-gray-900">{{ sub.name }}</span>
              <span class="text-gray-600">{{ sub.questionCount }} questions</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="viewTemplate(template)"
            class="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Voir les Détails
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="templates.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-5xl mb-4">📚</div>
      <p class="text-gray-600">Aucun meta-template disponible</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  templates: any[];
}>();

function viewTemplate(template: any) {
  alert(`Meta-Template: ${template.name}\n\nVersion: ${template.version}\nQuestions: ${template.totalQuestions}\n\nCe template contient ${template.subTemplates.length} sous-templates.\n\nLa création/édition de meta-templates sera implémentée dans EPIC-101 (Phase 2).`);
}
</script>
