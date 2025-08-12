import { Router } from "express";
import { registerLogin, refreshToken, getUserInfo } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const authRouter = Router();

authRouter.post('/register-login', registerLogin)
authRouter.post('/refresh-token', refreshToken)
authRouter.get('/comment/user-info', requireAuth, getUserInfo)

export default authRouter