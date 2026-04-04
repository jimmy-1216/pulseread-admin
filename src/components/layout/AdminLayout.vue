<template>
  <a-layout class="admin-shell">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :width="220"
      class="admin-sider"
    >
      <div class="logo-area">
        <div class="logo-icon">微澜</div>
        <div v-if="!collapsed" class="logo-copy">
          <span class="logo-text">PulseRead</span>
          <span class="logo-subtitle">Admin Console</span>
        </div>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        theme="dark"
        mode="inline"
        class="admin-menu"
        @click="handleMenuClick"
        @openChange="handleOpenChange"
      >
        <template v-for="section in menuSections" :key="section.key">
          <a-menu-item-group v-if="section.kind === 'group'">
            <template #title>
              <span class="menu-group-title">{{ section.title }}</span>
            </template>
            <a-menu-item v-for="item in section.items" :key="item.key">
              <template #icon>
                <component :is="item.icon" />
              </template>
              <span class="menu-item-label">{{ item.label }}</span>
              <a-badge
                v-if="item.badgeCount"
                :count="item.badgeCount"
                :offset="[10, -2]"
                size="small"
              />
            </a-menu-item>
          </a-menu-item-group>

          <a-sub-menu v-else :key="section.key">
            <template #icon>
              <component :is="section.icon" />
            </template>
            <template #title>{{ section.title }}</template>
            <a-menu-item v-for="item in section.items" :key="item.key">
              {{ item.label }}
            </a-menu-item>
          </a-sub-menu>
        </template>
      </a-menu>

      <div class="sider-footer">
        <div class="collapse-btn" @click="collapsed = !collapsed">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
          <span v-if="!collapsed">收起导航</span>
        </div>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="admin-header">
        <div class="header-left">
          <div class="page-heading">
            <span class="page-title">{{ currentPageTitle }}</span>
            <a-breadcrumb class="page-breadcrumb">
              <a-breadcrumb-item v-for="crumb in breadcrumbs" :key="crumb.path || crumb.title">
                {{ crumb.title }}
              </a-breadcrumb-item>
            </a-breadcrumb>
          </div>
        </div>

        <div class="header-right">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索资讯标题、摘要或关键词..."
            allow-clear
            class="header-search"
            @search="handleSearch"
          />

          <a-badge :count="3" size="small" class="header-badge">
            <BellOutlined class="header-icon" />
          </a-badge>

          <a-dropdown>
            <div class="user-info">
              <a-avatar class="user-avatar">
                {{ authStore.user?.name?.charAt(0) || '管' }}
              </a-avatar>
              <div class="user-copy">
                <span class="user-name">{{ authStore.user?.name || '管理员' }}</span>
                <span class="user-role">{{ authStore.user?.role === 'admin' ? '管理员' : '编辑' }}</span>
              </div>
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

      <a-layout-content class="admin-content">
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="route-loading-shell">
                <a-spin size="large" tip="页面加载中..." />
              </div>
            </template>
          </Suspense>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import {
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'

interface MenuItemConfig {
  key: string
  label: string
  route: string
  title: string
  icon?: unknown
  badgeCount?: number
  parentKey?: string
}

interface MenuGroupSection {
  kind: 'group'
  key: string
  title: string
  items: MenuItemConfig[]
}

interface MenuSubMenuSection {
  kind: 'submenu'
  key: string
  title: string
  icon: unknown
  items: MenuItemConfig[]
}

type MenuSection = MenuGroupSection | MenuSubMenuSection

const UI_PREFERENCE_KEY = 'pulseread-admin-ui-preferences'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const menuSections: MenuSection[] = [
  {
    kind: 'group',
    key: 'main-group',
    title: '主要功能',
    items: [
      {
        key: 'dashboard',
        label: '仪表板',
        route: '/dashboard',
        title: '仪表板',
        icon: markRaw(DashboardOutlined),
      },
      {
        key: 'analytics',
        label: '数据统计',
        route: '/analytics',
        title: '数据统计',
        icon: markRaw(BarChartOutlined),
      },
    ],
  },
  {
    kind: 'submenu',
    key: 'articles',
    title: '资讯管理',
    icon: markRaw(FileTextOutlined),
    items: [
      {
        key: 'article-list',
        label: '资讯列表',
        route: '/articles',
        title: '资讯列表',
        parentKey: 'articles',
      },
      {
        key: 'article-create',
        label: '新增资讯',
        route: '/articles/create',
        title: '新增资讯',
        parentKey: 'articles',
      },
    ],
  },
  {
    kind: 'submenu',
    key: 'settings',
    title: '系统设置',
    icon: markRaw(SettingOutlined),
    items: [
      {
        key: 'noise-config',
        label: '降噪配置',
        route: '/settings/noise',
        title: '降噪配置',
        parentKey: 'settings',
      },
      {
        key: 'domain-manage',
        label: '领域管理',
        route: '/settings/domains',
        title: '领域管理',
        parentKey: 'settings',
      },
      {
        key: 'region-manage',
        label: '地区管理',
        route: '/settings/regions',
        title: '地区管理',
        parentKey: 'settings',
      },
      {
        key: 'radar-manage',
        label: '雷达词管理',
        route: '/settings/radar',
        title: '雷达词管理',
        parentKey: 'settings',
      },
      {
        key: 'source-manage',
        label: '数据来源配置',
        route: '/settings/sources',
        title: '数据来源配置',
        parentKey: 'settings',
      },
    ],
  },
  {
    kind: 'group',
    key: 'user-group',
    title: '用户运营',
    items: [
      {
        key: 'feedback',
        label: '用户反馈',
        route: '/feedback',
        title: '用户反馈',
        icon: markRaw(MessageOutlined),
        badgeCount: 12,
      },
      {
        key: 'users',
        label: '用户管理',
        route: '/users',
        title: '用户管理',
        icon: markRaw(TeamOutlined),
      },
    ],
  },
]

const menuItems = menuSections.flatMap((section) => section.items)
const routePathToMenuItem = new Map(menuItems.map((item) => [item.route, item]))
const menuKeyToRoute = new Map(menuItems.map((item) => [item.key, item.route]))

function loadUiPreferences() {
  if (typeof window === 'undefined') {
    return {
      collapsed: false,
      openKeys: ['articles', 'settings'],
    }
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(UI_PREFERENCE_KEY) || '{}') as {
      collapsed?: boolean
      openKeys?: string[]
    }

    return {
      collapsed: parsed.collapsed ?? false,
      openKeys: parsed.openKeys?.length ? parsed.openKeys : ['articles', 'settings'],
    }
  } catch {
    return {
      collapsed: false,
      openKeys: ['articles', 'settings'],
    }
  }
}

const uiPreferences = loadUiPreferences()
const collapsed = ref(uiPreferences.collapsed)
const openKeys = ref<string[]>(uiPreferences.openKeys)
const selectedKeys = ref<string[]>(['dashboard'])
const searchKeyword = ref(typeof route.query.keyword === 'string' ? route.query.keyword : '')

const currentMenuItem = computed(() => {
  if (route.path.startsWith('/articles/edit/')) {
    return {
      key: 'article-list',
      label: '编辑资讯',
      route: route.path,
      title: '编辑资讯',
      parentKey: 'articles',
    }
  }

  return routePathToMenuItem.get(route.path)
})

const currentPageTitle = computed(() => {
  return typeof route.meta.title === 'string'
    ? route.meta.title
    : currentMenuItem.value?.title || '管理后台'
})

const breadcrumbs = computed(() => {
  const matchedTitles = route.matched
    .filter((record) => typeof record.meta?.title === 'string')
    .map((record) => ({
      title: record.meta.title as string,
      path: record.path,
    }))

  if (matchedTitles.length > 0) {
    return matchedTitles
  }

  return [{ title: currentPageTitle.value, path: route.path }]
})

watch(
  () => route.fullPath,
  () => {
    searchKeyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : ''

    if (currentMenuItem.value?.key) {
      selectedKeys.value = [currentMenuItem.value.key]
    }

    const parentKey = currentMenuItem.value?.parentKey
    if (parentKey && !collapsed.value && !openKeys.value.includes(parentKey)) {
      openKeys.value = [...openKeys.value, parentKey]
    }
  },
  { immediate: true },
)

watch(
  [collapsed, openKeys],
  () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      UI_PREFERENCE_KEY,
      JSON.stringify({
        collapsed: collapsed.value,
        openKeys: openKeys.value,
      }),
    )
  },
  { deep: true },
)

watch(collapsed, (value) => {
  if (value) {
    openKeys.value = []
    return
  }

  const parentKey = currentMenuItem.value?.parentKey
  openKeys.value = parentKey ? [parentKey] : uiPreferences.openKeys
})

function handleOpenChange(keys: string[]) {
  openKeys.value = keys
}

function handleMenuClick({ key }: { key: string }) {
  const targetRoute = menuKeyToRoute.get(key)
  if (targetRoute && targetRoute !== route.path) {
    router.push(targetRoute)
  }
}

function handleSearch(value: string) {
  const keyword = value.trim()
  router.push({
    path: '/articles',
    query: keyword ? { keyword } : {},
  })
}

async function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  await router.push('/login')
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
}

.admin-sider {
  position: sticky;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #101418 0%, #141414 50%, #171d1b 100%) !important;
  box-shadow: 6px 0 18px rgba(10, 20, 18, 0.16);
}

.logo-area {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #19c37d 0%, #0aa868 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.logo-copy {
  display: flex;
  flex-direction: column;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  line-height: 1.2;
}

.admin-menu {
  flex: 1;
  padding: 12px 8px 0;
  background: transparent !important;
}

.menu-group-title {
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
  letter-spacing: 0.4px;
}

.menu-item-label {
  margin-right: 8px;
}

.sider-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 72px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(14px);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-right {
  gap: 16px;
}

.page-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #101828;
  line-height: 1.2;
}

.page-breadcrumb :deep(.ant-breadcrumb-link) {
  color: #667085;
}

.header-search {
  width: 300px;
}

.header-badge {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 18px;
  color: #475467;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-info:hover {
  background: rgba(15, 23, 42, 0.04);
}

.user-avatar {
  background: linear-gradient(135deg, #00b96b 0%, #08a36d 100%);
}

.user-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  color: #101828;
  font-weight: 600;
}

.user-role {
  color: #667085;
  font-size: 12px;
}

.admin-content {
  min-height: calc(100vh - 72px);
  padding: 24px;
  overflow: auto;
  background:
    radial-gradient(circle at top right, rgba(0, 185, 107, 0.08), transparent 240px),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%);
}

.route-loading-shell {
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

@media (max-width: 1200px) {
  .header-search {
    width: 220px;
  }
}

@media (max-width: 992px) {
  .admin-header {
    padding: 0 20px;
  }

  .admin-content {
    padding: 20px;
  }

  .user-copy {
    display: none;
  }
}
</style>
