import { Request, Response, NextFunction } from 'express';
import logger from '../extensions/ext_logger';
import { ServiceError } from '../errors/ServiceError';


// 全局异常处理器中间件
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ServiceError) {
    logger.info("this!!!!")
    res.status(err.status).json({
      code: err.code ?? err.status, // 优先返回业务码
      message: err.message
    });
    return;
  }

  logger.error("error info: " + err)
  res.status(500).json({
    code: 500,
    message: 'internal server error',
    error: err
  });
}
