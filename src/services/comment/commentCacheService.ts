import redis_client from "../../extensions/ext_redis";
import logger from "../../extensions/ext_logger";
import { UserBriefDTO } from "../../interfaces/comment/commentType";
import { COMMENT_CACHE_KEYS, COMMENT_CACHE_TTL } from "../../utils/constants";

export class CommentCacheService {
  /**
   * 获取用户信息缓存
   */
  static async getUserCache(userId: string): Promise<UserBriefDTO | null> {
    try {
      const cached = await redis_client.get(COMMENT_CACHE_KEYS.USER + userId);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Redis获取用户缓存失败', error);
      return null;
    }
  }

  /**
   * 设置用户信息缓存
   */
  static async setUserCache(userId: string, userData: UserBriefDTO): Promise<void> {
    try {
      await redis_client.setex(
        COMMENT_CACHE_KEYS.USER + userId, 
        COMMENT_CACHE_TTL.USER, 
        JSON.stringify(userData)
      );
    } catch (error) {
      logger.warn('Redis设置用户缓存失败', error);
    }
  }

  /**
   * 获取项目缓存
   */
  static async getProjectCache(projectId: string): Promise<boolean | null> {
    try {
      const cached = await redis_client.get(COMMENT_CACHE_KEYS.PROJECT + projectId);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Redis获取项目缓存失败', error);
      return null;
    }
  }

  /**
   * 设置项目缓存
   */
  static async setProjectCache(projectId: string, exists: boolean): Promise<void> {
    try {
      await redis_client.setex(
        COMMENT_CACHE_KEYS.PROJECT + projectId, 
        COMMENT_CACHE_TTL.PROJECT, 
        JSON.stringify(exists)
      );
    } catch (error) {
      logger.warn('Redis设置项目缓存失败', error);
    }
  }

  /**
   * 批量获取用户信息（管道操作）
   */
  static async getUsersBatch(userIds: string[]): Promise<Map<string, UserBriefDTO>> {
    if (userIds.length === 0) return new Map();
    
    const pipeline = redis_client.pipeline();
    const keys = userIds.map(id => COMMENT_CACHE_KEYS.USER + id);
    
    keys.forEach(key => pipeline.get(key));
    
    try {
      const results = await pipeline.exec();
      const userMap = new Map<string, UserBriefDTO>();
      
      results?.forEach((result, index) => {
        if (result[0] === null && result[1]) {
          try {
            const userData = JSON.parse(result[1] as string);
            userMap.set(userIds[index], userData);
          } catch (error) {
            logger.warn('解析用户缓存数据失败', error);
          }
        }
      });
      
      return userMap;
    } catch (error) {
      logger.warn('Redis批量获取用户缓存失败', error);
      return new Map();
    }
  }

  /**
   * 删除用户缓存
   */
  static async deleteUserCache(userId: string): Promise<void> {
    try {
      await redis_client.del(COMMENT_CACHE_KEYS.USER + userId);
    } catch (error) {
      logger.warn('Redis删除用户缓存失败', error);
    }
  }

  /**
   * 删除项目缓存
   */
  static async deleteProjectCache(projectId: string): Promise<void> {
    try {
      await redis_client.del(COMMENT_CACHE_KEYS.PROJECT + projectId);
    } catch (error) {
      logger.warn('Redis删除项目缓存失败', error);
    }
  }

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await redis_client.ping();
      return true;
    } catch (error) {
      logger.error('Redis连接失败', error);
      return false;
    }
  }

  /**
   * 清空所有缓存（开发环境使用）
   */
  static async clearAllCache(): Promise<void> {
    try {
      await redis_client.flushdb();
      logger.info('Redis缓存已清空');
    } catch (error) {
      logger.error('清空Redis缓存失败', error);
    }
  }
} 