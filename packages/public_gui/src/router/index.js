import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/profile' },
      { path: 'profile', component: () => import('../views/Profile.vue') },
      { path: 'bans', component: () => import('../views/BansList.vue') },
      { path: 'bans/detail/:id', name: 'BanDetail', component: () => import('../views/BanDetail.vue') },
    ],
  },
  { path: '/login', component: () => import('../views/Login.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.path !== '/login' && !authStore.token) {
    next('/login');
  } else {
    next();
  }
});

export default router;