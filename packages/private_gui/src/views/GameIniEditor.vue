<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>Game.ini 文件编辑器</span>
        <el-button type="primary" @click="saveGameIni">保存</el-button>
      </div>
    </template>
    <el-input
      v-model="content"
      type="textarea"
      :rows="25"
      placeholder="Loading content..."
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { ElMessage } from 'element-plus';

const content = ref('');
const loading = ref(false);

const fetchGameIni = async () => {
  loading.value = true;
  try {
    const response = await api.getGameIni();
    content.value = response.data.content;
  } catch (error) {
    ElMessage.error(`加载 Game.ini 失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const saveGameIni = async () => {
  loading.value = true;
  try {
    await api.updateGameIni(content.value);
    ElMessage.success('Game.ini 保存成功！');
  } catch (error) {
    ElMessage.error(`保存 Game.ini 失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchGameIni);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
