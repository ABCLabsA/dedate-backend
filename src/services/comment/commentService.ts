import db_client from "../../extensions/ext_db";
import logger from "../../extensions/ext_logger";
import { 
  CreateCommentPayload, 
  CommentDTO, 
  UserBriefDTO,
  RepliesQuery
} from "../../interfaces/comment/commentType";
import { generateRandomName } from "../../utils/userUtils";
import { PerformanceMonitor } from "../../utils/performanceMonitor";

// 内存缓存（避免Redis网络延迟）
const memoryCache = {
  users: new Map<string, { data: UserBriefDTO; timestamp: number }>(),
  projects: new Map<string, { data: boolean; timestamp: number }>(),
  maxAge: 5 * 60 * 1000, // 5分钟
};

/**
 * 获取用户信息（内存缓存 + 批量查询）
 */
async function fetchUserBrief(userId: string): Promise<UserBriefDTO> {
  const now = Date.now();
  const cached = memoryCache.users.get(userId);
  
  // 检查内存缓存
  if (cached && (now - cached.timestamp) < memoryCache.maxAge) {
    return cached.data;
  }

  try {
    const user = await db_client.user.findUnique({ 
      where: { id: userId },
      select: { id: true, name: true, avatar: true }
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const userBrief = { id: user.id, name: user.name, avatar: user.avatar };
    
    // 更新内存缓存
    memoryCache.users.set(userId, { data: userBrief, timestamp: now });
    
    return userBrief;
  } catch (error) {
    logger.error('获取用户信息失败', error);
    
    // 返回fallback用户信息
    const fallbackUser = {
      id: userId,
      name: generateRandomName(userId),
      avatar: `https://api.multiavatar.com/${userId}.svg`
    };
    
    // 缓存fallback信息
    memoryCache.users.set(userId, { data: fallbackUser, timestamp: now });
    
    return fallbackUser;
  }
}

/**
 * 批量获取用户信息（减少数据库查询）
 */
async function fetchUsersBatch(userIds: string[]): Promise<Map<string, UserBriefDTO>> {
  const now = Date.now();
  const result = new Map<string, UserBriefDTO>();
  const missingIds: string[] = [];
  
  // 先检查缓存
  for (const userId of userIds) {
    const cached = memoryCache.users.get(userId);
    if (cached && (now - cached.timestamp) < memoryCache.maxAge) {
      result.set(userId, cached.data);
    } else {
      missingIds.push(userId);
    }
  }
  
  // 批量查询缺失的用户
  if (missingIds.length > 0) {
    try {
      const users = await db_client.user.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true, avatar: true }
      });
      
      for (const user of users) {
        const userBrief = { id: user.id, name: user.name, avatar: user.avatar };
        result.set(user.id, userBrief);
        memoryCache.users.set(user.id, { data: userBrief, timestamp: now });
      }
      
      // 为缺失的用户创建fallback
      for (const userId of missingIds) {
        if (!result.has(userId)) {
          const fallbackUser = {
            id: userId,
            name: generateRandomName(userId),
            avatar: `https://api.multiavatar.com/${userId}.svg`
          };
          result.set(userId, fallbackUser);
          memoryCache.users.set(userId, { data: fallbackUser, timestamp: now });
        }
      }
    } catch (error) {
      logger.error('批量获取用户信息失败', error);
      
      // 为所有缺失用户创建fallback
      for (const userId of missingIds) {
        if (!result.has(userId)) {
          const fallbackUser = {
            id: userId,
            name: generateRandomName(userId),
            avatar: `https://api.multiavatar.com/${userId}.svg`
          };
          result.set(userId, fallbackUser);
          memoryCache.users.set(userId, { data: fallbackUser, timestamp: now });
        }
      }
    }
  }
  
  return result;
}

/**
 * 快速验证项目（内存缓存）
 */
async function validateProjectFast(projectId: string): Promise<boolean> {
  const now = Date.now();
  const cached = memoryCache.projects.get(projectId);
  
  if (cached && (now - cached.timestamp) < memoryCache.maxAge) {
    return cached.data;
  }

  try {
    const project = await db_client.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });
    
    const exists = !!project;
    memoryCache.projects.set(projectId, { data: exists, timestamp: now });
    
    return exists;
  } catch (error) {
    logger.error('项目验证失败', error);
    return false;
  }
}

/**
 * 将数据库评论对象转换为DTO
 */
function mapToCommentDTO(
  comment: any,
  user: UserBriefDTO,
  replyUser: UserBriefDTO | null
): CommentDTO {
  return {
    id: comment.id,
    projectId: comment.projectId,
    user,
    content: comment.content,
    parentId: comment.parentId,
    rootId: comment.rootId,
    replyUser,
    likesCount: comment.likesCount || 0,
    dislikesCount: comment.dislikesCount || 0,
    repliesCount: comment.repliesCount || 0,
    isDeleted: comment.isDeleted || false,
    deletedAt: comment.deletedAt,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  };
}

/**
 * 创建评论（高性能版本）
 */
export async function createCommentService(
  projectId: string,
  authorUserId: string,
  payload: CreateCommentPayload
): Promise<CommentDTO> {
  const timerId = PerformanceMonitor.startTimer('createComment');
  
  try {
    const { content, parentId, rootId, replyToId } = payload;

    // 并行执行：项目验证 + 用户信息获取
    const [projectExists, authorUser] = await Promise.all([
      validateProjectFast(projectId),
      fetchUserBrief(authorUserId)
    ]);

    if (!projectExists) {
      throw new Error('项目不存在');
    }

    // 顶层评论逻辑
    if (!parentId && !rootId) {
      const comment = await db_client.comment.create({
        data: {
          projectId,
          userId: authorUserId,
          content,
          parentId: null,
          rootId: null,
          replyToId: null
        }
      });

      const result = mapToCommentDTO(comment, authorUser, null);
      
      // 异步更新 rootId（非阻塞）
      setImmediate(async () => {
        try {
          await db_client.comment.update({
            where: { id: comment.id },
            data: { rootId: comment.id }
          });
        } catch (error) {
          logger.error('异步更新 rootId 失败', error);
        }
      });

      PerformanceMonitor.endTimer(timerId, 'createComment');
      return result;
    }

    // 回复评论逻辑
    if (parentId && rootId) {
      // 并行验证评论
      const [rootComment, parentComment] = await Promise.all([
        db_client.comment.findUnique({ 
          where: { id: rootId },
          select: { id: true, projectId: true, parentId: true }
        }),
        db_client.comment.findUnique({ 
          where: { id: parentId },
          select: { id: true, projectId: true }
        })
      ]);

      if (!rootComment || !parentComment) {
        throw new Error('评论不存在');
      }
      
      if (rootComment.projectId !== projectId || parentComment.projectId !== projectId) {
        throw new Error('评论与项目不一致');
      }
      
      if (rootComment.parentId !== null) {
        throw new Error('rootId 必须是顶层评论');
      }

      const comment = await db_client.comment.create({
        data: {
          projectId,
          userId: authorUserId,
          content,
          parentId,
          rootId,
          replyToId: replyToId || null
        }
      });

      const result = mapToCommentDTO(comment, authorUser, null);
      
      // 异步更新计数（非阻塞）
      setImmediate(async () => {
        try {
          await db_client.comment.update({
            where: { id: rootId },
            data: { repliesCount: { increment: 1 } }
          });
        } catch (error) {
          logger.error('异步更新回复计数失败', error);
        }
      });

      PerformanceMonitor.endTimer(timerId, 'createComment');
      return result;
    }

    throw new Error('评论参数无效');
  } catch (error) {
    PerformanceMonitor.endTimer(timerId, 'createComment');
    throw error;
  }
}


/**
 * 获取项目评论列表
 */
export async function listProjectCommentsService(
  projectId: string, 
  query: {
    rootId: string | null,
    page: number,
    limit: number
  }
) {
  const { page, limit } = query;

  // 计算分页偏移量
  const skip = (page - 1) * limit;
  
  // 查询评论列表
  const replies = await db_client.comment.findMany({
    where: {
      projectId
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
    select: {
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
  });

  // 获取用户信息
  const userIds = [...new Set(replies.map(reply => reply.userId))];
  const users = await db_client.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true }
  });

  // 将用户信息添加到回复列表中
  const repliesWithUser = replies.map(reply => {
    const user = users.find(u => u.id === reply.userId);
    return {
      ...reply,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
    };
  });

  return repliesWithUser;
  
}


/**
 * 获取更多回复
 */
export async function listCommentRepliesService(
  rootId: string, 
  query: {
    page: number,
    limit: number
  }
) {
  const { page, limit } = query;

  // 计算分页偏移量
  const skip = (page - 1) * limit;
  
  // 查询回复列表
  const replies = await db_client.comment.findMany({ 
    where: {
      rootId, // 查询同一线程下的所有回复
      isDeleted: false,
      id: { not: rootId } // 排除根评论本身
    },
    orderBy: {
      createdAt: 'asc', // 按时间正序，保持对话顺序
    },
    skip,
    take: limit,
    select: {
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
  });

  // 获取用户信息
  const userIds = [...new Set(replies.map(reply => reply.userId))];
  const users = await db_client.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true }
  });

  // 将用户信息添加到回复列表中
  const repliesWithUser = replies.map(reply => {
    const user = users.find(u => u.id === reply.userId);
    return {
      ...reply,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
    };
  });

  return repliesWithUser;
}


export async function listThreadRepliesService(
  rootId: string, 
  query: RepliesQuery
) {
  // TODO: 实现获取线程回复列表
  throw new Error('未实现');
}

export async function upsertReactionService(
  commentId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE' | null
) {
  // TODO: 实现点赞/点踩功能
  throw new Error('未实现');
}

export async function softDeleteCommentService(
  commentId: string,
  userId: string
) {
  // TODO: 实现软删除评论功能
  throw new Error('未实现');
}