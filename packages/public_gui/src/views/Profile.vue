<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>用户信息</span>
        </div>
      </template>
      <div v-if="playerInfo.id">
        <el-descriptions border :column="2">
          <el-descriptions-item label="SteamID">{{ playerInfo.id }}</el-descriptions-item>
          <el-descriptions-item label="Steam昵称">{{ playerInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="积分余额">{{ playerInfo.points }}</el-descriptions-item>
          <el-descriptions-item label="在线状态">{{ playerInfo.isonline ? '在线' : '离线' }}</el-descriptions-item>
          <el-descriptions-item label="上次签到日期">{{ playerInfo.signindate || '无' }}</el-descriptions-item>
          <el-descriptions-item label="连续签到次数">
            {{ playerInfo.signintimes || 0 }}
            <el-button link type="primary" @click="handleSignin" :disabled="isSignedin" class="action-button">签到</el-button>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else description="正在加载用户信息..." />
    </el-card>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>当前存档</span>
        </div>
      </template>
      <div v-if="characterSaveData">
        <el-descriptions border :column="2">
          <el-descriptions-item label="种类">{{ characterSaveData.className }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ characterSaveData.gender }}</el-descriptions-item>
          <el-descriptions-item label="成长度">{{ characterSaveData.growth }}</el-descriptions-item>
          <el-descriptions-item label="操作">
            <el-button link type="warning" @click="handleSell" :disabled="playerInfo.isonline">卖出</el-button>
            <el-button link type="success" @click="handleGrow" :disabled="playerInfo.isonline">点大</el-button>
            <el-button link type="danger" @click="handleDelete" :disabled="playerInfo.isonline">自杀</el-button>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else description="暂无存档数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'

const playerInfo = ref({})
const characterSaveData = ref(null)
const authStore = useAuthStore()

const fetchData = async () => {
  try {
    const [pInfo, charDetails] = await Promise.allSettled([api.getPlayerInfo(), api.getCharacterDetails()])

    if (pInfo.status === 'fulfilled') {
      playerInfo.value = pInfo.value.data
      authStore.user = pInfo.value.data
    } else {
      ElMessage.error('刷新用户信息失败')
    }

    if (charDetails.status === 'fulfilled') {
      characterSaveData.value = charDetails.value.data
    } else {
      characterSaveData.value = null
    }
  } catch (error) {
    ElMessage.error('获取数据时发生未知错误。')
  }
}

onMounted(fetchData)

const isSignedin = computed(() => {
  if (!playerInfo.value.signindate) return false
  const today = new Date().toISOString().slice(0, 10)
  return playerInfo.value.signindate === today
})

const handleSignin = async () => {
  try {
    const result = await api.dailySignin()
    ElMessage.success(result.data.message)
    await fetchData()
  } catch (error) {
    ElMessage.error(`签到失败: ${error.response?.data?.message || error.message}`)
  }
}

const handleSell = async () => {
  if (!characterSaveData.value) return
  const recallPrice = Math.floor(characterSaveData.value.cost * 0.5)
  try {
    await ElMessageBox.confirm(`确认卖出将删除您的存档，并获得 ${recallPrice} 积分`, '卖出确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await api.sellCharacter()
    ElMessage.success(result.message)
    await fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`卖出失败: ${error.response?.data?.message || error.message}`)
    } else {
      ElMessage.info('操作已取消')
    }
  }
}

const handleGrow = async () => {
  if (!characterSaveData.value) return
  const growPrice = characterSaveData.value.cost
  try {
    await ElMessageBox.confirm(`确认点大将会从您的余额中扣除 ${growPrice} 积分`, '点大确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })
    const result = await api.growCharacter()
    ElMessage.success(result.message)
    await fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`点大失败: ${error.response?.data?.message || error.message}`)
    } else {
      ElMessage.info('操作已取消')
    }
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确认自杀您将失去当前的存档，并且不会得到任何补偿', '自杀确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await api.deleteCharacter()
    ElMessage.success(result.message)
    await fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`自杀失败: ${error.response?.data?.message || error.message}`)
    } else {
      ElMessage.info('操作已取消')
    }
  }
}
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}
.card-header {
  font-weight: bold;
}
.action-button {
  margin-left: 10px;
}
</style>
