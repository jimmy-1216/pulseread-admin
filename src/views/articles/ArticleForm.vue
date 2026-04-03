<template>
  <div class="article-form">
    <a-card :title="isEdit ? '编辑资讯' : '新增资讯'">
      <template #extra>
        <a-button @click="$router.back()">返回</a-button>
      </template>

      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-row :gutter="24">
          <a-col :span="16">
            <a-form-item label="资讯标题" name="title">
              <a-input v-model:value="formState.title" placeholder="请输入资讯标题" />
            </a-form-item>

            <a-form-item label="摘要" name="summary">
              <a-textarea
                v-model:value="formState.summary"
                placeholder="请输入资讯摘要（100字以内）"
                :rows="3"
                :maxlength="200"
                show-count
              />
            </a-form-item>

            <a-form-item label="标签">
              <a-select
                v-model:value="formState.tags"
                mode="tags"
                placeholder="输入标签后按 Enter 添加"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item label="领域" name="domain">
              <a-select v-model:value="formState.domain" style="width: 100%">
                <a-select-option value="tech">科技</a-select-option>
                <a-select-option value="finance">财经</a-select-option>
                <a-select-option value="policy">政策</a-select-option>
                <a-select-option value="commerce">商情</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="地区" name="region">
              <a-select v-model:value="formState.region" style="width: 100%">
                <a-select-option value="domestic">国内</a-select-option>
                <a-select-option value="international">国际</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="来源" name="source">
              <a-input v-model:value="formState.source" placeholder="如：新华社、TechCrunch" />
            </a-form-item>

            <a-form-item label="AI 评分" name="aiScore">
              <a-slider
                v-model:value="formState.aiScore"
                :min="0"
                :max="100"
                :marks="{ 0: '0', 60: '60', 75: '75', 88: '88', 100: '100' }"
              />
              <div style="text-align: center; color: #00B96B; font-weight: 600; margin-top: 8px">
                当前评分: {{ formState.aiScore }}
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item style="margin-top: 16px">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              {{ isEdit ? '保存修改' : '发布资讯' }}
            </a-button>
            <a-button @click="$router.back()">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleApi } from '@/api'
import { message } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)

const formState = reactive({
  title: '',
  summary: '',
  domain: 'tech' as string,
  region: 'domestic' as string,
  source: '',
  aiScore: 75,
  tags: [] as string[],
})

const rules = {
  title: [{ required: true, message: '请输入资讯标题', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择领域', trigger: 'change' }],
  region: [{ required: true, message: '请选择地区', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }],
}

async function handleSubmit() {
  submitting.value = true
  try {
    if (isEdit.value) {
      await articleApi.update(Number(route.params.id), formState)
      message.success('修改成功')
    } else {
      await articleApi.create(formState)
      message.success('发布成功')
    }
    router.push('/articles')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const article = await articleApi.getById(Number(route.params.id))
    if (article) {
      Object.assign(formState, article)
    }
  }
})
</script>
