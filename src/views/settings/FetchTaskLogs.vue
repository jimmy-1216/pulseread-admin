<template>
  <div class="fetch-log-page">
    <section class="page-header">
      <div>
        <h1>抓取任务日志</h1>
        <p>集中查看资讯抓取任务的执行状态、增量产出、异常原因与重试情况，便于定位来源配置和解析链路问题。</p>
      </div>
      <a-space>
        <a-button @click="reloadData">刷新日志</a-button>
        <a-button type="primary" @click="reloadSummary">刷新概览</a-button>
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

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="6">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索任务名、来源、操作人、错误信息"
            allow-clear
            @search="applyFilter"
            @change="applyFilter"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.sourceId" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部来源</a-select-option>
            <a-select-option v-for="source in sourceOptions" :key="source.id" :value="source.id">
              {{ source.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="3">
          <a-select v-model:value="filters.domain" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部领域</a-select-option>
            <a-select-option value="tech">科技</a-select-option>
            <a-select-option value="finance">财经</a-select-option>
            <a-select-option value="policy">政策</a-select-option>
            <a-select-option value="commerce">商情</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="3">
          <a-select v-model:value="filters.region" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.triggerType" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部触发方式</a-select-option>
            <a-select-option value="schedule">定时任务</a-select-option>
            <a-select-option value="manual">手动执行</a-select-option>
            <a-select-option value="retry">失败重试</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="2">
          <a-select v-model:value="filters.status" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="partial">部分成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
            <a-select-option value="running">执行中</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :xl="2" class="filter-actions">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="logs"
        :loading="loading"
        row-key="id"
        size="middle"
        :scroll="{ x: 1560 }"
        :pagination="paginationConfig"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'taskName'">
            <div class="task-main">
              <div class="task-main__title">
                <span class="task-name">{{ record.taskName }}</span>
                <a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
              </div>
              <div class="task-meta">来源：{{ record.sourceName }} · {{ record.sourceUrl }}</div>
              <div class="task-meta">操作人：{{ record.operator }} · 触发方式：{{ getTriggerLabel(record.triggerType) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'scope'">
            <div class="scope-cell">
              <a-tag :color="getDomainColor(record.domain)">{{ getDomainLabel(record.domain) }}</a-tag>
              <a-tag :color="getRegionColor(record.region)">{{ getRegionLabel(record.region) }}</a-tag>
              <div class="scope-detail">解析器：{{ getProtocolLabel(record.parserType) }}</div>
              <div class="scope-detail">去重：{{ getDedupLabel(record.dedupStrategy) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'result'">
            <div class="result-cell">
              <div><strong>{{ record.newCount }}</strong> 条新增 / {{ record.fetchedCount }} 条抓取</div>
              <div>重复 {{ record.duplicateCount }} · 过滤 {{ record.filteredCount }}</div>
              <div>错误 {{ record.errorCount }} · 成功率 {{ record.successRate }}%</div>
            </div>
          </template>

          <template v-else-if="column.key === 'timing'">
            <div class="timing-cell">
              <div>开始：{{ record.startTime }}</div>
              <div>结束：{{ record.endTime }}</div>
              <div>耗时：{{ formatDuration(record.durationMs) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
              <a-button
                v-if="record.status === 'failed' || record.status === 'partial'"
                type="link"
                size="small"
                @click="handleRetry(record.id)"
              >
                重试
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="detailVisible"
      title="抓取任务详情"
      width="760px"
      :footer="null"
    >
      <div v-if="currentLog" class="detail-panel">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="任务名称">{{ currentLog.taskName }}</a-descriptions-item>
          <a-descriptions-item label="执行状态">
            <a-tag :color="getStatusColor(currentLog.status)">{{ getStatusLabel(currentLog.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="来源站点">{{ currentLog.sourceName }}</a-descriptions-item>
          <a-descriptions-item label="来源地址">{{ currentLog.sourceUrl }}</a-descriptions-item>
          <a-descriptions-item label="触发方式">{{ getTriggerLabel(currentLog.triggerType) }}</a-descriptions-item>
          <a-descriptions-item label="操作人">{{ currentLog.operator }}</a-descriptions-item>
          <a-descriptions-item label="所属领域">{{ getDomainLabel(currentLog.domain) }}</a-descriptions-item>
          <a-descriptions-item label="所属地区">{{ getRegionLabel(currentLog.region) }}</a-descriptions-item>
          <a-descriptions-item label="解析器">{{ getProtocolLabel(currentLog.parserType) }}</a-descriptions-item>
          <a-descriptions-item label="去重策略">{{ getDedupLabel(currentLog.dedupStrategy) }}</a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ currentLog.startTime }}</a-descriptions-item>
          <a-descriptions-item label="结束时间">{{ currentLog.endTime }}</a-descriptions-item>
          <a-descriptions-item label="执行耗时">{{ formatDuration(currentLog.durationMs) }}</a-descriptions-item>
          <a-descriptions-item label="成功率">{{ currentLog.successRate }}%</a-descriptions-item>
          <a-descriptions-item label="抓取条数">{{ currentLog.fetchedCount }}</a-descriptions-item>
          <a-descriptions-item label="新增条数">{{ currentLog.newCount }}</a-descriptions-item>
          <a-descriptions-item label="重复条数">{{ currentLog.duplicateCount }}</a-descriptions-item>
          <a-descriptions-item label="过滤条数">{{ currentLog.filteredCount }}</a-descriptions-item>
          <a-descriptions-item label="错误条数">{{ currentLog.errorCount }}</a-descriptions-item>
        </a-descriptions>

        <a-alert
          v-if="currentLog.errorMessage"
          class="detail-error"
          type="warning"
          show-icon
          :message="currentLog.errorMessage"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { fetchTaskLogApi, sourceApi } from '@/api'
import type {
  ArticleDomain,
  ArticleRegion,
  FetchTaskLog,
  FetchTaskLogQuery,
  FetchTaskLogSummary,
  FetchTaskStatus,
  FetchTriggerType,
  Source,
  SourceProtocol,
  DedupStrategy,
} from '@/types'

const route = useRoute()
const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref<FetchTaskLog | null>(null)
const logs = ref<FetchTaskLog[]>([])
const sourceOptions = ref<Source[]>([])
const summary = ref<FetchTaskLogSummary>({
  totalRuns: 0,
  successRuns: 0,
  failedRuns: 0,
  runningRuns: 0,
  averageSuccessRate: 0,
  averageDurationMs: 0,
  totalNewCount: 0,
})

const filters = ref<Required<FetchTaskLogQuery>>({
  keyword: '',
  sourceId: 'all',
  domain: 'all',
  region: 'all',
  triggerType: 'all',
  status: 'all',
  page: 1,
  pageSize: 10,
})

const total = ref(0)

const columns = [
  { title: '任务信息', dataIndex: 'taskName', key: 'taskName', width: 360 },
  { title: '范围与策略', dataIndex: 'scope', key: 'scope', width: 220 },
  { title: '执行结果', dataIndex: 'result', key: 'result', width: 240 },
  { title: '执行时间', dataIndex: 'timing', key: 'timing', width: 250 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 120, fixed: 'right' as const },
]

const paginationConfig = computed(() => ({
  current: filters.value.page,
  pageSize: filters.value.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value: number) => `共 ${value} 条任务日志`,
}))

const summaryCards = computed(() => [
  {
    label: '任务总数',
    value: summary.value.totalRuns,
    color: '#1677FF',
    suffix: '次',
    description: '当前筛查周期内累计产生的抓取任务执行记录。',
  },
  {
    label: '成功 / 执行中',
    value: `${summary.value.successRuns} / ${summary.value.runningRuns}`,
    color: '#52C41A',
    suffix: '',
    description: '用于快速判断当前采集链路是否存在积压或长时间运行任务。',
  },
  {
    label: '失败任务',
    value: summary.value.failedRuns,
    color: '#FF4D4F',
    suffix: '次',
    description: '建议优先排查失败任务对应的来源站点、选择器和访问限制。',
  },
  {
    label: '平均成功率',
    value: summary.value.averageSuccessRate,
    color: '#722ED1',
    suffix: '%',
    description: `平均耗时 ${formatDuration(summary.value.averageDurationMs)}，累计新增 ${summary.value.totalNewCount} 条。`,
  },
])

function sanitizeFilters() {
  return {
    ...filters.value,
    keyword: filters.value.keyword.trim(),
  }
}

function applyRouteFilters() {
  const routeSourceId = route.query.sourceId
  if (typeof routeSourceId === 'string') {
    const parsed = Number(routeSourceId)
    filters.value.sourceId = Number.isNaN(parsed) ? 'all' : parsed
  }

  const routeStatus = route.query.status
  if (typeof routeStatus === 'string' && ['all', 'success', 'partial', 'failed', 'running'].includes(routeStatus)) {
    filters.value.status = routeStatus as Required<FetchTaskLogQuery>['status']
  }
}

async function loadSources() {
  sourceOptions.value = await sourceApi.getList()
}

async function loadSummary() {
  summary.value = await fetchTaskLogApi.getSummary()
}

async function loadLogs() {
  loading.value = true
  try {
    const response = await fetchTaskLogApi.getList(sanitizeFilters())
    logs.value = response.list
    total.value = response.total
  } finally {
    loading.value = false
  }
}

async function reloadSummary() {
  try {
    await loadSummary()
    message.success('概览统计已刷新')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '刷新概览失败')
  }
}

async function reloadData() {
  try {
    await Promise.all([loadSummary(), loadLogs(), loadSources()])
    message.success('抓取任务日志已刷新')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '刷新日志失败')
  }
}

async function applyFilter() {
  filters.value.page = 1
  await loadLogs()
}

async function resetFilters() {
  filters.value = {
    keyword: '',
    sourceId: 'all',
    domain: 'all',
    region: 'all',
    triggerType: 'all',
    status: 'all',
    page: 1,
    pageSize: 10,
  }
  await loadLogs()
}

function showDetail(record: FetchTaskLog) {
  currentLog.value = record
  detailVisible.value = true
}

async function handleRetry(id: number) {
  try {
    await fetchTaskLogApi.retry(id)
    message.success('已重新发起抓取任务')
    await Promise.all([loadSummary(), loadLogs()])
  } catch (error) {
    message.error(error instanceof Error ? error.message : '重试失败')
  }
}

async function handleTableChange(pagination: { current?: number; pageSize?: number }) {
  filters.value.page = pagination.current || 1
  filters.value.pageSize = pagination.pageSize || 10
  await loadLogs()
}

function formatDuration(durationMs: number) {
  if (!durationMs) {
    return '0s'
  }
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}分 ${seconds}秒` : `${seconds}秒`
}

function getStatusLabel(status: FetchTaskStatus) {
  return {
    success: '成功',
    partial: '部分成功',
    failed: '失败',
    running: '执行中',
  }[status]
}

function getStatusColor(status: FetchTaskStatus) {
  return {
    success: 'green',
    partial: 'gold',
    failed: 'red',
    running: 'blue',
  }[status]
}

function getTriggerLabel(triggerType: FetchTriggerType) {
  return {
    schedule: '定时任务',
    manual: '手动执行',
    retry: '失败重试',
  }[triggerType]
}

function getProtocolLabel(protocol: SourceProtocol) {
  return {
    rss: 'RSS',
    scrape: '页面抓取',
    api: 'API',
  }[protocol]
}

function getDedupLabel(strategy: DedupStrategy) {
  return {
    url: '按 URL 去重',
    title: '按标题去重',
    content_hash: '按正文指纹去重',
  }[strategy]
}

function getDomainLabel(domain: ArticleDomain) {
  return {
    tech: '科技',
    finance: '财经',
    policy: '政策',
    commerce: '商情',
  }[domain]
}

function getDomainColor(domain: ArticleDomain) {
  return {
    tech: 'blue',
    finance: 'gold',
    policy: 'green',
    commerce: 'purple',
  }[domain]
}

function getRegionLabel(region: ArticleRegion) {
  return {
    domestic: '国内',
    international: '国际',
  }[region]
}

function getRegionColor(region: ArticleRegion) {
  return {
    domestic: 'cyan',
    international: 'geekblue',
  }[region]
}

onMounted(async () => {
  applyRouteFilters()
  try {
    await Promise.all([loadSources(), loadSummary(), loadLogs()])
  } catch (error) {
    message.error(error instanceof Error ? error.message : '抓取任务日志加载失败')
  }
})
</script>

<style scoped>
.fetch-log-page {
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
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.page-header p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.stat-card,
.filter-card,
.table-card {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.stat-unit {
  font-size: 14px;
  color: #64748b;
}

.stat-desc {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.6;
  min-height: 44px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.task-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-main__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-name {
  font-weight: 700;
  color: #0f172a;
}

.task-meta,
.scope-detail,
.result-cell,
.timing-cell {
  color: #475569;
  line-height: 1.7;
}

.scope-cell,
.result-cell,
.timing-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.detail-error {
  border-radius: 14px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
