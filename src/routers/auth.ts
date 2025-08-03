import { Router } from "express";
import { registerLogin, refreshToken } from "../controllers/authController";

const authRouter = Router();

authRouter.post('/register-login', registerLogin)
authRouter.post('/refresh-token', refreshToken)

export default authRouter