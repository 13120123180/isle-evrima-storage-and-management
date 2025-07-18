<template>
  <el-card>
    <template #header>玩家信息管理</template>
    <el-form :inline="true" :model="searchParams" @submit.prevent="fetchUsers">
      <el-form-item label="ID">
        <el-input v-model="searchParams.id" placeholder="按ID搜索" clearable></el-input>
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="searchParams.name" placeholder="按昵称搜索" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchUsers">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="users" v-loading="loading">
      <el-table-column prop="id" label="ID" width="180"></el-table-column>
      <el-table-column prop="name" label="昵称"></el-table-column>
      <el-table-column prop="points" label="积分"></el-table-column>
      <el-table-column prop="isonline" label="在线状态">
        <template #default="{ row }">
          <el-tag :type="row.isonline ? 'success' : 'info'">{{ row.isonline ? '在线' : '离线' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewUserDetail(row.id)">详情</el-button>
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
import { useRouter } from 'vue-router';

const router = useRouter();
const users = ref([]);
const loading = ref(false);
const searchParams = reactive({ id: '', name: '' });
const pagination = reactive({ total: 0, pageSize: 10, currentPage: 1 });

const fetchUsers = async () => {
  loading.value = true;
  const params = {
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    ...(searchParams.id && { id: searchParams.id }),
    ...(searchParams.name && { name: searchParams.name }),
  };
  try {
    const response = await api.getUsers(params);
    users.value = response.data.list;
    pagination.total = response.data.total;
  } catch (error) {
    ElMessage.error(`获取用户列表失败: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchUsers();
};

const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  fetchUsers();
};

const viewUserDetail = (id) => {
  router.push({ name: 'UserDetail', params: { id } });
};

onMounted(fetchUsers);
</script>

<style scoped>
.mt-4 {
  margin-top: 1rem;
}
</style>
