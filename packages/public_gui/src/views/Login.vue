<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">岛民自助存取龙平台</h2>
      <el-form @submit.prevent="handleLogin" :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="id">
          <el-input v-model="loginForm.id" placeholder="请输入ID" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-button" size="large">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'

const loginForm = ref({
  id: '',
  password: ''
})
const rules = {
  id: [{ required: true, message: '请输入ID', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
const loginFormRef = ref(null)
const authStore = useAuthStore()

const handleLogin = async () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.login(loginForm.value.id, loginForm.value.password);
        ElMessage.success('登录成功！');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage === '用户不存在。') {
          ElMessage.error('用户不存在：请先在游戏中发送!reg+空格+6位数字密码完成注册');
        } else if (errorMessage === '密码错误。') {
          ElMessage.error('密码不正确：在游戏中重新注册即可重置密码');
        } else {
          ElMessage.error(`登录失败: ${errorMessage}`);
        }
      }
    } else {
      ElMessage.error('请检查登录信息。')
      return false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.title {
  text-align: center;
  color: white;
  font-size: 24px;
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}
</style>
