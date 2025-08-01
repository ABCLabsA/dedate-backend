import { ServiceError } from "../errors/ServiceError";
import supabase, { supabaseAdmin } from "../extensions/ext_auth";

/**
 * 统一的注册/登录服务
 * 先检查用户是否存在，不存在则注册，存在则登录
 */
export const authRegisterLoginService = async (email: string, password: string) => {
  try {
    // 参数验证
    if (!email || !password) {
      throw new ServiceError("邮箱和密码不能为空", 200, 1001);
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ServiceError("邮箱格式不正确", 200, 1002);
    }

    // 密码强度验证
    if (password.length < 6) {
      throw new ServiceError("密码长度不能少于6位", 200, 1003);
    }

    // 先尝试登录，检查用户是否已存在
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // 如果登录成功，说明用户已存在且密码正确
    if (loginData.user && !loginError) {
      return {
        code: 200,
        message: "登录成功",
        data: {
          email_confirmed: true,
          isNewUser: false,
          session: {
            access_token: loginData.session?.access_token,
            refresh_token: loginData.session?.refresh_token,
            expires_at: loginData.session?.expires_at
          }
        }
      };
    }

    // 未确认，重新再次发送邮件并提醒用户
    if (loginError && loginError.message.includes('Email not confirmed')) {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (resendError) {
        throw new ServiceError("重新发送确认邮件失败: " + resendError.message, 200, 1004);
      }

      return {
        code: 200,
        message: "邮箱未确认，已重新发送确认邮件，请查收邮箱",
        data: {
          email_confirmed: false,
          isNewUser: true,
          needsEmailConfirmation: true
        }
      };
    }

    // 如果登录失败且是"Invalid login credentials"错误，需要进一步判断
    if (loginError && loginError.message.includes('Invalid login credentials')) {
      // 使用 supabaseAdmin 查询用户表，检查用户是否存在
      const { data: users, error: userQueryError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userQueryError) {
        throw new ServiceError("查询用户信息失败: " + userQueryError.message, 500);
      }

      // 检查用户是否存在于用户表中
      const existingUser = users.users.find(user => user.email === email);
      
      if (existingUser) {
        // 用户存在，说明是密码错误
        throw new ServiceError("用户已存在，密码错误，请检查密码", 200, 1005);
      } else {
        // 用户不存在，尝试注册新用户
        const { data: registerData, error: registerError } = await supabase.auth.signUp({
          email,
          password
        });

        // 如果注册成功，说明用户确实不存在
        if (registerData.user && !registerError) {
          return {
            code: 200,
            message: "注册成功，请查收邮件确认邮箱地址",
            data: {
              email_confirmed: false,
              isNewUser: true,
              needsEmailConfirmation: true
            }
          };
        }

        // 如果注册失败，可能是其他原因
        if (registerError) {
          throw new ServiceError("注册失败: " + registerError.message, 200, 1006);
        }
      }
    }

    // 其他登录错误
    throw new ServiceError(loginError?.message || "登录失败");

  } catch (error) {
    // 如果是 ServiceError，直接抛出
    if (error instanceof ServiceError) {
      throw error;
    }

    throw new ServiceError("认证失败", 500);
  }
};
