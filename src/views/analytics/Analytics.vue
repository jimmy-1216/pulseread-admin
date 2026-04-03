<template>
  <div class="analytics-page">
    <!-- 顶部概览卡片 -->
    <a-row :gutter="16" style="margin-bottom: 24px">
      <a-col :span="6" v-for="stat in overviewStats" :key="stat.label">
        <a-card size="small" hoverable>
          <a-statistic
            :title="stat.label"
            :value="stat.value"
            :value-style="{ color: stat.color, fontSize: '28px', fontWeight: 700 }"
          >
            <template #prefix>
              <span style="font-size: 20px; margin-right: 4px">{{ stat.icon }}</span>
            </template>
            <template #suffix>
              <span style="font-size: 14px; color: #999">{{ stat.unit }}</span>
            </template>
          </a-statistic>
          <div style="margin-top: 8px; font-size: 12px">
            <span :style="{ color: stat.delta >= 0 ? '#52C41A' : '#FF4D4F' }">
              {{ stat.delta >= 0 ? '↑' : '↓' }} {{ Math.abs(stat.delta) }}%
            </span>
            <span style="color: #999; margin-left: 4px">较上周</span>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-bottom: 24px">
      <!-- 资讯发布趋势 -->
      <a-col :span="16">
        <a-card title="资讯发布趋势" size="small">
          <template #extra>
            <a-radio-group v-model:value="trendRange" size="small" @change="updateTrendChart">
              <a-radio-button value="7days">近 7 天</a-radio-button>
              <a-radio-button value="30days">近 30 天</a-radio-button>
              <a-radio-button value="90days">近 90 天</a-radio-button>
            </a-radio-group>
          </template>
          <div ref="trendChartRef" style="height: 320px"></div>
        </a-card>
      </a-col>

      <!-- 领域分布 -->
      <a-col :span="8">
        <a-card title="领域分布" size="small">
          <div ref="domainChartRef" style="height: 320px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-bottom: 24px">
      <!-- 用户增长趋势 -->
      <a-col :span="12">
        <a-card title="用户增长趋势" size="small">
          <div ref="userGrowthRef" style="height: 280px"></div>
        </a-card>
      </a-col>

      <!-- 用户套餐分布 -->
      <a-col :span="12">
        <a-card title="用户套餐分布" size="small">
          <div ref="planChartRef" style="height: 280px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <!-- 热门资讯 TOP 10 -->
      <a-col :span="12">
        <a-card title="热门资讯 TOP 10" size="small">
          <a-table
            :columns="hotArticleColumns"
            :data-source="hotArticles"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'rank'">
                <a-tag :color="index < 3 ? 'red' : 'default'" style="min-width: 28px; text-align: center">
                  {{ index + 1 }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'domain'">
                <a-tag :color="domainColorMap[record.domain]" size="small">{{ domainLabelMap[record.domain] }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 降噪档位分布 -->
      <a-col :span="12">
        <a-card title="用户降噪档位分布" size="small">
          <div ref="noiseChartRef" style="height: 280px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { dashboardApi, articleApi, userApi } from '@/api'
import * as echarts from 'echarts'

const trendRange = ref<'7days' | '30days' | '90days'>('7days')

const trendChartRef = ref<HTMLElement>()
const domainChartRef = ref<HTMLElement>()
const userGrowthRef = ref<HTMLElement>()
const planChartRef = ref<HTMLElement>()
const noiseChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let domainChart: echarts.ECharts | null = null
let userGrowthChart: echarts.ECharts | null = null
let planChart: echarts.ECharts | null = null
let noiseChart: echarts.ECharts | null = null

const domainColorMap: Record<string, string> = { tech: 'blue', finance: 'orange', policy: 'green', commerce: 'pink' }
const domainLabelMap: Record<string, string> = { tech: '科技', finance: '财经', policy: '政策', commerce: '商情' }

const overviewStats = ref([
  { label: '资讯总量', value: 0, unit: '篇', icon: '📰', color: '#1677FF', delta: 12.5 },
  { label: '活跃用户', value: 0, unit: '人', icon: '👥', color: '#52C41A', delta: 8.3 },
  { label: '今日抓取', value: 0, unit: '条', icon: '🔄', color: '#FA8C16', delta: 15.2 },
  { label: '待处理反馈', value: 0, unit: '条', icon: '💬', color: '#EB2F96', delta: -5.1 },
])

const hotArticles = ref<any[]>([])
const hotArticleColumns = [
  { title: '#', key: 'rank', width: 50 },
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '领域', key: 'domain', width: 80 },
  { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 80, sorter: (a: any, b: any) => a.viewCount - b.viewCount },
  { title: 'AI评分', dataIndex: 'aiScore', key: 'aiScore', width: 80 },
]

onMounted(async () => {
  // 加载统计数据
  const [stats, articles] = await Promise.all([
    dashboardApi.getStats(),
    articleApi.getList({ pageSize: 100 }),
  ])

  overviewStats.value[0].value = stats.totalArticles
  overviewStats.value[1].value = stats.activeUsers
  overviewStats.value[2].value = 264 // mock today crawl
  overviewStats.value[3].value = stats.pendingFeedbacks

  // 热门资讯
  hotArticles.value = [...articles.list]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10)

  await nextTick()
  initTrendChart()
  initDomainChart()
  initUserGrowthChart()
  initPlanChart()
  initNoiseChart()
})

async function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const data = await dashboardApi.getTrendData(trendRange.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'line',
      data: data.values,
      smooth: true,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
        { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
      ])},
      lineStyle: { color: '#1677FF', width: 2 },
      itemStyle: { color: '#1677FF' },
    }],
  })
}

async function updateTrendChart() {
  if (!trendChart) return
  const data = await dashboardApi.getTrendData(trendRange.value)
  trendChart.setOption({
    xAxis: { data: data.dates },
    series: [{ data: data.values }],
  })
}

async function initDomainChart() {
  if (!domainChartRef.value) return
  domainChart = echarts.init(domainChartRef.value)
  const dist = await dashboardApi.getDomainDistribution()
  domainChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: dist.map((d: any) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      label: { fontSize: 12 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  })
}

function initUserGrowthChart() {
  if (!userGrowthRef.value) return
  userGrowthChart = echarts.init(userGrowthRef.value)
  // Mock 用户增长数据
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-03-02')
    d.setDate(d.getDate() + i)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const values = dates.map((_, i) => Math.floor(5000 + i * 25 + Math.random() * 50))
  userGrowthChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#52C41A' },
        { offset: 1, color: '#95DE64' },
      ]), borderRadius: [4, 4, 0, 0] },
      barWidth: '60%',
    }],
  })
}

function initPlanChart() {
  if (!planChartRef.value) return
  planChart = echarts.init(planChartRef.value)
  planChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['50%', '50%'],
      data: [
        { name: '免费版', value: 3200, itemStyle: { color: '#8C8C8C' } },
        { name: 'Pro', value: 1800, itemStyle: { color: '#FA8C16' } },
        { name: '企业版', value: 678, itemStyle: { color: '#722ED1' } },
      ],
      label: { fontSize: 12, formatter: '{b}\n{c}人 ({d}%)' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  })
}

function initNoiseChart() {
  if (!noiseChartRef.value) return
  noiseChart = echarts.init(noiseChartRef.value)
  noiseChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 40, top: 20, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: ['行业地震', '重大事件', '核心聚焦', '视野全开'],
      axisLabel: { fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: [
        { value: 320, itemStyle: { color: '#FF4D4F' } },
        { value: 890, itemStyle: { color: '#FA8C16' } },
        { value: 2100, itemStyle: { color: '#1677FF' } },
        { value: 1368, itemStyle: { color: '#52C41A' } },
      ],
      barWidth: 24,
      label: { show: true, position: 'right', fontSize: 12, color: '#666' },
    }],
  })
}
</script>

<style scoped>
.analytics-page {
  padding: 0;
}
</style>
