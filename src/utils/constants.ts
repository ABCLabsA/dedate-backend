// 用户相关常量
export const USER_CACHE_KEY = 'user_cache';
export const USER_CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟

// 评论相关常量
export const COMMENT_CACHE_KEYS = {
  USER: 'user:',
  PROJECT: 'project:',
  COMMENT_COUNT: 'comment_count:',
  COMMENT_THREAD: 'comment_thread:',
  COMMENT_REPLIES: 'comment_replies:'
} as const;

export const COMMENT_CACHE_TTL = {
  USER: 5 * 60,        // 5分钟
  PROJECT: 10 * 60,    // 10分钟
  COMMENT_COUNT: 60,   // 1分钟
  COMMENT_THREAD: 2 * 60,  // 2分钟
  COMMENT_REPLIES: 2 * 60  // 2分钟
} as const;

// 数据库查询优化常量
export const DB_SELECT_FIELDS = {
  USER_BRIEF: { id: true, name: true, avatar: true },
  PROJECT_BASIC: { id: true, name: true },
  COMMENT_BASIC: { id: true, projectId: true, parentId: true, rootId: true },
  COMMENT_FULL: { 
    id: true, 
    projectId: true, 
    userId: true, 
    content: true, 
    parentId: true, 
    rootId: true, 
    replyToId: true,
    likesCount: true,
    dislikesCount: true,
    repliesCount: true,
    isDeleted: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true
  }
} as const;

// 异步操作延迟常量
export const ASYNC_DELAY = {
  IMMEDIATE: 0,
  SHORT: 100,      // 100ms
  MEDIUM: 500,     // 500ms
  LONG: 1000       // 1秒
} as const;