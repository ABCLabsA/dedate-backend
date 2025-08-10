import express from 'express';
import cors from 'cors';
import router from './routers';
import logger from './extensions/ext_logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger); // 请求日志中间件 - 必须在路由之前
app.use('/api', router);
app.use(errorHandler); // 错误处理中间件必须在所有路由之后


const PORT = process.env.SERVER_PORT || 8002;
app.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`)
});