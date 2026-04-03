<template>
  <div class="user-list">
    <!-- 筛选 -->
    <a-card style="margin-bottom: 16px">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :span="6">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索昵称或手机号..."
            @search="loadData"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.plan" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部套餐</a-select-option>
            <a-select-option value="free">免费版</a-select-option>
            <a-select-option value="pro">Pro 版</a-select-option>
            <a-select-option value="enterprise">企业版</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.status" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="active">正常</a-select-option>
            <a-select-option value="banned">已封禁</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button @click="resetFilters">重置</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 表格 -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 位用户`,
          onChange: handlePageChange,
        }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <!-- 昵称 -->
          <template v-if="column.key === 'nickname'">
            <div style="display: flex; align-items: center; gap: 8px">
              <a-avatar size="small" style="background-color: #00B96B">
                {{ record.nickname.charAt(0) }}
              </a-avatar>
              <span>{{ record.nickname }}</span>
            </div>
          </template>

          <!-- 套餐 -->
          <template v-else-if="column.key === 'plan'">
            <a-tag :color="getPlanColor(record.plan)">{{ getPlanLabel(record.plan) }}</a-tag>
          </template>

          <!-- 订阅领域 -->
          <template v-else-if="column.key === 'subscribedDomains'">
            <a-space>
              <a-tag
                v-for="d in record.subscribedDomains"
                :key="d"
                :color="getDomainColor(d)"
                size="small"
              >
                {{ getDomainLabel(d) }}
              </a-tag>
            </a-space>
          </template>

          <!-- 降噪档位 -->
          <template v-else-if="column.key === 'noiseLevel'">
            <span style="font-size: 12px; color: #666">{{ getNoiseLevelLabel(record.noiseLevel) }}</span>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <a-badge
              :status="record.status === 'active' ? 'success' : 'error'"
              :text="record.status === 'active' ? '正常' : '已封禁'"
            />
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showUserDetail(record)">详情</a-button>
              <a-popconfirm
                v-if="record.status === 'active'"
                title="确定封禁该用户？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleBan(record.id)"
              >
                <a-button type="link" size="small" danger>封禁</a-button>
              </a-popconfirm>
              <a-popconfirm
                v-else
                title="确定解封该用户？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleUnban(record.id)"
              >
                <a-button type="link" size="small">解封</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 用户详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      :title="`用户详情 - ${currentUser?.nickname}`"
      :footer="null"
      width="600px"
    >
      <template v-if="currentUser">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="用户 ID">{{ currentUser.id }}</a-descriptions-item>
          <a-descriptions-item label="昵称">{{ currentUser.nickname }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</a-descriptions-item>
          <a-descriptions-item label="套餐">
            <a-tag :color="getPlanColor(currentUser.plan)">{{ getPlanLabel(currentUser.plan) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge
              :status="currentUser.status === 'active' ? 'success' : 'error'"
              :text="currentUser.status === 'active' ? '正常' : '已封禁'"
            />
          </a-descriptions-item>
          <a-descriptions-item label="降噪档位">{{ getNoiseLevelLabel(currentUser.noiseLevel) }}</a-descriptions-item>
          <a-descriptions-item label="累计阅读">{{ currentUser.readCount }} 篇</a-descriptions-item>
          <a-descriptions-item label="注册时间" :span="2">{{ currentUser.registerTime }}</a-descriptions-item>
          <a-descriptions-item label="最近活跃" :span="2">{{ currentUser.lastActiveTime }}</a-descriptions-item>
          <a-descriptions-item label="订阅领域" :span="2">
            <a-space>
              <a-tag v-for="d in currentUser.subscribedDomains" :key="d" :color="getDomainColor(d)">
                {{ getDomainLabel(d) }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="雷达词" :span="2">
            <a-space wrap>
              <a-tag v-for="w in currentUser.radarWords" :key="w" color="green">{{ w }}</a-tag>
              <span v-if="currentUser.radarWords.length === 0" style="color: #999">暂无</span>
            </a-space>
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" style="margin: 16px 0 12px; font-size: 14px">阅读偏好</a-divider>
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="地区偏好">
            {{ getRegionLabel(currentUser.regionPref) }}
          </a-descriptions-item>
          <a-descriptions-item label="阅读模式">
            {{ currentUser.readingMode === 'compact' ? '紧凑模式' : '舒适模式' }}
          </a-descriptions-item>
          <a-descriptions-item label="自动翻译">
            <a-badge :status="currentUser.enableAutoTranslate ? 'success' : 'default'" :text="currentUser.enableAutoTranslate ? '已开启' : '未开启'" />
          </a-descriptions-item>
          <a-descriptions-item label="推送通知">
            <a-badge :status="currentUser.enableNotification ? 'success' : 'default'" :text="currentUser.enableNotification ? '已开启' : '未开启'" />
          </a-descriptions-item>
          <a-descriptions-item label="屏蔽情绪" :span="2">
            <a-space v-if="currentUser.blockedSentiments && currentUser.blockedSentiments.length > 0">
              <a-tag v-for="s in currentUser.blockedSentiments" :key="s" color="red">{{ getSentimentLabel(s) }}</a-tag>
            </a-space>
            <span v-else style="color: #999">未屏蔽</span>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { userApi } from '@/api'
import type { User } from '@/types'
import { message } from 'ant-design-vue'

const loading = ref(false)
const users = ref<User[]>([])
const detailVisible = ref(false)
const currentUser = ref<User | null>(null)

const filters = reactive({ keyword: '', plan: 'all', status: 'all' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const columns = [
  { title: '用户', key: 'nickname', width: 140 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '套餐', key: 'plan', width: 90 },
  { title: '订阅领域', key: 'subscribedDomains', width: 180 },
  { title: '降噪档位', key: 'noiseLevel', width: 100 },
  { title: '阅读量', dataIndex: 'readCount', key: 'readCount', width: 80, sorter: (a: User, b: User) => a.readCount - b.readCount },
  { title: '最近活跃', dataIndex: 'lastActiveTime', key: 'lastActiveTime', width: 140 },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

async function loadData() {
  loading.value = true
  try {
    const result = await userApi.getList({
      keyword: filters.keyword,
      plan: filters.plan,
      status: filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    users.value = result.list
    pagination.total = result.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.plan = 'all'
  filters.status = 'all'
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

function showUserDetail(user: User) {
  currentUser.value = user
  detailVisible.value = true
}

async function handleBan(id: number) {
  await userApi.ban(id)
  message.success('封禁成功')
  loadData()
}

async function handleUnban(id: number) {
  await userApi.unban(id)
  message.success('解封成功')
  loadData()
}

function getPlanColor(plan: string) {
  const map: Record<string, string> = { free: 'default', pro: 'gold', enterprise: 'purple' }
  return map[plan] || 'default'
}

function getPlanLabel(plan: string) {
  const map: Record<string, string> = { free: '免费版', pro: 'Pro', enterprise: '企业版' }
  return map[plan] || plan
}

function getDomainColor(domain: string) {
  const map: Record<string, string> = { tech: 'blue', finance: 'orange', policy: 'green', commerce: 'pink' }
  return map[domain] || 'default'
}

function getDomainLabel(domain: string) {
  const map: Record<string, string> = { tech: '科技', finance: '财经', policy: '政策', commerce: '商情' }
  return map[domain] || domain
}

function getNoiseLevelLabel(level: string) {
  const map: Record<string, string> = {
    open: '视野全开',
    focus: '核心聚焦',
    major: '重大事件',
    quake: '行业地震',
  }
  return map[level] || level
}

function getRegionLabel(region?: string) {
  const map: Record<string, string> = { all: '全部地区', domestic: '仅国内', international: '仅国际' }
  return map[region || 'all'] || '全部地区'
}

function getSentimentLabel(sentiment: string) {
  const map: Record<string, string> = { positive: '正面', negative: '负面', neutral: '中性' }
  return map[sentiment] || sentiment
}

onMounted(loadData)
</script>
