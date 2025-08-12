import { Request, Response } from 'express';
import {
  createCommentService,
  upsertReactionService,
  getMyLikedCommentIdsService,
  softDeleteCommentService,
  listProjectCommentsService,
  listCommentRepliesService
} from '../services/comment/commentService';


// ======================= 创建评论/回复 =========================
export const postProjectComment = async (req: Request, res: Response) => {
  const { projectId, content, parentId = null, rootId = null, replyToId = null } = req.body as {
    projectId: string;
    content: string;
    parentId?: string | null;
    rootId?: string | null;
    replyToId?: string | null;
  };

  if (!req.user) {
    return res.status(401).json({ code: 401, message: '需要登录', data: null });
  }

  if (!projectId) {
    return res.status(400).json({ code: 400, message: '缺少 projectId', data: null });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ code: 400, message: '内容不能为空', data: null });
  }

  const result = await createCommentService(projectId, req.user?.id, {
    content: content.trim(),
    parentId: parentId || null,
    rootId: rootId || null,
    replyToId: replyToId || null
  });

  return res.status(200).json({
    code: 200,
    message: '创建评论成功',
    data: result
  });
};


// ======================= 获取项目评论列表 =========================
export const getProjectCommentList = async (req: Request, res: Response) => {
  const { projectId, rootId = null, page = '1', limit = '10'} = req.query;

  if (!projectId) {
    return res.status(400).json({ code: 400, message: '缺少 projectId', data: null });
  }

  const result = await listProjectCommentsService(projectId as string, {
    rootId: rootId as string | null,
    limit: Number(limit),
    page: Number(page),
  });

  return res.status(200).json({
    code: 200,
    message: '获取项目评论列表成功',
    data: result
  });
}


// ======================= 获取更多回复 =========================
export const getCommentReplies = async (req: Request, res: Response) => {
  const { rootId, page = '1', limit = '10' } = req.query;

  if (!rootId) {
    return res.status(400).json({ code: 400, message: '缺少 rootId', data: null });
  }

  const result = await listCommentRepliesService(rootId as string, {
    limit: Number(limit),
    page: Number(page),
  });

  return res.status(200).json({
    code: 200,
    message: '获取更多回复成功',
    data: result
  });
};


// ======================= 点赞/点踩（幂等 upsert） =========================
export const putCommentReaction = async (req: Request, res: Response) => {
  const { commentId } = req.params;
  // 现在仅允许 LIKE 与取消（null）
  const { type } = req.body as { type: 'LIKE' | null };

  if (!req.user) {
    return res.status(401).json({ code: 401, message: '需要登录', data: null });
  }

  if (!commentId) {
    return res.status(400).json({ code: 400, message: '缺少 commentId', data: null });
  }

  if (type !== 'LIKE' && type !== null) {
    return res.status(400).json({ code: 400, message: '非法的 type 参数', data: null });
  }

  const result = await upsertReactionService(commentId, req.user.id, type);

  return res.status(200).json({
    code: 200,
    message: '更新互动状态成功',
    data: result
  });
};


// ======================= 查询我点赞过的评论ID =========================
export const getMyLikedCommentIds = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await getMyLikedCommentIdsService(userId);
  return res.status(200).json({
    code: 200,
    message: '查询我点赞过的评论ID成功',
    data: result
  });
};


// ======================= 软删除评论 =========================
export const deleteComment = async (req: Request, res: Response) => {
  const { commentId } = req.params;

  if (!req.user) {
    return res.status(401).json({ code: 401, message: '需要登录', data: null });
  }

  if (!commentId) {
    return res.status(400).json({ code: 400, message: '缺少 commentId', data: null });
  }

  const result = await softDeleteCommentService(commentId, req.user.id);

  return res.status(200).json({
    code: 200,
    message: '删除评论成功',
    data: result
  });
};

