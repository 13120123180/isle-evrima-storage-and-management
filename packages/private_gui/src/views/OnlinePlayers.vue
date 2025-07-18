<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>在线玩家</span>
        <el-button :icon="Refresh" @click="fetchOnlinePlayers" :loading="loading">刷新</el-button>
      </div>
    </template>
    <el-table :data="players" v-loading="loading">
      <el-table-column prop="PlayerID" label="ID" width="180"></el-table-column>
      <el-table-column prop="Name" label="昵称"></el-table-column>
      <el-table-column prop="isRegistered" label="是否注册">
        <template #default="{ row }">
          <el-tag :type="row.isRegistered ? 'success' : 'warning'">{{ row.isRegistered ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button link type="danger" @click="kickPlayer(row)">踢出</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const players = ref([]);
const loading = ref(false);

const fetchOnlinePlayers = async () => {
  loading.value = true;
  try {
    const response = await api.getOnlinePlayers();
    players.value = response.data;
  } catch (error) {
    ElMessage.error(`获取在线玩家失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const kickPlayer = async (player) => {
  try {
    const reason = await ElMessageBox.prompt('请输入踢出原因', '踢出玩家', {
      confirmButtonText: '确认踢出',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '原因不能为空',
    });
    await api.kickPlayer(player.PlayerID, reason.value);
    ElMessage.success(`玩家 ${player.Name} 已被踢出`);
    fetchOnlinePlayers();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`操作失败: ${error.response?.data?.message || error.message}`);
    }
  }
};

onMounted(fetchOnlinePlayers);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
