import { Request, Response } from 'express';
import {
  listProjectThreadsService,
  listThreadRepliesService,
  createCommentService,
  upsertReactionService,
  softDeleteCommentService
} from '../services/commentService';


// ======================= 获取项目评论线程列表 =========================
export const getProjectCommentThreads = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { limit = '20', cursor, repliesLimit = '3' } = req.query;
  const currentUserId = req.user?.id ?? null;

  if (!projectId) {
    return res.status(400).json({ code: 400, message: '缺少 projectId', data: null });
  }

  const result = await listProjectThreadsService(projectId, {
    limit: Number(limit),
    cursor: (cursor as string) || undefined,
    repliesLimit: Number(repliesLimit),
    currentUserId: currentUserId as string | null
  });

  return res.status(200).json({
    code: 200,
    message: '获取评论线程成功',
    data: result
  });
};

// ======================= 获取单线程更多回复 =========================
export const getThreadReplies = async (req: Request, res: Response) => {
  const { rootId } = req.params;
  const { limit = '20', cursor, parentId } = req.query;
  const currentUserId = req.user?.id ?? null;

  if (!rootId) {
    return res.status(400).json({ code: 400, message: '缺少 rootId', data: null });
  }

  const result = await listThreadRepliesService(rootId, {
    limit: Number(limit),
    cursor: (cursor as string) || undefined,
    currentUserId: currentUserId as string | null,
    parentId: (parentId as string) || undefined
  });

  return res.status(200).json({
    code: 200,
    message: '获取线程回复成功',
    data: result
  });
};

// ======================= 创建评论/回复 =========================
export const postProjectComment = async (req: Request, res: Response) => {
  const { projectId, content, parentId = null, rootId = null, replyUserId = null } = req.body as {
    projectId: string;
    content: string;
    parentId?: string | null;
    rootId?: string | null;
    replyUserId?: string | null;
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
    replyUserId: replyUserId || null
  });

  return res.status(200).json({
    code: 200,
    message: '创建评论成功',
    data: result
  });
};

// ======================= 点赞/点踩（幂等 upsert） =========================
export const putCommentReaction = async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { type } = req.body as { type: 'LIKE' | 'DISLIKE' | null };

  if (!req.user) {
    return res.status(401).json({ code: 401, message: '需要登录', data: null });
  }

  if (!commentId) {
    return res.status(400).json({ code: 400, message: '缺少 commentId', data: null });
  }

  if (type !== 'LIKE' && type !== 'DISLIKE' && type !== null) {
    return res.status(400).json({ code: 400, message: '非法的 type 参数', data: null });
  }

  const result = await upsertReactionService(commentId, req.user.id, type);

  return res.status(200).json({
    code: 200,
    message: '更新互动状态成功',
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

