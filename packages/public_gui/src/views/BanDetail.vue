<template>
  <el-card class="box-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>记录详情</span>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </template>
    <div v-if="ban.id">
      <el-descriptions border :column="1" label-width="120px">
        <el-descriptions-item label="登记时间">{{ formatBeijingTime(ban.time) }}</el-descriptions-item>
        <el-descriptions-item label="疑似外挂ID">
          <div v-html="formatIds(ban.ids)"></div>
        </el-descriptions-item>
        <el-descriptions-item label="外挂类型">{{ getBanTypeLabel(ban.type) }}</el-descriptions-item>
        <el-descriptions-item label="登记原因">
          <div style="white-space: pre-wrap">{{ ban.reason }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="视频证据链接">
          <a :href="ban.video" target="_blank" rel="noopener noreferrer">点击跳转</a>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStateTagType(ban.state)">{{ getStateText(ban.state) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="赞成票">{{ supporterCount }}</el-descriptions-item>
        <el-descriptions-item label="反对票">{{ opponentCount }}</el-descriptions-item>
      </el-descriptions>
      <div class="actions" v-if="canVote">
        <el-button type="success" @click="handleVote('approve')" :disabled="hasVoted">支持</el-button>
        <el-button type="danger" @click="handleVote('oppose')" :disabled="hasVoted">反对</el-button>
        <p v-if="hasVoted" class="vote-tip">您已投过票</p>
      </div>
    </div>
    <el-empty v-else description="加载中或未找到记录..."></el-empty>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../api';
import { ElMessage } from 'element-plus';
import { getBanTypeLabel } from '../utils/banTypes';
import { formatBeijingTime } from '../utils/formatters';

const ban = ref({});
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formatIds = (ids) => {
  if (!ids) return '';
  return ids.split(',').join('<br>');
};

const getStateText = (state) => {
  return { 0: '投票中', 1: '已封禁', 2: '未通过', 3: '已撤销' }[state] || '未知';
};

const getStateTagType = (state) => {
  return { 0: 'primary', 1: 'danger', 2: 'warning', 3: 'info' }[state] || 'info';
};

const supporterCount = computed(() => {
  return ban.value.supporter ? ban.value.supporter.split(',').filter(Boolean).length : 0;
});

const opponentCount = computed(() => {
  return ban.value.opponent ? ban.value.opponent.split(',').filter(Boolean).length : 0;
});

const hasVoted = computed(() => {
  if (!authStore.user?.id || !ban.value.id) return false;
  const supporters = ban.value.supporter?.split(',') || [];
  const opponents = ban.value.opponent?.split(',') || [];
  return supporters.includes(authStore.user.id) || opponents.includes(authStore.user.id);
});

const canVote = computed(() => {
  if (!authStore.user?.id || !ban.value.id) return false;
  return ban.value.state === 0 && ban.value.witness !== authStore.user.id;
});

const fetchBanDetails = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    if (!id) {
      ElMessage.error('缺少封禁记录ID');
      router.push('/bans');
      return;
    }
    const response = await api.getBanById(id);
    ban.value = response.data;
  } catch (error) {
    ElMessage.error(`获取详情失败: ${error.response?.data?.message || error.message}`);
    router.push('/bans');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBanDetails);

const handleVote = async (voteType) => {
  try {
    const result = await api.voteOnBan(ban.value.id, voteType);
    ElMessage.success(result.message || '投票成功！');
    await fetchBanDetails();
  } catch (error) {
    ElMessage.error(`投票失败: ${error.response?.data?.message || error.message}`);
  }
};
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.actions {
  margin-top: 20px;
}
.vote-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}
</style>
