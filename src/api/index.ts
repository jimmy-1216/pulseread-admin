/**
 * PulseRead 后台管理系统 API 接口定义
 * 使用模块级可变 Mock 数据，CRUD 操作在内存中持久生效（刷新页面后重置）
 * 接入真实后端时：将各方法体替换为 request.get/post/put/delete 调用即可
 */
import type { Article, User, Feedback, NoiseConfig } from '@/types'
import {
  MOCK_ARTICLES,
  MOCK_USERS,
  MOCK_FEEDBACKS,
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_TREND_DATA,
  MOCK_DOMAIN_DISTRIBUTION,
  DEFAULT_NOISE_CONFIG,
  MOCK_SOURCES,
  MOCK_RADAR_WORDS,
} from '@/utils/mockData'
import type { Source } from '@/types'

// ---- 模块级可变 Mock 数据（内存持久化） ----
let _articles: Article[] = [...MOCK_ARTICLES]
let _users: User[] = [...MOCK_USERS]
let _feedbacks: Feedback[] = [...MOCK_FEEDBACKS]
let _noiseConfig: NoiseConfig = { ...DEFAULT_NOISE_CONFIG }
let _sources: Source[] = [...MOCK_SOURCES]
let _radarWords: string[] = [...MOCK_RADAR_WORDS]

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ---- 认证 ----
export const authApi = {
  login: async (email: string, password: string) => {
    await delay(800)
    if (email === 'admin@pulseread.com' && password === 'admin123') {
      return {
        token: 'mock_admin_token_' + Date.now(),
        user: { id: 1, name: '管理员', email, role: 'admin' as const },
      }
    }
    throw new Error('邮箱或密码错误')
  },
  logout: async () => {
    await delay(200)
  },
}

// ---- 仪表盘 ----
export const dashboardApi = {
  getStats: async () => {
    await delay(300)
    return { ...MOCK_DASHBOARD_STATS, totalArticles: _articles.length }
  },
  getRecentActivities: async () => {
    await delay(200)
    return MOCK_RECENT_ACTIVITIES
  },
  getTrendData: async (range: '7days' | '30days' | '90days') => {
    await delay(300)
    return MOCK_TREND_DATA[range]
  },
  getDomainDistribution: async () => {
    await delay(200)
    return MOCK_DOMAIN_DISTRIBUTION
  },
}

// ---- 资讯管理 ----
export const articleApi = {
  getList: async (params?: {
    keyword?: string
    domain?: string
    region?: string
    scoreRange?: string
    page?: number
    pageSize?: number
  }) => {
    await delay()
    let list = [..._articles]
    if (params?.keyword) {
      list = list.filter(
        (a) =>
          a.title.includes(params.keyword!) ||
          a.source.includes(params.keyword!),
      )
    }
    if (params?.domain && params.domain !== 'all') {
      list = list.filter((a) => a.domain === params.domain)
    }
    if (params?.region && params.region !== 'all') {
      list = list.filter((a) => a.region === params.region)
    }
    if (params?.scoreRange === 'high') {
      list = list.filter((a) => a.aiScore >= 80)
    } else if (params?.scoreRange === 'medium') {
      list = list.filter((a) => a.aiScore >= 60 && a.aiScore < 80)
    } else if (params?.scoreRange === 'low') {
      list = list.filter((a) => a.aiScore < 60)
    }
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const total = list.length
    const data = list.slice((page - 1) * pageSize, page * pageSize)
    return { list: data, total, page, pageSize }
  },
  getById: async (id: number) => {
    await delay(200)
    return _articles.find((a) => a.id === id) || null
  },
  create: async (article: Partial<Article>) => {
    await delay(500)
    const newArticle: Article = {
      id: Date.now(),
      title: article.title || '新资讯',
      summary: article.summary || '',
      domain: article.domain || 'tech',
      region: article.region || 'domestic',
      source: article.source || '未知来源',
      aiScore: article.aiScore || 70,
      publishTime: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      isLiked: false,
      isCollected: false,
      tags: article.tags || [],
      ...article,
    } as Article
    _articles.unshift(newArticle)
    return newArticle
  },
  update: async (id: number, article: Partial<Article>) => {
    await delay()
    const idx = _articles.findIndex((a) => a.id === id)
    if (idx !== -1) {
      _articles[idx] = { ..._articles[idx], ...article }
      return _articles[idx]
    }
    throw new Error('资讯不存在')
  },
  delete: async (id: number) => {
    await delay(300)
    const idx = _articles.findIndex((a) => a.id === id)
    if (idx !== -1) _articles.splice(idx, 1)
    return true
  },
  batchDelete: async (ids: number[]) => {
    await delay(500)
    _articles = _articles.filter((a) => !ids.includes(a.id))
    return true
  },
}

// ---- 用户管理 ----
export const userApi = {
  getList: async (params?: {
    keyword?: string
    plan?: string
    status?: string
    page?: number
    pageSize?: number
  }) => {
    await delay()
    let list = [..._users]
    if (params?.keyword) {
      list = list.filter(
        (u) =>
          u.nickname.includes(params.keyword!) ||
          (u.phone && u.phone.includes(params.keyword!)),
      )
    }
    if (params?.plan && params.plan !== 'all') {
      list = list.filter((u) => u.plan === params.plan)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((u) => u.status === params.status)
    }
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const total = list.length
    const data = list.slice((page - 1) * pageSize, page * pageSize)
    return { list: data, total, page, pageSize }
  },
  ban: async (id: number) => {
    await delay(300)
    const user = _users.find((u) => u.id === id)
    if (user) user.status = 'banned'
    return true
  },
  unban: async (id: number) => {
    await delay(300)
    const user = _users.find((u) => u.id === id)
    if (user) user.status = 'active'
    return true
  },
}

// ---- 用户反馈 ----
export const feedbackApi = {
  getList: async (params?: {
    status?: string
    type?: string
    page?: number
    pageSize?: number
  }) => {
    await delay()
    let list = [..._feedbacks]
    if (params?.status && params.status !== 'all') {
      list = list.filter((f) => f.status === params.status)
    }
    if (params?.type && params.type !== 'all') {
      list = list.filter((f) => f.type === params.type)
    }
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const total = list.length
    // 全量待处理数量（不受分页影响）
    const pendingTotal = _feedbacks.filter((f) => f.status === 'pending').length
    const data = list.slice((page - 1) * pageSize, page * pageSize)
    return { list: data, total, page, pageSize, pendingTotal }
  },
  reply: async (id: number, content: string) => {
    await delay()
    const fb = _feedbacks.find((f) => f.id === id)
    if (fb) {
      fb.status = 'replied'
      fb.replyContent = content
      fb.replyTime = new Date().toISOString()
    }
    return true
  },
  updateStatus: async (id: number, status: string) => {
    await delay(300)
    const fb = _feedbacks.find((f) => f.id === id)
    if (fb) fb.status = status as Feedback['status']
    return true
  },
}

// ---- 数据来源 ----
export const sourceApi = {
  getList: async () => {
    await delay(300)
    return [..._sources]
  },
  create: async (source: Partial<Source>) => {
    await delay(400)
    const newSource: Source = {
      id: Date.now(),
      name: source.name || '',
      url: source.url || '',
      region: source.region || 'domestic',
      domain: source.domain || 'tech',
      credibility: source.credibility || 80,
      fetchInterval: source.fetchInterval || '1h',
      rssUrl: source.rssUrl || '',
      remark: source.remark || '',
      todayCount: 0,
      status: 'active',
      ...source,
    } as Source
    _sources.unshift(newSource)
    return newSource
  },
  update: async (id: number, data: Partial<Source>) => {
    await delay(300)
    const idx = _sources.findIndex(s => s.id === id)
    if (idx !== -1) {
      _sources[idx] = { ..._sources[idx], ...data }
      return _sources[idx]
    }
    throw new Error('来源不存在')
  },
  delete: async (id: number) => {
    await delay(200)
    _sources = _sources.filter(s => s.id !== id)
    return true
  },
}

// ---- 雷达词 ----
export const radarApi = {
  getList: async () => {
    await delay(200)
    return [..._radarWords]
  },
  add: async (word: string) => {
    await delay(200)
    if (!_radarWords.includes(word)) _radarWords.push(word)
    return [..._radarWords]
  },
  remove: async (word: string) => {
    await delay(200)
    _radarWords = _radarWords.filter(w => w !== word)
    return [..._radarWords]
  },
}

// ---- 领域管理 ----
interface DomainItem {
  key: string
  label: string
  icon: string
  description: string
  color: string
  status: 'active' | 'inactive'
}

let _domains: DomainItem[] = [
  { key: 'tech', label: '科技', icon: '💻', description: '前沿技术、AI、芯片、云计算', color: '#1677FF', status: 'active' },
  { key: 'finance', label: '财经', icon: '📈', description: '宏观经济、股市、投融资', color: '#FA8C16', status: 'active' },
  { key: 'policy', label: '政策', icon: '🏛️', description: '监管政策、法律法规、贸易', color: '#52C41A', status: 'active' },
  { key: 'commerce', label: '商情', icon: '📋', description: '招投标、商业情报、竞争分析', color: '#EB2F96', status: 'active' },
]

export const domainApi = {
  getList: async () => {
    await delay(200)
    return [..._domains]
  },
  create: async (domain: DomainItem) => {
    await delay(300)
    if (_domains.some(d => d.key === domain.key)) throw new Error('领域标识已存在')
    _domains.push({ ...domain, status: domain.status || 'active' })
    return [..._domains]
  },
  update: async (key: string, data: Partial<DomainItem>) => {
    await delay(300)
    const idx = _domains.findIndex(d => d.key === key)
    if (idx !== -1) {
      _domains[idx] = { ..._domains[idx], ...data }
      return _domains[idx]
    }
    throw new Error('领域不存在')
  },
  delete: async (key: string) => {
    await delay(200)
    _domains = _domains.filter(d => d.key !== key)
    return true
  },
}

// 兼容旧的 SourceManage 导入
export const getSources = sourceApi.getList
export const addSource = sourceApi.create
export const updateSource = sourceApi.update
export const deleteSource = sourceApi.delete

// ---- 系统配置 ----
export const settingsApi = {
  getNoiseConfig: async (): Promise<NoiseConfig> => {
    await delay(300)
    return { ..._noiseConfig }
  },
  saveNoiseConfig: async (config: NoiseConfig) => {
    await delay(500)
    _noiseConfig = { ...config }
    return true
  },
}
