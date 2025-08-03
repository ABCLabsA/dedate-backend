import { Request, Response } from "express";
import supabase from "../extensions/ext_auth"
import { authRegisterLoginService, refreshTokenService } from "../services/authService";


/**
 * 统一的注册/登录接口
 * 先检查用户是否存在，不存在则注册，存在则登录
 */
export const registerLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 调用服务层处理注册/登录逻辑
  const result = await authRegisterLoginService(email, password);
  
  return res.status(200).json({
    code: 200,
    message: result.message,
    data: result.data
  });
};

/**
 * 刷新访问令牌
 */
export const refreshToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

    // 调用服务层处理刷新令牌逻辑
    const result = await refreshTokenService(refresh_token);
    
    return res.status(200).json(result);
};


/**
 * 获取用户信息
 */
export const getProfile = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: "用户未登录",
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: "获取用户信息成功",
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          email_confirmed: req.user.email_confirmed_at ? true : false,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at,
          user_metadata: req.user.user_metadata
        }
      }
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null
    });
  }
};

/**
 * 用户登出
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: "未提供认证令牌",
        data: null
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: "认证令牌格式错误",
        data: null
      });
    }

    // 调用 Supabase 登出
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        code: 400,
        message: error.message,
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: "登出成功",
      data: null
    });

  } catch (error) {
    console.error('登出失败:', error);
    return res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null
    });
  }
};

/**
 * 发送密码重置邮件
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: "邮箱不能为空",
        data: null
      });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        message: "邮箱格式不正确",
        data: null
      });
    }

    // 调用 Supabase 发送密码重置邮件
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      return res.status(400).json({
        code: 400,
        message: error.message,
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: "密码重置邮件已发送，请查收邮箱",
      data: null
    });

  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    return res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null
    });
  }
};