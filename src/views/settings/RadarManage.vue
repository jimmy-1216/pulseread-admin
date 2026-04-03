<template>
  <div class="radar-manage">
    <a-card title="雷达词管理" :loading="loading">
      <template #extra>
        <span style="color: #999; font-size: 13px">全局推荐雷达词，用户可在偏好设置中选用</span>
      </template>

      <div class="radar-tags">
        <a-tag
          v-for="word in radarWords"
          :key="word"
          closable
          color="green"
          style="margin-bottom: 8px; font-size: 14px; padding: 4px 12px"
          @close="removeWord(word)"
        >
          {{ word }}
        </a-tag>

        <a-input
          v-if="inputVisible"
          ref="inputRef"
          v-model:value="inputValue"
          type="text"
          size="small"
          style="width: 120px; margin-bottom: 8px"
          @blur="handleInputConfirm"
          @keyup.enter="handleInputConfirm"
        />
        <a-tag
          v-else
          style="border-style: dashed; cursor: pointer; margin-bottom: 8px"
          @click="showInput"
        >
          <PlusOutlined /> 添加雷达词
        </a-tag>
      </div>

      <a-divider />

      <div style="color: #999; font-size: 13px">
        共 {{ radarWords.length }} 个推荐雷达词。用户在 Onboarding 和偏好设置页面可从此列表中选择添加到个人雷达。
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { radarApi } from '@/api'
import { message } from 'ant-design-vue'

const radarWords = ref<string[]>([])
const loading = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref()

onMounted(async () => {
  loading.value = true
  try {
    radarWords.value = await radarApi.getList()
  } finally {
    loading.value = false
  }
})

function showInput() {
  inputVisible.value = true
  nextTick(() => inputRef.value?.focus())
}

async function handleInputConfirm() {
  const word = inputValue.value.trim()
  if (word && !radarWords.value.includes(word)) {
    try {
      radarWords.value = await radarApi.add(word)
      message.success(`已添加「${word}」`)
    } catch {
      message.error('添加失败')
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

async function removeWord(word: string) {
  try {
    radarWords.value = await radarApi.remove(word)
    message.success(`已删除「${word}」`)
  } catch {
    message.error('删除失败')
  }
}
</script>

<style scoped>
.radar-tags { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
