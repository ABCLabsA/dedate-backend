// 用户简要信息类型
export interface UserBriefDTO {
  id: string;
  name: string | null;
  avatar: string | null;
}

// 评论DTO类型
export interface CommentDTO {
  id: string;
  projectId: string;
  user: UserBriefDTO;
  content: string;
  parentId: string | null;
  rootId: string | null;
  replyUser: UserBriefDTO | null;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 创建评论的载荷类型
export interface CreateCommentPayload {
  content: string;
  parentId: string | null;
  rootId: string | null;
  replyToId: string | null;
}

export interface RepliesQuery {
  limit: number;
  cursor?: string;
  currentUserId: string | null;
  parentId?: string;
}