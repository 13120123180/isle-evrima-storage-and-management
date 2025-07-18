<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>服务器实时状态</span>
          <div>
            <el-button :icon="Refresh" @click="fetchServerStatus" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>
      <div v-if="serverStatus">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="服务器名称">{{ serverStatus.ServerName }}</el-descriptions-item>
          <el-descriptions-item label="在线人数">{{ serverStatus.ServerCurrentPlayers }} / {{ serverStatus.ServerMaxPlayers }}</el-descriptions-item>
          <el-descriptions-item label="当前地图">{{ serverStatus.ServerMap }}</el-descriptions-item>
          <el-descriptions-item label="变异服">{{ formatBoolean(serverStatus.bEnableMutations) }}</el-descriptions-item>
          <el-descriptions-item label="允许人类">{{ formatBoolean(serverStatus.bEnableHumans) }}</el-descriptions-item>
          <el-descriptions-item label="有密码">{{ formatBoolean(serverStatus.bServerPassword) }}</el-descriptions-item>
          <el-descriptions-item label="白名单">{{ formatBoolean(serverStatus.bServerWhitelist) }}</el-descriptions-item>
          <el-descriptions-item label="生成AI">{{ formatBoolean(serverStatus.bSpawnAI) }}</el-descriptions-item>
          <el-descriptions-item label="允许录像">{{ formatBoolean(serverStatus.bAllowRecordingReplay) }}</el-descriptions-item>
          <el-descriptions-item label="白天时长">{{ serverStatus.ServerDayLengthMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="夜晚时长">{{ serverStatus.ServerNightLengthMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="全局聊天">{{ formatBoolean(serverStatus.bEnableGlobalChat) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else-if="!loading" description="获取服务器状态失败，请检查后端服务是否开启或网络连接。"></el-empty>
    </el-card>

    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>服务器操作</span>
        </div>
      </template>
      <el-button type="danger" @click="() => confirmAction('reboot')">重启服务器</el-button>
      <el-button type="warning" @click="() => confirmAction('cleanup')">清理尸体</el-button>
      <el-button type="primary" @click="() => confirmAction('save')">数据备份</el-button>
      <el-button type="success" @click="showBroadcastDialog = true">发送广播</el-button>
    </el-card>

    <el-dialog v-model="showBroadcastDialog" title="发送服务器广播">
      <el-input v-model="broadcastMessage" type="textarea" :rows="3" placeholder="请输入广播内容" />
      <template #footer>
        <el-button @click="showBroadcastDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBroadcast">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const serverStatus = ref(null)
const loading = ref(false)
const showBroadcastDialog = ref(false)
const broadcastMessage = ref('')

const fetchServerStatus = async () => {
  loading.value = true
  try {
    const response = await api.getServerStatus()
    serverStatus.value = response.data
  } catch (error) {
    serverStatus.value = null
    ElMessage.error(`获取服务器状态失败: ${error.response?.data?.message || error.message}`)
  } finally {
    loading.value = false
  }
}

const handleBroadcast = async () => {
  if (!broadcastMessage.value) {
    ElMessage.warning('广播内容不能为空')
    return
  }
  try {
    await api.broadcast(broadcastMessage.value)
    ElMessage.success('广播发送成功！')
    showBroadcastDialog.value = false
    broadcastMessage.value = ''
  } catch (error) {
    ElMessage.error(`发送失败: ${error.response?.data?.message || error.message}`)
  }
}

const formatBoolean = (value) => {
  return value ? '是' : '否'
}

const confirmAction = (action) => {
  const actions = {
    reboot: { title: '确认重启', message: '确定要重启服务器吗？此操作会中断所有玩家的连接。' },
    cleanup: { title: '确认清理', message: '确定要清理所有尸体吗？' },
    save: { title: '确认保存', message: '确定要数据备份数据吗？' }
  }

  ElMessageBox.confirm(actions[action].message, actions[action].title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      let response
      if (action === 'reboot') response = await api.rebootServer()
      if (action === 'cleanup') response = await api.cleanUpBodies()
      if (action === 'save') response = await api.saveServerData()
      ElMessage.success(response.message || '操作成功！')
    } catch (error) {
      ElMessage.error(`操作失败: ${error.response?.data?.message || error.message}`)
    }
  })
}

onMounted(fetchServerStatus)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
