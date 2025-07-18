<template>
  <el-container class="main-container">
    <el-header class="header">
      <div class="header-content">
        <div class="system-name">岛民自助存取龙平台</div>
        <div class="user-info" v-if="user">
          <span>欢迎, {{ user.name }} ({{ user.id }})</span>
          <el-button type="primary" plain @click="logout">退出</el-button>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu :default-active="$route.path" router class="menu">
          <el-menu-item index="/profile">
            <template #title>用户信息</template>
          </el-menu-item>
          <el-menu-item index="/bans">
            <template #title>龙岛小法庭</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const logout = () => {
  authStore.logout()
}
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.system-name {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 15px;
}

.aside {
  background-color: #fff;
}

.menu {
  height: 100%;
  border-right: none;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
