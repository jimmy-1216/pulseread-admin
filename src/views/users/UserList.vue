<template>
  <div class="user-page">
    <section class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>集中查看用户状态、订阅偏好、阅读习惯与封禁操作，支持按套餐与状态快速筛选。</p>
      </div>
    </section>

    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :sm="12" :xl="8">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索昵称、手机号或邮箱..."
            allow-clear
            @search="loadData"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.plan" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部套餐</a-select-option>
            <a-select-option value="free">免费版</a-select-option>
            <a-select-option value="pro">Pro 版</a-select-option>
            <a-select-option value="enterprise">企业版</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-select v-model:value="filters.status" style="width: 100%" @change="loadData">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="active">正常</a-select-option>
            <a-select-option value="banned">已封禁</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="12" :xl="4">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        row-key="id"
        size="middle"
        :pagination="{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 位用户`,
          onChange: handlePageChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'nickname'">
            <div class="nickname-cell">
              <a-avatar size="small" class="nickname-avatar">
                {{ record.nickname.charAt(0) }}
              </a-avatar>
              <span>{{ record.nickname }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'plan'">
            <a-tag :color="getPlanColor(record.plan)">{{ getPlanLabel(record.plan) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'subscribedDomains'">
            <a-space wrap>
              <a-tag v-for="domain in record.subscribedDomains" :key="domain" :color="getDomainColor(domain)">
                {{ getDomainLabel(domain) }}
              </a-tag>
            </a-space>
          </template>

          <template v-else-if="column.key === 'noiseLevel'">
            <span class="noise-text">{{ getNoiseLevelLabel(record.noiseLevel) }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-badge
              :status="record.status === 'active' ? 'success' : 'error'"
              :text="record.status === 'active' ? '正常' : '已封禁'"
            />
          </template>

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

    <a-modal
      v-model:open="detailVisible"
      :title="`用户详情 - ${currentUser?.nickname ?? ''}`"
      :footer="null"
      width="680px"
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
            <a-space wrap>
              <a-tag v-for="domain in currentUser.subscribedDomains" :key="domain" :color="getDomainColor(domain)">
                {{ getDomainLabel(domain) }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="雷达词" :span="2">
            <a-space wrap>
              <a-tag v-for="word in currentUser.radarWords" :key="word" color="green">{{ word }}</a-tag>
              <span v-if="currentUser.radarWords.length === 0" class="empty-text">暂无</span>
            </a-space>
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" class="detail-divider">阅读偏好</a-divider>
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
            <a-space v-if="currentUser.blockedSentiments && currentUser.blockedSentiments.length > 0" wrap>
              <a-tag v-for="sentiment in currentUser.blockedSentiments" :key="sentiment" color="red">
                {{ getSentimentLabel(sentiment) }}
              </a-tag>
            </a-space>
            <span v-else class="empty-text">未屏蔽</span>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { userApi } from '@/api'
import type { ArticleDomain, User, UserPlan, UserStatus } from '@/types'

type FilterState = {
  keyword: string
  plan: UserPlan | 'all'
  status: UserStatus | 'all'
}

type NoiseLevel = User['noiseLevel']
type RegionPreference = User['regionPref']

type SentimentKey = 'positive' | 'negative' | 'neutral'

const loading = ref(false)
const users = ref<User[]>([])
const detailVisible = ref(false)
const currentUser = ref<User | null>(null)

const filters = reactive<FilterState>({
  keyword: '',
  plan: 'all',
  status: 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const columns = [
  { title: '用户', key: 'nickname', width: 160 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '套餐', key: 'plan', width: 96 },
  { title: '订阅领域', key: 'subscribedDomains', width: 220 },
  { title: '降噪档位', key: 'noiseLevel', width: 110 },
  { title: '阅读量', dataIndex: 'readCount', key: 'readCount', width: 90, sorter: (a: User, b: User) => a.readCount - b.readCount },
  { title: '最近活跃', dataIndex: 'lastActiveTime', key: 'lastActiveTime', width: 170 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
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
  void loadData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.page = page
  pagination.pageSize = pageSize
  void loadData()
}

function showUserDetail(user: User) {
  currentUser.value = user
  detailVisible.value = true
}

async function handleBan(id: number) {
  await userApi.ban(id)
  message.success('封禁成功')
  await loadData()
}

async function handleUnban(id: number) {
  await userApi.unban(id)
  message.success('解封成功')
  await loadData()
}

function getPlanColor(plan: UserPlan) {
  const map: Record<UserPlan, string> = {
    free: 'default',
    pro: 'gold',
    enterprise: 'purple',
  }
  return map[plan]
}

function getPlanLabel(plan: UserPlan) {
  const map: Record<UserPlan, string> = {
    free: '免费版',
    pro: 'Pro',
    enterprise: '企业版',
  }
  return map[plan]
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

function getNoiseLevelLabel(level: NoiseLevel) {
  const map: Record<NoiseLevel, string> = {
    open: '视野全开',
    focus: '核心聚焦',
    major: '重大事件',
    quake: '行业地震',
  }
  return map[level]
}

function getRegionLabel(region?: RegionPreference) {
  const map: Record<NonNullable<RegionPreference> | 'all', string> = {
    all: '全部地区',
    domestic: '仅国内',
    international: '仅国际',
  }
  return map[region || 'all']
}

function getSentimentLabel(sentiment: string) {
  const map: Record<SentimentKey, string> = {
    positive: '正面',
    negative: '负面',
    neutral: '中性',
  }
  return map[sentiment as SentimentKey] || sentiment
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
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

.nickname-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-avatar {
  background-color: #00b96b;
}

.noise-text {
  font-size: 12px;
  color: #666;
}

.detail-divider {
  margin: 16px 0 12px;
  font-size: 14px;
}

.empty-text {
  color: #999;
}

:deep(.ant-card-body) {
  padding: 20px;
}
</style>
