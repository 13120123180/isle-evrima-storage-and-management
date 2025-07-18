<template>
  <el-card>
    <template #header>封禁列表管理</template>
    <el-form :inline="true" :model="searchParams" @submit.prevent="fetchBans">
      <el-form-item label="ID">
        <el-input v-model="searchParams.ids" placeholder="按ID搜索" clearable></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchParams.state" placeholder="全部状态" clearable>
          <el-option label="投票中" :value="0"></el-option>
          <el-option label="已封禁" :value="1"></el-option>
          <el-option label="未通过" :value="2"></el-option>
          <el-option label="已撤销" :value="3"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchBans">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="bans" v-loading="loading">
      <el-table-column prop="id" label="#" width="80"></el-table-column>
      <el-table-column prop="time" label="登记时间" width="180"></el-table-column>
      <el-table-column prop="ids" label="目标ID"></el-table-column>
      <el-table-column prop="reason" label="原因"></el-table-column>
      <el-table-column prop="witness" label="发起人ID"></el-table-column>
      <el-table-column prop="state" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStateTagType(row.state)">{{ getStateText(row.state) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt-4"
      layout="total, sizes, prev, pager, next"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current-page="pagination.currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';
import { ElMessage } from 'element-plus';

const bans = ref([]);
const loading = ref(false);
const searchParams = reactive({ ids: '', state: '' });
const pagination = reactive({ total: 0, pageSize: 10, currentPage: 1 });

const fetchBans = async () => {
  loading.value = true;
  const params = {
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    ...(searchParams.ids && { ids: searchParams.ids }),
    ...(searchParams.state !== '' && { state: searchParams.state }),
  };
  try {
    const response = await api.getBans(params);
    bans.value = response.data.list;
    pagination.total = response.data.total;
  } catch (error) {
    ElMessage.error(`获取封禁列表失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchBans();
};

const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  fetchBans();
};

const getStateText = (state) => {
  return { 0: '投票中', 1: '已封禁', 2: '未通过', 3: '已撤销' }[state] || '未知';
};

const getStateTagType = (state) => {
  return { 0: 'primary', 1: 'danger', 2: 'warning', 3: 'info' }[state] || 'info';
};

onMounted(fetchBans);
</script>

<style scoped>
.mt-4 {
  margin-top: 1rem;
}
</style>
