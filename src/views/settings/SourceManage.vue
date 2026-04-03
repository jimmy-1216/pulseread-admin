<template>
  <div class="source-manage">
    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-bottom: 20px">
      <a-col :span="6" v-for="stat in stats" :key="stat.label">
        <a-card size="small">
          <a-statistic
            :title="stat.label"
            :value="stat.value"
            :value-style="{ color: stat.color, fontSize: '24px', fontWeight: 700 }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #999">{{ stat.unit }}</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选区 -->
    <a-card style="margin-bottom: 16px">
      <a-row :gutter="[16, 0]" align="middle">
        <a-col :span="6">
          <a-input-search
            v-model:value="filters.keyword"
            placeholder="搜索来源名称或域名..."
            @search="applyFilter"
            allow-clear
            @change="applyFilter"
          />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.region" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部地区</a-select-option>
            <a-select-option value="domestic">国内</a-select-option>
            <a-select-option value="international">国际</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.domain" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部领域</a-select-option>
            <a-select-option value="tech">科技</a-select-option>
            <a-select-option value="finance">财经</a-select-option>
            <a-select-option value="policy">政策</a-select-option>
            <a-select-option value="commerce">商情</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="filters.status" style="width: 100%" @change="applyFilter">
            <a-select-option value="all">全部状态</a-select-option>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6" style="display: flex; justify-content: flex-end; gap: 8px">
          <a-button @click="resetFilters">重置</a-button>
          <a-button type="primary" @click="showAddModal">
            <template #icon><PlusOutlined /></template>
            新增来源
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据表格 -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="filteredSources"
        row-key="id"
        size="middle"
        :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 个来源` }"
      >
        <template #bodyCell="{ column, record }">
          <!-- 来源名称 -->
          <template v-if="column.key === 'name'">
            <div>
              <div style="font-weight: 600; color: #1a1a1a">{{ record.name }}</div>
              <div style="font-size: 12px; color: #999; margin-top: 2px">
                <a :href="record.url" target="_blank" style="color: #1677FF">{{ record.url }}</a>
              </div>
            </div>
          </template>

          <!-- 地区 -->
          <template v-else-if="column.key === 'region'">
            <a-tag :color="record.region === 'domestic' ? 'blue' : 'purple'">
              {{ record.region === 'domestic' ? '国内' : '国际' }}
            </a-tag>
          </template>

          <!-- 领域 -->
          <template v-else-if="column.key === 'domain'">
            <a-tag :color="domainColorMap[record.domain]">
              {{ domainLabelMap[record.domain] || record.domain }}
            </a-tag>
          </template>

          <!-- 可信度评分 -->
          <template v-else-if="column.key === 'credibility'">
            <div style="display: flex; align-items: center; gap: 8px">
              <a-progress
                :percent="record.credibility"
                :stroke-color="getCredibilityColor(record.credibility)"
                size="small"
                style="width: 80px; margin: 0"
                :show-info="false"
              />
              <span :style="{ color: getCredibilityColor(record.credibility), fontWeight: 600 }">
                {{ record.credibility }}
              </span>
            </div>
          </template>

          <!-- 抓取频率 -->
          <template v-else-if="column.key === 'fetchInterval'">
            <a-tag>{{ record.fetchInterval }}</a-tag>
          </template>

          <!-- 今日抓取 -->
          <template v-else-if="column.key === 'todayCount'">
            <span style="font-weight: 600; color: #1677FF">{{ record.todayCount }}</span>
            <span style="color: #999; font-size: 12px"> 条</span>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(val: boolean) => handleToggle(record.id, val)"
            />
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleTestFetch(record)">测试</a-button>
              <a-popconfirm
                title="确定删除该数据来源？"
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

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑数据来源' : '新增数据来源'"
      width="600px"
      @ok="handleSubmit"
      ok-text="保存"
      cancel-text="取消"
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
              <a-slider v-model:value="form.credibility" :min="0" :max="100" :marks="{ 0: '0', 50: '50', 100: '100' }" />
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

    <!-- 测试抓取结果弹窗 -->
    <a-modal
      v-model:open="testModalVisible"
      title="测试抓取结果"
      width="600px"
      :footer="null"
    >
      <div v-if="testLoading" style="text-align: center; padding: 40px">
        <a-spin size="large" />
        <div style="margin-top: 16px; color: #666">正在抓取 {{ testingSource?.name }}...</div>
      </div>
      <div v-else>
        <a-alert
          :message="`成功抓取 ${testResult.length} 条资讯`"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        />
        <div v-for="item in testResult" :key="item.title" style="padding: 12px 0; border-bottom: 1px solid #f0f0f0">
          <div style="font-weight: 600; margin-bottom: 4px">{{ item.title }}</div>
          <div style="font-size: 12px; color: #999">{{ item.publishTime }} · AI评分: {{ item.score }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { sourceApi } from '@/api/index'

interface Source {
  id: number
  name: string
  url: string
  region: 'domestic' | 'international'
  domain: string
  credibility: number
  fetchInterval: string
  rssUrl: string
  remark: string
  todayCount: number
  status: 'active' | 'inactive'
}

const domainColorMap: Record<string, string> = {
  tech: 'blue', finance: 'orange', policy: 'green', commerce: 'pink',
}
const domainLabelMap: Record<string, string> = {
  tech: '科技', finance: '财经', policy: '政策', commerce: '商情',
}

const sources = ref<Source[]>([])

// 初始化时加载数据
onMounted(async () => {
  const data = await sourceApi.getList()
  sources.value = data
})

const filters = reactive({ keyword: '', region: 'all', domain: 'all', status: 'all' })

const filteredSources = computed(() => {
  return sources.value.filter((s) => {
    if (filters.keyword && !s.name.includes(filters.keyword) && !s.url.includes(filters.keyword)) return false
    if (filters.region !== 'all' && s.region !== filters.region) return false
    if (filters.domain !== 'all' && s.domain !== filters.domain) return false
    if (filters.status !== 'all' && s.status !== filters.status) return false
    return true
  })
})

const stats = computed(() => [
  { label: '数据来源总数', value: sources.value.length, unit: '个', color: '#1677FF' },
  { label: '启用中', value: sources.value.filter((s) => s.status === 'active').length, unit: '个', color: '#52C41A' },
  { label: '今日抓取总量', value: sources.value.reduce((sum, s) => sum + s.todayCount, 0), unit: '条', color: '#FA8C16' },
  { label: '平均可信度', value: Math.round(sources.value.reduce((sum, s) => sum + s.credibility, 0) / sources.value.length), unit: '分', color: '#722ED1' },
])

const columns = [
  { title: '来源名称', key: 'name', width: '22%' },
  { title: '地区', key: 'region', width: 80 },
  { title: '领域', key: 'domain', width: 80 },
  { title: '可信度', key: 'credibility', width: 160 },
  { title: '抓取频率', key: 'fetchInterval', width: 110 },
  { title: '今日抓取', key: 'todayCount', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 150 },
]

const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<Source>({
  id: 0, name: '', url: '', region: 'domestic', domain: 'tech',
  credibility: 80, fetchInterval: '1h', rssUrl: '', remark: '', todayCount: 0, status: 'active',
})

const testModalVisible = ref(false)
const testLoading = ref(false)
const testingSource = ref<Source | null>(null)
const testResult = ref<{ title: string; publishTime: string; score: number }[]>([])

function applyFilter() { /* filteredSources 是 computed，自动响应 */ }

function resetFilters() {
  Object.assign(filters, { keyword: '', region: 'all', domain: 'all', status: 'all' })
}

function showAddModal() {
  editingId.value = null
  Object.assign(form, {
    id: 0, name: '', url: '', region: 'domestic', domain: 'tech',
    credibility: 80, fetchInterval: '1h', rssUrl: '', remark: '', todayCount: 0, status: 'active',
  })
  modalVisible.value = true
}

function handleEdit(record: Source) {
  editingId.value = record.id
  Object.assign(form, { ...record })
  modalVisible.value = true
}

async function handleDelete(id: number) {
  try {
    await sourceApi.delete(id)
    sources.value = await sourceApi.getList()
    message.success('删除成功')
  } catch {
    message.error('删除失败')
  }
}

async function handleToggle(id: number, val: boolean) {
  try {
    await sourceApi.update(id, { status: val ? 'active' : 'inactive' })
    sources.value = await sourceApi.getList()
    message.success(val ? '已启用' : '已禁用')
  } catch {
    message.error('操作失败')
  }
}

async function handleSubmit() {
  if (!form.name || !form.url) {
    message.error('来源名称和网址不能为空')
    return
  }
  try {
    if (editingId.value) {
      await sourceApi.update(editingId.value, { ...form })
      message.success('修改成功')
    } else {
      await sourceApi.create({ ...form })
      message.success('新增成功')
    }
    sources.value = await sourceApi.getList()
    modalVisible.value = false
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

async function handleTestFetch(record: Source) {
  testingSource.value = record
  testLoading.value = true
  testResult.value = []
  testModalVisible.value = true
  await new Promise((r) => setTimeout(r, 1500))
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
</script>

<style scoped>
.source-manage :deep(.ant-progress-inner) {
  background: #f0f0f0;
}
</style>
