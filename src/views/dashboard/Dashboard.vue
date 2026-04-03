<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">仪表板</h1>
        <p class="page-desc">欢迎回来，管理员。以下是今日系统概述。</p>
      </div>
      <div class="header-actions">
        <span class="last-update">最后更新: {{ lastUpdateTime }}</span>
        <a-button @click="refreshData" :loading="refreshing">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6F4FF; color: #1677FF">
              <FileTextOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">总资讯数</div>
              <div class="stat-value">{{ stats.totalArticles.toLocaleString() }}</div>
              <div class="stat-delta positive">
                <ArrowUpOutlined /> 较昨日 +{{ stats.totalArticlesDelta }}
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F6FFED; color: #52C41A">
              <TeamOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">活跃用户</div>
              <div class="stat-value">{{ stats.activeUsers.toLocaleString() }}</div>
              <div class="stat-delta positive">
                <ArrowUpOutlined /> 较昨日 +{{ stats.activeUsersDelta }}
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #FFF7E6; color: #FA8C16">
              <MessageOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">待处理反馈</div>
              <div class="stat-value">{{ stats.pendingFeedbacks }}</div>
              <div class="stat-delta warning">
                <ArrowUpOutlined /> 较昨日 +{{ stats.pendingFeedbacksDelta }}
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F9F0FF; color: #722ED1">
              <SafetyOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">系统可用率</div>
              <div class="stat-value">{{ stats.systemUptime }}</div>
              <div class="stat-delta positive">本月稳定运行</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
      <!-- 资讯发布趋势 -->
      <a-col :span="14">
        <a-card title="资讯发布趋势" :body-style="{ padding: '16px' }">
          <template #extra>
            <span style="color: #999; font-size: 12px; margin-right: 12px">近 {{ trendRange === '7days' ? 7 : trendRange === '30days' ? 30 : 90 }} 天每日发布量</span>
            <a-radio-group v-model:value="trendRange" size="small" button-style="solid" @change="loadTrendData">
              <a-radio-button value="7days">7天</a-radio-button>
              <a-radio-button value="30days">30天</a-radio-button>
              <a-radio-button value="90days">90天</a-radio-button>
            </a-radio-group>
          </template>
          <div ref="trendChartRef" style="height: 200px"></div>
        </a-card>
      </a-col>

      <!-- 分类分布 -->
      <a-col :span="10">
        <a-card title="分类分布" :body-style="{ padding: '16px' }">
          <template #extra>
            <span style="color: #999; font-size: 12px">资讯分类占比</span>
          </template>
          <div ref="pieChartRef" style="height: 200px"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近活动 + 快捷操作 + 系统状态 -->
    <a-row :gutter="[16, 16]">
      <!-- 最近活动 -->
      <a-col :span="14">
        <a-card title="最近活动">
          <template #extra>
            <a-button type="link" size="small" @click="$router.push('/feedback')">查看全部</a-button>
          </template>
          <a-list :data-source="activities" :split="false">
            <template #renderItem="{ item }">
              <a-list-item style="padding: 8px 0">
                <div class="activity-item">
                  <span
                    class="activity-dot"
                    :style="{ background: getActivityColor(item.status) }"
                  ></span>
                  <span class="activity-content">{{ item.content }}</span>
                  <span class="activity-time">{{ item.timeAgo }}</span>
                  <a-tag
                    :color="getActivityTagColor(item.status)"
                    style="margin-left: 8px"
                  >
                    {{ getActivityStatusText(item.status) }}
                  </a-tag>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 快捷操作 + 系统状态 -->
      <a-col :span="10">
        <a-card title="快捷操作" style="margin-bottom: 16px">
          <a-row :gutter="[12, 12]">
            <a-col :span="12">
              <div class="quick-btn" @click="$router.push('/articles/create')">
                <PlusOutlined style="font-size: 20px; color: #1677FF" />
                <span>新增资讯</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="quick-btn" @click="$router.push('/feedback')">
                <MessageOutlined style="font-size: 20px; color: #FA8C16" />
                <span>处理反馈</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="quick-btn" @click="$router.push('/users')">
                <TeamOutlined style="font-size: 20px; color: #52C41A" />
                <span>用户管理</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="quick-btn" @click="$router.push('/settings/noise')">
                <SettingOutlined style="font-size: 20px; color: #722ED1" />
                <span>降噪配置</span>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <!-- 系统状态 -->
        <a-card title="系统状态">
          <div class="system-status-list">
            <div class="status-item">
              <span class="status-name">API 服务</span>
              <span class="status-badge success">正常</span>
            </div>
            <div class="status-item">
              <span class="status-name">数据库</span>
              <span class="status-badge success">正常</span>
            </div>
            <div class="status-item">
              <span class="status-name">AI 服务</span>
              <span class="status-badge success">正常</span>
            </div>
            <div class="status-item">
              <span class="status-name">CDN 节点</span>
              <span class="status-badge warning">延迟偏高</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { dashboardApi } from '@/api'
import type { DashboardStats, RecentActivity } from '@/types'
import { MOCK_DASHBOARD_STATS, MOCK_RECENT_ACTIVITIES } from '@/utils/mockData'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  ReloadOutlined, FileTextOutlined, TeamOutlined, MessageOutlined,
  SafetyOutlined, ArrowUpOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons-vue'

const stats = ref<DashboardStats>(MOCK_DASHBOARD_STATS)
const activities = ref<RecentActivity[]>(MOCK_RECENT_ACTIVITIES)
const trendRange = ref<'7days' | '30days' | '90days'>('7days')
const refreshing = ref(false)
const lastUpdateTime = ref(dayjs().format('HH:mm'))

const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

async function loadTrendData() {
  const data = await dashboardApi.getTrendData(trendRange.value)
  if (trendChart) {
    trendChart.setOption({
      xAxis: { data: data.dates },
      series: [{ data: data.values }],
    })
  }
}

async function refreshData() {
  refreshing.value = true
  try {
    stats.value = await dashboardApi.getStats()
    activities.value = await dashboardApi.getRecentActivities()
    await loadTrendData()
    lastUpdateTime.value = dayjs().format('HH:mm')
  } finally {
    refreshing.value = false
  }
}

function initTrendChart(data: { dates: string[]; values: number[] }) {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    grid: { top: 10, right: 10, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
      axisLabel: { color: '#999', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#999', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: data.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#00B96B', width: 2 },
        itemStyle: { color: '#00B96B' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 185, 107, 0.2)' },
            { offset: 1, color: 'rgba(0, 185, 107, 0.02)' },
          ]),
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 条',
    },
  })
}

function initPieChart(data: { name: string; value: number; color: string }[]) {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: '#666' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
        label: { show: false },
        emphasis: { label: { show: false } },
      },
    ],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)',
    },
  })
}

function getActivityColor(status: string) {
  const map: Record<string, string> = {
    success: '#52C41A',
    pending: '#FA8C16',
    warning: '#FAAD14',
    error: '#FF4D4F',
  }
  return map[status] || '#999'
}

function getActivityTagColor(status: string) {
  const map: Record<string, string> = {
    success: 'success',
    pending: 'warning',
    warning: 'orange',
    error: 'error',
  }
  return map[status] || 'default'
}

function getActivityStatusText(status: string) {
  const map: Record<string, string> = {
    success: '成功',
    pending: '待处理',
    warning: '警告',
    error: '错误',
  }
  return map[status] || status
}

onMounted(async () => {
  const [trendData, domainData] = await Promise.all([
    dashboardApi.getTrendData('7days'),
    dashboardApi.getDomainDistribution(),
  ])
  await nextTick()
  initTrendChart(trendData)
  initPieChart(domainData)
})
</script>

<style scoped>
.dashboard { padding: 0; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}
.page-desc { color: #999; font-size: 13px; }
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.last-update { color: #999; font-size: 12px; }
.stat-card { border-radius: 8px; }
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.stat-label { color: #999; font-size: 13px; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1; margin-bottom: 4px; }
.stat-delta { font-size: 12px; }
.stat-delta.positive { color: #52C41A; }
.stat-delta.warning { color: #FA8C16; }
.activity-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.activity-content {
  flex: 1;
  font-size: 13px;
  color: #333;
}
.activity-time {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}
.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #666;
}
.quick-btn:hover {
  border-color: #00B96B;
  background: #f6ffed;
  color: #00B96B;
}
.system-status-list { display: flex; flex-direction: column; gap: 12px; }
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-name { color: #666; font-size: 13px; }
.status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-badge.success { background: #f6ffed; color: #52C41A; }
.status-badge.warning { background: #fff7e6; color: #FA8C16; }
</style>
