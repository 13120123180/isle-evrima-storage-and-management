import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
  baseURL: '/server_api',
});

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error);
  }
);

export default {
  login(id, password) {
    return apiClient.post('/auth/login', { id, password });
  },
  logout() {
    return apiClient.post('/auth/logout');
  },

  getPlayerInfo() {
    return apiClient.get('/players/me');
  },
  dailySignin() {
    return apiClient.post('/players/me/signin');
  },

  getCharacterDetails() {
    return apiClient.get('/character/');
  },
  deleteCharacter() {
    return apiClient.delete('/');
  },
  sellCharacter() {
    return apiClient.post('/character/sell');
  },
  growCharacter() {
    return apiClient.post('/character/grow');
  },

  getBans(params) {
    return apiClient.get('/ban/', { params });
  },
  getBanById(banId) {
    return apiClient.get(`/ban/${banId}`);
  },
  createBan(data) {
    return apiClient.post('/ban/', data);
  },
  voteOnBan(banId, voteType) {
    return apiClient.post(`/ban/${banId}/vote`, { voteType });
  },
  revokeBan(banId) {
    return apiClient.post(`/ban/${banId}/revoke`);
  },
};
