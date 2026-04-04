<template>
  <div class="domain-page">
    <section class="page-header">
      <div>
        <h1>内容领域管理</h1>
        <p>维护后台的一级资讯领域，用于内容分类、来源配置与用户订阅偏好映射。</p>
      </div>
      <a-button type="primary" @click="showAddModal">
        <template #icon><PlusOutlined /></template>
        新增领域
      </a-button>
    </section>

    <a-card class="table-card" :bordered="false" :loading="loading">
      <a-table :columns="columns" :data-source="domains" row-key="key" size="middle" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <span class="domain-icon">{{ record.icon }}</span>
          </template>

          <template v-else-if="column.key === 'color'">
            <div class="color-cell">
              <span class="color-preview" :style="{ background: record.color }"></span>
              <span>{{ record.color }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(value: boolean) => handleToggleStatus(record.key, value)"
            />
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该领域？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.key)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="editingKey ? '编辑领域' : '新增领域'"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSubmit"
    >
      <a-form :model="form" layout="vertical" style="margin-top: 16px">
        <a-form-item label="领域标识" required>
          <a-select v-model:value="form.key" :disabled="!!editingKey" placeholder="请选择领域标识">
            <a-select-option value="tech">tech / 科技</a-select-option>
            <a-select-option value="finance">finance / 财经</a-select-option>
            <a-select-option value="policy">policy / 政策</a-select-option>
            <a-select-option value="commerce">commerce / 商情</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="领域名称" required>
          <a-input v-model:value="form.label" placeholder="如：科技" />
        </a-form-item>
        <a-form-item label="图标（Emoji）">
          <a-input v-model:value="form.icon" placeholder="如：💻" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" placeholder="请输入领域简介" />
        </a-form-item>
        <a-form-item label="主题色">
          <a-input v-model:value="form.color" placeholder="如：#1677FF" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { domainApi } from '@/api'
import type { ArticleDomain, DomainItem } from '@/types'

const loading = ref(false)
const domains = ref<DomainItem[]>([])
const modalVisible = ref(false)
const editingKey = ref<ArticleDomain | null>(null)

const columns = [
  { title: '图标', key: 'icon', width: 72 },
  { title: '标识', dataIndex: 'key', key: 'key', width: 120 },
  { title: '名称', dataIndex: 'label', key: 'label', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '颜色', key: 'color', width: 160 },
  { title: '状态', key: 'status', width: 120 },
  { title: '操作', key: 'action', width: 140 },
]

const createInitialForm = (): DomainItem => ({
  key: 'tech',
  label: '',
  icon: '',
  description: '',
  color: '#1677FF',
  status: 'active',
})

const form = reactive<DomainItem>(createInitialForm())

async function loadDomains() {
  loading.value = true
  try {
    domains.value = await domainApi.getList()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, createInitialForm())
}

function showAddModal() {
  editingKey.value = null
  resetForm()
  modalVisible.value = true
}

function handleEdit(record: DomainItem) {
  editingKey.value = record.key
  Object.assign(form, { ...record })
  modalVisible.value = true
}

async function handleDelete(key: ArticleDomain) {
  try {
    await domainApi.delete(key)
    await loadDomains()
    message.success('删除成功')
  } catch {
    message.error('删除失败')
  }
}

async function handleToggleStatus(key: ArticleDomain, value: boolean) {
  try {
    await domainApi.update(key, { status: value ? 'active' : 'inactive' })
    await loadDomains()
    message.success(value ? '已启用' : '已禁用')
  } catch {
    message.error('操作失败')
  }
}

async function handleSubmit() {
  if (!form.key || !form.label.trim()) {
    message.error('标识和名称不能为空')
    return
  }

  try {
    if (editingKey.value) {
      await domainApi.update(editingKey.value, {
        label: form.label,
        icon: form.icon,
        description: form.description,
        color: form.color,
        status: form.status,
      })
      message.success('修改成功')
    } else {
      await domainApi.create({ ...form })
      message.success('新增成功')
    }

    modalVisible.value = false
    await loadDomains()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '操作失败')
  }
}

onMounted(() => {
  void loadDomains()
})
</script>

<style scoped>
.domain-page {
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

.table-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.domain-icon {
  font-size: 20px;
}

.color-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #595959;
}

.color-preview {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.ant-card-body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
