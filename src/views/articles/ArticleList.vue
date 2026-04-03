<template>
  <div class="article-list">
    <!-- 筛选区 -->
    <a-card style="margin-bottom: 16px">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :span="6">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索标题或来源..."
            @search="loadData"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.domain" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部领域</a-select-option>
            <a-select-option value="tech">科技</a-select-option>
            <a-select-option value="finance">财经</a-select-option>
            <a-select-option value="policy">政策</a-select-option>
            <a-select-option value="commerce">商情</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.region" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.scoreRange" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部评分</a-select-option>
            <a-select-option value="high">高质量 (≥80)</a-select-option>
            <a-select-option value="medium">中等 (60-79)</a-select-option>
            <a-select-option value="low">低质量 (&lt;60)</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6" style="display: flex; justify-content: flex-end; gap: 8px">
          <a-button @click="resetFilters">重置</a-button>
          <a-button type="primary" @click="$router.push('/articles/create')">
            <template #icon><PlusOutlined /></template>
            新增资讯
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据表格 -->
    <a-card>
      <div class="table-header">
        <span class="table-title">共 {{ pagination.total }} 条资讯</span>
        <div class="table-actions">
          <a-button
            v-if="selectedRowKeys.length > 0"
            danger
            @click="handleBatchDelete"
          >
            删除选中 ({{ selectedRowKeys.length }})
          </a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="articles"
        :loading="loading"
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
        row-key="id"
        size="middle"
      >
        <!-- 标题列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="article-title-cell">
              <div class="article-title">{{ record.title }}</div>
              <div class="article-summary">{{ record.summary }}</div>
            </div>
          </template>

          <!-- 领域 -->
          <template v-else-if="column.key === 'domain'">
            <a-tag :color="getDomainColor(record.domain)">
              {{ getDomainLabel(record.domain) }}
            </a-tag>
          </template>

          <!-- 地区 -->
          <template v-else-if="column.key === 'region'">
            <a-tag :color="record.region === 'domestic' ? 'blue' : 'purple'">
              {{ record.region === 'domestic' ? '国内' : '国际' }}
            </a-tag>
          </template>

          <!-- AI 评分 -->
          <template v-else-if="column.key === 'aiScore'">
            <span :class="getScoreClass(record.aiScore)" style="font-weight: 600">
              {{ record.aiScore }}
            </span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="$router.push(`/articles/edit/${record.id}`)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除该资讯？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { articleApi } from '@/api'
import type { Article } from '@/types'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const loading = ref(false)
const articles = ref<Article[]>([])
const selectedRowKeys = ref<number[]>([])

const filters = reactive({
  keyword: (route.query.keyword as string) || '',
  domain: 'all',
  region: 'all',
  scoreRange: 'all',
})

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const columns = [
  { title: '标题', key: 'title', ellipsis: true, width: '35%' },
  { title: '领域', key: 'domain', width: 80 },
  { title: '地区', key: 'region', width: 80 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
  { title: 'AI 评分', key: 'aiScore', width: 80, sorter: (a: Article, b: Article) => a.aiScore - b.aiScore },
  { title: '阅读量', dataIndex: 'viewCount', key: 'viewCount', width: 80 },
  { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 140 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
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
  loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

function onSelectChange(keys: number[]) {
  selectedRowKeys.value = keys
}

async function handleDelete(id: number) {
  await articleApi.delete(id)
  message.success('删除成功')
  loadData()
}

async function handleBatchDelete() {
  await articleApi.batchDelete(selectedRowKeys.value)
  message.success(`已删除 ${selectedRowKeys.value.length} 条资讯`)
  selectedRowKeys.value = []
  loadData()
}

function getDomainColor(domain: string) {
  const map: Record<string, string> = {
    tech: 'blue',
    finance: 'orange',
    policy: 'green',
    commerce: 'pink',
  }
  return map[domain] || 'default'
}

function getDomainLabel(domain: string) {
  const map: Record<string, string> = {
    tech: '科技',
    finance: '财经',
    policy: '政策',
    commerce: '商情',
  }
  return map[domain] || domain
}

function getScoreClass(score: number) {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

onMounted(loadData)
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.table-title { font-size: 14px; color: #666; }
.article-title-cell { max-width: 400px; }
.article-title { font-size: 14px; color: #1a1a1a; font-weight: 500; margin-bottom: 4px; }
.article-summary { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.score-high { color: #52C41A; }
.score-medium { color: #FA8C16; }
.score-low { color: #FF4D4F; }
</style>
