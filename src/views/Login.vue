<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">微澜</div>
      </div>
      <h2 class="login-title">PulseRead 后台管理系统</h2>
      <p class="login-subtitle">AI 驱动的跨域资讯聚合平台</p>

      <!-- 登录表单 -->
      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleLogin"
        style="margin-top: 24px"
      >
        <a-form-item label="邮箱" name="email">
          <a-input
            v-model:value="formState.email"
            placeholder="请输入邮箱地址"
            size="large"
            prefix-icon="MailOutlined"
          >
            <template #prefix><MailOutlined style="color: #bbb" /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix><LockOutlined style="color: #bbb" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            block
            size="large"
            :loading="loading"
            style="background: #00B96B; border-color: #00B96B; margin-top: 8px"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-footer">© 2026 PulseRead. 保留所有权利。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const formState = reactive({
  email: 'admin@pulseread.com',
  password: 'admin123',
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(formState.email, formState.password)
    message.success('登录成功，欢迎回来！')
    router.push('/dashboard')
  } catch (err: unknown) {
    const error = err as Error
    message.error(error.message || '登录失败，请检查邮箱和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #0d1117;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: radial-gradient(ellipse at 50% 50%, rgba(0, 185, 107, 0.08) 0%, transparent 70%);
}
.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #00B96B, #00d97e);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 185, 107, 0.3);
}
.login-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.login-subtitle {
  color: #999;
  font-size: 13px;
  margin-bottom: 0;
}
.login-footer {
  margin-top: 24px;
  color: #bbb;
  font-size: 12px;
}
</style>
