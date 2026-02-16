<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center gap-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-white">Administration Plateforme</h1>
            <p class="text-primary-100 mt-1">Vue d'ensemble globale de la plateforme Janus</p>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>

    <!-- KPIs Cards -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Global KPIs Cards -->
      <GlobalKPIsCards />

      <!-- Revenue Trend Chart -->
      <RevenueTrendChart />

        <!-- Tabs Navigation -->
        <div class="bg-white rounded-lg shadow-sm mb-8">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex">
              <button
                @click="activeTab = 'assessments'"
                :class="[
                  'py-4 px-6 text-center border-b-2 font-medium text-sm',
                  activeTab === 'assessments'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                📋 Tous les Assessments
              </button>
              <button
                @click="activeTab = 'audit-logs'"
                :class="[
                  'py-4 px-6 text-center border-b-2 font-medium text-sm',
                  activeTab === 'audit-logs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                📝 Journaux d'Audit
              </button>
              <button
                @click="activeTab = 'meta-templates'"
                :class="[
                  'py-4 px-6 text-center border-b-2 font-medium text-sm',
                  activeTab === 'meta-templates'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                📚 Méta-Templates
              </button>
              <button
                @click="activeTab = 'companies'"
                :class="[
                  'py-4 px-6 text-center border-b-2 font-medium text-sm',
                  activeTab === 'companies'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                🏢 Entreprises
              </button>
              <button
                @click="activeTab = 'license-pools'"
                :class="[
                  'py-4 px-6 text-center border-b-2 font-medium text-sm',
                  activeTab === 'license-pools'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                🎫 Pools de Licences
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Assessments Tab -->
            <div v-if="activeTab === 'assessments'">
              <AllAssessmentsTable :sessions="allSessions" @refresh="loadAllAssessments" />
            </div>

            <!-- Audit Logs Tab -->
            <div v-if="activeTab === 'audit-logs'">
              <AuditLogsTable :logs="auditLogs" @refresh="loadAuditLogs" />
            </div>

            <!-- Meta-Templates Tab -->
            <div v-if="activeTab === 'meta-templates'">
              <MetaTemplatesView :templates="metaTemplates" />
            </div>

            <!-- Companies Tab -->
            <div v-if="activeTab === 'companies'">
              <CompaniesManagement :companies="companies" @refresh="loadCompanies" />
            </div>

            <!-- License Pools Tab -->
            <div v-if="activeTab === 'license-pools'">
              <AdminLicensePoolsTable />
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AllAssessmentsTable from '../components/AllAssessmentsTable.vue';
import AuditLogsTable from '../components/AuditLogsTable.vue';
import MetaTemplatesView from '../components/MetaTemplatesView.vue';
import CompaniesManagement from '../components/CompaniesManagement.vue';
import GlobalKPIsCards from '../components/GlobalKPIsCards.vue';
import RevenueTrendChart from '../components/RevenueTrendChart.vue';
import UserMenu from '../components/UserMenu.vue';
import AdminLicensePoolsTable from '../components/AdminLicensePoolsTable.vue';

const loading = ref(true);
const activeTab = ref('assessments');

const kpis = ref({
  activeAssessments: 0,
  pendingAssessments: 0,
  completedAssessments: 0,
  totalAssessments: 0,
  revenue: 0,
  pendingOrders: 0,
});

const allSessions = ref<any[]>([]);
const auditLogs = ref<any[]>([]);
const metaTemplates = ref<any[]>([]);
const companies = ref<any[]>([]);

onMounted(async () => {
  await loadKPIs();
  await loadAllAssessments();
  await loadAuditLogs();
  await loadMetaTemplates();
  await loadCompanies();
  loading.value = false;
});

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  console.error('VITE_API_URL is not defined! Please set it in your environment variables.');
}

async function loadKPIs() {
  try {
    const response = await fetch(`${API_URL}/api/admin/kpis`);
    const data = await response.json();
    kpis.value = data.kpis;
  } catch (error) {
    console.error('Failed to load KPIs:', error);
  }
}

async function loadAllAssessments() {
  try {
    const response = await fetch(`${API_URL}/api/admin/assessments`);
    const data = await response.json();
    allSessions.value = data.sessions;
  } catch (error) {
    console.error('Failed to load assessments:', error);
  }
}

async function loadAuditLogs() {
  try {
    const response = await fetch(`${API_URL}/api/admin/audit-logs`);
    const data = await response.json();
    auditLogs.value = data.logs;
  } catch (error) {
    console.error('Failed to load audit logs:', error);
  }
}

async function loadMetaTemplates() {
  try {
    const response = await fetch(`${API_URL}/api/admin/meta-templates`);
    const data = await response.json();
    metaTemplates.value = data.templates;
  } catch (error) {
    console.error('Failed to load meta-templates:', error);
  }
}

async function loadCompanies() {
  try {
    const response = await fetch(`${API_URL}/api/companies`);
    const data = await response.json();
    companies.value = data.companies;
  } catch (error) {
    console.error('Failed to load companies:', error);
  }
}
</script>
