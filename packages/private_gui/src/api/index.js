import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/private_api',
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default {
  getServerStatus() {
    return apiClient.get('/serv/status');
  },
  getGameIni() {
    return apiClient.get('/serv/game-ini');
  },
  updateGameIni(content) {
    return apiClient.post('/serv/game-ini', { content });
  },
  broadcast(message) {
    return apiClient.post('/serv/cast', { message });
  },
  rebootServer() {
    return apiClient.post('/serv/reboot');
  },
  cleanUpBodies() {
    return apiClient.post('/serv/clean');
  },
  saveServerData() {
    return apiClient.post('/serv/save');
  },

  getUsers(params) {
    return apiClient.get('/users/list', { params });
  },
  getUserDetail(id) {
    return apiClient.get('/users/detail', { params: { id } });
  },
  updateUser(id, points) {
    return apiClient.post('/users/update', { id, points });
  },

  getOnlinePlayers() {
    return apiClient.get('/online/list');
  },
  kickPlayer(id, reason) {
    return apiClient.post('/online/kick', { id, reason });
  },

  getBans(params) {
    return apiClient.get('/bans/list', { params });
  },

  getKillLogs(params) {
    return apiClient.get('/logs/kills', { params });
  },
  getChatLogs(params) {
    return apiClient.get('/logs/chats', { params });
  },
};
