import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { registerLogin } from "../controllers/authController";

const authRouter = Router();

authRouter.post('/register-login', registerLogin)

export default authRouter