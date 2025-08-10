
### 我需要的返回/假数据结构（直接照这个出后端）

- 用户
```json
{
  "id": "f4e6a7b6-2c7e-46bb-9f26-7f7fa2b4a111",
  "name": "小林",
  "avatar": "https://example.com/u1.png"
}
```

- 单条评论 DTO（与你的表做了最小映射 + 前端需要的派生字段）
```json
{
  "id": "cmt_01",
  "projectId": "proj_01",
  "user": { "id": "f4e6...", "name": "小林", "avatar": "https://..." },
  "content": "这个项目的交互做得很顺滑！",
  "parentId": null,
  "rootId": "cmt_01",
  "replyUser": null,
  "likesCount": 12,
  "dislikesCount": 0,
  "repliesCount": 2,
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2025-08-09T08:00:00.000Z",
  "updatedAt": "2025-08-09T08:00:00.000Z",
  "myReaction": "LIKE" // 当前登录用户对该评论的互动：LIKE | DISLIKE | null
}
```

- 线程项（顶层评论 + 一段子评论，支持折叠与按需加载）
```json
{
  "root": { /* 上面的 Comment DTO（parentId=null, rootId=自己） */ },
  "replies": [
    {
      "id": "cmt_02",
      "projectId": "proj_01",
      "user": { "id": "b9a1...", "name": "小周", "avatar": "https://..." },
      "content": "@小林 文档也写得很清晰。",
      "parentId": "cmt_01",
      "rootId": "cmt_01",
      "replyUser": { "id": "f4e6...", "name": "小林", "avatar": "https://..." },
      "likesCount": 3,
      "dislikesCount": 0,
      "repliesCount": 0,
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2025-08-09T08:10:00.000Z",
      "updatedAt": "2025-08-09T08:10:00.000Z",
      "myReaction": null
    }
  ],
  "hasMoreReplies": true  // repliesCount > replies.length 时为 true
}
```

- 列表接口返回（按项目分页获取线程）
```json
{
  "items": [
    { "root": { /* ... */ }, "replies": [ /* ... */ ], "hasMoreReplies": true },
    { "root": { /* ... */ }, "replies": [], "hasMoreReplies": false }
  ],
  "cursor": "next_cursor_or_null",
  "hasMore": true
}
```

- 单线程更多回复（折叠展开时加载）
```json
{
  "rootId": "cmt_01",
  "replies": [ /* Comment DTO 数组（parentId=顶层或子层皆可，返回按 createdAt asc） */ ],
  "cursor": "next_cursor_or_null",
  "hasMore": false
}
```

- 创建评论请求/响应
```json
// POST /projects/:projectId/comments
{
  "content": "回复顶层评论",
  "parentId": null,              // 顶层= null
  "replyUserId": null            // 顶层= null；回复某人= 对方 userId
}
// 201
{ "comment": { /* Comment DTO（包含 myReaction=null） */ } }
```

- 回复评论请求
```json
// POST /projects/:projectId/comments
{
  "content": "@小周 我有个疑问…",
  "parentId": "cmt_01",          // 直接父级（可以是顶层或子层）
  "rootId": "cmt_01",            // 线程根（顶层 id）
  "replyUserId": "b9a1-..."      // 被 @ 的用户
}
```

- 点赞/点踩（幂等 upsert）请求/响应
```json
// PUT /comments/:commentId/reaction
{ "type": "LIKE" } // 或 "DISLIKE" 或 null(取消)
// 200
{
  "commentId": "cmt_02",
  "likesCount": 4,
  "dislikesCount": 0,
  "myReaction": "LIKE"
}
```

- 软删除评论
```json
// DELETE /comments/:commentId
// 200
{ "commentId": "cmt_02", "isDeleted": true, "deletedAt": "2025-08-09T09:00:00.000Z" }
```

### 种子假数据（最小可用）
```json
{
  "threads": [
    {
      "root": {
        "id": "cmt_01",
        "projectId": "proj_01",
        "user": { "id": "u1", "name": "小林", "avatar": "https://img/u1.png" },
        "content": "这个项目的交互做得很顺滑！",
        "parentId": null,
        "rootId": "cmt_01",
        "replyUser": null,
        "likesCount": 12,
        "dislikesCount": 0,
        "repliesCount": 2,
        "isDeleted": false,
        "deletedAt": null,
        "createdAt": "2025-08-09T08:00:00.000Z",
        "updatedAt": "2025-08-09T08:00:00.000Z",
        "myReaction": "LIKE"
      },
      "replies": [
        {
          "id": "cmt_02",
          "projectId": "proj_01",
          "user": { "id": "u2", "name": "小周", "avatar": "https://img/u2.png" },
          "content": "@小林 文档也写得很清晰。",
          "parentId": "cmt_01",
          "rootId": "cmt_01",
          "replyUser": { "id": "u1", "name": "小林", "avatar": "https://img/u1.png" },
          "likesCount": 3,
          "dislikesCount": 0,
          "repliesCount": 0,
          "isDeleted": false,
          "deletedAt": null,
          "createdAt": "2025-08-09T08:10:00.000Z",
          "updatedAt": "2025-08-09T08:10:00.000Z",
          "myReaction": null
        }
      ],
      "hasMoreReplies": true
    },
    {
      "root": {
        "id": "cmt_10",
        "projectId": "proj_01",
        "user": { "id": "u3", "name": "阿强", "avatar": "https://img/u3.png" },
        "content": "请问是否支持离线模式？",
        "parentId": null,
        "rootId": "cmt_10",
        "replyUser": null,
        "likesCount": 6,
        "dislikesCount": 0,
        "repliesCount": 0,
        "isDeleted": false,
        "deletedAt": null,
        "createdAt": "2025-08-09T08:30:00.000Z",
        "updatedAt": "2025-08-09T08:30:00.000Z",
        "myReaction": null
      },
      "replies": [],
      "hasMoreReplies": false
    }
  ],
  "cursor": null,
  "hasMore": false
}
```

### 字段说明（关键差异）
- myReaction: 从 `CommentReaction` 计算得出（当前用户维度），用于前端高亮状态。
- repliesCount: 冗余缓存，总回复数；列表初次仅返回部分 `replies`，配合 `hasMoreReplies` 决定是否“展开更多”。
- replyUser: 由 `replyUserId` 反查用户，便于前端直接渲染 `@用户名`。

用这套结构，你可以直接对接当前前端，无需再改组件。
