import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: '/players', name: 'Players', component: () => import('../views/Players.vue') },
      { path: '/player/:id', name: 'UserDetail', component: () => import('../views/PlayerDetail.vue') },
      { path: '/online', name: 'OnlinePlayers', component: () => import('../views/OnlinePlayers.vue') },
      { path: '/logs', name: 'Logs', component: () => import('../views/Logs.vue') },
      { path: '/game-ini', name: 'GameIniEditor', component: () => import('../views/GameIniEditor.vue') },
      { path: '/admin-bans', name: 'AdminBans', component: () => import('../views/AdminBans.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
