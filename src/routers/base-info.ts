import { Router } from "express";
import { getBaseInfoList, getBaseInfoById } from "../controllers/baseInfoController";
import { requireAuth } from "../middleware/auth";

const baseInfoRouter = Router();

baseInfoRouter.get('/list', getBaseInfoList)
baseInfoRouter.get('/:id', getBaseInfoById)

export default baseInfoRouter
