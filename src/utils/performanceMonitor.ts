import logger from "../extensions/ext_logger";

export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  /**
   * 开始计时
   */
  static startTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    
    // 存储开始时间
    this.metrics.set(timerId, [startTime]);
    
    return timerId;
  }

  /**
   * 结束计时并记录
   */
  static endTimer(timerId: string, operation: string): number {
    const startTime = this.metrics.get(timerId);
    if (!startTime) {
      logger.warn(`计时器 ${timerId} 不存在`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime[0];
    
    // 记录性能指标
    this.recordMetric(operation, duration);
    
    // 清理计时器
    this.metrics.delete(timerId);
    
    // 记录慢操作
    if (duration > 1000) {
      logger.warn(`慢操作检测: ${operation} 耗时 ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  /**
   * 记录性能指标
   */
  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // 只保留最近100次记录
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * 获取性能统计
   */
  static getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = metrics.length;
    const avg = metrics.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, avg, min, max, p95 };
  }

  /**
   * 打印性能报告
   */
  static printReport(): void {
    logger.info('=== 性能监控报告 ===');
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const stats = this.getStats(operation);
      if (stats) {
        logger.info(`${operation}: 调用${stats.count}次, 平均${stats.avg.toFixed(2)}ms, P95:${stats.p95.toFixed(2)}ms`);
      }
    }
    
    logger.info('==================');
  }

  /**
   * 清理所有指标
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * 性能监控装饰器
 */
export function monitorPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timerId = PerformanceMonitor.startTimer(operation);
      
      try {
        const result = await method.apply(this, args);
        PerformanceMonitor.endTimer(timerId, operation);
        return result;
      } catch (error) {
        PerformanceMonitor.endTimer(timerId, operation);
        throw error;
      }
    };
  };
} 