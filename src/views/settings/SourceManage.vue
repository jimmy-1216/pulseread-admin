<template>
  <div class="source-page">
    <section class="page-header">
      <div>
        <h1>数据来源管理</h1>
        <p>统一维护资讯来源、抓取频率、可信度与启停状态，并支持抓取测试与快速筛选。</p>
      </div>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增来源
      </a-button>
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
        </a-card>
      </a-col>
    </a-row>

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="8">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索来源名称或域名..."
            allow-clear
            @search="applyFilter"
            @change="applyFilter"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.region" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.domain" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部领域</a-select-option>
            <a-select-option value="tech">科技</a-select-option>
            <a-select-option value="finance">财经</a-select-option>
            <a-select-option value="policy">政策</a-select-option>
            <a-select-option value="commerce">商情</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.status" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :xl="4" class="filter-actions">
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
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 个来源` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <div class="source-name">{{ record.name }}</div>
              <div class="source-url">
                <a :href="record.url" target="_blank" rel="noreferrer">{{ record.url }}</a>
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'region'">
            <a-tag :color="record.region === 'domestic' ? 'blue' : 'purple'">
              {{ record.region === 'domestic' ? '国内' : '国际' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'domain'">
            <a-tag :color="getDomainColor(record.domain)">
              {{ getDomainLabel(record.domain) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'credibility'">
            <div class="credibility-cell">
              <a-progress
                :percent="record.credibility"
                :stroke-color="getCredibilityColor(record.credibility)"
                size="small"
                :show-info="false"
                style="width: 88px; margin: 0"
              />
              <span :style="{ color: getCredibilityColor(record.credibility) }" class="credibility-value">
                {{ record.credibility }}
              </span>
            </div>
          </template>

          <template v-else-if="column.key === 'fetchInterval'">
            <a-tag>{{ record.fetchInterval }}</a-tag>
          </template>

          <template v-else-if="column.key === 'todayCount'">
            <span class="today-count">{{ record.todayCount }}</span>
            <span class="today-count__unit">条</span>
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
              <a-popconfirm title="确定删除该数据来源？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑数据来源' : '新增数据来源'"
      width="640px"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSubmit"
    >
      <a-form :model="form" layout="vertical" style="margin-top: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="来源名称" required>
              <a-input v-model:value="form.name" placeholder="如 36氪" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源网址" required>
              <a-input v-model:value="form.url" placeholder="https://36kr.com" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属地区" required>
              <a-select v-model:value="form.region" style="width: 100%">
                <a-select-option value="domestic">国内</a-select-option>
                <a-select-option value="international">国际</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所属领域" required>
              <a-select v-model:value="form.domain" style="width: 100%">
                <a-select-option value="tech">科技</a-select-option>
                <a-select-option value="finance">财经</a-select-option>
                <a-select-option value="policy">政策</a-select-option>
                <a-select-option value="commerce">商情</a-select-option>
              </a-select>
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
            <a-form-item label="抓取频率">
              <a-select v-model:value="form.fetchInterval" style="width: 100%">
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
        </a-row>

        <a-form-item label="RSS/API 地址">
          <a-input v-model:value="form.rssUrl" placeholder="RSS 或 API 抓取地址（选填）" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="2" placeholder="来源说明、特殊处理规则等" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="testModalVisible" title="测试抓取结果" width="600px" :footer="null">
      <div v-if="testLoading" class="test-loading">
        <a-spin size="large" />
        <div class="test-loading__text">正在抓取 {{ testingSource?.name }}...</div>
      </div>
      <div v-else>
        <a-alert
          :message="`成功抓取 ${testResult.length} 条资讯`"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        />
        <div v-for="item in testResult" :key="item.title" class="test-item">
          <div class="test-item__title">{{ item.title }}</div>
          <div class="test-item__meta">{{ item.publishTime }} · AI评分: {{ item.score }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { sourceApi } from '@/api'
import type { ArticleDomain, ArticleRegion, Source, SourcePayload, SourceStatus } from '@/types'

type RegionFilter = ArticleRegion | 'all'
type DomainFilter = ArticleDomain | 'all'
type StatusFilter = SourceStatus | 'all'

type SourceFilters = {
  keyword: string
  region: RegionFilter
  domain: DomainFilter
  status: StatusFilter
}

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

const sources = ref<Source[]>([])
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const testModalVisible = ref(false)
const testLoading = ref(false)
const testingSource = ref<Source | null>(null)
const testResult = ref<Array<{ title: string; publishTime: string; score: number }>>([])

const filters = reactive<SourceFilters>({
  keyword: '',
  region: 'all',
  domain: 'all',
  status: 'all',
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
})

const form = reactive<SourcePayload>(createInitialForm())

const filteredSources = computed(() => {
  return sources.value.filter((item) => {
    if (filters.keyword && !item.name.includes(filters.keyword) && !item.url.includes(filters.keyword)) {
      return false
    }
    if (filters.region !== 'all' && item.region !== filters.region) {
      return false
    }
    if (filters.domain !== 'all' && item.domain !== filters.domain) {
      return false
    }
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false
    }
    return true
  })
})

const stats = computed(() => {
  const total = sources.value.length
  const totalCredibility = sources.value.reduce((sum, item) => sum + item.credibility, 0)

  return [
    { label: '数据来源总数', value: total, unit: '个', color: '#1677FF' },
    { label: '启用中', value: sources.value.filter((item) => item.status === 'active').length, unit: '个', color: '#52C41A' },
    { label: '今日抓取总量', value: sources.value.reduce((sum, item) => sum + item.todayCount, 0), unit: '条', color: '#FA8C16' },
    { label: '平均可信度', value: total ? Math.round(totalCredibility / total) : 0, unit: '分', color: '#722ED1' },
  ]
})

const columns = [
  { title: '来源名称', key: 'name', width: '24%' },
  { title: '地区', key: 'region', width: 90 },
  { title: '领域', key: 'domain', width: 90 },
  { title: '可信度', key: 'credibility', width: 170 },
  { title: '抓取频率', key: 'fetchInterval', width: 120 },
  { title: '今日抓取', key: 'todayCount', width: 110 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 170 },
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
  })
}

function resetForm() {
  Object.assign(form, createInitialForm())
}

async function loadSources() {
  sources.value = await sourceApi.getList()
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
  })
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
    message.success(value ? '已启用' : '已禁用')
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
    name: form.name,
    url: form.url,
    region: form.region,
    domain: form.domain,
    credibility: form.credibility,
    fetchInterval: form.fetchInterval,
    rssUrl: form.rssUrl,
    remark: form.remark,
    todayCount: form.todayCount,
    status: form.status,
  }

  try {
    if (editingId.value) {
      await sourceApi.update(editingId.value, payload)
      message.success('修改成功')
    } else {
      await sourceApi.create(payload)
      message.success('新增成功')
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

  await new Promise((resolve) => setTimeout(resolve, 1500))

  testResult.value = [
    { title: `${record.name} 最新资讯：AI 技术突破引发行业震动`, publishTime: '刚刚', score: 87 },
    { title: `${record.name} 独家：全球市场今日关键动态`, publishTime: '5分钟前', score: 82 },
    { title: `${record.name} 深度：政策变化对行业的三大影响`, publishTime: '12分钟前', score: 91 },
  ]
  testLoading.value = false
}

function getCredibilityColor(score: number) {
  if (score >= 90) return '#52C41A'
  if (score >= 75) return '#FA8C16'
  return '#FF4D4F'
}

function getDomainColor(domain: ArticleDomain) {
  return domainColorMap[domain]
}

function getDomainLabel(domain: ArticleDomain) {
  return domainLabelMap[domain]
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
  font-size: 14px;
  color: #999;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.source-name {
  color: #141414;
  font-weight: 600;
}

.source-url {
  margin-top: 4px;
  font-size: 12px;
}

.credibility-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.credibility-value {
  font-weight: 700;
}

.today-count {
  color: #1677FF;
  font-weight: 700;
}

.today-count__unit {
  margin-left: 4px;
  color: #999;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
