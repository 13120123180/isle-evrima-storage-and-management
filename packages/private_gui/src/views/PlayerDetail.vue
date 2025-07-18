<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>玩家详情</span>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </template>
    <div v-if="detail">
      <el-tabs type="border-card">
        <el-tab-pane label="基础信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ detail.playerInfo.id }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ detail.playerInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="积分">
              <el-input-number v-model="editablePoints" :min="0" controls-position="right" />
              <el-button type="primary" @click="updatePoints" style="margin-left: 10px;">更新</el-button>
            </el-descriptions-item>
            <el-descriptions-item label="在线状态">{{ detail.playerInfo.isonline ? '在线' : '离线' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="游戏存档">
          <pre v-if="detail.saveData">{{ detail.saveData }}</pre>
          <el-empty v-else description="无存档信息"></el-empty>
        </el-tab-pane>
        <el-tab-pane label="击杀记录">
          <el-table :data="detail.killsAsKiller" height="400">
            <el-table-column prop="killedname" label="受害者"></el-table-column>
            <el-table-column prop="killedclass" label="受害者物种"></el-table-column>
            <el-table-column prop="time" label="时间"></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="聊天记录">
          <el-table :data="detail.chats" height="400">
            <el-table-column prop="content" label="内容"></el-table-column>
            <el-table-column prop="time" label="时间"></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import { ElMessage } from 'element-plus';

const route = useRoute();
const detail = ref(null);
const loading = ref(false);
const editablePoints = ref(0);

const fetchUserDetail = async () => {
  loading.value = true;
  try {
    const response = await api.getUserDetail(route.params.id);
    detail.value = response.data;
    editablePoints.value = response.data.playerInfo.points;
  } catch (error) {
    ElMessage.error(`获取详情失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const updatePoints = async () => {
  try {
    await api.updateUser(route.params.id, editablePoints.value);
    ElMessage.success('积分更新成功！');
    fetchUserDetail();
  } catch (error) {
    ElMessage.error(`更新失败: ${error.response?.data?.message || error.message}`);
  }
};

onMounted(fetchUserDetail);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
