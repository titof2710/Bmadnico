import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from './views/DashboardView.vue';
import ResultsView from './views/ResultsView.vue';
import PlatformAdminView from './views/PlatformAdminView.vue';
import LicensePoolsView from './views/LicensePoolsView.vue';
import TemplateBuilderView from './views/TemplateBuilderView.vue';
import UserManagementView from './views/UserManagementView.vue';
import LoginView from './views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, roles: ['admin', 'manager'] },
    },
    {
      path: '/results/:sessionId',
      name: 'results',
      component: ResultsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'platform-admin',
      component: PlatformAdminView,
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/license-pools',
      name: 'license-pools',
      component: LicensePoolsView,
      meta: { requiresAuth: true, roles: ['admin', 'manager'] },
    },
    {
      path: '/templates',
      name: 'template-builder',
      component: TemplateBuilderView,
      meta: { requiresAuth: true, roles: ['admin', 'manager'] },
    },
    {
      path: '/users',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true, role: 'admin' },
    },
  ],
});

// Navigation guard pour l'authentification
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt_token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth && !token) {
    // Rediriger vers login
    next('/login');
    return;
  }

  // Vérifier le rôle si nécessaire
  if (to.meta.role && user) {
    if (user.role !== to.meta.role) {
      // Rôle insuffisant - rediriger vers login
      alert(`Accès refusé: Cette page nécessite le rôle ${to.meta.role}`);
      next('/login');
      return;
    }
  }

  // Vérifier les rôles multiples
  if (to.meta.roles && user) {
    const roles = to.meta.roles as string[];
    if (!roles.includes(user.role)) {
      alert(`Accès refusé: Cette page nécessite l'un des rôles: ${roles.join(', ')}`);
      // Redirect to login instead of dashboard to avoid loops
      next('/login');
      return;
    }
  }

  // Si on est déjà connecté et qu'on va sur /login, rediriger vers home
  if (to.path === '/login' && token) {
    next('/');
    return;
  }

  next();
});

export default router;
