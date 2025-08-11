/**
 * 根据用户ID生成固定的随机名称
 * 使用哈希算法确保同一个用户ID总是生成相同的名称
 */
export function generateRandomName(userId: string): string {
  // 使用更复杂的哈希算法，减少冲突
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // 大幅增加词汇库
  const adjectives = [
    '快乐的', '聪明的', '友好的', '勇敢的', '温柔的', '活泼的', '稳重的', '热情的', '冷静的', '乐观的',
    '勤奋的', '善良的', '诚实的', '谦虚的', '坚强的', '独立的', '创新的', '专注的', '耐心的', '细心的',
    '幽默的', '浪漫的', '神秘的', '优雅的', '可爱的', '帅气的', '美丽的', '智慧的', '博学的', '有才华的',
    '勇敢的', '坚韧的', '灵活的', '敏捷的', '协调的', '平衡的', '和谐的', '完美的', '独特的', '非凡的',
    '温暖的', '阳光的', '清新的', '自然的', '健康的', '活力的', '青春的', '成熟的', '稳重的', '可靠的',
    '创意的', '艺术的', '科学的', '技术的', '文学的', '哲学的', '历史的', '地理的', '数学的', '物理的'
  ];
  
  const nouns = [
    '开发者', '设计师', '工程师', '创作者', '探索者', '思考者', '学习者', '实践者', '创新者', '梦想家',
    '艺术家', '科学家', '作家', '诗人', '音乐家', '画家', '摄影师', '导演', '演员', '歌手',
    '教师', '医生', '律师', '会计师', '建筑师', '厨师', '农民', '工人', '商人', '企业家',
    '运动员', '教练', '裁判', '观众', '粉丝', '支持者', '朋友', '伙伴', '同事', '同学',
    '旅行者', '冒险家', '收藏家', '鉴赏家', '评论家', '分析师', '研究员', '专家', '大师', '导师',
    '守护者', '引导者', '启发者', '激励者', '保护者', '建设者', '改革者', '领导者', '追随者', '见证者'
  ];
  
  // 使用不同的哈希位来生成索引，减少冲突
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs((hash >> 8) + (hash >> 16)) % nouns.length;
  
  // 添加数字后缀，进一步减少重复
  const numberSuffix = Math.abs(hash % 999) + 1;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${numberSuffix}`;
} 

/**
 * 生成随机的背景色组合
 * 用于Dicebear头像API的背景色参数
 */
export function getRandomBackgroundColors(): string {
  const colors = [
    'ff6b6b', '4ecdc4', '45b7d1', 'f9ca24', 'f0932b', '6c5ce7', 
    'a29bfe', 'fd79a8', '00b894', '00cec9', '74b9ff', '0984e3',
    '55a3ff', 'fd79a8', 'ff7675', 'fd79a8', '74b9ff', '55a3ff'
  ];
  // 随机选择3-5个颜色
  const selectedColors = colors.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
  return selectedColors.join(',');
} 