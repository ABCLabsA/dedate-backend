import { Router } from "express";
import { getProjectCommentThreads, getThreadReplies, postProjectComment, putCommentReaction, deleteComment } from "../controllers/commentController";
import { requireAuth } from "../middleware/auth";

const commentRouter = Router();

commentRouter.get('/list', getProjectCommentThreads)
commentRouter.get('/:id', getThreadReplies)
commentRouter.post('/add-comment', requireAuth, postProjectComment)
commentRouter.put('/:id', requireAuth, putCommentReaction)
commentRouter.delete('/:id', requireAuth, deleteComment)

export default commentRouter