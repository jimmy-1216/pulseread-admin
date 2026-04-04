<template>
  <div class="feedback-page">
    <section class="page-header">
      <div>
        <h1>用户反馈中心</h1>
        <p>集中处理问题反馈、功能建议与内容纠错请求，并跟踪当前待办状态。</p>
      </div>
      <div class="page-header__meta">
        <span>待处理总数</span>
        <strong>{{ pendingCount }}</strong>
      </div>
    </section>

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="6">
          <a-select v-model:value="filters.status" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="6">
          <a-select v-model:value="filters.type" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部类型</a-select-option>
            <a-select-option value="bug">Bug 报告</a-select-option>
            <a-select-option value="feature">功能建议</a-select-option>
            <a-select-option value="content">内容问题</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="6">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
        <a-col :xs="24" :xl="6" class="filter-card__summary">
          <a-badge :count="pendingCount">
            <span>当前待处理反馈</span>
          </a-badge>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="feedbacks"
        :loading="loading"
        row-key="id"
        size="middle"
        :pagination="{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total: number) => `共 ${total} 条反馈`,
          onChange: handlePageChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">{{ getTypeLabel(record.type) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'content'">
            <div class="content-cell">
              <div class="content-cell__text">{{ record.content }}</div>
              <div v-if="record.replyContent" class="content-cell__reply">
                已回复：{{ record.replyContent }}
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" size="small" @click="showReplyModal(record)">回复</a-button>
              <a-select
                v-model:value="record.status"
                size="small"
                style="width: 96px"
                @change="(value: FeedbackStatus) => handleStatusChange(record.id, value)"
              >
                <a-select-option value="pending">待处理</a-select-option>
                <a-select-option value="processing">处理中</a-select-option>
                <a-select-option value="resolved">已解决</a-select-option>
                <a-select-option value="closed">已关闭</a-select-option>
              </a-select>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="replyVisible"
      title="回复反馈"
      ok-text="发送回复"
      cancel-text="取消"
      :confirm-loading="replying"
      @ok="handleReply"
    >
      <template v-if="currentFeedback">
        <a-descriptions :column="1" size="small" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="用户">{{ currentFeedback.userNickname }}</a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="getTypeColor(currentFeedback.type)">{{ getTypeLabel(currentFeedback.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="内容">{{ currentFeedback.content }}</a-descriptions-item>
        </a-descriptions>
        <a-form-item label="回复内容">
          <a-textarea v-model:value="replyContent" placeholder="请输入回复内容..." :rows="4" />
        </a-form-item>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { feedbackApi } from '@/api'
import type { Feedback, FeedbackStatus, FeedbackType } from '@/types'

type FeedbackStatusFilter = FeedbackStatus | 'all'
type FeedbackTypeFilter = FeedbackType | 'all'

const loading = ref(false)
const feedbacks = ref<Feedback[]>([])
const replyVisible = ref(false)
const replying = ref(false)
const currentFeedback = ref<Feedback | null>(null)
const replyContent = ref('')
const pendingTotal = ref(0)

const filters = reactive<{
  status: FeedbackStatusFilter
  type: FeedbackTypeFilter
}>({
  status: 'all',
  type: 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const pendingCount = computed(() => pendingTotal.value)

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 72 },
  { title: '用户', dataIndex: 'userNickname', key: 'userNickname', width: 120 },
  { title: '类型', key: 'type', width: 110 },
  { title: '反馈内容', key: 'content', ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 168 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
]

async function loadData() {
  loading.value = true
  try {
    const result = await feedbackApi.getList({
      status: filters.status,
      type: filters.type,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    feedbacks.value = result.list
    pagination.total = result.total
    pendingTotal.value = result.pendingTotal ?? 0
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = 'all'
  filters.type = 'all'
  pagination.page = 1
  void loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  void loadData()
}

function showReplyModal(feedback: Feedback) {
  currentFeedback.value = feedback
  replyContent.value = feedback.replyContent || ''
  replyVisible.value = true
}

async function handleReply() {
  if (!currentFeedback.value) {
    return
  }

  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  replying.value = true
  try {
    await feedbackApi.reply(currentFeedback.value.id, replyContent.value)
    message.success('回复成功')
    replyVisible.value = false
    await loadData()
  } finally {
    replying.value = false
  }
}

async function handleStatusChange(id: number, status: FeedbackStatus) {
  await feedbackApi.updateStatus(id, status)
  message.success('状态已更新')
  await loadData()
}

function getTypeColor(type: FeedbackType) {
  const map: Record<FeedbackType, string> = {
    bug: 'red',
    feature: 'blue',
    content: 'orange',
    other: 'default',
  }
  return map[type]
}

function getTypeLabel(type: FeedbackType) {
  const map: Record<FeedbackType, string> = {
    bug: 'Bug 报告',
    feature: '功能建议',
    content: '内容问题',
    other: '其他',
  }
  return map[type]
}

function getStatusColor(status: FeedbackStatus) {
  const map: Record<FeedbackStatus, string> = {
    pending: 'orange',
    processing: 'blue',
    resolved: 'green',
    closed: 'default',
  }
  return map[status]
}

function getStatusLabel(status: FeedbackStatus) {
  const map: Record<FeedbackStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return map[status]
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.feedback-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-header h1 {
  margin: 0 0 8px;
  color: #141414;
  font-size: 24px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  line-height: 1.6;
}

.page-header__meta {
  min-width: 120px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #effaf4 0%, #f7fffb 100%);
  color: #389e0d;
}

.page-header__meta span {
  display: block;
  font-size: 12px;
  color: #73a66b;
}

.page-header__meta strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}

.filter-card,
.table-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.filter-card__summary {
  display: flex;
  justify-content: flex-end;
}

.content-cell {
  max-width: 360px;
}

.content-cell__text {
  color: #262626;
  line-height: 1.6;
}

.content-cell__reply {
  margin-top: 6px;
  color: #00b96b;
  font-size: 12px;
}

:deep(.ant-card-body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .filter-card__summary {
    justify-content: flex-start;
  }
}
</style>
