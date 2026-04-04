<template>
  <div class="article-form-page">
    <a-card class="form-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <div>
            <h1>{{ isEdit ? '编辑资讯' : '新增资讯' }}</h1>
            <p>统一维护资讯标题、摘要、领域标签与质量评分，用于后台内容运营与推荐分发。</p>
          </div>
        </div>
      </template>
      <template #extra>
        <a-button @click="router.back()">返回</a-button>
      </template>

      <a-form :model="formState" :rules="rules" layout="vertical" @finish="handleSubmit">
        <a-row :gutter="24">
          <a-col :xs="24" :xl="16">
            <a-form-item label="资讯标题" name="title">
              <a-input v-model:value="formState.title" placeholder="请输入资讯标题" />
            </a-form-item>

            <a-form-item label="摘要" name="summary">
              <a-textarea
                v-model:value="formState.summary"
                placeholder="请输入资讯摘要（建议 100 字以内）"
                :rows="4"
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

          <a-col :xs="24" :xl="8">
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
              <div class="score-value">当前评分：{{ formState.aiScore }}</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item class="form-actions">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              {{ isEdit ? '保存修改' : '发布资讯' }}
            </a-button>
            <a-button @click="router.back()">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { articleApi } from '@/api'
import type { ArticlePayload } from '@/types'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const isEdit = computed(() => Boolean(route.params.id))

const createInitialState = (): ArticlePayload => ({
  title: '',
  summary: '',
  domain: 'tech',
  region: 'domestic',
  source: '',
  aiScore: 75,
  tags: [],
})

const formState = reactive<ArticlePayload>(createInitialState())

const rules = {
  title: [{ required: true, message: '请输入资讯标题', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择领域', trigger: 'change' }],
  region: [{ required: true, message: '请选择地区', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }],
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload: ArticlePayload = {
      title: formState.title,
      summary: formState.summary,
      domain: formState.domain,
      region: formState.region,
      source: formState.source,
      aiScore: formState.aiScore,
      tags: [...formState.tags],
    }

    if (isEdit.value) {
      await articleApi.update(Number(route.params.id), payload)
      message.success('修改成功')
    } else {
      await articleApi.create(payload)
      message.success('发布成功')
    }

    await router.push('/articles')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!isEdit.value) {
    return
  }

  const article = await articleApi.getById(Number(route.params.id))
  if (article) {
    Object.assign(formState, {
      title: article.title,
      summary: article.summary,
      domain: article.domain,
      region: article.region,
      source: article.source,
      aiScore: article.aiScore,
      tags: [...article.tags],
    })
  }
})
</script>

<style scoped>
.article-form-page {
  display: flex;
  flex-direction: column;
}

.form-card {
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.card-title h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #141414;
}

.card-title p {
  margin: 0;
  color: #8c8c8c;
  line-height: 1.6;
}

.score-value {
  margin-top: 8px;
  text-align: center;
  color: #00b96b;
  font-weight: 600;
}

.form-actions {
  margin-top: 16px;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-body) {
  padding: 24px;
}
</style>
