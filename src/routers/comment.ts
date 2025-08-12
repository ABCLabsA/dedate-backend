import { Router } from "express";
import { getProjectCommentList, getCommentReplies, postProjectComment, putCommentReaction, deleteComment, getMyLikedCommentIds } from "../controllers/commentController";
import { requireAuth } from "../middleware/auth";

const commentRouter = Router();

commentRouter.post('/add-comment', requireAuth, postProjectComment)
commentRouter.get('/list', getProjectCommentList)
commentRouter.get('/replies', getCommentReplies)
commentRouter.put('/:commentId', requireAuth, putCommentReaction)
commentRouter.get('/my-liked', requireAuth, getMyLikedCommentIds)
// commentRouter.delete('/:id', requireAuth, deleteComment)

export default commentRouter