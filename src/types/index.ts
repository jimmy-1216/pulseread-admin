// ============================================================
// PulseRead 后台管理系统 - 核心类型定义
// ============================================================

/** 资讯领域 */
export type ArticleDomain = 'tech' | 'finance' | 'policy' | 'commerce'

/** 地区 */
export type ArticleRegion = 'domestic' | 'international'

/** 资讯条目 */
export interface Article {
  id: number
  title: string
  summary: string
  domain: ArticleDomain
  region: ArticleRegion
  source: string
  publishTime: string
  aiScore: number
  tags: string[]
  viewCount?: number
  likeCount?: number
  status?: 'published' | 'draft' | 'hidden'
}

/** 用户信息 */
export interface User {
  id: number
  nickname: string
  avatar?: string
  phone?: string
  email?: string
  plan: 'free' | 'pro' | 'enterprise'
  subscribedDomains: ArticleDomain[]
  radarWords: string[]
  noiseLevel: 'open' | 'focus' | 'major' | 'quake'
  registerTime: string
  lastActiveTime: string
  readCount: number
  status: 'active' | 'banned'
  regionPref?: 'all' | 'domestic' | 'international'
  blockedSentiments?: string[]
  enableAutoTranslate?: boolean
  enableNotification?: boolean
  readingMode?: 'comfortable' | 'compact'
}

/** 数据来源 */
export interface Source {
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

/** 用户反馈 */
export interface Feedback {
  id: number
  userId: number
  userNickname: string
  type: 'bug' | 'feature' | 'content' | 'other'
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createTime: string
  replyContent?: string
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalArticles: number
  totalArticlesDelta: number
  activeUsers: number
  activeUsersDelta: number
  pendingFeedbacks: number
  pendingFeedbacksDelta: number
  systemUptime: string
}

/** 最近活动 */
export interface RecentActivity {
  id: number
  content: string
  status: 'success' | 'pending' | 'warning' | 'error'
  timeAgo: string
}

/** 降噪配置 */
export interface NoiseConfig {
  highQualityThreshold: number
  mediumQualityThreshold: number
  filterThreshold: number
  adFilter: boolean
  titleFilter: boolean
  lowQualitySourceFilter: boolean
  duplicateMerge: boolean
  obsceneDetection: boolean
  paywallFilter: boolean
  titleSimilarity: number
  contentSimilarity: number
  duplicateTimeWindow: number
  sourceCredibility: Record<string, number>
}

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

/** API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 管理员信息 */
export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}
