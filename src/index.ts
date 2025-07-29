import express from 'express';
import cors from 'cors';
import router from './routers';
import logger from './extensions/ext_logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(errorHandler);
app.use('/api', router);


const PORT = process.env.SERVER_PORT || 8002;
app.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`)
});