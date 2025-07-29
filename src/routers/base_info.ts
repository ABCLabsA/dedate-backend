import { Router } from "express";
import { getBaseInfoList, getBaseInfoById } from "../controllers/baseInfoController";

const baseInfoRouter = Router();

baseInfoRouter.get('/list', getBaseInfoList)
baseInfoRouter.get('/:id', getBaseInfoById)

export default baseInfoRouter
