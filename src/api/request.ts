import axios, { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types'

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined) || '/api'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${token}`)
      config.headers = headers
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const payload = response.data

    if (payload && (payload.code === 0 || payload.code === 200)) {
      response.data = payload.data as never
      return response
    }

    message.error(payload?.message || '请求失败')
    return Promise.reject(new Error(payload?.message || '请求失败'))
  },
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status

    if (status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      await router.push('/login')
      message.error('登录已过期，请重新登录')
    } else if (status === 403) {
      message.error('权限不足')
    } else if (status && status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误')
    }

    return Promise.reject(error)
  },
)

export default request
