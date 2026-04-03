<template>
  <div class="region-manage">
    <a-card title="地区管理">
      <template #extra>
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增地区
        </a-button>
      </template>

      <a-table :columns="columns" :data-source="regions" row-key="key" size="middle" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sourceCount'">
            <a-tag color="blue">{{ record.sourceCount }} 个数据源</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.enabled"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(val: boolean) => handleToggle(record.key, val)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该地区？"
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
      :title="editingKey ? '编辑地区' : '新增地区'"
      @ok="handleSubmit"
      ok-text="保存"
      cancel-text="取消"
    >
      <a-form :model="form" layout="vertical" style="margin-top: 16px">
        <a-form-item label="地区标识（英文）" required>
          <a-input v-model:value="form.key" placeholder="如 domestic" :disabled="!!editingKey" />
        </a-form-item>
        <a-form-item label="地区名称" required>
          <a-input v-model:value="form.label" placeholder="如 国内" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" placeholder="地区简介" />
        </a-form-item>
        <a-form-item label="数据源数量">
          <a-input-number v-model:value="form.sourceCount" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

interface Region {
  key: string
  label: string
  description: string
  sourceCount: number
  enabled: boolean
}

const regions = ref<Region[]>([
  { key: 'domestic', label: '国内', description: '中国大陆地区资讯，含 36Kr、财联社、虎嗅等', sourceCount: 12, enabled: true },
  { key: 'international', label: '国际', description: '海外主流媒体，含 TechCrunch、Bloomberg、Reuters 等', sourceCount: 18, enabled: true },
])

const columns = [
  { title: '标识', dataIndex: 'key', key: 'key', width: 120 },
  { title: '名称', dataIndex: 'label', key: 'label', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '数据源', key: 'sourceCount', width: 130 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120 },
]

const modalVisible = ref(false)
const editingKey = ref<string | null>(null)
const form = reactive<Region>({ key: '', label: '', description: '', sourceCount: 0, enabled: true })

function showAddModal() {
  editingKey.value = null
  Object.assign(form, { key: '', label: '', description: '', sourceCount: 0, enabled: true })
  modalVisible.value = true
}

function handleEdit(record: Region) {
  editingKey.value = record.key
  Object.assign(form, { ...record })
  modalVisible.value = true
}

function handleDelete(key: string) {
  const idx = regions.value.findIndex((r) => r.key === key)
  if (idx !== -1) {
    regions.value.splice(idx, 1)
    message.success('删除成功')
  }
}

function handleToggle(key: string, val: boolean) {
  const region = regions.value.find((r) => r.key === key)
  if (region) {
    region.enabled = val
    message.success(val ? '已启用' : '已禁用')
  }
}

function handleSubmit() {
  if (!form.key || !form.label) {
    message.error('标识和名称不能为空')
    return
  }
  if (editingKey.value) {
    const idx = regions.value.findIndex((r) => r.key === editingKey.value)
    if (idx !== -1) regions.value[idx] = { ...form }
    message.success('修改成功')
  } else {
    if (regions.value.some((r) => r.key === form.key)) {
      message.error('地区标识已存在')
      return
    }
    regions.value.push({ ...form })
    message.success('新增成功')
  }
  modalVisible.value = false
}
</script>
