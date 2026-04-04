/**
 * PulseRead 后台管理系统 API 接口定义
 * 使用模块级可变 Mock 数据，CRUD 操作在内存中持久生效（刷新页面后重置）
 * 接入真实后端时：将各方法体替换为 request.get/post/put/delete 调用即可
 */
import type {
  AdminUser,
  Article,
  ArticlePayload,
  ArticleQuery,
  DashboardStats,
  DistributionItem,
  DomainItem,
  Feedback,
  FeedbackQuery,
  FeedbackStatus,
  NoiseConfig,
  PaginatedResult,
  RecentActivity,
  Source,
  SourcePayload,
  TrendPoint,
  User,
  UserQuery,
} from '@/types'
import {
  DEFAULT_NOISE_CONFIG,
  MOCK_ARTICLES,
  MOCK_DASHBOARD_STATS,
  MOCK_DOMAIN_DISTRIBUTION,
  MOCK_FEEDBACKS,
  MOCK_RADAR_WORDS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_SOURCES,
  MOCK_TREND_DATA,
  MOCK_USERS,
} from '@/utils/mockData'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))

let articles: Article[] = clone(MOCK_ARTICLES)
let users: User[] = clone(MOCK_USERS)
let feedbacks: Feedback[] = clone(MOCK_FEEDBACKS)
let noiseConfig: NoiseConfig = clone(DEFAULT_NOISE_CONFIG)
let sources: Source[] = clone(MOCK_SOURCES)
let radarWords: string[] = clone(MOCK_RADAR_WORDS)
let domains: DomainItem[] = [
  { key: 'tech', label: '科技', icon: '💻', description: '前沿技术、AI、芯片、云计算', color: '#1677FF', status: 'active' },
  { key: 'finance', label: '财经', icon: '📈', description: '宏观经济、股市、投融资', color: '#FA8C16', status: 'active' },
  { key: 'policy', label: '政策', icon: '🏛️', description: '监管政策、法律法规、贸易', color: '#52C41A', status: 'active' },
  { key: 'commerce', label: '商情', icon: '📋', description: '招投标、商业情报、竞争分析', color: '#EB2F96', status: 'active' },
]

const normalizePage = (page?: number, pageSize?: number) => ({
  page: page || 1,
  pageSize: pageSize || 10,
})

const paginate = <T>(list: T[], page?: number, pageSize?: number): PaginatedResult<T> => {
  const normalized = normalizePage(page, pageSize)
  return {
    list: list.slice((normalized.page - 1) * normalized.pageSize, normalized.page * normalized.pageSize),
    total: list.length,
    page: normalized.page,
    pageSize: normalized.pageSize,
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    await delay(700)
    if (email === 'admin@pulseread.com' && password === 'admin123') {
      return {
        token: `mock_admin_token_${Date.now()}`,
        user: { id: 1, name: '管理员', email, role: 'admin' },
      }
    }
    throw new Error('邮箱或密码错误')
  },
  async logout() {
    await delay(200)
    return true
  },
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    await delay(200)
    return {
      ...clone(MOCK_DASHBOARD_STATS),
      totalArticles: articles.length,
      pendingFeedbacks: feedbacks.filter((item) => item.status === 'pending').length,
      activeUsers: users.filter((item) => item.status === 'active').length,
    }
  },
  async getRecentActivities(): Promise<RecentActivity[]> {
    await delay(180)
    return clone(MOCK_RECENT_ACTIVITIES)
  },
  async getTrendData(range: '7days' | '30days' | '90days'): Promise<TrendPoint> {
    await delay(240)
    return clone(MOCK_TREND_DATA[range])
  },
  async getDomainDistribution(): Promise<DistributionItem[]> {
    await delay(200)
    return clone(MOCK_DOMAIN_DISTRIBUTION)
  },
}

export const articleApi = {
  async getList(params: ArticleQuery = {}): Promise<PaginatedResult<Article>> {
    await delay()
    let list = [...articles]

    if (params.keyword) {
      list = list.filter((item) => item.title.includes(params.keyword!) || item.source.includes(params.keyword!))
    }

    if (params.domain && params.domain !== 'all') {
      list = list.filter((item) => item.domain === params.domain)
    }

    if (params.region && params.region !== 'all') {
      list = list.filter((item) => item.region === params.region)
    }

    if (params.scoreRange === 'high') {
      list = list.filter((item) => item.aiScore >= 80)
    } else if (params.scoreRange === 'medium') {
      list = list.filter((item) => item.aiScore >= 60 && item.aiScore < 80)
    } else if (params.scoreRange === 'low') {
      list = list.filter((item) => item.aiScore < 60)
    }

    return paginate(list, params.page, params.pageSize)
  },

  async getById(id: number): Promise<Article | null> {
    await delay(180)
    return clone(articles.find((item) => item.id === id) || null)
  },

  async create(payload: ArticlePayload): Promise<Article> {
    await delay(400)
    const article: Article = {
      id: Date.now(),
      title: payload.title,
      summary: payload.summary,
      domain: payload.domain,
      region: payload.region,
      source: payload.source,
      aiScore: payload.aiScore,
      tags: payload.tags,
      publishTime: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      isLiked: false,
      isCollected: false,
      status: 'published',
    }
    articles.unshift(article)
    return clone(article)
  },

  async update(id: number, payload: Partial<ArticlePayload>): Promise<Article> {
    await delay(320)
    const index = articles.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('资讯不存在')
    }
    articles[index] = { ...articles[index], ...payload }
    return clone(articles[index])
  },

  async delete(id: number) {
    await delay(260)
    articles = articles.filter((item) => item.id !== id)
    return true
  },

  async batchDelete(ids: number[]) {
    await delay(360)
    articles = articles.filter((item) => !ids.includes(item.id))
    return true
  },
}

export const userApi = {
  async getList(params: UserQuery = {}): Promise<PaginatedResult<User>> {
    await delay()
    let list = [...users]

    if (params.keyword) {
      list = list.filter(
        (item) => item.nickname.includes(params.keyword!) || item.phone?.includes(params.keyword!) || item.email?.includes(params.keyword!),
      )
    }

    if (params.plan && params.plan !== 'all') {
      list = list.filter((item) => item.plan === params.plan)
    }

    if (params.status && params.status !== 'all') {
      list = list.filter((item) => item.status === params.status)
    }

    return paginate(list, params.page, params.pageSize)
  },

  async ban(id: number) {
    await delay(240)
    const target = users.find((item) => item.id === id)
    if (target) {
      target.status = 'banned'
    }
    return true
  },

  async unban(id: number) {
    await delay(240)
    const target = users.find((item) => item.id === id)
    if (target) {
      target.status = 'active'
    }
    return true
  },
}

export const feedbackApi = {
  async getList(
    params: FeedbackQuery = {},
  ): Promise<PaginatedResult<Feedback> & { pendingTotal: number }> {
    await delay()
    let list = [...feedbacks]

    if (params.status && params.status !== 'all') {
      list = list.filter((item) => item.status === params.status)
    }

    if (params.type && params.type !== 'all') {
      list = list.filter((item) => item.type === params.type)
    }

    const paged = paginate(list, params.page, params.pageSize)
    return {
      ...paged,
      pendingTotal: feedbacks.filter((item) => item.status === 'pending').length,
    }
  },

  async reply(id: number, content: string) {
    await delay(300)
    const target = feedbacks.find((item) => item.id === id)
    if (target) {
      target.status = 'resolved'
      target.replyContent = content
      target.replyTime = new Date().toISOString()
    }
    return true
  },

  async updateStatus(id: number, status: FeedbackStatus) {
    await delay(220)
    const target = feedbacks.find((item) => item.id === id)
    if (target) {
      target.status = status
    }
    return true
  },
}

export const sourceApi = {
  async getList(): Promise<Source[]> {
    await delay(240)
    return clone(sources)
  },

  async create(payload: Partial<SourcePayload>): Promise<Source> {
    await delay(320)
    const source: Source = {
      id: Date.now(),
      name: payload.name || '',
      url: payload.url || '',
      region: payload.region || 'domestic',
      domain: payload.domain || 'tech',
      credibility: payload.credibility ?? 80,
      fetchInterval: payload.fetchInterval || '1h',
      rssUrl: payload.rssUrl || '',
      remark: payload.remark || '',
      todayCount: payload.todayCount ?? 0,
      status: payload.status || 'active',
    }
    sources.unshift(source)
    return clone(source)
  },

  async update(id: number, payload: Partial<SourcePayload>): Promise<Source> {
    await delay(300)
    const index = sources.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('来源不存在')
    }
    sources[index] = { ...sources[index], ...payload }
    return clone(sources[index])
  },

  async delete(id: number) {
    await delay(220)
    sources = sources.filter((item) => item.id !== id)
    return true
  },
}

export const radarApi = {
  async getList(): Promise<string[]> {
    await delay(180)
    return [...radarWords]
  },
  async add(word: string): Promise<string[]> {
    await delay(180)
    if (!radarWords.includes(word)) {
      radarWords.push(word)
    }
    return [...radarWords]
  },
  async remove(word: string): Promise<string[]> {
    await delay(180)
    radarWords = radarWords.filter((item) => item !== word)
    return [...radarWords]
  },
}

export const domainApi = {
  async getList(): Promise<DomainItem[]> {
    await delay(180)
    return clone(domains)
  },
  async create(payload: DomainItem): Promise<DomainItem[]> {
    await delay(260)
    if (domains.some((item) => item.key === payload.key)) {
      throw new Error('领域标识已存在')
    }
    domains.push({ ...payload })
    return clone(domains)
  },
  async update(key: DomainItem['key'], payload: Partial<DomainItem>): Promise<DomainItem> {
    await delay(240)
    const index = domains.findIndex((item) => item.key === key)
    if (index === -1) {
      throw new Error('领域不存在')
    }
    domains[index] = { ...domains[index], ...payload }
    return clone(domains[index])
  },
  async delete(key: DomainItem['key']) {
    await delay(200)
    domains = domains.filter((item) => item.key !== key)
    return true
  },
}

export const settingsApi = {
  async getNoiseConfig(): Promise<NoiseConfig> {
    await delay(220)
    return clone(noiseConfig)
  },
  async saveNoiseConfig(config: NoiseConfig) {
    await delay(360)
    noiseConfig = clone(config)
    return true
  },
}

// 兼容旧的 SourceManage 导入
export const getSources = sourceApi.getList
export const addSource = sourceApi.create
export const updateSource = sourceApi.update
export const deleteSource = sourceApi.delete
