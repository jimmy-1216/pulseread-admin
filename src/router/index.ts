import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AdminLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/Dashboard.vue'),
          meta: { title: '仪表板' },
        },
        {
          path: 'articles',
          name: 'ArticleList',
          component: () => import('@/views/articles/ArticleList.vue'),
          meta: { title: '资讯列表' },
        },
        {
          path: 'articles/create',
          name: 'ArticleCreate',
          component: () => import('@/views/articles/ArticleForm.vue'),
          meta: { title: '新增资讯' },
        },
        {
          path: 'articles/edit/:id',
          name: 'ArticleEdit',
          component: () => import('@/views/articles/ArticleForm.vue'),
          meta: { title: '编辑资讯' },
        },
        {
          path: 'users',
          name: 'UserList',
          component: () => import('@/views/users/UserList.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'feedback',
          name: 'Feedback',
          component: () => import('@/views/feedback/FeedbackList.vue'),
          meta: { title: '用户反馈' },
        },
        {
          path: 'settings/noise',
          name: 'NoiseConfig',
          component: () => import('@/views/settings/NoiseConfig.vue'),
          meta: { title: '降噪配置' },
        },
        {
          path: 'settings/domains',
          name: 'DomainManage',
          component: () => import('@/views/settings/DomainManage.vue'),
          meta: { title: '领域管理' },
        },
        {
          path: 'settings/regions',
          name: 'RegionManage',
          component: () => import('@/views/settings/RegionManage.vue'),
          meta: { title: '地区管理' },
        },
        {
          path: 'settings/radar',
          name: 'RadarManage',
          component: () => import('@/views/settings/RadarManage.vue'),
          meta: { title: '雷达词管理' },
        },
        {
          path: 'settings/sources',
          name: 'SourceManage',
          component: () => import('@/views/settings/SourceManage.vue'),
          meta: { title: '数据来源配置' },
        },
        {
          path: 'analytics',
          name: 'Analytics',
          component: () => import('@/views/analytics/Analytics.vue'),
          meta: { title: '数据统计' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
