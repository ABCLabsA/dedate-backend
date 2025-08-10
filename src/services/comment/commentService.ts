import db_client from "../../extensions/ext_db";
import logger from "../../extensions/ext_logger";
import { 
  CreateCommentPayload, 
  CommentDTO, 
  UserBriefDTO,
  ThreadsQuery,
  RepliesQuery
} from "../../interfaces/comment/commentType";
import { generateRandomName } from "../../utils/userUtils";
import { CommentCacheService } from "./commentCacheService";
import { DB_SELECT_FIELDS } from "../../utils/constants";

/**
 * 获取用户简要信息（带缓存）
 * @param userId 用户ID
 */
async function fetchUserBrief(userId: string): Promise<UserBriefDTO> {
  // 先检查缓存
  const cached = await CommentCacheService.getUserCache(userId);
  if (cached) {
    return cached;
  }

  // 缓存未命中，查询数据库
  try {
    const user = await db_client.user.findUnique({ 
      where: { id: userId },
      select: DB_SELECT_FIELDS.USER_BRIEF
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const userBrief = {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    };
    
    // 设置缓存
    await CommentCacheService.setUserCache(userId, userBrief);
    
    return userBrief;
  } catch (error) {
    logger.error('获取用户信息失败, 直接返回随机用户信息', error);
    
    // 返回fallback用户信息
    const fallbackUser = {
      id: userId,
      name: generateRandomName(userId),
      avatar: `https://api.multiavatar.com/${userId}.svg`
    };
    
    // 缓存fallback信息
    await CommentCacheService.setUserCache(userId, fallbackUser);
    
    return fallbackUser;
  }
}

/**
 * 快速验证项目是否存在（带缓存）
 * @param projectId 项目ID
 */
async function validateProjectFast(projectId: string): Promise<boolean> {
  // 先检查缓存
  const cached = await CommentCacheService.getProjectCache(projectId);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，查询数据库
  try {
    const project = await db_client.project.findUnique({ 
      where: { id: projectId },
      select: DB_SELECT_FIELDS.PROJECT_BASIC
    });
    
    const exists = !!project;
    
    // 设置缓存
    await CommentCacheService.setProjectCache(projectId, exists);
    
    return exists;
  } catch (error) {
    logger.error('项目验证失败', error);
    return false;
  }
}

/**
 * 将数据库评论对象转换为DTO
 * @param comment 数据库评论对象
 * @param user 用户信息
 * @param replyUser 被回复用户信息
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
 * 创建评论（优化版本）
 * @param projectId 项目ID
 * @param authorUserId 作者用户ID
 * @param payload 评论内容
 */
export async function createCommentService(
  projectId: string,
  authorUserId: string,
  payload: CreateCommentPayload
): Promise<CommentDTO> {
  const { content, parentId, rootId, replyToId } = payload;

  // 并行执行项目验证和用户信息获取
  const [projectExists, authorUser] = await Promise.all([
    validateProjectFast(projectId),
    fetchUserBrief(authorUserId)
  ]);

  if (!projectExists) {
    throw new Error('项目不存在');
  }

  // 顶层评论逻辑 - 直接插入
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

    // 立即返回结果
    const result = mapToCommentDTO(comment, authorUser, null);
    
    // 异步更新 rootId
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

    return result;
  }

  // 回复评论逻辑 - 优化验证
  if (parentId && rootId) {
    // 并行验证父评论和根评论，只查询必要字段
    const [rootComment, parentComment] = await Promise.all([
      db_client.comment.findUnique({ 
        where: { id: rootId },
        select: DB_SELECT_FIELDS.COMMENT_BASIC
      }),
      db_client.comment.findUnique({ 
        where: { id: parentId },
        select: DB_SELECT_FIELDS.COMMENT_BASIC
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

    // 获取被回复用户信息（非阻塞）
    let replyToUser = null;
    if (replyToId) {
      setImmediate(async () => {
        try {
          const replyToComment = await db_client.comment.findUnique({ 
            where: { id: replyToId },
            select: { id: true, projectId: true, rootId: true, userId: true }
          });
          
          if (replyToComment && 
              replyToComment.projectId === projectId && 
              replyToComment.rootId === rootId) {
            replyToUser = await fetchUserBrief(replyToComment.userId);
          }
        } catch (error) {
          logger.warn('获取被回复用户信息失败', error);
        }
      });
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

    // 立即返回结果
    const result = mapToCommentDTO(comment, authorUser, replyToUser);
    
    // 异步更新计数
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

    return result;
  }

  throw new Error('评论参数无效');
}



export async function listProjectThreadsService(
  projectId: string, 
  query: ThreadsQuery
) {
  // TODO: 实现获取项目评论线程列表
  throw new Error('未实现');
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