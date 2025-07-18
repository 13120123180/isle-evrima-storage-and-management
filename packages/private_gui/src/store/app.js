import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    appName: 'Admin Dashboard',
  }),
  actions: {},
});
