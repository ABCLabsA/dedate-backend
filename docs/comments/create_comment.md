## 创建评论，分三种情况

```
1. 父级评论（顶级评论）

{
  "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
  "content": " 真的假的！！！ ",
  "parentId": null,
  "rootId": null,
  "replyToId": null
}

	•	parentId 和 rootId 都为空，说明是顶级评论。
	•	添加时 rootId 应设置为自己生成的 id。

返回值：
{
  "code": 200,
  "message": "创建评论成功",
  "data": {
    "id": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
    "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
    "user": {
        "id": "81b24345-a20f-4eab-9f1e-3f527cae2898",
        "name": "温柔的歌手737",
        "avatar": "https://api.multiavatar.com/81b24345-a20f-4eab-9f1e-3f527cae2898.svg"
    },
    "content": "真的假的！！！",
    "parentId": null,
    "rootId": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
    "replyUser": null,
    "likesCount": 0,
    "dislikesCount": 0,
    "repliesCount": 0,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2025-08-10T18:14:44.889Z",
    "updatedAt": "2025-08-10T18:14:45.188Z"
  }
}

2. 子评论直接回复父级评论

{
  "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
  "content": "回复楼主",
  "parentId": "d3b1387f-6b9e-41e5-b67c-46e244673adc", 
  "rootId": "d3b1387f-6b9e-41e5-b67c-46e244673adc", 
  "replyToId": null
}

	•	parentId 指向顶级评论的 id。
	•	replyToId 为 null，表示回复的是父级评论。
	•	rootId 指向顶级评论 id。
  
返回值：
{
  "code": 200,
  "message": "创建评论成功",
  "data": {
    "id": "08b4f90d-57a9-4137-ad5b-f9c2bc926e10",
    "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
    "user": {
        "id": "21d3870d-915c-4bc8-a216-b9d278523b24",
        "name": "快乐的开发者",
        "avatar": "https://api.multiavatar.com/21d3870d-915c-4bc8-a216-b9d278523b24.svg"
    },
    "content": "回复楼主",
    "parentId": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
    "rootId": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
    "replyUser": null,
    "likesCount": 0,
    "dislikesCount": 0,
    "repliesCount": 0,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2025-08-10T18:16:28.976Z",
    "updatedAt": "2025-08-10T18:16:28.976Z"
  }
}


3. 子评论回复另一条子评论（@某人）

{
  "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
  "content": "@快乐的开发者 回复子评论，需要加上@用户标识",
  "parentId": "08b4f90d-57a9-4137-ad5b-f9c2bc926e10", 
  "rootId": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
  "replyToId": "08b4f90d-57a9-4137-ad5b-f9c2bc926e10"
}

	•	parentId 依然指向顶级评论 id。
	•	replyToId 指向被 @ 的子评论 id。
	•	rootId 指向顶级评论 id。


返回值：
{
  "code": 200,
  "message": "创建评论成功",
  "data": {
    "id": "4b5e4d76-0836-47cb-b53e-bc1f2b4d01c7",
    "projectId": "fdcbf0a8-98a5-4f23-a2fd-9b748c0a215e",
    "user": {
        "id": "21d3870d-915c-4bc8-a216-b9d278523b24",
        "name": "快乐的开发者",
        "avatar": "https://api.multiavatar.com/21d3870d-915c-4bc8-a216-b9d278523b24.svg"
    },
    "content": "@快乐的开发者 回复子评论，需要加上@用户标识",
    "parentId": "08b4f90d-57a9-4137-ad5b-f9c2bc926e10",
    "rootId": "d3b1387f-6b9e-41e5-b67c-46e244673adc",
    "replyUser": {
        "id": "21d3870d-915c-4bc8-a216-b9d278523b24",
        "name": "快乐的开发者",
        "avatar": "https://api.multiavatar.com/21d3870d-915c-4bc8-a216-b9d278523b24.svg"
    },
    "likesCount": 0,
    "dislikesCount": 0,
    "repliesCount": 0,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2025-08-10T18:17:55.968Z",
    "updatedAt": "2025-08-10T18:17:55.968Z"
  }
}
```

⸻

添加评论时业务逻辑要点
	1.	生成新的评论 ID（UUID 或 cuid）
	2.	自动处理 rootId
	•	如果是顶级评论，rootId = 自己的 id
	•	如果是子评论，rootId 要取对应的顶级评论 id（可通过 parentId 查找）
	3.	验证参数有效性
	•	projectId、content 必填且非空
	•	parentId 必须存在且属于同一项目（如果不为 null）
	•	replyToId（若存在）必须存在且属于当前线程
	4.	更新顶级评论的 repliesCount（+1）
	5.	插入新评论记录
	6.	事务处理：确保步骤4和5原子执行


```
项目ID: 123

顶级评论（rootId = 自己的 id，parentId = null）
───────────────────────────────────────────
[CommentID: c1]
 userId: u1
 content: "这是一个顶级评论"
 parentId: null
 rootId: c1

    ├── [CommentID: c2]
    │     userId: u2
    │     content: "回复顶级评论"
    │     parentId: c1          ← 直接父评论是 c1
    │     rootId: c1            ← 线程顶级评论是 c1
    │
    └── [CommentID: c3]
          userId: u3
          content: "回复 c2 的评论"
          parentId: c2          ← 直接父评论是 c2
          rootId: c1            ← 线程顶级评论仍是 c1


结构说明：
- 顶级评论 c1 的 parentId 为 null，rootId 指向自己。
- c2 是回复 c1，parentId 指向 c1，rootId 仍是 c1。
- c3 是回复 c2，parentId 指向 c2，但 rootId 还是 c1，因为它属于 c1 这个顶级评论线程。

这样设计，方便：
- 用 parentId 组织回复层级关系（构建树）
- 用 rootId 快速查询整个评论线程，避免递归查询
```