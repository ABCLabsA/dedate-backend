import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxnfvfozimvkautcdtce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmZ2Zm96aW12a2F1dGNkdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjQxMDYsImV4cCI6MjA2OTQ0MDEwNn0.jxn5Zi9FRVRkJUqibGXlbI8kZAl_shUJLL2svrmuoKM'
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 替换为你注册过的邮箱和密码
  const email = 'csiyu100@gmail.com';
  const password = 'csy100@github';

  // 先尝试登录
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error && error.message.includes('Invalid login credentials')) {
    // 如果未注册，自动注册
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      console.error('注册失败:', signUpError.message);
      return;
    }
    // 注册后再登录
    ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
  }

  if (error) {
    console.error('登录失败:', error.message);
    return;
  }

  const access_token = data.session?.access_token;
  console.log('access_token:', access_token);
}

main();