// PulseRead 后台管理系统 - 共享业务类型
// ============================================================

export type ArticleDomain = 'tech' | 'finance' | 'policy' | 'commerce'
export type ArticleRegion = 'domestic' | 'international'
export type UserPlan = 'free' | 'pro' | 'enterprise'
export type UserStatus = 'active' | 'banned'
export type FeedbackType = 'bug' | 'feature' | 'content' | 'other'
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed'
export type SourceStatus = 'active' | 'inactive'
export type SourceProtocol = 'rss' | 'scrape' | 'api'
export type SourceLanguage = 'zh' | 'en' | 'multi'
export type SourceHealthStatus = 'healthy' | 'warning' | 'error'
export type DedupStrategy = 'url' | 'title' | 'content_hash'
export type AdminRole = 'admin' | 'editor' | 'viewer'

export interface OptionItem<T extends string = string> {
  label: string
  value: T
  color?: string
}

export interface SummaryStat {
  label: string
  value: number | string
  unit?: string
  delta?: number
  trend?: 'up' | 'down' | 'flat'
  color?: string
  description?: string
}

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
  viewCount: number
  likeCount: number
  collectCount?: number
  isLiked?: boolean
  isCollected?: boolean
  status: 'published' | 'draft' | 'hidden'
}

export interface ArticlePayload {
  title: string
  summary: string
  domain: ArticleDomain
  region: ArticleRegion
  source: string
  aiScore: number
  tags: string[]
}

export interface ArticleQuery {
  keyword?: string
  domain?: ArticleDomain | 'all'
  region?: ArticleRegion | 'all'
  scoreRange?: 'all' | 'high' | 'medium' | 'low'
  page?: number
  pageSize?: number
}

export interface User {
  id: number
  nickname: string
  avatar?: string
  phone?: string
  email?: string
  plan: UserPlan
  subscribedDomains: ArticleDomain[]
  radarWords: string[]
  noiseLevel: 'open' | 'focus' | 'major' | 'quake'
  registerTime: string
  lastActiveTime: string
  readCount: number
  status: UserStatus
  regionPref?: 'all' | 'domestic' | 'international'
  blockedSentiments?: string[]
  enableAutoTranslate?: boolean
  enableNotification?: boolean
  readingMode?: 'comfortable' | 'compact'
}

export interface UserQuery {
  keyword?: string
  plan?: UserPlan | 'all'
  status?: UserStatus | 'all'
  page?: number
  pageSize?: number
}

export interface Source {
  id: number
  name: string
  url: string
  region: ArticleRegion
  domain: ArticleDomain
  credibility: number
  fetchInterval: string
  rssUrl: string
  remark: string
  todayCount: number
  status: SourceStatus
  sourceType: SourceProtocol
  language: SourceLanguage
  priority: number
  parserType: SourceProtocol
  dedupStrategy: DedupStrategy
  categoryTags: string[]
  lastFetchTime: string
  lastSuccessTime: string
  successRate: number
  failCount: number
  avgLatency: number
  healthStatus: SourceHealthStatus
  lastError?: string
}

export interface SourcePayload {
  name: string
  url: string
  region: ArticleRegion
  domain: ArticleDomain
  credibility: number
  fetchInterval: string
  rssUrl: string
  remark: string
  todayCount?: number
  status: SourceStatus
  sourceType: SourceProtocol
  language: SourceLanguage
  priority: number
  parserType: SourceProtocol
  dedupStrategy: DedupStrategy
  categoryTags: string[]
  lastFetchTime?: string
  lastSuccessTime?: string
  successRate?: number
  failCount?: number
  avgLatency?: number
  healthStatus: SourceHealthStatus
  lastError?: string
}

export interface Feedback {
  id: number
  userId: number
  userNickname: string
  type: FeedbackType
  content: string
  status: FeedbackStatus
  createTime: string
  replyContent?: string
  replyTime?: string
}

export interface FeedbackQuery {
  status?: FeedbackStatus | 'all'
  type?: FeedbackType | 'all'
  page?: number
  pageSize?: number
}

export interface DashboardStats {
  totalArticles: number
  totalArticlesDelta: number
  activeUsers: number
  activeUsersDelta: number
  pendingFeedbacks: number
  pendingFeedbacksDelta: number
  systemUptime: string
}

export interface RecentActivity {
  id: number
  content: string
  status: 'success' | 'pending' | 'warning' | 'error'
  timeAgo: string
}

export interface TrendPoint {
  dates: string[]
  values: number[]
}

export interface DistributionItem {
  name: string
  value: number
}

export interface DomainItem {
  key: ArticleDomain
  label: string
  icon: string
  description: string
  color: string
  status: SourceStatus
}

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

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: AdminRole
  avatar?: string
}

export interface MenuMeta {
  key: string
  label: string
  path?: string
  icon?: string
  badge?: number
  children?: MenuMeta[]
}
