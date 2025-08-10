import { Request, Response, NextFunction } from 'express';
import logger from '../extensions/ext_logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info({
    event: 'request_start',
    method: req.method,
    url: req.originalUrl,
    // ip: req.ip || req.connection.remoteAddress,
    // userAgent: req.get('User-Agent')?.substring(0, 50)
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 根据状态码选择日志级别
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]({
      event: 'request_end',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: duration
    });
  });

  next();
} 