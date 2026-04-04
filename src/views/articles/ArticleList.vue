<template>
  <div class="article-page">
    <section class="page-header">
      <div>
        <h1>资讯内容管理</h1>
        <p>统一查看资讯池、筛选内容质量，并支持编辑、删除与批量清理操作。</p>
      </div>
      <a-button type="primary" @click="router.push('/articles/create')">
        <template #icon><PlusOutlined /></template>
        新增资讯
      </a-button>
    </section>

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="8">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索标题或来源..."
            allow-clear
            @search="loadData"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.domain" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部领域</a-select-option>
            <a-select-option value="tech">科技</a-select-option>
            <a-select-option value="finance">财经</a-select-option>
            <a-select-option value="policy">政策</a-select-option>
            <a-select-option value="commerce">商情</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.region" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.scoreRange" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部评分</a-select-option>
            <a-select-option value="high">高质量 (≥80)</a-select-option>
            <a-select-option value="medium">中等 (60-79)</a-select-option>
            <a-select-option value="low">低质量 (&lt;60)</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :xl="4" class="filter-actions">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <div class="table-toolbar">
        <div>
          <strong>{{ pagination.total }}</strong>
          <span>条资讯</span>
        </div>
        <a-button v-if="selectedRowKeys.length > 0" danger @click="handleBatchDelete">
          删除选中（{{ selectedRowKeys.length }}）
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="articles"
        :loading="loading"
        row-key="id"
        size="middle"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        :pagination="{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
          onChange: handlePageChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="article-title-cell">
              <div class="article-title">{{ record.title }}</div>
              <div class="article-summary">{{ record.summary }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'domain'">
            <a-tag :color="getDomainColor(record.domain)">
              {{ getDomainLabel(record.domain) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'region'">
            <a-tag :color="record.region === 'domestic' ? 'blue' : 'purple'">
              {{ record.region === 'domestic' ? '国内' : '国际' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'aiScore'">
            <span :class="getScoreClass(record.aiScore)" class="score-text">
              {{ record.aiScore }}
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="router.push(`/articles/edit/${record.id}`)">
                编辑
              </a-button>
              <a-popconfirm title="确定删除该资讯？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { articleApi } from '@/api'
import type { Article, ArticleDomain, ArticleQuery, ArticleRegion } from '@/types'

type ScoreRange = NonNullable<ArticleQuery['scoreRange']>

type FiltersState = {
  keyword: string
  domain: ArticleDomain | 'all'
  region: ArticleRegion | 'all'
  scoreRange: ScoreRange
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const articles = ref<Article[]>([])
const selectedRowKeys = ref<number[]>([])

const filters = reactive<FiltersState>({
  keyword: (route.query.keyword as string) || '',
  domain: 'all',
  region: 'all',
  scoreRange: 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const columns = [
  { title: '标题', key: 'title', ellipsis: true, width: '36%' },
  { title: '领域', key: 'domain', width: 90 },
  { title: '地区', key: 'region', width: 90 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
  { title: 'AI 评分', key: 'aiScore', width: 90, sorter: (a: Article, b: Article) => a.aiScore - b.aiScore },
  { title: '阅读量', dataIndex: 'viewCount', key: 'viewCount', width: 90 },
  { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
]

async function loadData() {
  loading.value = true
  try {
    const result = await articleApi.getList({
      keyword: filters.keyword,
      domain: filters.domain,
      region: filters.region,
      scoreRange: filters.scoreRange,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    articles.value = result.list
    pagination.total = result.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.domain = 'all'
  filters.region = 'all'
  filters.scoreRange = 'all'
  pagination.page = 1
  void loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  void loadData()
}

function onSelectChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys.map((item) => Number(item))
}

async function handleDelete(id: number) {
  await articleApi.delete(id)
  message.success('删除成功')
  await loadData()
}

async function handleBatchDelete() {
  await articleApi.batchDelete(selectedRowKeys.value)
  message.success(`已删除 ${selectedRowKeys.value.length} 条资讯`)
  selectedRowKeys.value = []
  await loadData()
}

function getDomainColor(domain: ArticleDomain) {
  const map: Record<ArticleDomain, string> = {
    tech: 'blue',
    finance: 'orange',
    policy: 'green',
    commerce: 'pink',
  }
  return map[domain]
}

function getDomainLabel(domain: ArticleDomain) {
  const map: Record<ArticleDomain, string> = {
    tech: '科技',
    finance: '财经',
    policy: '政策',
    commerce: '商情',
  }
  return map[domain]
}

function getScoreClass(score: number) {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.article-page {
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

.filter-card,
.table-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: #8c8c8c;
}

.table-toolbar strong {
  margin-right: 6px;
  color: #141414;
  font-size: 20px;
}

.article-title-cell {
  max-width: 420px;
}

.article-title {
  margin-bottom: 6px;
  color: #141414;
  font-weight: 600;
  line-height: 1.5;
}

.article-summary {
  color: #8c8c8c;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-text {
  font-weight: 700;
}

.score-high {
  color: #52c41a;
}

.score-medium {
  color: #fa8c16;
}

.score-low {
  color: #ff4d4f;
}

:deep(.ant-card-body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .filter-actions {
    justify-content: flex-start;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
