<template>
  <a-config-provider :theme="antTheme" :locale="zhCN" component-size="middle">
    <router-view v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
        <template #fallback>
          <div class="app-fallback-shell">
            <a-spin size="large" tip="应用初始化中..." />
          </div>
        </template>
      </Suspense>
    </router-view>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { theme } from 'ant-design-vue'

const antTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#00B96B',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#1677FF',
    borderRadius: 10,
    wireframe: false,
    colorBgLayout: '#eef2f7',
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#eef2f6',
    boxShadowSecondary: '0 12px 30px rgba(15, 23, 42, 0.08)',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  components: {
    Layout: {
      headerBg: 'rgba(255,255,255,0.88)',
      bodyBg: '#eef2f7',
      siderBg: '#141414',
      triggerBg: '#141414',
    },
    Card: {
      borderRadiusLG: 18,
      headerHeight: 56,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#344054',
      borderColor: '#eef2f6',
    },
    Button: {
      borderRadius: 10,
      controlHeight: 38,
    },
    Input: {
      controlHeight: 40,
    },
    Select: {
      controlHeight: 40,
    },
  },
}
</script>

<style scoped>
.app-fallback-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(0, 185, 107, 0.14), transparent 240px),
    linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%);
}
</style>
