<template>
  <div class="feedback-list">
    <!-- 筛选 -->
    <a-card style="margin-bottom: 16px">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :span="4">
          <a-select v-model:value="filters.status" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.type" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部类型</a-select-option>
            <a-select-option value="bug">Bug 报告</a-select-option>
            <a-select-option value="feature">功能建议</a-select-option>
            <a-select-option value="content">内容问题</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button @click="resetFilters">重置</a-button>
        </a-col>
        <a-col :span="12" style="text-align: right">
          <a-badge :count="pendingCount" style="margin-right: 8px">
            <span style="color: #666; font-size: 13px">待处理反馈</span>
          </a-badge>
        </a-col>
      </a-row>
    </a-card>

    <!-- 表格 -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="feedbacks"
        :loading="loading"
        :pagination="{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total: number) => `共 ${total} 条反馈`,
          onChange: handlePageChange,
        }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <!-- 类型 -->
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">{{ getTypeLabel(record.type) }}</a-tag>
          </template>

          <!-- 内容 -->
          <template v-else-if="column.key === 'content'">
            <div style="max-width: 320px">
              <div style="font-size: 13px; color: #333">{{ record.content }}</div>
              <div v-if="record.replyContent" style="font-size: 12px; color: #00B96B; margin-top: 4px">
                回复: {{ record.replyContent }}
              </div>
            </div>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showReplyModal(record)">回复</a-button>
              <a-select
                v-model:value="record.status"
                size="small"
                style="width: 90px"
                @change="(val: string) => handleStatusChange(record.id, val)"
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

    <!-- 回复弹窗 -->
    <a-modal
      v-model:open="replyVisible"
      title="回复反馈"
      ok-text="发送回复"
      cancel-text="取消"
      :confirm-loading="replying"
      @ok="handleReply"
    >
      <template v-if="currentFeedback">
        <a-descriptions :column="1" size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="用户">{{ currentFeedback.userNickname }}</a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="getTypeColor(currentFeedback.type)">{{ getTypeLabel(currentFeedback.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="内容">{{ currentFeedback.content }}</a-descriptions-item>
        </a-descriptions>
        <a-form-item label="回复内容">
          <a-textarea
            v-model:value="replyContent"
            placeholder="请输入回复内容..."
            :rows="4"
          />
        </a-form-item>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { feedbackApi } from '@/api'
import type { Feedback } from '@/types'
import { message } from 'ant-design-vue'

const loading = ref(false)
const feedbacks = ref<Feedback[]>([])
const replyVisible = ref(false)
const replying = ref(false)
const currentFeedback = ref<Feedback | null>(null)
const replyContent = ref('')
// 全量待处理数量（不受分页影响）
const pendingTotal = ref(0)

const filters = reactive({ status: 'all', type: 'all' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// 使用 API 返回的全量待处理数，而非仅统计当前页
const pendingCount = computed(() => pendingTotal.value)

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '用户', dataIndex: 'userNickname', key: 'userNickname', width: 100 },
  { title: '类型', key: 'type', width: 100 },
  { title: '反馈内容', key: 'content', ellipsis: true },
  { title: '状态', key: 'status', width: 90 },
  { title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 140 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
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
    // 更新全量待处理数量
    pendingTotal.value = result.pendingTotal ?? 0
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = 'all'
  filters.type = 'all'
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

function showReplyModal(feedback: Feedback) {
  currentFeedback.value = feedback
  replyContent.value = feedback.replyContent || ''
  replyVisible.value = true
}

async function handleReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }
  replying.value = true
  try {
    await feedbackApi.reply(currentFeedback.value!.id, replyContent.value)
    message.success('回复成功')
    replyVisible.value = false
    loadData()
  } finally {
    replying.value = false
  }
}

async function handleStatusChange(id: number, status: string) {
  await feedbackApi.updateStatus(id, status)
  message.success('状态已更新')
  // 刷新列表以同步待处理数量和状态标签
  await loadData()
}

function getTypeColor(type: string) {
  const map: Record<string, string> = { bug: 'red', feature: 'blue', content: 'orange', other: 'default' }
  return map[type] || 'default'
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = { bug: 'Bug 报告', feature: '功能建议', content: '内容问题', other: '其他' }
  return map[type] || type
}

function getStatusColor(status: string) {
  const map: Record<string, string> = { pending: 'orange', processing: 'blue', resolved: 'green', closed: 'default' }
  return map[status] || 'default'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

onMounted(loadData)
</script>
