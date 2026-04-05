<template>
  <div class="source-health-page">
    <section class="page-header">
      <div>
        <h1>来源健康监控</h1>
        <p>聚合查看来源健康度、成功率、延迟表现与异常任务，帮助运营人员优先处理风险站点与采集链路问题。</p>
      </div>
      <a-space>
        <a-button @click="router.push('/settings/fetch-logs')">查看抓取日志</a-button>
        <a-button type="primary" :loading="loading" @click="reloadData">
          刷新监控
        </a-button>
      </a-space>
    </section>

    <a-row :gutter="16">
      <a-col v-for="card in summaryCards" :key="card.label" :xs="24" :sm="12" :xl="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            :title="card.label"
            :value="card.value"
            :value-style="{ color: card.color, fontSize: '24px', fontWeight: 700 }"
          >
            <template v-if="card.suffix" #suffix>
              <span class="stat-unit">{{ card.suffix }}</span>
            </template>
          </a-statistic>
          <p class="stat-desc">{{ card.description }}</p>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :xs="24" :xl="8">
        <a-card class="panel-card" :bordered="false" title="健康状态分布">
          <div class="health-overview">
            <div v-for="item in healthDistribution" :key="item.label" class="health-overview__item">
              <div class="health-overview__main">
                <div>
                  <strong>{{ item.label }}</strong>
                  <p>{{ item.description }}</p>
                </div>
                <a-tag :color="item.color">{{ item.count }} 个</a-tag>
              </div>
              <a-progress :percent="item.percent" :stroke-color="item.hexColor" :show-info="false" />
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="16">
        <a-card class="panel-card" :bordered="false" title="优先处理来源">
          <a-table
            :columns="focusColumns"
            :data-source="focusSources"
            row-key="id"
            size="middle"
            :pagination="false"
            :scroll="{ x: 960 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <div class="source-main">
                  <div class="source-main__title">
                    <span class="source-name">{{ record.name }}</span>
                    <a-tag :color="getDomainColor(record.domain)">{{ getDomainLabel(record.domain) }}</a-tag>
                    <a-tag :color="record.region === 'domestic' ? 'blue' : 'purple'">{{ record.region === 'domestic' ? '国内' : '国际' }}</a-tag>
                  </div>
                  <div class="source-sub">{{ record.url }}</div>
                </div>
              </template>

              <template v-else-if="column.key === 'health'">
                <div class="metric-stack">
                  <a-tag :color="getHealthColor(record.healthStatus)">{{ getHealthLabel(record.healthStatus) }}</a-tag>
                  <span>成功率 {{ record.successRate }}%</span>
                  <span>平均延迟 {{ record.avgLatency }} ms</span>
                </div>
              </template>

              <template v-else-if="column.key === 'risk'">
                <div class="metric-stack">
                  <strong class="risk-score">{{ getRiskScore(record) }}</strong>
                  <span>失败 {{ record.failCount }} 次</span>
                  <span>今日抓取 {{ record.todayCount }} 条</span>
                </div>
              </template>

              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="router.push('/settings/sources')">来源配置</a-button>
                  <a-button type="link" size="small" @click="goFetchLogs(record.id)">相关日志</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :xs="24" :xl="14">
        <a-card class="panel-card" :bordered="false" title="来源健康排行榜">
          <div class="ranking-list">
            <div v-for="(item, index) in rankedSources" :key="item.id" class="ranking-item">
              <div class="ranking-item__index">{{ index + 1 }}</div>
              <div class="ranking-item__main">
                <div class="ranking-item__title">
                  <span>{{ item.name }}</span>
                  <a-tag :color="getHealthColor(item.healthStatus)">{{ getHealthLabel(item.healthStatus) }}</a-tag>
                </div>
                <div class="ranking-item__meta">
                  <span>{{ getDomainLabel(item.domain) }}</span>
                  <span>成功率 {{ item.successRate }}%</span>
                  <span>延迟 {{ item.avgLatency }} ms</span>
                  <span>优先级 P{{ item.priority }}</span>
                </div>
              </div>
              <div class="ranking-item__score">
                <strong>{{ getHealthScore(item) }}</strong>
                <span>健康分</span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="10">
        <a-card class="panel-card" :bordered="false" title="最近异常任务">
          <div class="alert-list">
            <div v-for="item in abnormalLogs" :key="item.id" class="alert-item">
              <div class="alert-item__header">
                <strong>{{ item.taskName }}</strong>
                <a-tag :color="getStatusColor(item.status)">{{ getStatusLabel(item.status) }}</a-tag>
              </div>
              <div class="alert-item__meta">{{ item.sourceName }} · {{ item.startTime }}</div>
              <div class="alert-item__content">
                新增 {{ item.newCount }} / 抓取 {{ item.fetchedCount }} · 错误 {{ item.errorCount }} · 成功率 {{ item.successRate }}%
              </div>
              <div v-if="item.errorMessage" class="alert-item__error">{{ item.errorMessage }}</div>
            </div>
            <a-empty v-if="!abnormalLogs.length" description="最近没有异常任务" />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { fetchTaskLogApi, sourceApi } from '@/api'
import type { ArticleDomain, FetchTaskLog, FetchTaskStatus, Source, SourceHealthStatus } from '@/types'

const router = useRouter()
const loading = ref(false)
const sources = ref<Source[]>([])
const logs = ref<FetchTaskLog[]>([])

const domainColorMap: Record<ArticleDomain, string> = {
  tech: 'blue',
  finance: 'orange',
  policy: 'green',
  commerce: 'pink',
}

const domainLabelMap: Record<ArticleDomain, string> = {
  tech: '科技',
  finance: '财经',
  policy: '政策',
  commerce: '商情',
}

const healthConfigMap: Record<SourceHealthStatus, { label: string; color: string; hexColor: string; description: string }> = {
  healthy: { label: '正常', color: 'green', hexColor: '#52C41A', description: '采集链路稳定，建议维持当前策略。' },
  warning: { label: '预警', color: 'orange', hexColor: '#FA8C16', description: '存在延迟升高或成功率下降，需要关注。' },
  error: { label: '异常', color: 'red', hexColor: '#FF4D4F', description: '近期抓取失败较多，建议优先排查。' },
}

const statusConfigMap: Record<FetchTaskStatus, { label: string; color: string }> = {
  success: { label: '成功', color: 'green' },
  partial: { label: '部分成功', color: 'gold' },
  failed: { label: '失败', color: 'red' },
  running: { label: '执行中', color: 'blue' },
}

const summaryCards = computed(() => {
  const total = sources.value.length
  const healthyCount = sources.value.filter((item) => item.healthStatus === 'healthy').length
  const warningCount = sources.value.filter((item) => item.healthStatus === 'warning').length
  const errorCount = sources.value.filter((item) => item.healthStatus === 'error').length
  const avgSuccessRate = total ? Math.round(sources.value.reduce((sum, item) => sum + item.successRate, 0) / total) : 0
  const avgLatency = total ? Math.round(sources.value.reduce((sum, item) => sum + item.avgLatency, 0) / total) : 0
  const abnormalLogCount = logs.value.filter((item) => item.status === 'failed' || item.status === 'partial').length

  return [
    {
      label: '健康来源',
      value: healthyCount,
      suffix: '个',
      color: '#52C41A',
      description: `共 ${total} 个来源中，当前稳定运行的站点数量。`,
    },
    {
      label: '预警 / 异常来源',
      value: warningCount + errorCount,
      suffix: '个',
      color: '#FA8C16',
      description: '建议优先检查成功率偏低、延迟偏高或近期失败较多的来源。',
    },
    {
      label: '平均抓取成功率',
      value: avgSuccessRate,
      suffix: '%',
      color: '#1677FF',
      description: `${abnormalLogCount} 条异常日志已进入监控视图，可用于快速定位链路问题。`,
    },
    {
      label: '平均响应延迟',
      value: avgLatency,
      suffix: 'ms',
      color: '#722ED1',
      description: '持续观测来源接口或页面抓取响应耗时，避免调度堆积。',
    },
  ]
})

const healthDistribution = computed(() => {
  const total = sources.value.length || 1
  return (Object.keys(healthConfigMap) as SourceHealthStatus[]).map((key) => {
    const count = sources.value.filter((item) => item.healthStatus === key).length
    const config = healthConfigMap[key]
    return {
      label: config.label,
      color: config.color,
      hexColor: config.hexColor,
      description: config.description,
      count,
      percent: Math.round((count / total) * 100),
    }
  })
})

const focusSources = computed(() => {
  return [...sources.value]
    .sort((a, b) => getRiskScore(b) - getRiskScore(a))
    .slice(0, 5)
})

const rankedSources = computed(() => {
  return [...sources.value]
    .sort((a, b) => getHealthScore(b) - getHealthScore(a))
    .slice(0, 6)
})

const abnormalLogs = computed(() => {
  return [...logs.value]
    .filter((item) => item.status === 'failed' || item.status === 'partial')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 6)
})

const focusColumns = [
  { title: '来源站点', key: 'name', width: 320 },
  { title: '健康指标', key: 'health', width: 220 },
  { title: '风险评估', key: 'risk', width: 160 },
  { title: '操作', key: 'action', width: 160 },
]

async function loadData() {
  loading.value = true
  try {
    const [sourceList, logResult] = await Promise.all([
      sourceApi.getList(),
      fetchTaskLogApi.getList({ page: 1, pageSize: 200 }),
    ])
    sources.value = sourceList
    logs.value = logResult.list
  } catch (error) {
    console.error(error)
    message.error('来源健康监控加载失败')
  } finally {
    loading.value = false
  }
}

async function reloadData() {
  await loadData()
  message.success('监控数据已刷新')
}

function goFetchLogs(sourceId: number) {
  router.push(`/settings/fetch-logs?sourceId=${sourceId}`)
}

function getDomainColor(domain: ArticleDomain) {
  return domainColorMap[domain]
}

function getDomainLabel(domain: ArticleDomain) {
  return domainLabelMap[domain]
}

function getHealthLabel(status: SourceHealthStatus) {
  return healthConfigMap[status].label
}

function getHealthColor(status: SourceHealthStatus) {
  return healthConfigMap[status].color
}

function getStatusLabel(status: FetchTaskStatus) {
  return statusConfigMap[status].label
}

function getStatusColor(status: FetchTaskStatus) {
  return statusConfigMap[status].color
}

function getRiskScore(source: Source) {
  const healthPenalty = source.healthStatus === 'error' ? 35 : source.healthStatus === 'warning' ? 18 : 0
  const successPenalty = Math.max(0, 100 - source.successRate)
  const latencyPenalty = Math.min(25, Math.round(source.avgLatency / 120))
  const failPenalty = Math.min(20, source.failCount * 2)
  return healthPenalty + successPenalty + latencyPenalty + failPenalty
}

function getHealthScore(source: Source) {
  const risk = getRiskScore(source)
  return Math.max(0, 100 - risk + Math.min(10, source.priority))
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.source-health-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #141414;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  line-height: 1.6;
}

.stat-card,
.panel-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.stat-unit {
  margin-left: 4px;
  font-size: 14px;
  color: #999;
}

.stat-desc {
  margin: 12px 0 0;
  min-height: 44px;
  color: #8c8c8c;
  font-size: 13px;
  line-height: 1.6;
}

.health-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-overview__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.health-overview__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.health-overview__main strong {
  display: block;
  color: #141414;
}

.health-overview__main p {
  margin: 6px 0 0;
  color: #8c8c8c;
  line-height: 1.6;
  font-size: 13px;
}

.source-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-main__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.source-name {
  font-weight: 700;
  color: #141414;
}

.source-sub {
  font-size: 12px;
  color: #8c8c8c;
}

.metric-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #595959;
  font-size: 13px;
}

.risk-score {
  color: #fa541c;
  font-size: 18px;
  line-height: 1;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
}

.ranking-item__index {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #1677ff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ranking-item__main {
  flex: 1;
  min-width: 0;
}

.ranking-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-weight: 700;
  color: #141414;
}

.ranking-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #8c8c8c;
  font-size: 13px;
}

.ranking-item__score {
  min-width: 72px;
  text-align: right;
}

.ranking-item__score strong {
  display: block;
  color: #1677ff;
  font-size: 24px;
  line-height: 1;
}

.ranking-item__score span {
  font-size: 12px;
  color: #8c8c8c;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: #fffaf7;
  border: 1px solid #ffe7d1;
}

.alert-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alert-item__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.alert-item__content {
  margin-top: 8px;
  color: #595959;
  line-height: 1.6;
}

.alert-item__error {
  margin-top: 8px;
  color: #ff4d4f;
  line-height: 1.6;
}

:deep(.ant-card-body) {
  padding: 20px;
}

@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
  }

  .ranking-item,
  .alert-item__header,
  .health-overview__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .ranking-item__score {
    text-align: left;
  }
}
</style>
