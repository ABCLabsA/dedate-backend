import { supabaseAdmin } from "../extensions/ext_auth";
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
  // supabase 获取用户信息
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) {
      throw new Error('获取用户信息失败');
    }
    const user = data.user;
    return {
      id: user.id,
      name: user.user_metadata.display_name,
      avatar: user.user_metadata.avatar
    };
  } catch (error) {
    logger.error('获取用户信息失败, 直接返回', error);
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

  // 顶层评论逻辑
  if (!parentId && !rootId) {
    const created = await db_client.$transaction(async (tx) => {
      // 1. 创建评论记录
      const comment = await tx.comment.create({
        data: {
          projectId,
          userId: authorUserId,
          content,
          parentId: null,
          rootId: null,
          replyToId: null
        }
      });

      // 2. 更新 rootId 为自己的 id
      const updated = await tx.comment.update({
        where: { id: comment.id },
        data: { rootId: comment.id }
      });

      return updated;
    });

    // 3. 获取用户信息并返回DTO
    const user = await fetchUserBrief(created.userId);
    return mapToCommentDTO(created, user, null);
  }

  // 回复评论逻辑
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

    const created = await db_client.$transaction(async (tx) => {
      // 1. 创建回复评论
      const comment = await tx.comment.create({
        data: {
          projectId,
          userId: authorUserId,
          content,
          parentId,
          rootId,
          replyToId: replyToId || null
        }
      });

      // 2. 递增根评论的回复计数（整个线程的回复总数）
      await tx.comment.update({
        where: { id: rootId },
        data: { repliesCount: { increment: 1 } }
      });

      // 注意：不再递增直接父评论的 repliesCount
      // 因为 repliesCount 表示整个线程的回复数量，不是直接回复数量

      return comment;
    });

    // 4. 获取用户信息并返回DTO
    const author = await fetchUserBrief(created.userId);
    return mapToCommentDTO(created, author, replyToUser);
  }

  throw new Error('评论参数无效：顶级评论不能指定 parentId/rootId，回复评论必须同时提供 parentId 和 rootId');
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