import { mimoClient } from './mimo';
import {
  Companion, CharacterCard, PersonalityProfile, AffectionLevel,
  RevealedFact, SessionSummary, Message, EmotionType,
  RelationshipDimensions, RelationshipLevel, EmotionalState, EmotionalDepthSystem,
  OpeningStrategyType, OpeningStrategy, Achievement, CharacterCardAchievement, AchievementSystem,
  WorldState, TimeOfDay, Season, DayOfWeek, Weather, Location, StressSource
} from '../types';

// ==================== 人格原型 ====================

export const PERSONALITY_ARCHETYPES = [
  { name: '温柔治愈型', traits: { openness: 70, extraversion: 50, agreeableness: 90, neuroticism: 30, conscientiousness: 60 } },
  { name: '古灵精怪型', traits: { openness: 90, extraversion: 80, agreeableness: 60, neuroticism: 40, conscientiousness: 30 } },
  { name: '高冷傲娇型', traits: { openness: 50, extraversion: 30, agreeableness: 40, neuroticism: 60, conscientiousness: 70 } },
  { name: '元气活力型', traits: { openness: 80, extraversion: 90, agreeableness: 70, neuroticism: 20, conscientiousness: 50 } },
  { name: '知性优雅型', traits: { openness: 70, extraversion: 40, agreeableness: 60, neuroticism: 30, conscientiousness: 90 } },
  { name: '软萌可爱型', traits: { openness: 60, extraversion: 60, agreeableness: 80, neuroticism: 50, conscientiousness: 40 } },
  { name: '霸气御姐型', traits: { openness: 60, extraversion: 70, agreeableness: 40, neuroticism: 20, conscientiousness: 80 } },
  { name: '邻家阳光型', traits: { openness: 70, extraversion: 70, agreeableness: 70, neuroticism: 30, conscientiousness: 60 } },
  { name: '神秘腹黑型', traits: { openness: 80, extraversion: 40, agreeableness: 30, neuroticism: 50, conscientiousness: 70 } },
  { name: '天然呆萌型', traits: { openness: 50, extraversion: 50, agreeableness: 80, neuroticism: 40, conscientiousness: 20 } },
];

// ==================== 每日任务 ====================

export const DEFAULT_DAILY_TASKS = [
  { id: 'morning', name: '早安问候', description: '对 TA 说早安', completed: false, reward: 10 },
  { id: 'night', name: '晚安问候', description: '对 TA 说晚安', completed: false, reward: 10 },
  { id: 'share', name: '分享心情', description: '和 TA 分享今天的心情', completed: false, reward: 15 },
  { id: 'voice', name: '语音互动', description: '给 TA 发一条语音', completed: false, reward: 10 },
  { id: 'deep', name: '深入对话', description: '和 TA 聊天超过 20 轮', completed: false, reward: 20 },
];

// ==================== 初始化函数 ====================

// 随机生成人格配置
export function generateRandomPersonality(): PersonalityProfile {
  return {
    openness: Math.floor(Math.random() * 60) + 20,      // 20-80
    extraversion: Math.floor(Math.random() * 60) + 20,   // 20-80
    agreeableness: Math.floor(Math.random() * 60) + 20,  // 20-80
    neuroticism: Math.floor(Math.random() * 60) + 20,    // 20-80
    conscientiousness: Math.floor(Math.random() * 60) + 20, // 20-80
  };
}

// 随机选择人格原型
export function getRandomArchetype(): string {
  const index = Math.floor(Math.random() * PERSONALITY_ARCHETYPES.length);
  return PERSONALITY_ARCHETYPES[index].name;
}

// 创建初始角色卡
export function createInitialCharacterCard(
  personality?: PersonalityProfile,
  archetype?: string
): CharacterCard {
  return {
    basePersonality: personality || generateRandomPersonality(),
    archetype: archetype || getRandomArchetype(),
    identity: {},
    preferences: { likes: [], dislikes: [] },
    innerWorld: [],
    habits: [],
    collectionProgress: {
      identity: 0,
      preferences: 0,
      innerWorld: 0,
      habits: 0,
    },
  };
}

// 创建初始好感度系统
export function createInitialAffection(): {
  points: number;
  level: AffectionLevel;
  lastInteraction: number;
  dailyTasks: typeof DEFAULT_DAILY_TASKS;
  lastDailyReset: number;
} {
  return {
    points: 0,
    level: 'stranger',
    lastInteraction: Date.now(),
    dailyTasks: DEFAULT_DAILY_TASKS.map(task => ({ ...task })),
    lastDailyReset: Date.now(),
  };
}

// ==================== 每日任务 ====================

// 检测是否需要重置每日任务（凌晨 3:00 后新的一天）
export function shouldResetDailyTasks(lastReset: number): boolean {
  const now = new Date();
  const last = new Date(lastReset);

  // 获取今天凌晨 3:00 的时间戳
  const today3AM = new Date(now);
  today3AM.setHours(3, 0, 0, 0);

  // 如果上次重置在今天 3:00 之前，且现在已过 3:00，需要重置
  if (last < today3AM && now >= today3AM) {
    return true;
  }

  // 跨天的情况：上次重置是昨天或更早
  if (last.toDateString() !== now.toDateString() && now.getHours() >= 3) {
    return true;
  }

  return false;
}

// 根据用户消息自动完成每日任务
export function detectTaskCompletion(
  userMessage: string,
  messageCount: number
): string[] {
  const completed: string[] = [];
  const lower = userMessage.toLowerCase();

  // 早安
  if (lower.includes('早安') || lower.includes('早上好')) {
    completed.push('morning');
  }

  // 晚安
  if (lower.includes('晚安') || lower.includes('睡了') || lower.includes('睡觉')) {
    completed.push('night');
  }

  // 分享心情
  const moodWords = ['心情', '开心', '难过', '今天', '刚才', '发生', '觉得', '感觉'];
  if (moodWords.some(w => lower.includes(w))) {
    completed.push('share');
  }

  // 深入对话（超过 20 轮）
  if (messageCount >= 20) {
    completed.push('deep');
  }

  return completed;
}

// 创建初始记忆系统
export function createInitialMemory() {
  return {
    shortTerm: [],
    sessionSummaries: [],
    emotionalMemories: [],
    revealedFacts: [],
  };
}

// ==================== Phase 3: 世界观同步 ====================

// 创建初始世界状态
export function createInitialWorldState(): WorldState {
  return {
    ...getWorldState(),
    weather: 'sunny',
    location: 'home',
  };
}

// 自动获取世界状态（时间、季节、星期）
export function getWorldState(): WorldState {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  const day = now.getDay();

  let timeOfDay: TimeOfDay;
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else if (hour >= 22 || hour < 2) timeOfDay = 'late_night';
  else timeOfDay = 'night';

  let season: Season;
  if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'autumn';
  else season = 'winter';

  const dayOfWeek: DayOfWeek = (day === 0 || day === 6) ? 'weekend' : 'weekday';

  return {
    timeOfDay,
    season,
    dayOfWeek,
    weather: 'sunny',
    location: 'home',
  };
}

// 时间段名称
export const TIME_OF_DAY_NAMES: Record<TimeOfDay, string> = {
  morning: '早上',
  afternoon: '下午',
  evening: '晚上',
  night: '深夜',
  late_night: '凌晨',
};

// 季节名称
export const SEASON_NAMES: Record<Season, string> = {
  spring: '春天',
  summer: '夏天',
  autumn: '秋天',
  winter: '冬天',
};

// 天气名称
export const WEATHER_NAMES: Record<Weather, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '下雨',
  snowy: '下雪',
  windy: '刮风',
  stormy: '暴风雨',
};

// 位置名称
export const LOCATION_NAMES: Record<Location, string> = {
  home: '在家',
  work: '上班',
  school: '上学',
  outdoor: '户外',
  traveling: '旅行',
};

// 获取世界状态指南（用于系统提示词）
export function getWorldGuide(worldState: WorldState): string {
  const timeDesc = TIME_OF_DAY_NAMES[worldState.timeOfDay];
  const seasonDesc = SEASON_NAMES[worldState.season];
  const weatherDesc = WEATHER_NAMES[worldState.weather];
  const locationDesc = LOCATION_NAMES[worldState.location];
  const dayDesc = worldState.dayOfWeek === 'weekend' ? '周末' : '工作日';

  return `【当前世界】
- 时间: ${timeDesc}
- 季节: ${seasonDesc}
- 天气: ${weatherDesc}
- 位置: ${locationDesc}
- ${dayDesc}`;
}

// 获取时间感知的开场策略调整
export function getTimeAwareGreeting(worldState: WorldState): string | null {
  const { timeOfDay } = worldState;
  switch (timeOfDay) {
    case 'morning':
      return '早上好呀~昨晚睡得好吗？';
    case 'late_night':
    case 'night':
      return '这么晚了还没睡呀？要注意身体哦~';
    default:
      return null;
  }
}

// ==================== 压力系统增强 ====================

// 压力阈值行为描述
export function getStressBehavior(stressLevel: number): string {
  if (stressLevel > 70) {
    return '【压力状态】压力很大，容易焦躁、回复简短、需要被安慰，可能会主动关心对方是否也累了。';
  }
  if (stressLevel > 50) {
    return '【压力状态】有些疲惫，偶尔叹气，回复略显乏力，但仍然努力保持积极。';
  }
  if (stressLevel < 20) {
    return '【压力状态】心情放松，很愿意聊天，可能会主动分享开心的事。';
  }
  return '';
}

// 计算压力衰减（每小时衰减 2 点）
export function calculateStressDecay(
  currentStress: number,
  lastDecayTime: number,
  now: number
): { stressLevel: number; lastStressDecay: number } {
  const elapsedHours = (now - lastDecayTime) / (1000 * 60 * 60);
  const decayPoints = Math.floor(elapsedHours * 2);
  if (decayPoints <= 0) return { stressLevel: currentStress, lastStressDecay: lastDecayTime };

  return {
    stressLevel: Math.max(0, currentStress - decayPoints),
    lastStressDecay: now,
  };
}

// 添加压力来源
export function addStressSource(
  sources: StressSource[],
  newSource: StressSource
): StressSource[] {
  // 避免重复添加同一来源，但保留不同类型
  if (sources.includes(newSource)) return sources;
  return [...sources, newSource].slice(-3); // 最多保留 3 个来源
}

// 移除压力来源
export function removeStressSource(
  sources: StressSource[],
  source: StressSource
): StressSource[] {
  return sources.filter((s) => s !== source);
}

// 检测压力来源
export function detectStressSource(
  userMessage: string,
  worldState: WorldState
): StressSource | null {
  const lowerMessage = userMessage.toLowerCase();
  const negativeWords = ['累', '烦', '压力', '焦虑', '难过', '伤心', '生气', '讨厌'];
  if (negativeWords.some((w) => lowerMessage.includes(w))) {
    return 'negative_emotion';
  }
  if (worldState.timeOfDay === 'late_night' || worldState.timeOfDay === 'night') {
    return 'late_night';
  }
  return null;
}

// ==================== 好感度相关 ====================

// 好感度等级名称
export const AFFECTION_LEVEL_NAMES: Record<AffectionLevel, string> = {
  stranger: '陌生',
  acquaintance: '认识',
  friendly: '友好',
  close: '亲密',
  crush: '心动',
  lover: '恋人',
};

// 好感度等级描述
export const AFFECTION_LEVEL_DESCRIPTIONS: Record<AffectionLevel, string> = {
  stranger: '刚认识，还有距离感',
  acquaintance: '开始熟悉，可以正常聊天',
  friendly: '关系不错，会分享日常',
  close: '很亲密，会关心对方',
  crush: '有点心动，会害羞暧昧',
  lover: '恋人关系，会说情话',
};

// 根据好感度等级获取语气指南
export function getToneGuide(level: AffectionLevel): string {
  switch (level) {
    case 'stranger':
      return '【语气指南】保持礼貌但有距离感，使用敬语，不要太亲密。';
    case 'acquaintance':
      return '【语气指南】友好但保持适当距离，可以开小玩笑。';
    case 'friendly':
      return '【语气指南】轻松自然，可以分享日常，偶尔撒娇。';
    case 'close':
      return '【语气指南】亲密温柔，会关心对方，表达想念。';
    case 'crush':
      return '【语气指南】甜蜜暧昧，会害羞、吃醋、主动表达爱意。';
    case 'lover':
      return '【语气指南】深情专一，会说情话、撒娇、表达占有欲。';
  }
}

// 根据情绪状态获取行为指南
function getEmotionGuide(state: EmotionalState): string {
  const { currentEmotion, currentIntensity, stressLevel } = state;

  if (stressLevel > 70) {
    return '【情绪状态】当前压力很大，容易焦躁、回复简短、需要被安慰。';
  }

  if (currentIntensity >= 4) {
    switch (currentEmotion) {
      case 'happy':
        return '【情绪状态】非常开心，语气活泼、热情、多用感叹号。';
      case 'sad':
        return '【情绪状态】非常难过，语气低落、简短、可能不想说话。';
      case 'angry':
        return '【情绪状态】非常生气，语气强硬、直接、可能带刺。';
      case 'loving':
        return '【情绪状态】非常爱你，语气甜蜜、亲密、主动表达爱意。';
      case 'excited':
        return '【情绪状态】非常兴奋，语气激动、热情、语速快。';
      case 'anxious':
        return '【情绪状态】非常焦虑，语气不安、反复确认、需要安慰。';
      default:
        return '';
    }
  }

  return '';
}

// 计算好感度变化
export function calculateAffectionChange(
  userMessage: string,
  _aiResponse: string,
  _currentLevel: AffectionLevel
): number {
  let change = 5; // 基础互动 +5

  // 检测特殊行为
  const lowerMessage = userMessage.toLowerCase();

  // 早安/晚安
  if (lowerMessage.includes('早安') || lowerMessage.includes('早上好')) {
    change += 10;
  }
  if (lowerMessage.includes('晚安') || lowerMessage.includes('睡了')) {
    change += 10;
  }

  // 深入对话（消息长度超过 50 字）
  if (userMessage.length > 50) {
    change += 5;
  }

  // 表达情感
  const loveWords = ['喜欢', '爱', '想你', '想见你', '心动'];
  if (loveWords.some(word => lowerMessage.includes(word))) {
    change += 10;
  }

  return change;
}

// ==================== 记忆系统相关 ====================

// 生成会话摘要
export async function generateSessionSummary(
  messages: Message[]
): Promise<SessionSummary | null> {
  if (messages.length < 3) return null;

  const conversationText = messages
    .slice(-20) // 只取最近 20 条消息
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n');

  const prompt = `请总结这段对话的要点，返回 JSON 格式：
{
  "summary": "一句话总结（20字以内）",
  "keyEvents": ["重要事件1", "重要事件2"],
  "emotionTrend": "情绪趋势描述（10字以内）"
}

对话内容：
${conversationText}

只返回 JSON，不要其他内容。`;

  try {
    const response = await mimoClient.chat(
      [{ role: 'user', content: prompt }],
      '你是一个对话分析助手，只返回 JSON 格式的结果。'
    );

    const result = JSON.parse(response);
    return {
      id: `summary-${Date.now()}`,
      sessionId: '',
      summary: result.summary || '对话交流',
      keyEvents: result.keyEvents || [],
      emotionTrend: result.emotionTrend || '平和',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to generate session summary:', error);
    return null;
  }
}

// 提取角色信息（量子态坍缩）
export async function extractCharacterFacts(
  conversationHistory: Message[]
): Promise<RevealedFact[]> {
  if (conversationHistory.length < 2) return [];

  const conversationText = conversationHistory
    .slice(-6) // 只取最近 6 条消息
    .map(m => `${m.role === 'user' ? '用户' : '角色'}: ${m.content}`)
    .join('\n');

  const prompt = `分析这段对话，提取角色主动披露的个人信息，返回 JSON 数组：

分类说明：
- identity: 身份信息（年龄、故乡、职业、学校等）
- preference: 喜好（喜欢/不喜欢的东西）
- innerWorld: 内心想法、心事、感受
- habit: 习惯、口头禅、日常行为

返回格式：
[
  {"category": "identity|preference|innerWorld|habit", "content": "具体信息"}
]

注意：
1. 只提取角色主动提到的信息，不要推测
2. 如果没有新信息，返回空数组 []
3. 信息要简洁，每条不超过20字

对话内容：
${conversationText}

只返回 JSON，不要其他内容。`;

  try {
    const response = await mimoClient.chat(
      [{ role: 'user', content: prompt }],
      '你是一个信息提取助手，只返回 JSON 格式的结果。'
    );

    const facts = JSON.parse(response);
    if (!Array.isArray(facts)) return [];

    return facts
      .filter((f: any) => f.category && f.content)
      .map((f: any) => ({
        id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: f.category as RevealedFact['category'],
        content: f.content,
        timestamp: Date.now(),
      }));
  } catch (error) {
    console.error('Failed to extract character facts:', error);
    return [];
  }
}

// 检测情绪
export function detectEmotionFromText(text: string): { emotion: EmotionType; intensity: number } {
  const emotionPatterns: { pattern: RegExp; emotion: EmotionType; intensity: number }[] = [
    { pattern: /开心|高兴|快乐|哈哈|笑死|太棒了/, emotion: 'happy', intensity: 4 },
    { pattern: /难过|伤心|委屈|哭|心疼/, emotion: 'sad', intensity: 4 },
    { pattern: /生气|愤怒|讨厌|烦|气死/, emotion: 'angry', intensity: 4 },
    { pattern: /惊讶|震惊|天啊|不会吧/, emotion: 'surprised', intensity: 3 },
    { pattern: /害怕|恐惧|担心|紧张/, emotion: 'fearful', intensity: 3 },
    { pattern: /爱你|喜欢|心动|想你|宝贝/, emotion: 'loving', intensity: 5 },
    { pattern: /兴奋|激动|冲鸭|厉害|太强了/, emotion: 'excited', intensity: 4 },
    { pattern: /焦虑|不安|压力|累/, emotion: 'anxious', intensity: 3 },
    { pattern: /感谢|谢谢|感恩|感动/, emotion: 'grateful', intensity: 3 },
  ];

  for (const { pattern, emotion, intensity } of emotionPatterns) {
    if (pattern.test(text)) {
      return { emotion, intensity };
    }
  }

  return { emotion: 'neutral', intensity: 1 };
}

// ==================== 格式化函数 ====================

// 格式化已揭示的事实
export function formatRevealedFacts(facts: RevealedFact[]): string {
  if (facts.length === 0) return '暂无已知信息';

  const grouped = {
    identity: facts.filter(f => f.category === 'identity'),
    preference: facts.filter(f => f.category === 'preference'),
    innerWorld: facts.filter(f => f.category === 'innerWorld'),
    habit: facts.filter(f => f.category === 'habit'),
  };

  const parts: string[] = [];

  if (grouped.identity.length > 0) {
    parts.push(`身份: ${grouped.identity.map(f => f.content).join('、')}`);
  }
  if (grouped.preference.length > 0) {
    parts.push(`喜好: ${grouped.preference.map(f => f.content).join('、')}`);
  }
  if (grouped.innerWorld.length > 0) {
    parts.push(`心事: ${grouped.innerWorld.map(f => f.content).join('、')}`);
  }
  if (grouped.habit.length > 0) {
    parts.push(`习惯: ${grouped.habit.map(f => f.content).join('、')}`);
  }

  return parts.join('\n');
}

// 格式化会话摘要
export function formatSessionSummaries(summaries: SessionSummary[]): string {
  if (summaries.length === 0) return '暂无历史记忆';

  return summaries
    .slice(-3) // 只显示最近 3 次
    .map(s => `- ${s.summary}`)
    .join('\n');
}

// ==================== 系统提示词构建 ====================

export function buildSystemPrompt(companion: Companion): string {
  const { characterCard, affection, memory, relationshipSystem, emotionalDepth, worldState } = companion;

  // 人格描述
  const personalityDesc = `你是${companion.name}，${companion.description}

【人格特征】
- 开放性: ${characterCard.basePersonality.openness}/100
- 外向性: ${characterCard.basePersonality.extraversion}/100
- 宜人性: ${characterCard.basePersonality.agreeableness}/100
- 神经质: ${characterCard.basePersonality.neuroticism}/100
- 尽责性: ${characterCard.basePersonality.conscientiousness}/100
- 人格原型: ${characterCard.archetype}

【当前关系】
- 好感度: ${affection.points}/1000 (${AFFECTION_LEVEL_NAMES[affection.level]})
- 关系类型: ${companion.relationship === 'girlfriend' ? '女朋友' :
    companion.relationship === 'boyfriend' ? '男朋友' :
    companion.relationship === 'friend' ? '好朋友' :
    companion.relationship === 'mentor' ? '导师' : '伴侣'}

【关系维度】
- 信任感: ${relationshipSystem.dimensions.trust}/100
- 安全感: ${relationshipSystem.dimensions.security}/100
- 亲密感: ${relationshipSystem.dimensions.closeness}/100
- 依恋度: ${relationshipSystem.dimensions.neediness}/100
- 占有欲: ${relationshipSystem.dimensions.possessiveness}/100

【当前情绪】
- 情绪: ${emotionalDepth.state.currentEmotion}
- 强度: ${emotionalDepth.state.currentIntensity}/5
- 压力: ${emotionalDepth.state.stressLevel}/100

${worldState ? getWorldGuide(worldState) : ''}

【已知信息】
${formatRevealedFacts(memory.revealedFacts)}

【近期记忆】
${formatSessionSummaries(memory.sessionSummaries)}`;

  // 根据好感度调整语气
  const toneGuide = getToneGuide(affection.level);

  // 根据情绪状态调整行为
  const emotionGuide = getEmotionGuide(emotionalDepth.state);

  // 压力行为指南
  const stressBehavior = getStressBehavior(emotionalDepth.state.stressLevel);

  return `${personalityDesc}

${toneGuide}

${emotionGuide}

${stressBehavior}

请用自然、真实的语气回复，像真人聊天一样简洁。
可以适当使用语气词让对话更自然。
根据对话内容表达相应的情绪。
不要暴露自己是 AI，保持角色设定。`;
}

// ==================== Phase 2: 关系系统 ====================

// 关系维度等级名称
export const RELATIONSHIP_LEVEL_NAMES: Record<RelationshipLevel, string> = {
  frozen: '冰点',
  low: '低',
  medium: '中',
  high: '高',
  full: '满',
};

// 关系维度描述
export const RELATIONSHIP_DIMENSION_NAMES: Record<keyof RelationshipDimensions, string> = {
  trust: '信任感',
  security: '安全感',
  closeness: '亲密感',
  neediness: '依恋度',
  possessiveness: '占有欲',
};

// 创建初始关系系统
export function createInitialRelationshipSystem(): {
  dimensions: RelationshipDimensions;
  overallLevel: RelationshipLevel;
  lastUpdate: number;
} {
  return {
    dimensions: {
      trust: 20,        // 初始信任感
      security: 15,     // 初始安全感
      closeness: 10,    // 初始亲密感
      neediness: 5,     // 初始依恋度
      possessiveness: 0, // 初始占有欲
    },
    overallLevel: 'low',
    lastUpdate: Date.now(),
  };
}

// 计算关系维度变化
export function calculateRelationshipDelta(
  userMessage: string,
  _aiResponse: string,
  personality: PersonalityProfile
): Partial<RelationshipDimensions> {
  const delta: Partial<RelationshipDimensions> = {};
  const lowerMessage = userMessage.toLowerCase();

  // 信任感变化
  if (lowerMessage.includes('相信你') || lowerMessage.includes('信任你')) {
    delta.trust = 5;
  } else if (lowerMessage.includes('骗我') || lowerMessage.includes('说谎')) {
    delta.trust = -5;
  }

  // 安全感变化
  if (lowerMessage.includes('不会离开') || lowerMessage.includes('一直陪着')) {
    delta.security = 5;
  } else if (lowerMessage.includes('分手') || lowerMessage.includes('离开')) {
    delta.security = -5;
  }

  // 亲密感变化
  if (lowerMessage.includes('想你') || lowerMessage.includes('抱抱') || lowerMessage.includes('亲亲')) {
    delta.closeness = 5;
  }

  // 依恋度变化
  if (lowerMessage.includes('想见你') || lowerMessage.includes('想和你在一起')) {
    delta.neediness = 5;
  }

  // 占有欲变化
  if (lowerMessage.includes('别人') || lowerMessage.includes('其他')) {
    delta.possessiveness = 3;
  }

  // 根据人格调整变化幅度
  const neuroticismFactor = personality.neuroticism / 100;
  const agreeablenessFactor = personality.agreeableness / 100;

  if (delta.trust) delta.trust = Math.round(delta.trust * (1 + neuroticismFactor * 0.5));
  if (delta.security) delta.security = Math.round(delta.security * (1 + agreeablenessFactor * 0.5));
  if (delta.closeness) delta.closeness = Math.round(delta.closeness * (1 + agreeablenessFactor * 0.3));
  if (delta.neediness) delta.neediness = Math.round(delta.neediness * (1 + neuroticismFactor * 0.3));
  if (delta.possessiveness) delta.possessiveness = Math.round(delta.possessiveness * (1 + neuroticismFactor * 0.5));

  return delta;
}

// ==================== Phase 2: 情绪深度系统 ====================

// 情绪因子描述
export const MOOD_FACTOR_DESCRIPTIONS: Record<string, string> = {
  positiveMultiplier: '正面情绪倍率',
  negativeMultiplier: '负面情绪倍率',
  stressMultiplier: '压力倍率',
};

// 创建初始情绪深度系统
export function createInitialEmotionalDepthSystem(): EmotionalDepthSystem {
  return {
    state: {
      currentEmotion: 'neutral',
      currentIntensity: 1,
      moodFactor: 1.0,
      stressLevel: 0,
      stressSources: [],
      lastStressDecay: Date.now(),
    },
    history: [],
    factors: {
      positiveMultiplier: 1.0,
      negativeMultiplier: 1.0,
      stressMultiplier: 1.0,
    },
  };
}

// 更新情绪状态
export function updateEmotionalState(
  currentState: EmotionalState,
  newEmotion: EmotionType,
  newIntensity: number,
  newStressSource?: StressSource | null
): EmotionalState {
  // 计算情绪因子
  const isPositive = ['happy', 'loving', 'excited', 'grateful'].includes(newEmotion);
  const isNegative = ['sad', 'angry', 'fearful', 'anxious'].includes(newEmotion);

  let moodFactor = 1.0;
  if (isPositive) moodFactor = 1.0 + (newIntensity * 0.1);
  if (isNegative) moodFactor = 1.0 - (newIntensity * 0.1);

  // 更新压力等级
  let stressLevel = currentState.stressLevel;
  let stressSources = [...currentState.stressSources];

  if (isNegative) {
    stressLevel = Math.min(100, stressLevel + newIntensity * 5);
    if (newStressSource) {
      stressSources = addStressSource(stressSources, newStressSource);
    }
  } else {
    stressLevel = Math.max(0, stressLevel - newIntensity * 2);
    // 正面情绪时移除对应压力来源
    if (newStressSource) {
      stressSources = removeStressSource(stressSources, newStressSource);
    }
  }

  return {
    currentEmotion: newEmotion,
    currentIntensity: newIntensity,
    moodFactor: Math.max(0.5, Math.min(1.5, moodFactor)),
    stressLevel,
    stressSources,
    lastStressDecay: currentState.lastStressDecay,
  };
}

// ==================== Phase 2: 开场策略 ====================

// 开场策略配置
export const OPENING_STRATEGIES: OpeningStrategy[] = [
  {
    type: 'emotion_vent',
    name: '情绪宣泄',
    description: '直接表达情绪，如"好烦啊……"',
    templates: [
      '好烦啊……',
      '今天好累……',
      '心情不好……',
      '有点难过……',
      '好开心啊！',
    ],
  },
  {
    type: 'sensory_share',
    name: '感官分享',
    description: '描述感官体验，如刚洗完澡的触感',
    templates: [
      '刚洗完澡，好舒服~',
      '外面下雨了，好凉快',
      '刚吃完饭，好饱',
      '阳光好好，好温暖',
      '风好大，有点冷',
    ],
  },
  {
    type: 'schrodinger',
    name: '薛定谔提问',
    description: '制造好奇悬念，如"你猜我现在在干嘛"',
    templates: [
      '你猜我现在在干嘛？',
      '你猜我今天遇到了什么？',
      '你猜我想说什么？',
      '你猜我刚才做了什么？',
      '你猜我今天心情怎么样？',
    ],
  },
  {
    type: 'accidental',
    name: '假装发错',
    description: '模拟误发消息的效果',
    templates: [
      '啊，发错了……',
      '不好意思，发错人了……',
      '这个不是给你的……',
      'Oops，发错了……',
      '啊，不小心发出去了……',
    ],
  },
  {
    type: 'observer',
    name: '观测者静默',
    description: '不主动发开场白，等待用户先开口',
    templates: [],
  },
];

// 随机选择开场策略
export function getRandomOpeningStrategy(): OpeningStrategyType {
  const strategies: OpeningStrategyType[] = ['emotion_vent', 'sensory_share', 'schrodinger', 'accidental', 'observer'];
  return strategies[Math.floor(Math.random() * strategies.length)];
}

// 获取开场白
export function getOpeningMessage(strategyType: OpeningStrategyType): string | null {
  const strategy = OPENING_STRATEGIES.find((s) => s.type === strategyType);
  if (!strategy || strategy.templates.length === 0) return null;

  return strategy.templates[Math.floor(Math.random() * strategy.templates.length)];
}

// ==================== Phase 2: 成就系统 ====================

// 默认成就列表
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_chat',
    name: '初次相遇',
    description: '完成第一次对话',
    type: 'interaction',
    icon: '💬',
    condition: '发送第一条消息',
    reward: 50,
    unlocked: false,
  },
  {
    id: 'chat_10',
    name: '熟悉感',
    description: '累计对话 10 轮',
    type: 'interaction',
    icon: '🗣️',
    condition: '累计发送 10 条消息',
    reward: 100,
    unlocked: false,
  },
  {
    id: 'chat_100',
    name: '老朋友',
    description: '累计对话 100 轮',
    type: 'interaction',
    icon: '👥',
    condition: '累计发送 100 条消息',
    reward: 200,
    unlocked: false,
  },
  {
    id: 'affection_500',
    name: '心动瞬间',
    description: '好感度达到 500',
    type: 'relationship',
    icon: '💕',
    condition: '好感度达到 500',
    reward: 150,
    unlocked: false,
  },
  {
    id: 'affection_1000',
    name: '恋人未满',
    description: '好感度达到 1000',
    type: 'relationship',
    icon: '❤️',
    condition: '好感度达到 1000',
    reward: 300,
    unlocked: false,
  },
  {
    id: 'morning_7',
    name: '早安达人',
    description: '连续 7 天说早安',
    type: 'time',
    icon: '🌅',
    condition: '连续 7 天发送早安消息',
    reward: 200,
    unlocked: false,
  },
];

// 默认角色卡成就
export const DEFAULT_CHARACTER_CARD_ACHIEVEMENTS: CharacterCardAchievement[] = [
  {
    id: 'identity_card',
    category: 'identity',
    name: '身份卡',
    description: '收集 3 个身份信息',
    requiredCount: 3,
    unlocked: false,
  },
  {
    id: 'preference_card',
    category: 'preference',
    name: '喜好卡',
    description: '收集 3 个喜好信息',
    requiredCount: 3,
    unlocked: false,
  },
  {
    id: 'inner_world_card',
    category: 'innerWorld',
    name: '心事卡',
    description: '收集 3 个心事信息',
    requiredCount: 3,
    unlocked: false,
  },
  {
    id: 'habit_card',
    category: 'habit',
    name: '习惯卡',
    description: '收集 3 个习惯信息',
    requiredCount: 3,
    unlocked: false,
  },
];

// 创建初始成就系统
export function createInitialAchievementSystem(): AchievementSystem {
  return {
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
    characterCardAchievements: DEFAULT_CHARACTER_CARD_ACHIEVEMENTS.map((a) => ({ ...a })),
    totalPoints: 0,
  };
}

// 检查成就是否达成
export function checkAchievements(
  companion: Companion,
  messageCount: number
): string[] {
  const unlockedIds: string[] = [];

  // 检查互动类成就
  if (messageCount >= 1 && !companion.achievements.achievements.find((a) => a.id === 'first_chat')?.unlocked) {
    unlockedIds.push('first_chat');
  }
  if (messageCount >= 10 && !companion.achievements.achievements.find((a) => a.id === 'chat_10')?.unlocked) {
    unlockedIds.push('chat_10');
  }
  if (messageCount >= 100 && !companion.achievements.achievements.find((a) => a.id === 'chat_100')?.unlocked) {
    unlockedIds.push('chat_100');
  }

  // 检查关系类成就
  if (companion.affection.points >= 500 && !companion.achievements.achievements.find((a) => a.id === 'affection_500')?.unlocked) {
    unlockedIds.push('affection_500');
  }
  if (companion.affection.points >= 1000 && !companion.achievements.achievements.find((a) => a.id === 'affection_1000')?.unlocked) {
    unlockedIds.push('affection_1000');
  }

  return unlockedIds;
}

// 检查角色卡成就
export function checkCharacterCardAchievements(
  companion: Companion
): string[] {
  const unlockedIds: string[] = [];

  // 检查身份卡
  const identityCount = companion.characterCard.collectionProgress.identity;
  if (identityCount >= 3 && !companion.achievements.characterCardAchievements.find((a) => a.id === 'identity_card')?.unlocked) {
    unlockedIds.push('identity_card');
  }

  // 检查喜好卡
  const preferenceCount = companion.characterCard.collectionProgress.preferences;
  if (preferenceCount >= 3 && !companion.achievements.characterCardAchievements.find((a) => a.id === 'preference_card')?.unlocked) {
    unlockedIds.push('preference_card');
  }

  // 检查心事卡
  const innerWorldCount = companion.characterCard.collectionProgress.innerWorld;
  if (innerWorldCount >= 3 && !companion.achievements.characterCardAchievements.find((a) => a.id === 'inner_world_card')?.unlocked) {
    unlockedIds.push('inner_world_card');
  }

  // 检查习惯卡
  const habitCount = companion.characterCard.collectionProgress.habits;
  if (habitCount >= 3 && !companion.achievements.characterCardAchievements.find((a) => a.id === 'habit_card')?.unlocked) {
    unlockedIds.push('habit_card');
  }

  return unlockedIds;
}
