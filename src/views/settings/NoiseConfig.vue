<template>
  <div class="noise-config">
    <a-row :gutter="[16, 16]">
      <!-- 质量阈值配置 -->
      <a-col :span="12">
        <a-card title="质量阈值配置">
          <a-form layout="vertical">
            <a-form-item>
              <template #label>
                <span>高质量阈值</span>
                <a-tooltip title="AI 评分高于此值的资讯标记为高质量">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #999" />
                </a-tooltip>
              </template>
              <a-row align="middle" :gutter="16">
                <a-col :span="18">
                  <a-slider
                    v-model:value="config.highQualityThreshold"
                    :min="0"
                    :max="100"
                    :marks="{ 0: '0', 60: '60', 75: '75', 88: '88', 100: '100' }"
                  />
                </a-col>
                <a-col :span="6">
                  <a-input-number
                    v-model:value="config.highQualityThreshold"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                  />
                </a-col>
              </a-row>
            </a-form-item>

            <a-form-item>
              <template #label>
                <span>中等质量阈值</span>
                <a-tooltip title="AI 评分在此值到高质量阈值之间的资讯标记为中等质量">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #999" />
                </a-tooltip>
              </template>
              <a-row align="middle" :gutter="16">
                <a-col :span="18">
                  <a-slider
                    v-model:value="config.mediumQualityThreshold"
                    :min="0"
                    :max="100"
                    :marks="{ 0: '0', 60: '60', 75: '75', 88: '88', 100: '100' }"
                  />
                </a-col>
                <a-col :span="6">
                  <a-input-number
                    v-model:value="config.mediumQualityThreshold"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                  />
                </a-col>
              </a-row>
            </a-form-item>

            <a-form-item>
              <template #label>
                <span>过滤阈值</span>
                <a-tooltip title="AI 评分低于此值的资讯将被过滤，不展示给用户">
                  <QuestionCircleOutlined style="margin-left: 4px; color: #999" />
                </a-tooltip>
              </template>
              <a-row align="middle" :gutter="16">
                <a-col :span="18">
                  <a-slider
                    v-model:value="config.filterThreshold"
                    :min="0"
                    :max="100"
                    :marks="{ 0: '0', 40: '40', 60: '60', 100: '100' }"
                  />
                </a-col>
                <a-col :span="6">
                  <a-input-number
                    v-model:value="config.filterThreshold"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                  />
                </a-col>
              </a-row>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 过滤规则 -->
      <a-col :span="12">
        <a-card title="过滤规则">
          <a-form layout="vertical">
            <a-row :gutter="[16, 8]">
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">广告过滤</span>
                  <a-switch v-model:checked="config.adFilter" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">标题党过滤</span>
                  <a-switch v-model:checked="config.titleFilter" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">低质量来源过滤</span>
                  <a-switch v-model:checked="config.lowQualitySourceFilter" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">重复内容合并</span>
                  <a-switch v-model:checked="config.duplicateMerge" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">低俗内容检测</span>
                  <a-switch v-model:checked="config.obsceneDetection" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="switch-item">
                  <span class="switch-label">付费墙过滤</span>
                  <a-switch v-model:checked="config.paywallFilter" />
                </div>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-col>

      <!-- 去重配置 -->
      <a-col :span="12">
        <a-card title="去重配置">
          <a-form layout="vertical">
            <a-form-item label="标题相似度阈值 (%)">
              <a-row align="middle" :gutter="16">
                <a-col :span="18">
                  <a-slider v-model:value="config.titleSimilarity" :min="50" :max="100" />
                </a-col>
                <a-col :span="6">
                  <a-input-number v-model:value="config.titleSimilarity" :min="50" :max="100" style="width: 100%" />
                </a-col>
              </a-row>
            </a-form-item>

            <a-form-item label="内容相似度阈值 (%)">
              <a-row align="middle" :gutter="16">
                <a-col :span="18">
                  <a-slider v-model:value="config.contentSimilarity" :min="50" :max="100" />
                </a-col>
                <a-col :span="6">
                  <a-input-number v-model:value="config.contentSimilarity" :min="50" :max="100" style="width: 100%" />
                </a-col>
              </a-row>
            </a-form-item>

            <a-form-item label="去重时间窗口 (小时)">
              <a-input-number
                v-model:value="config.duplicateTimeWindow"
                :min="1"
                :max="168"
                style="width: 100%"
                addon-after="小时"
              />
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 来源可信度配置 -->
      <a-col :span="12">
        <a-card title="来源可信度配置">
          <div class="source-list">
            <div
              v-for="(score, source) in config.sourceCredibility"
              :key="source"
              class="source-item"
            >
              <span class="source-name">{{ source }}</span>
              <a-input-number
                :value="score"
                :min="-10"
                :max="10"
                size="small"
                style="width: 80px"
                @change="(val: number) => updateSourceScore(source as string, val)"
              />
              <span :class="score > 0 ? 'score-positive' : score < 0 ? 'score-negative' : 'score-neutral'">
                {{ score > 0 ? `+${score}` : score }}
              </span>
            </div>
          </div>
          <a-button type="dashed" block style="margin-top: 12px" @click="addSourceVisible = true">
            <PlusOutlined /> 添加来源
          </a-button>
        </a-card>
      </a-col>
    </a-row>

    <!-- 保存按钮 -->
    <div class="save-area">
      <a-button @click="resetConfig" style="margin-right: 12px">重置默认</a-button>
      <a-button type="primary" :loading="saving" @click="handleSave">
        保存配置
      </a-button>
    </div>

    <!-- 添加来源弹窗 -->
    <a-modal
      v-model:open="addSourceVisible"
      title="添加来源"
      ok-text="添加"
      cancel-text="取消"
      @ok="handleAddSource"
    >
      <a-form layout="vertical">
        <a-form-item label="来源名称">
          <a-input v-model:value="newSource.name" placeholder="如：新华社、TechCrunch" />
        </a-form-item>
        <a-form-item label="可信度分值 (-10 ~ +10)">
          <a-input-number v-model:value="newSource.score" :min="-10" :max="10" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { settingsApi } from '@/api'
import type { NoiseConfig } from '@/types'
import { DEFAULT_NOISE_CONFIG } from '@/utils/mockData'
import { message } from 'ant-design-vue'
import { QuestionCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'

const saving = ref(false)
const addSourceVisible = ref(false)
const config = reactive<NoiseConfig>({ ...DEFAULT_NOISE_CONFIG, sourceCredibility: { ...DEFAULT_NOISE_CONFIG.sourceCredibility } })
const newSource = reactive({ name: '', score: 5 })

function updateSourceScore(source: string, val: number) {
  config.sourceCredibility[source] = val
}

function handleAddSource() {
  if (!newSource.name.trim()) {
    message.warning('请输入来源名称')
    return
  }
  config.sourceCredibility[newSource.name] = newSource.score
  newSource.name = ''
  newSource.score = 5
  addSourceVisible.value = false
  message.success('来源已添加')
}

async function handleSave() {
  saving.value = true
  try {
    await settingsApi.saveNoiseConfig(config)
    message.success('配置保存成功')
  } finally {
    saving.value = false
  }
}

function resetConfig() {
  Object.assign(config, { ...DEFAULT_NOISE_CONFIG, sourceCredibility: { ...DEFAULT_NOISE_CONFIG.sourceCredibility } })
  message.info('已重置为默认配置')
}

onMounted(async () => {
  const data = await settingsApi.getNoiseConfig()
  Object.assign(config, data)
})
</script>

<style scoped>
.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.switch-label { font-size: 13px; color: #333; }
.source-list { display: flex; flex-direction: column; gap: 8px; }
.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f5f5f5;
}
.source-name { font-size: 13px; color: #333; flex: 1; }
.score-positive { color: #52C41A; font-size: 12px; width: 32px; text-align: right; }
.score-negative { color: #FF4D4F; font-size: 12px; width: 32px; text-align: right; }
.score-neutral { color: #999; font-size: 12px; width: 32px; text-align: right; }
.save-area {
  margin-top: 24px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
}
</style>
