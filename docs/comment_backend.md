
我先快速扫描后端代码，看看是否已有评论/项目的路由与控制器，以便给出与你现有结构一致的接口方法与命名。随后我会列出需要实现的接口清单、请求与响应模型、以及核心服务方法与权限校验点。

Search files...

### 需要实现的接口方法（与 `docs/comment.md` 对齐）

- 获取项目评论线程列表
  - 方法与路径: GET `/api/projects/:projectId/comments/threads`
  - Query: `limit`(默认20), `cursor`(可空), `repliesLimit`(每个线程返回的子回复条数，默认3)
  - 返回: 与文档“列表接口返回（按项目分页获取线程）”一致，`items` 内每项包含 `root`、`replies`、`hasMoreReplies`，顶层按 `createdAt desc` 游标分页，子回复按 `createdAt asc` 截取
  - 说明: 需要为每条评论填充 `user`、`replyUser` 与当前用户的 `myReaction`

- 获取单线程的更多回复
  - 方法与路径: GET `/api/comments/:rootId/replies`
  - Query: `limit`(默认20), `cursor`(可空，`createdAt` 或 复合 `createdAt|id`), 可选 `parentId`（若只展开某一子层）
  - 返回: 与文档“单线程更多回复（折叠展开时加载）”一致，按 `createdAt asc` 游标分页

- 创建评论/回复
  - 方法与路径: POST `/api/projects/:projectId/comments`
  - Body:
    - 顶层: `{ "content": "...", "parentId": null, "replyUserId": null }`
    - 回复: `{ "content": "...", "parentId": "cmt_x", "rootId": "cmt_root", "replyUserId": "u_y" }`
  - 返回: `{ "comment": CommentDTO }`，包含 `myReaction=null`
  - 说明: 需要校验 `parentId`、`rootId` 与 `projectId` 同属一项目且层级合法；创建回复时自增父链的 `repliesCount`

- 点赞/点踩（幂等 upsert）
  - 方法与路径: PUT `/api/comments/:commentId/reaction`
  - Body: `{ "type": "LIKE" | "DISLIKE" | null }`（null 表示取消）
  - 返回: `{ "commentId", "likesCount", "dislikesCount", "myReaction" }`
  - 说明: 事务内处理 `CommentReaction` 的插入/更新/删除，并同步增减 `likesCount`/`dislikesCount`

- 软删除评论
  - 方法与路径: DELETE `/api/comments/:commentId`
  - 返回: `{ "commentId", "isDeleted": true, "deletedAt": ISOString }`
  - 说明: 仅作者或管理员可删；不物理删除，内容由前端用 `isDeleted` 控制显示

### 控制器/服务建议的最小方法集

- 列表
  - `listProjectThreads(projectId, cursor, limit, repliesLimit, currentUserId)`
  - `listThreadReplies(rootId, cursor, limit, currentUserId, parentId?)`

- 变更
  - `createComment(projectId, authorUserId, { content, parentId, rootId, replyUserId })`
  - `upsertReaction(commentId, userId, type)`（事务，维护计数）
  - `softDeleteComment(commentId, userId)`

- 辅助
  - `mapCommentToDTO(comment, currentUserId)`（批量填充 `user`、`replyUser`、`myReaction`）
  - `fetchUsersBrief(userIds: string[])`（从 Supabase 或本地用户表获取 `id/name/avatar`，避免 N+1）
  - 游标策略：线程用 `createdAt desc`，replies 用 `createdAt asc`；游标可用 `createdAt|id` 复合键

### 校验与权限要点

- 认证: 写接口需 `requireAuth`，从 Supabase JWT 取 `userId`
- 关系校验:
  - `parentId` 与 `rootId`（若提供）必须属于同一 `projectId`
  - `rootId` 必须指向顶层评论（`parentId=null`）
  - 防环路（应用层判定）
- 权限: 删除只能作者或管理员
- 一致性:
  - 创建回复时递增对应祖先的 `repliesCount`
  - 点赞/点踩全在单事务内完成，保证与计数同步

### 路由建议（与现有结构对齐）

- 新增 `src/routers/comments.ts` 并在 `src/routers/index.ts` 中 `router.use('/comments', commentsRouter)` 与 `router.use('/projects', projectsRouter)`（或在现有 `search`/`base-info` 旁新增 `projects` 路由组，挂载项目内的 comments 子路由）

### 返回结构对齐
- 所有返回 DTO 严格匹配 `docs/comment.md` 中的示例（字段名、嵌套、`hasMore`/`cursor`/`hasMoreReplies`、`myReaction`）

- 已给出需要落地的 5 个接口方法与参数/返回要求，以及对应服务方法与关键校验点
- 路由分组与游标排序方式与现有 Prisma 模型索引相匹配，前端可按文档直接对接
