<template>
  <div class="source-page">
    <section class="page-header">
      <div>
        <h1>资讯来源配置</h1>
        <p>统一管理资讯抓取网站、抓取协议、优先级、去重策略与运行健康度，便于后续扩展更多采集来源。</p>
      </div>
      <a-space>
        <a-button @click="router.push('/settings/source-health')">健康监控</a-button>
        <a-button @click="reloadSources">刷新数据</a-button>
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增来源
        </a-button>
      </a-space>
    </section>

    <a-row :gutter="16">
      <a-col v-for="stat in stats" :key="stat.label" :xs="24" :sm="12" :xl="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            :title="stat.label"
            :value="stat.value"
            :value-style="{ color: stat.color, fontSize: '24px', fontWeight: 700 }"
          >
            <template #suffix>
              <span class="stat-unit">{{ stat.unit }}</span>
            </template>
          </a-statistic>
          <p class="stat-desc">{{ stat.description }}</p>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="6">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索名称、域名、标签"
            allow-clear
            @search="applyFilter"
            @change="applyFilter"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :xl="3">
          <a-select v-model:value="filters.region" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
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
          <a-select v-model:value="filters.status" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="3">
          <a-select v-model:value="filters.healthStatus" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部健康状态</a-select-option>
            <a-select-option value="healthy">正常</a-select-option>
            <a-select-option value="warning">预警</a-select-option>
            <a-select-option value="error">异常</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="3">
          <a-select v-model:value="filters.sourceType" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部抓取方式</a-select-option>
            <a-select-option value="rss">RSS</a-select-option>
            <a-select-option value="scrape">页面抓取</a-select-option>
            <a-select-option value="api">API</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :xl="3" class="filter-actions">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="filteredSources"
        row-key="id"
        size="middle"
        :scroll="{ x: 1320 }"
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 个来源` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="source-main">
              <div class="source-main__title">
                <span class="source-name">{{ record.name }}</span>
                <a-tag :color="getRegionColor(record.region)">{{ getRegionLabel(record.region) }}</a-tag>
                <a-tag :color="getDomainColor(record.domain)">{{ getDomainLabel(record.domain) }}</a-tag>
              </div>
              <div class="source-url">
                <a :href="record.url" target="_blank" rel="noreferrer">{{ record.url }}</a>
              </div>
              <div class="source-tags">
                <a-tag v-for="tag in record.categoryTags" :key="tag">{{ tag }}</a-tag>
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'strategy'">
            <div class="config-stack">
              <div>抓取方式：{{ getProtocolLabel(record.sourceType) }}</div>
              <div>解析器：{{ getProtocolLabel(record.parserType) }}</div>
              <div>去重策略：{{ getDedupLabel(record.dedupStrategy) }}</div>
              <div>抓取频率：{{ getIntervalLabel(record.fetchInterval) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'priority'">
            <div class="priority-cell">
              <a-progress :percent="record.priority * 10" size="small" :show-info="false" />
              <span class="priority-value">P{{ record.priority }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'health'">
            <div class="health-cell">
              <a-tag :color="getHealthColor(record.healthStatus)">{{ getHealthLabel(record.healthStatus) }}</a-tag>
              <div class="health-meta">成功率 {{ record.successRate }}%</div>
              <div class="health-meta">延迟 {{ record.avgLatency }}ms</div>
              <div class="health-meta">最近成功 {{ record.lastSuccessTime }}</div>
              <div v-if="record.lastError" class="health-error">{{ record.lastError }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'output'">
            <div class="output-cell">
              <div><strong>{{ record.todayCount }}</strong> 条 / 今日</div>
              <div>失败 {{ record.failCount }} 次</div>
              <div>{{ getLanguageLabel(record.language) }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(value: boolean) => handleToggle(record.id, value)"
            />
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleTestFetch(record)">测试</a-button>
              <a-popconfirm title="确定删除该来源配置？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑资讯来源' : '新增资讯来源'"
      width="820px"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSubmit"
    >
      <a-form :model="form" layout="vertical" style="margin-top: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="来源名称" required>
              <a-input v-model:value="form.name" placeholder="如 TechCrunch、36氪" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源网址" required>
              <a-input v-model:value="form.url" placeholder="https://example.com" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="所属地区" required>
              <a-select v-model:value="form.region">
                <a-select-option value="domestic">国内</a-select-option>
                <a-select-option value="international">国际</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属领域" required>
              <a-select v-model:value="form.domain">
                <a-select-option value="tech">科技</a-select-option>
                <a-select-option value="finance">财经</a-select-option>
                <a-select-option value="policy">政策</a-select-option>
                <a-select-option value="commerce">商情</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="语言">
              <a-select v-model:value="form.language">
                <a-select-option value="zh">中文</a-select-option>
                <a-select-option value="en">英文</a-select-option>
                <a-select-option value="multi">多语言</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="抓取方式">
              <a-select v-model:value="form.sourceType">
                <a-select-option value="rss">RSS</a-select-option>
                <a-select-option value="scrape">页面抓取</a-select-option>
                <a-select-option value="api">API</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="解析器类型">
              <a-select v-model:value="form.parserType">
                <a-select-option value="rss">RSS</a-select-option>
                <a-select-option value="scrape">页面解析</a-select-option>
                <a-select-option value="api">API 解析</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="去重策略">
              <a-select v-model:value="form.dedupStrategy">
                <a-select-option value="url">按 URL 去重</a-select-option>
                <a-select-option value="title">按标题去重</a-select-option>
                <a-select-option value="content_hash">按正文指纹去重</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="抓取频率">
              <a-select v-model:value="form.fetchInterval">
                <a-select-option value="15min">每 15 分钟</a-select-option>
                <a-select-option value="30min">每 30 分钟</a-select-option>
                <a-select-option value="1h">每小时</a-select-option>
                <a-select-option value="2h">每 2 小时</a-select-option>
                <a-select-option value="6h">每 6 小时</a-select-option>
                <a-select-option value="12h">每 12 小时</a-select-option>
                <a-select-option value="24h">每天</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="优先级">
              <a-input-number v-model:value="form.priority" :min="1" :max="10" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-select v-model:value="form.status">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="RSS / API 地址">
              <a-input v-model:value="form.rssUrl" placeholder="可填写 RSS 或 API 接口地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分类标签">
              <a-input
                v-model:value="tagInput"
                placeholder="多个标签请用英文逗号分隔，如 AI, 芯片, 创投"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="可信度评分（0-100）">
              <a-slider
                v-model:value="form.credibility"
                :min="0"
                :max="100"
                :marks="{ 0: '0', 50: '50', 100: '100' }"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="健康状态">
              <a-select v-model:value="form.healthStatus">
                <a-select-option value="healthy">正常</a-select-option>
                <a-select-option value="warning">预警</a-select-option>
                <a-select-option value="error">异常</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="今日抓取量">
              <a-input-number v-model:value="form.todayCount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="成功率（%）">
              <a-input-number v-model:value="form.successRate" :min="0" :max="100" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="平均延迟（ms）">
              <a-input-number v-model:value="form.avgLatency" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="最近抓取时间">
              <a-input v-model:value="form.lastFetchTime" placeholder="2026-04-05 10:00" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最近成功时间">
              <a-input v-model:value="form.lastSuccessTime" placeholder="2026-04-05 09:58" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="失败次数">
              <a-input-number v-model:value="form.failCount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最近错误信息">
              <a-input v-model:value="form.lastError" placeholder="可选，记录最近一次抓取异常" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="3" placeholder="来源说明、解析规则备注、限流信息等" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="testModalVisible" title="抓取测试结果" width="680px" :footer="null">
      <div v-if="testLoading" class="test-loading">
        <a-spin size="large" />
        <div class="test-loading__text">正在测试 {{ testingSource?.name }} 的抓取链路...</div>
      </div>
      <div v-else class="test-panel">
        <a-alert
          :message="`已返回 ${testResult.length} 条模拟结果，来源健康状态：${testingSource ? getHealthLabel(testingSource.healthStatus) : '正常'}`"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-descriptions bordered :column="2" size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="抓取方式">{{ testingSource ? getProtocolLabel(testingSource.sourceType) : '-' }}</a-descriptions-item>
          <a-descriptions-item label="去重策略">{{ testingSource ? getDedupLabel(testingSource.dedupStrategy) : '-' }}</a-descriptions-item>
          <a-descriptions-item label="最近抓取">{{ testingSource?.lastFetchTime || '-' }}</a-descriptions-item>
          <a-descriptions-item label="成功率">{{ testingSource?.successRate || 0 }}%</a-descriptions-item>
        </a-descriptions>
        <div v-for="item in testResult" :key="item.title" class="test-item">
          <div class="test-item__title">{{ item.title }}</div>
          <div class="test-item__meta">{{ item.publishTime }} · AI评分 {{ item.score }} · {{ item.statusText }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { sourceApi } from '@/api'
import type {
  ArticleDomain,
  ArticleRegion,
  DedupStrategy,
  Source,
  SourceHealthStatus,
  SourceLanguage,
  SourcePayload,
  SourceProtocol,
  SourceStatus,
} from '@/types'

type RegionFilter = ArticleRegion | 'all'
type DomainFilter = ArticleDomain | 'all'
type StatusFilter = SourceStatus | 'all'
type HealthFilter = SourceHealthStatus | 'all'
type ProtocolFilter = SourceProtocol | 'all'

type SourceFilters = {
  keyword: string
  region: RegionFilter
  domain: DomainFilter
  status: StatusFilter
  healthStatus: HealthFilter
  sourceType: ProtocolFilter
}

type TestResultItem = {
  title: string
  publishTime: string
  score: number
  statusText: string
}

const router = useRouter()

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

const protocolLabelMap: Record<SourceProtocol, string> = {
  rss: 'RSS',
  scrape: '页面抓取',
  api: 'API',
}

const languageLabelMap: Record<SourceLanguage, string> = {
  zh: '中文',
  en: '英文',
  multi: '多语言',
}

const dedupLabelMap: Record<DedupStrategy, string> = {
  url: '按 URL 去重',
  title: '按标题去重',
  content_hash: '按正文指纹去重',
}

const healthLabelMap: Record<SourceHealthStatus, string> = {
  healthy: '正常',
  warning: '预警',
  error: '异常',
}

const healthColorMap: Record<SourceHealthStatus, string> = {
  healthy: 'green',
  warning: 'orange',
  error: 'red',
}

const intervalLabelMap: Record<string, string> = {
  '15min': '每 15 分钟',
  '30min': '每 30 分钟',
  '1h': '每小时',
  '2h': '每 2 小时',
  '6h': '每 6 小时',
  '12h': '每 12 小时',
  '24h': '每天',
}

const sources = ref<Source[]>([])
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const testModalVisible = ref(false)
const testLoading = ref(false)
const testingSource = ref<Source | null>(null)
const testResult = ref<TestResultItem[]>([])
const tagInput = ref('')

const filters = reactive<SourceFilters>({
  keyword: '',
  region: 'all',
  domain: 'all',
  status: 'all',
  healthStatus: 'all',
  sourceType: 'all',
})

const createInitialForm = (): SourcePayload => ({
  name: '',
  url: '',
  region: 'domestic',
  domain: 'tech',
  credibility: 80,
  fetchInterval: '1h',
  rssUrl: '',
  remark: '',
  todayCount: 0,
  status: 'active',
  sourceType: 'rss',
  language: 'zh',
  priority: 5,
  parserType: 'rss',
  dedupStrategy: 'url',
  categoryTags: [],
  lastFetchTime: '',
  lastSuccessTime: '',
  successRate: 95,
  failCount: 0,
  avgLatency: 800,
  healthStatus: 'healthy',
  lastError: '',
})

const form = reactive<SourcePayload>(createInitialForm())

const filteredSources = computed(() => {
  return sources.value.filter((item) => {
    const matchedKeyword =
      !filters.keyword ||
      item.name.includes(filters.keyword) ||
      item.url.includes(filters.keyword) ||
      item.categoryTags.some((tag) => tag.includes(filters.keyword))

    if (!matchedKeyword) return false
    if (filters.region !== 'all' && item.region !== filters.region) return false
    if (filters.domain !== 'all' && item.domain !== filters.domain) return false
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.healthStatus !== 'all' && item.healthStatus !== filters.healthStatus) return false
    if (filters.sourceType !== 'all' && item.sourceType !== filters.sourceType) return false
    return true
  })
})

const stats = computed(() => {
  const total = sources.value.length
  const activeCount = sources.value.filter((item) => item.status === 'active').length
  const abnormalCount = sources.value.filter((item) => item.healthStatus !== 'healthy').length
  const avgSuccessRate = total
    ? Math.round(sources.value.reduce((sum, item) => sum + item.successRate, 0) / total)
    : 0

  return [
    {
      label: '来源站点总数',
      value: total,
      unit: '个',
      color: '#1677FF',
      description: '包含当前已接入的资讯抓取网站与备用采集源。',
    },
    {
      label: '启用中的来源',
      value: activeCount,
      unit: '个',
      color: '#52C41A',
      description: '当前允许参与抓取任务调度的站点数量。',
    },
    {
      label: '异常 / 预警来源',
      value: abnormalCount,
      unit: '个',
      color: '#FA8C16',
      description: '便于快速定位解析失败或结构变更的网站。',
    },
    {
      label: '平均抓取成功率',
      value: avgSuccessRate,
      unit: '%',
      color: '#722ED1',
      description: '综合评估当前来源配置整体运行稳定度。',
    },
  ]
})

const columns = [
  { title: '来源站点', key: 'name', width: 320 },
  { title: '抓取配置', key: 'strategy', width: 240 },
  { title: '优先级', key: 'priority', width: 120 },
  { title: '健康监控', key: 'health', width: 240 },
  { title: '产出信息', key: 'output', width: 160 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 180 },
]

function applyFilter() {
  return filteredSources.value
}

function resetFilters() {
  Object.assign(filters, {
    keyword: '',
    region: 'all',
    domain: 'all',
    status: 'all',
    healthStatus: 'all',
    sourceType: 'all',
  })
}

function resetForm() {
  Object.assign(form, createInitialForm())
  tagInput.value = ''
}

async function loadSources() {
  sources.value = await sourceApi.getList()
}

async function reloadSources() {
  await loadSources()
  message.success('来源配置已刷新')
}

function showAddModal() {
  editingId.value = null
  resetForm()
  modalVisible.value = true
}

function handleEdit(record: Source) {
  editingId.value = record.id
  Object.assign(form, {
    name: record.name,
    url: record.url,
    region: record.region,
    domain: record.domain,
    credibility: record.credibility,
    fetchInterval: record.fetchInterval,
    rssUrl: record.rssUrl,
    remark: record.remark,
    todayCount: record.todayCount,
    status: record.status,
    sourceType: record.sourceType,
    language: record.language,
    priority: record.priority,
    parserType: record.parserType,
    dedupStrategy: record.dedupStrategy,
    categoryTags: [...record.categoryTags],
    lastFetchTime: record.lastFetchTime,
    lastSuccessTime: record.lastSuccessTime,
    successRate: record.successRate,
    failCount: record.failCount,
    avgLatency: record.avgLatency,
    healthStatus: record.healthStatus,
    lastError: record.lastError || '',
  })
  tagInput.value = record.categoryTags.join(', ')
  modalVisible.value = true
}

async function handleDelete(id: number) {
  try {
    await sourceApi.delete(id)
    await loadSources()
    message.success('删除成功')
  } catch {
    message.error('删除失败')
  }
}

async function handleToggle(id: number, value: boolean) {
  try {
    await sourceApi.update(id, { status: value ? 'active' : 'inactive' })
    await loadSources()
    message.success(value ? '已启用该来源' : '已禁用该来源')
  } catch {
    message.error('操作失败')
  }
}

async function handleSubmit() {
  if (!form.name.trim() || !form.url.trim()) {
    message.error('来源名称和网址不能为空')
    return
  }

  const payload: SourcePayload = {
    ...form,
    categoryTags: tagInput.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    lastError: form.lastError?.trim() || undefined,
  }

  try {
    if (editingId.value) {
      await sourceApi.update(editingId.value, payload)
      message.success('来源配置已更新')
    } else {
      await sourceApi.create(payload)
      message.success('来源配置已新增')
    }
    modalVisible.value = false
    await loadSources()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '操作失败')
  }
}

async function handleTestFetch(record: Source) {
  testingSource.value = record
  testLoading.value = true
  testResult.value = []
  testModalVisible.value = true

  await new Promise((resolve) => setTimeout(resolve, 1200))

  testResult.value = [
    {
      title: `${record.name} 最新抓取：${getDomainLabel(record.domain)}领域出现新的高热资讯`,
      publishTime: '刚刚',
      score: Math.min(99, record.credibility + 4),
      statusText: '列表页解析成功',
    },
    {
      title: `${record.name} 解析结果：正文摘要抽取完成，标签匹配 ${record.categoryTags[0] || '资讯'} 主题`,
      publishTime: '2分钟前',
      score: Math.max(70, record.credibility - 2),
      statusText: '正文抽取成功',
    },
    {
      title: `${record.name} 去重校验完成，当前策略为 ${getDedupLabel(record.dedupStrategy)}`,
      publishTime: '5分钟前',
      score: 88,
      statusText: '去重校验通过',
    },
  ]
  testLoading.value = false
}

function getRegionColor(region: ArticleRegion) {
  return region === 'domestic' ? 'blue' : 'purple'
}

function getRegionLabel(region: ArticleRegion) {
  return region === 'domestic' ? '国内' : '国际'
}

function getDomainColor(domain: ArticleDomain) {
  return domainColorMap[domain]
}

function getDomainLabel(domain: ArticleDomain) {
  return domainLabelMap[domain]
}

function getProtocolLabel(protocol: SourceProtocol) {
  return protocolLabelMap[protocol]
}

function getLanguageLabel(language: SourceLanguage) {
  return languageLabelMap[language]
}

function getDedupLabel(strategy: DedupStrategy) {
  return dedupLabelMap[strategy]
}

function getHealthLabel(status: SourceHealthStatus) {
  return healthLabelMap[status]
}

function getHealthColor(status: SourceHealthStatus) {
  return healthColorMap[status]
}

function getIntervalLabel(interval: string) {
  return intervalLabelMap[interval] || interval
}

onMounted(() => {
  void loadSources()
})
</script>

<style scoped>
.source-page {
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
.filter-card,
.table-card {
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

.filter-actions {
  display: flex;
  justify-content: flex-end;
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
  color: #141414;
  font-weight: 700;
}

.source-url {
  font-size: 12px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.config-stack,
.output-cell,
.health-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #595959;
  font-size: 13px;
  line-height: 1.5;
}

.priority-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.priority-value {
  min-width: 28px;
  color: #1677ff;
  font-weight: 700;
}

.health-meta {
  color: #595959;
}

.health-error {
  color: #ff4d4f;
  font-size: 12px;
}

.test-loading {
  padding: 40px;
  text-align: center;
}

.test-loading__text {
  margin-top: 16px;
  color: #666;
}

.test-panel {
  display: flex;
  flex-direction: column;
}

.test-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-item__title {
  margin-bottom: 4px;
  font-weight: 600;
}

.test-item__meta {
  font-size: 12px;
  color: #999;
}

:deep(.ant-card-body) {
  padding: 20px;
}

:deep(.ant-progress-inner) {
  background: #f0f0f0;
}

@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
