<template>
  <el-card>
    <template #header>日志查看器</template>
    <el-tabs type="border-card" v-model="activeTab">
      <el-tab-pane label="击杀日志" name="kills">
        <el-table :data="killLogs" v-loading="loading.kills" height="60vh">
          <el-table-column prop="time" label="时间" width="180"></el-table-column>
          <el-table-column prop="killername" label="击杀者"></el-table-column>
          <el-table-column prop="killerclass" label="物种"></el-table-column>
          <el-table-column prop="killedname" label="受害者"></el-table-column>
          <el-table-column prop="killedclass" label="物种"></el-table-column>
        </el-table>
        <el-pagination class="mt-4" layout="total, prev, pager, next" :total="pagination.kills.total" :page-size="pagination.kills.pageSize" :current-page="pagination.kills.currentPage" @current-change="handleKillLogPageChange"/>
      </el-tab-pane>
      <el-tab-pane label="聊天日志" name="chats">
        <el-table :data="chatLogs" v-loading="loading.chats" height="60vh">
          <el-table-column prop="time" label="时间" width="180"></el-table-column>
          <el-table-column prop="id" label="ID" width="180"></el-table-column>
          <el-table-column prop="content" label="内容"></el-table-column>
        </el-table>
        <el-pagination class="mt-4" layout="total, prev, pager, next" :total="pagination.chats.total" :page-size="pagination.chats.pageSize" :current-page="pagination.chats.currentPage" @current-change="handleChatLogPageChange"/>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import api from '../api';
import { ElMessage } from 'element-plus';

const activeTab = ref('kills');
const killLogs = ref([]);
const chatLogs = ref([]);
const loading = reactive({ kills: false, chats: false });
const pagination = reactive({
  kills: { total: 0, pageSize: 15, currentPage: 1 },
  chats: { total: 0, pageSize: 15, currentPage: 1 },
});

const fetchKillLogs = async () => {
  loading.kills = true;
  try {
    const response = await api.getKillLogs({ page: pagination.kills.currentPage, pageSize: pagination.kills.pageSize });
    killLogs.value = response.data.list;
    pagination.kills.total = response.data.total;
  } catch (error) {
    ElMessage.error(`获取击杀日志失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.kills = false;
  }
};

const fetchChatLogs = async () => {
  loading.chats = true;
  try {
    const response = await api.getChatLogs({ page: pagination.chats.currentPage, pageSize: pagination.chats.pageSize });
    chatLogs.value = response.data.list;
    pagination.chats.total = response.data.total;
  } catch (error) {
    ElMessage.error(`获取聊天日志失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.chats = false;
  }
};

const handleKillLogPageChange = (page) => {
  pagination.kills.currentPage = page;
  fetchKillLogs();
};

const handleChatLogPageChange = (page) => {
  pagination.chats.currentPage = page;
  fetchChatLogs();
};

watch(activeTab, (newTab) => {
  if (newTab === 'kills' && killLogs.value.length === 0) {
    fetchKillLogs();
  } else if (newTab === 'chats' && chatLogs.value.length === 0) {
    fetchChatLogs();
  }
});

onMounted(() => {
  fetchKillLogs();
});
</script>

<style scoped>
.mt-4 {
  margin-top: 1rem;
}
</style>
