import { createRouter, createWebHistory } from 'vue-router';
import SessionView from './views/SessionView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/session/:token',
      name: 'session',
      component: SessionView,
    },
    {
      path: '/',
      redirect: '/session/demo',
    },
  ],
});

export default router;
