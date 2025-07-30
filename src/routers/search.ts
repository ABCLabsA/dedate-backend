import { Router } from "express";
import { searchProjectInfo } from "../controllers/searchController";

const searchProjectInfoRouter = Router();

searchProjectInfoRouter.post('/info', searchProjectInfo);

export default searchProjectInfoRouter;