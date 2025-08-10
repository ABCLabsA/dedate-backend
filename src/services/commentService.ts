import db_client from "../extensions/ext_db";
import logger from "../extensions/ext_logger";
import { 
  CreateCommentPayload, 
  CommentDTO, 
  UserBriefDTO,
  ThreadsQuery,
  RepliesQuery
} from "../interfaces/comment/commentType";
import { generateRandomName } from "../utils/userUtils";


/**
 * 获取用户简要信息
 * @param userId 用户ID
 */
async function fetchUserBrief(userId: string): Promise<UserBriefDTO> {
  // 获取用户信息
  try {
    const user = await db_client.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    };
  } catch (error) {
    logger.error('获取用户信息失败, 直接返回随机用户信息', error);
    return {
      id: userId,
      name: generateRandomName(userId),
      avatar: `https://api.multiavatar.com/${userId}.svg`
    };
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
 * 创建评论
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

  // 验证项目是否存在
  const project = await db_client.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('项目不存在');
  }

  // 顶层评论逻辑 - 直接插入，不等待事务
  if (!parentId && !rootId) {
    const comment = await db_client.comment.create({
      data: {
        projectId,
        userId: authorUserId,
        content,
        parentId: null,
        rootId: null, // 先设为 null
        replyToId: null
      }
    });

    // 立即返回，不等待 rootId 更新
    const user = await fetchUserBrief(comment.userId);
    const result = mapToCommentDTO(comment, user, null);
    
    // 异步更新 rootId，不影响响应时间
    process.nextTick(async () => {
      try {
        await db_client.comment.update({
          where: { id: comment.id },
          data: { rootId: comment.id }
        });
      } catch (error) {
        logger.error('异步更新 rootId 失败', error);
        // 可以加入重试机制
      }
    });

    return result;
  }

  // 回复评论逻辑 - 直接插入，不等待计数更新
  if (parentId && rootId) {
    // 验证父评论和根评论
    const [rootComment, parentComment] = await Promise.all([
      db_client.comment.findUnique({ where: { id: rootId } }),
      db_client.comment.findUnique({ where: { id: parentId } })
    ]);

    if (!rootComment) {
      throw new Error('rootId 无效');
    }
    if (!parentComment) {
      throw new Error('parentId 无效');
    }
    if (rootComment.projectId !== projectId || parentComment.projectId !== projectId) {
      throw new Error('root/parent 与项目不一致');
    }
    if (rootComment.parentId !== null) {
      throw new Error('rootId 必须是顶层评论');
    }

    // 验证 replyToId（如果提供）
    let replyToComment = null;
    let replyToUser = null;
    
    if (replyToId) {
      replyToComment = await db_client.comment.findUnique({ where: { id: replyToId } });
      if (!replyToComment) {
        throw new Error('replyToId 无效');
      }
      if (replyToComment.projectId !== projectId || replyToComment.rootId !== rootId) {
        throw new Error('replyToId 与项目或线程不一致');
      }
      // 获取被回复评论的用户信息
      replyToUser = await fetchUserBrief(replyToComment.userId);
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

    // 立即返回，不等待计数更新
    const author = await fetchUserBrief(comment.userId);
    const result = mapToCommentDTO(comment, author, replyToUser);
    
    // 异步更新计数，不影响响应时间
    process.nextTick(async () => {
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