import { Request, Response, NextFunction } from "express";
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer token，并将用户信息挂载到 req.user
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 检查 Authorization 请求头
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        code: 401,
        message: "未提供认证令牌",
        data: null
      });
    }

    // 解析 Bearer token
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({ 
        code: 401,
        message: "认证令牌格式错误，请使用 'Bearer <token>' 格式",
        data: null
      });
    }

    const token = tokenParts[1];
    if (!token) {
      return res.status(401).json({ 
        code: 401,
        message: "认证令牌不能为空",
        data: null
      });
    }

    // 使用 Supabase 验证 token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ 
        code: 401,
        message: "认证令牌无效或已过期",
        data: { error: error.message }
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        code: 401,
        message: "用户不存在",
        data: null
      });
    }

    // 检查用户邮箱是否已确认（如果启用了邮箱确认）
    if (!user.email_confirmed_at) {
      return res.status(403).json({ 
        code: 403,
        message: "请先确认您的邮箱地址",
        data: null
      });
    }

    // 将用户信息挂载到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('认证中间件发生错误:', error);
    return res.status(500).json({ 
      code: 500,
      message: "服务器内部错误",
      data: null
    });
  }
}

/**
 * 可选的认证中间件
 * 如果提供了有效的 token，将用户信息挂载到 req.user，但不强制要求认证
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(); // 没有 token 也继续执行
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return next(); // token 格式错误也继续执行
    }

    const token = tokenParts[1];
    if (!token) {
      return next();
    }

    // 尝试验证 token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user && user.email_confirmed_at) {
      req.user = user;
    }

    next();
  } catch (error) {
    // 可选认证出错时不影响主流程
    next();
  }
}

/**
 * 检查用户角色权限的中间件
 * @param allowedRoles 允许的角色数组
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: 401,
        message: "需要登录",
        data: null
      });
    }

    const userRole = req.user.role || 'authenticated';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        code: 403,
        message: "权限不足",
        data: null
      });
    }

    next();
  };
}