import pino from 'pino';
import pinoCaller from 'pino-caller';

const baseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    }
  }
});

const logger = pinoCaller(baseLogger);

export default logger;