<template>
  <div class="domain-manage">
    <a-card title="领域管理" :loading="loading">
      <template #extra>
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增领域
        </a-button>
      </template>

      <a-table :columns="columns" :data-source="domains" row-key="key" size="middle" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <span style="font-size: 20px">{{ record.icon }}</span>
          </template>
          <template v-else-if="column.key === 'color'">
            <div style="display: flex; align-items: center; gap: 8px">
              <div :style="{ width: '16px', height: '16px', borderRadius: '4px', background: record.color }"></div>
              <span style="font-size: 12px; color: #666">{{ record.color }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(val: boolean) => handleToggleStatus(record.key, val)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该领域？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.key)"
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
      :title="editingKey ? '编辑领域' : '新增领域'"
      @ok="handleSubmit"
      ok-text="保存"
      cancel-text="取消"
    >
      <a-form :model="form" layout="vertical" style="margin-top: 16px">
        <a-form-item label="领域标识（英文）" required>
          <a-input v-model:value="form.key" placeholder="如 tech" :disabled="!!editingKey" />
        </a-form-item>
        <a-form-item label="领域名称" required>
          <a-input v-model:value="form.label" placeholder="如 科技" />
        </a-form-item>
        <a-form-item label="图标（Emoji）">
          <a-input v-model:value="form.icon" placeholder="如 💻" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" placeholder="领域简介" />
        </a-form-item>
        <a-form-item label="主题色">
          <a-input v-model:value="form.color" placeholder="如 #1677FF" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { domainApi } from '@/api'

interface Domain {
  key: string
  label: string
  icon: string
  description: string
  color: string
  status: 'active' | 'inactive'
}

const domains = ref<Domain[]>([])
const loading = ref(false)

const columns = [
  { title: '图标', key: 'icon', width: 60 },
  { title: '标识', dataIndex: 'key', key: 'key', width: 100 },
  { title: '名称', dataIndex: 'label', key: 'label', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '颜色', key: 'color', width: 140 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120 },
]

const modalVisible = ref(false)
const editingKey = ref<string | null>(null)
const form = reactive<Domain>({ key: '', label: '', icon: '', description: '', color: '#1677FF', status: 'active' })

onMounted(async () => {
  loading.value = true
  try {
    domains.value = await domainApi.getList()
  } finally {
    loading.value = false
  }
})

function showAddModal() {
  editingKey.value = null
  Object.assign(form, { key: '', label: '', icon: '', description: '', color: '#1677FF', status: 'active' })
  modalVisible.value = true
}

function handleEdit(record: Domain) {
  editingKey.value = record.key
  Object.assign(form, { ...record })
  modalVisible.value = true
}

async function handleDelete(key: string) {
  try {
    await domainApi.delete(key)
    domains.value = await domainApi.getList()
    message.success('删除成功')
  } catch {
    message.error('删除失败')
  }
}

async function handleToggleStatus(key: string, val: boolean) {
  try {
    await domainApi.update(key, { status: val ? 'active' : 'inactive' })
    domains.value = await domainApi.getList()
    message.success(val ? '已启用' : '已禁用')
  } catch {
    message.error('操作失败')
  }
}

async function handleSubmit() {
  if (!form.key || !form.label) {
    message.error('标识和名称不能为空')
    return
  }
  try {
    if (editingKey.value) {
      await domainApi.update(editingKey.value, { ...form })
      message.success('修改成功')
    } else {
      await domainApi.create({ ...form })
      message.success('新增成功')
    }
    domains.value = await domainApi.getList()
    modalVisible.value = false
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}
</script>
