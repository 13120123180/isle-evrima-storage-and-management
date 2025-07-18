<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>外挂登记列表</span>
        <el-button type="primary" @click="showCreateDialog = true">新增外挂登记</el-button>
      </div>
    </template>

    <el-form :inline="true" :model="searchParams" class="search-form">
      <el-form-item label="疑似外挂ID">
        <el-input v-model="searchParams.ids" placeholder="疑似外挂ID" clearable class="fixed-width-input"></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchParams.state" placeholder="全部" clearable class="fixed-width-select">
          <el-option label="全部" value=""></el-option>
          <el-option label="投票中" :value="0"></el-option>
          <el-option label="已封禁" :value="1"></el-option>
          <el-option label="未通过" :value="2"></el-option>
          <el-option label="已撤销" :value="3"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="范围">
        <el-select v-model="searchParams.viewType" placeholder="全部" clearable class="fixed-width-select">
          <el-option label="全部" value=""></el-option>
          <el-option label="我发起的" value="my"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchBans()">查询</el-button>
        <el-button @click="resetSearchParams">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="bans" v-loading="loading">
      <el-table-column label="序号" width="80">
        <template #default="scope">
          {{ (pagination.currentPage - 1) * pagination.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="time" label="登记时间" width="180">
        <template #default="{ row }">
          {{ formatBeijingTime(row.time) }}
        </template>
      </el-table-column>
      <el-table-column prop="ids" label="疑似外挂ID" width="180">
        <template #default="{ row }">
          <div v-html="formatIds(row.ids)"></div>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="外挂类型" width="120">
        <template #default="{ row }">
          {{ getBanTypeLabel(row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="登记原因" show-overflow-tooltip />
      <el-table-column prop="state" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStateTagType(row.state)">{{ getStateText(row.state) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetails(row)">查看</el-button>
          <el-button link type="danger" @click="handleRevokeBan(row)" v-if="row.witness === authStore.user.id && row.state === 0">撤销</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[10, 20, 50]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      background
      class="pagination-container" />

    <el-dialog v-model="showCreateDialog" title="新增外挂登记">
      <el-form :model="newBan" :rules="rules" ref="newBanForm" label-width="120px" label-position="right">
        <el-form-item
          v-for="(id, index) in newBan.ids"
          :key="index"
          :label="`疑似外挂ID ${index + 1}`"
          :prop="`ids.${index}`"
          :rules="[
            {
              required: true,
              message: '疑似外挂ID不能为空',
              trigger: 'blur'
            },
            {
              pattern: /^\d{17}$/,
              message: '疑似外挂ID必须是17位纯数字',
              trigger: 'blur'
            }
          ]">
          <div style="display: flex; align-items: center; width: 100%">
            <el-input v-model="newBan.ids[index]" style="width: 385px; margin-right: 10px" />
            <el-button :icon="Minus" @click="removeId(index)" v-if="newBan.ids.length > 1"></el-button>
            <el-button :icon="Plus" @click="addId" v-if="index === newBan.ids.length - 1"></el-button>
          </div>
        </el-form-item>
        <el-form-item label="外挂类型" prop="type">
          <el-select v-model="newBan.type" placeholder="请选择外挂类型">
            <el-option v-for="item in banTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="登记原因" prop="reason">
          <el-input type="textarea" v-model="newBan.reason" @blur="newBanForm.validateField('reason')" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="视频证据链接" prop="video">
          <el-input v-model="newBan.video" @blur="newBanForm.validateField('video')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateBan">创建</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../api'
import { Plus, Minus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { banTypes, getBanTypeLabel } from '../utils/banTypes'
import { formatBeijingTime } from '../utils/formatters'

const bans = ref([])
const showCreateDialog = ref(false)
const newBan = ref({ ids: [''], reason: '', video: '', type: '' })
const router = useRouter()
const authStore = useAuthStore()
const newBanForm = ref(null)
const loading = ref(false)

const searchParams = reactive({
  ids: '',
  state: '',
  viewType: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const rules = {
  type: [{ required: true, message: '外挂类型不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '原因不能为空', trigger: 'blur' }],
  video: [
    { required: true, message: '视频链接不能为空', trigger: 'blur' },
    { type: 'url', message: '视频链接必须是一个有效的http或https网址', trigger: 'blur' }
  ]
}

const fetchBans = async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
  loading.value = true
  try {
    const params = {
      page: page,
      pageSize: pageSize,
      ids: searchParams.ids,
      state: searchParams.state === '' ? null : searchParams.state,
      witness: searchParams.viewType === 'my' ? authStore.user.id : ''
    }
    const response = await api.getBans(params)
    bans.value = response.data.list
    pagination.total = response.data.total
    pagination.currentPage = page
    pagination.pageSize = pageSize
  } catch (error) {
    ElMessage.error('获取外挂登记列表失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const formatIds = (ids) => {
  if (!ids) return ''
  return ids.split(',').join('<br>')
}

const getStateText = (state) => {
  switch (state) {
    case 0:
      return '投票中'
    case 1:
      return '已封禁'
    case 2:
      return '未通过'
    case 3:
      return '已撤销'
    default:
      return '未知'
  }
}

const getStateTagType = (state) => {
  switch (state) {
    case 0:
      return 'success'
    case 1:
      return 'danger'
    case 2:
      return 'warning'
    case 3:
      return 'info'
    default:
      return 'info'
  }
}

const handleSizeChange = (val) => {
  fetchBans(pagination.currentPage, val)
}

const handleCurrentChange = (val) => {
  fetchBans(val, pagination.pageSize)
}

const resetSearchParams = () => {
  searchParams.ids = ''
  searchParams.state = ''
  searchParams.viewType = ''
  pagination.currentPage = 1
  pagination.pageSize = 10
  fetchBans()
}

onMounted(() => {
  fetchBans()
})

const viewDetails = (row) => {
  router.push({ name: 'BanDetail', params: { id: row.id } })
}

const addId = () => {
  newBan.value.ids.push('')
}

const removeId = (index) => {
  newBan.value.ids.splice(index, 1)
}

const handleCreateBan = async () => {
  newBanForm.value.validate(async (valid) => {
    if (valid) {
      try {
        const banData = {
          ...newBan.value,
          ids: newBan.value.ids.join(','),
          witness: authStore.user.id,
          time: Date.now()
        }
        await api.createBan(banData)
        ElMessage.success('外挂登记创建成功！')
        showCreateDialog.value = false
        fetchBans()
        newBan.value = { ids: [''], reason: '', video: '', type: '' }
      } catch (error) {
        ElMessage.error('外挂登记创建失败：' + (error.response?.data?.message || error.message))
      }
    } else {
      ElMessage.error('请检查表单填写，确保所有字段都符合要求。')
      return false
    }
  })
}

const handleRevokeBan = async (row) => {
  try {
    await ElMessageBox.confirm('确认撤销此条外挂登记吗？撤销后将无法恢复。', '撤销确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await api.revokeBan({ id: row.id, time: row.time, userId: authStore.user.id })
    if (response.data.code === 0) {
      ElMessage.success('撤销成功！')
      fetchBans()
    } else {
      ElMessage.error('撤销失败：' + (response.data.msg || '请联系管理员'))
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('操作已取消')
      return
    }
    ElMessage.error('撤销失败：' + (error.response?.data?.message || error.message))
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form .el-form-item {
  margin-right: 0;
  margin: 10px 0;
}

.fixed-width-input {
  width: 180px;
}
.fixed-width-select {
  width: 120px;
}

.pagination-container {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
</style>
