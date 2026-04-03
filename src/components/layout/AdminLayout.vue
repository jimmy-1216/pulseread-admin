<template>
  <a-layout style="min-height: 100vh">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :width="200"
      style="background: #141414"
    >
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo-icon">微澜</div>
        <span v-if="!collapsed" class="logo-text">PulseRead</span>
      </div>

      <!-- 菜单 -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        theme="dark"
        mode="inline"
        style="background: #141414; border-right: none"
        @click="handleMenuClick"
      >
        <a-menu-item-group>
          <template #title>
            <span style="color: #666; font-size: 11px">主要功能</span>
          </template>
          <a-menu-item key="dashboard">
            <template #icon><DashboardOutlined /></template>
            仪表板
          </a-menu-item>
          <a-menu-item key="analytics">
            <template #icon><BarChartOutlined /></template>
            数据统计
          </a-menu-item>
        </a-menu-item-group>

        <a-sub-menu key="articles">
          <template #icon><FileTextOutlined /></template>
          <template #title>资讯管理</template>
          <a-menu-item key="article-list">资讯列表</a-menu-item>
          <a-menu-item key="article-create">新增资讯</a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="settings">
          <template #icon><SettingOutlined /></template>
          <template #title>系统设置</template>
          <a-menu-item key="noise-config">降噪配置</a-menu-item>
          <a-menu-item key="domain-manage">领域管理</a-menu-item>
          <a-menu-item key="region-manage">地区管理</a-menu-item>
          <a-menu-item key="radar-manage">雷达词管理</a-menu-item>
          <a-menu-item key="source-manage">数据来源配置</a-menu-item>
        </a-sub-menu>

        <a-menu-item-group>
          <template #title>
            <span style="color: #666; font-size: 11px">用户运营</span>
          </template>
          <a-menu-item key="feedback">
            <template #icon><MessageOutlined /></template>
            用户反馈
            <a-badge :count="12" :offset="[8, -2]" />
          </a-menu-item>
          <a-menu-item key="users">
            <template #icon><TeamOutlined /></template>
            用户管理
          </a-menu-item>
        </a-menu-item-group>
      </a-menu>

      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="collapsed = !collapsed">
        <MenuFoldOutlined v-if="!collapsed" />
        <MenuUnfoldOutlined v-else />
      </div>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部导航 -->
      <a-layout-header style="background: #fff; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.08)">
        <div class="header-left">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <!-- 搜索 -->
          <a-input-search
            placeholder="快速搜索..."
            style="width: 200px; margin-right: 16px"
            @search="handleSearch"
          />
          <!-- 通知 -->
          <a-badge :count="3" style="margin-right: 20px">
            <BellOutlined style="font-size: 18px; cursor: pointer" />
          </a-badge>
          <!-- 用户信息 -->
          <a-dropdown>
            <div class="user-info">
              <a-avatar style="background-color: #00B96B; margin-right: 8px">
                {{ authStore.user?.name?.charAt(0) || '管' }}
              </a-avatar>
              <span>{{ authStore.user?.name || '管理员' }}</span>
              <span style="color: #999; margin-left: 4px; font-size: 12px">{{ authStore.user?.role === 'admin' ? '管理员' : '编辑' }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile">个人信息</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content style="margin: 24px; overflow: auto">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  MessageOutlined,
  TeamOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>(['dashboard'])
const openKeys = ref<string[]>(['articles', 'settings'])

const routeToMenuKey: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/articles': 'article-list',
  '/articles/create': 'article-create',
  '/users': 'users',
  '/feedback': 'feedback',
  '/settings/noise': 'noise-config',
  '/settings/domains': 'domain-manage',
  '/settings/regions': 'region-manage',
  '/settings/radar': 'radar-manage',
  '/settings/sources': 'source-manage',
  '/analytics': 'analytics',
}

const menuKeyToRoute: Record<string, string> = {
  'dashboard': '/dashboard',
  'article-list': '/articles',
  'article-create': '/articles/create',
  'users': '/users',
  'feedback': '/feedback',
  'noise-config': '/settings/noise',
  'domain-manage': '/settings/domains',
  'region-manage': '/settings/regions',
  'radar-manage': '/settings/radar',
  'source-manage': '/settings/sources',
  'analytics': '/analytics',
}

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表板',
  '/articles': '资讯列表',
  '/articles/create': '新增资讯',
  '/users': '用户管理',
  '/feedback': '用户反馈',
  '/settings/noise': '降噪配置',
  '/settings/domains': '领域管理',
  '/settings/regions': '地区管理',
  '/settings/radar': '雷达词管理',
  '/settings/sources': '数据来源配置',
  '/analytics': '数据统计',
}

const currentPageTitle = computed(() => pageTitles[route.path] || '管理后台')

watch(
  () => route.path,
  (path) => {
    const key = routeToMenuKey[path]
    if (key) selectedKeys.value = [key]
  },
  { immediate: true },
)

function handleMenuClick({ key }: { key: string }) {
  const path = menuKeyToRoute[key]
  if (path) router.push(path)
}

function handleSearch(value: string) {
  if (value) {
    router.push({ path: '/articles', query: { keyword: value } })
  }
}

async function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #2a2a2a;
  padding: 0 16px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background: #00B96B;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.collapse-btn {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  color: #666;
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s;
}
.collapse-btn:hover {
  color: #fff;
}
.header-left {
  display: flex;
  align-items: center;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}
.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f5f5f5;
}
</style>
