import { defineStore } from 'pinia';
import api from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
  }),
  actions: {
    async login(id, password) {
      const loginResult = await api.login(id, password);
      this.token = loginResult.token;
      localStorage.setItem('token', this.token);
      await this.fetchUser();
      router.push('/');
    },
    async logout() {
      try {
        await api.logout();
      } catch (error) {
        console.error('Error during logout API call:', error);
      }
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      router.push('/login');
    },
    async fetchUser() {
      if (this.token) {
        try {
          const userInfo = await api.getPlayerInfo();
          this.user = userInfo.data;
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          this.logout();
        }
      }
    },
  },
});