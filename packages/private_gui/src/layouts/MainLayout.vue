<template>
  <el-container style="height: 100vh;">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/players">
          <el-icon><User /></el-icon>
          <span>玩家管理</span>
        </el-menu-item>
        <el-menu-item index="/online">
          <el-icon><VideoCameraFilled /></el-icon>
          <span>在线玩家</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>日志查看</span>
        </el-menu-item>
        <el-menu-item index="/game-ini">
          <el-icon><Setting /></el-icon>
          <span>配置编辑</span>
        </el-menu-item>
        <el-menu-item index="/admin-bans">
          <el-icon><Warning /></el-icon>
          <span>封禁管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import {
  HomeFilled,
  User,
  VideoCameraFilled,
  Document,
  Setting,
  Warning
} from '@element-plus/icons-vue'
</script>

<style scoped>
.el-aside {
  background-color: #f4f4f5;
}
.el-menu {
  height: 100%;
}
</style>