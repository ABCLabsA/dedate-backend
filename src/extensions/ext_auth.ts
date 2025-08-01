import { createClient } from "@supabase/supabase-js";

// 初始化 Supabase 客户端
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化 Supabase 管理员客户端（使用 service role key）
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

export default supabase;
export { supabaseAdmin };
