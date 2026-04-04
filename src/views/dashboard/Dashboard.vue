<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div>
        <p class="hero-kicker">PulseRead Admin</p>
        <h1 class="hero-title">内容运营总览</h1>
        <p class="hero-description">
          聚合查看资讯、用户、反馈与系统状态，帮助运营与编辑团队更快完成日常决策。
        </p>
      </div>
      <div class="hero-actions">
        <div class="hero-meta">
          <span>最后更新</span>
          <strong>{{ lastUpdateTime }}</strong>
        </div>
        <a-button type="primary" :loading="refreshing" @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
      </div>
    </section>

    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col v-for="item in summaryCards" :key="item.label" :xs="24" :sm="12" :xl="6">
        <a-card class="summary-card" :bordered="false">
          <div class="summary-card__inner">
            <div class="summary-card__icon" :style="{ background: item.iconBg, color: item.iconColor }">
              <component :is="item.icon" />
            </div>
            <div class="summary-card__content">
              <span class="summary-card__label">{{ item.label }}</span>
              <strong class="summary-card__value">{{ item.value }}</strong>
              <span class="summary-card__desc" :class="item.deltaClass">{{ item.description }}</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="chart-row">
      <a-col :xs="24" :xl="15">
        <a-card class="panel-card" :bordered="false">
          <template #title>资讯发布趋势</template>
          <template #extra>
            <a-radio-group v-model:value="trendRange" size="small" button-style="solid" @change="handleTrendRangeChange">
              <a-radio-button value="7days">7天</a-radio-button>
              <a-radio-button value="30days">30天</a-radio-button>
              <a-radio-button value="90days">90天</a-radio-button>
            </a-radio-group>
          </template>
          <div ref="trendChartRef" class="chart-box"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="9">
        <a-card class="panel-card" :bordered="false">
          <template #title>资讯分类分布</template>
          <template #extra>
            <span class="panel-hint">按当前资讯库存统计</span>
          </template>
          <div ref="pieChartRef" class="chart-box chart-box--pie"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :xl="15">
        <a-card class="panel-card" :bordered="false">
          <template #title>最近活动</template>
          <template #extra>
            <a-button type="link" @click="router.push('/feedback')">查看反馈</a-button>
          </template>
          <div class="activity-list">
            <div v-for="item in activities" :key="item.id" class="activity-item">
              <span class="activity-dot" :style="{ background: getActivityColor(item.status) }"></span>
              <div class="activity-main">
                <div class="activity-content">{{ item.content }}</div>
                <div class="activity-time">{{ item.timeAgo }}</div>
              </div>
              <a-tag :color="getActivityTagColor(item.status)">
                {{ getActivityStatusText(item.status) }}
              </a-tag>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="9">
        <a-card class="panel-card" :bordered="false" style="margin-bottom: 16px">
          <template #title>快捷操作</template>
          <div class="quick-grid">
            <button v-for="item in quickActions" :key="item.label" class="quick-action" type="button" @click="router.push(item.path)">
              <div class="quick-action__icon" :style="{ background: item.bg, color: item.color }">
                <component :is="item.icon" />
              </div>
              <div class="quick-action__text">
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </div>
            </button>
          </div>
        </a-card>

        <a-card class="panel-card" :bordered="false">
          <template #title>系统状态</template>
          <div class="status-list">
            <div v-for="item in systemStatus" :key="item.label" class="status-item">
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.description }}</p>
              </div>
              <a-badge :status="item.status" :text="item.text" />
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { dashboardApi } from '@/api'
import type { DashboardStats, DistributionItem, RecentActivity, TrendPoint } from '@/types'
import {
  ArrowUpOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

const trendRange = ref<'7days' | '30days' | '90days'>('7days')
const refreshing = ref(false)
const lastUpdateTime = ref(dayjs().format('YYYY-MM-DD HH:mm'))
const stats = ref<DashboardStats>({
  totalArticles: 0,
  totalArticlesDelta: 0,
  activeUsers: 0,
  activeUsersDelta: 0,
  pendingFeedbacks: 0,
  pendingFeedbacksDelta: 0,
  systemUptime: '0%',
})
const activities = ref<RecentActivity[]>([])
const trendData = ref<TrendPoint>({ dates: [], values: [] })
const distributionData = ref<DistributionItem[]>([])

const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const summaryCards = computed(() => [
  {
    label: '资讯总量',
    value: stats.value.totalArticles.toLocaleString(),
    description: `较昨日 +${stats.value.totalArticlesDelta}`,
    deltaClass: 'is-up',
    icon: FileTextOutlined,
    iconBg: '#e8f3ff',
    iconColor: '#1677ff',
  },
  {
    label: '活跃用户',
    value: stats.value.activeUsers.toLocaleString(),
    description: `较昨日 +${stats.value.activeUsersDelta}`,
    deltaClass: 'is-up',
    icon: TeamOutlined,
    iconBg: '#edf9ef',
    iconColor: '#52c41a',
  },
  {
    label: '待处理反馈',
    value: stats.value.pendingFeedbacks.toLocaleString(),
    description: `较昨日 +${stats.value.pendingFeedbacksDelta}`,
    deltaClass: 'is-warning',
    icon: MessageOutlined,
    iconBg: '#fff5e8',
    iconColor: '#fa8c16',
  },
  {
    label: '系统可用率',
    value: stats.value.systemUptime,
    description: '当前服务稳定运行',
    deltaClass: 'is-stable',
    icon: SafetyOutlined,
    iconBg: '#f5edff',
    iconColor: '#722ed1',
  },
])

const quickActions = [
  { label: '新增资讯', description: '快速创建新内容', path: '/articles/create', icon: PlusOutlined, bg: '#e8f3ff', color: '#1677ff' },
  { label: '处理反馈', description: '查看待办与回复', path: '/feedback', icon: MessageOutlined, bg: '#fff5e8', color: '#fa8c16' },
  { label: '用户管理', description: '查看活跃与套餐', path: '/users', icon: TeamOutlined, bg: '#edf9ef', color: '#52c41a' },
  { label: '降噪配置', description: '调整内容过滤策略', path: '/settings/noise', icon: SettingOutlined, bg: '#f5edff', color: '#722ed1' },
]

const systemStatus = computed(() => [
  { label: 'API 服务', description: '接口请求链路正常', status: 'success' as const, text: '正常' },
  { label: '数据库', description: '读写延迟处于低位', status: 'success' as const, text: '正常' },
  { label: '任务调度', description: '内容抓取按计划执行', status: 'processing' as const, text: '运行中' },
  { label: '告警通道', description: '存在少量高延迟告警', status: 'warning' as const, text: '关注中' },
])

async function fetchDashboardData() {
  const [statsResult, activityResult, trendResult, distributionResult] = await Promise.all([
    dashboardApi.getStats(),
    dashboardApi.getRecentActivities(),
    dashboardApi.getTrendData(trendRange.value),
    dashboardApi.getDomainDistribution(),
  ])

  stats.value = statsResult
  activities.value = activityResult
  trendData.value = trendResult
  distributionData.value = distributionResult
  lastUpdateTime.value = dayjs().format('YYYY-MM-DD HH:mm')
}

function buildTrendOption(data: TrendPoint): echarts.EChartsOption {
  return {
    grid: { top: 16, right: 16, bottom: 30, left: 40 },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>发布量：{c} 条' },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#8c8c8c', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#8c8c8c', fontSize: 12 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.values,
        lineStyle: { color: '#00b96b', width: 3 },
        itemStyle: { color: '#00b96b' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 185, 107, 0.22)' },
            { offset: 1, color: 'rgba(0, 185, 107, 0.02)' },
          ]),
        },
      },
    ],
  }
}

function buildPieOption(data: DistributionItem[]): echarts.EChartsOption {
  const colorMap: Record<string, string> = {
    科技: '#1677ff',
    财经: '#fa8c16',
    政策: '#52c41a',
    商情: '#eb2f96',
  }

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0,
      icon: 'circle',
      textStyle: { color: '#666', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '42%'],
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
        data: data.map((item) => ({
          ...item,
          itemStyle: { color: colorMap[item.name] || '#1677ff' },
        })),
      },
    ],
  }
}

function renderCharts() {
  if (trendChartRef.value) {
    trendChart = trendChart || echarts.init(trendChartRef.value)
    trendChart.setOption(buildTrendOption(trendData.value))
  }

  if (pieChartRef.value) {
    pieChart = pieChart || echarts.init(pieChartRef.value)
    pieChart.setOption(buildPieOption(distributionData.value))
  }
}

async function refreshData() {
  refreshing.value = true
  try {
    await fetchDashboardData()
    await nextTick()
    renderCharts()
  } finally {
    refreshing.value = false
  }
}

async function handleTrendRangeChange() {
  trendData.value = await dashboardApi.getTrendData(trendRange.value)
  renderCharts()
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

function getActivityColor(status: RecentActivity['status']) {
  const map = {
    success: '#52c41a',
    pending: '#1677ff',
    warning: '#faad14',
    error: '#ff4d4f',
  }
  return map[status]
}

function getActivityTagColor(status: RecentActivity['status']) {
  const map = {
    success: 'success',
    pending: 'processing',
    warning: 'warning',
    error: 'error',
  }
  return map[status]
}

function getActivityStatusText(status: RecentActivity['status']) {
  const map = {
    success: '成功',
    pending: '处理中',
    warning: '预警',
    error: '异常',
  }
  return map[status]
}

onMounted(async () => {
  await refreshData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
  trendChart = null
  pieChart = null
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1f3a2d 60%, #0f766e 100%);
  color: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.68);
}

.hero-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-description {
  max-width: 640px;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.84);
}

.hero-meta strong {
  font-size: 14px;
  color: #fff;
}

.stats-row,
.chart-row {
  margin: 0;
}

.summary-card,
.panel-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.summary-card__inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  font-size: 22px;
}

.summary-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.summary-card__label {
  color: #8c8c8c;
  font-size: 13px;
}

.summary-card__value {
  color: #141414;
  font-size: 26px;
  line-height: 1.1;
}

.summary-card__desc {
  font-size: 12px;
  font-weight: 500;
}

.summary-card__desc.is-up {
  color: #16a34a;
}

.summary-card__desc.is-warning {
  color: #d97706;
}

.summary-card__desc.is-stable {
  color: #1677ff;
}

.panel-hint {
  color: #8c8c8c;
  font-size: 12px;
}

.chart-box {
  width: 100%;
  height: 280px;
}

.chart-box--pie {
  height: 280px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.activity-main {
  flex: 1;
  min-width: 0;
}

.activity-content {
  color: #141414;
  font-weight: 500;
}

.activity-time {
  margin-top: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-action {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action:hover {
  transform: translateY(-2px);
  border-color: #d9f7e8;
  box-shadow: 0 12px 24px rgba(0, 185, 107, 0.08);
}

.quick-action__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  font-size: 18px;
}

.quick-action__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-action__text strong {
  color: #141414;
  font-size: 14px;
}

.quick-action__text span {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.5;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fafafa;
}

.status-item strong {
  display: block;
  margin-bottom: 4px;
  color: #141414;
}

.status-item p {
  margin: 0;
  color: #8c8c8c;
  font-size: 12px;
}

:deep(.ant-card-head) {
  border-bottom: none;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
}

@media (max-width: 992px) {
  .dashboard-hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
