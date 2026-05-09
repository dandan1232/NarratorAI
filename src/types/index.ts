export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  ttsEnabled: boolean;
  autoPlayVoice: boolean;
}

export interface Companion {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  voiceId?: string;
  voiceSettings?: VoiceSettings;
  relationship: RelationshipType;
  description: string;
  traits: string[];
  greeting: string;

  // Phase 1: CyberPersona 设计理念
  characterCard: CharacterCard;
  affection: AffectionSystem;
  memory: MemorySystem;

  // Phase 2: 深化体验
  relationshipSystem: RelationshipSystem;
  emotionalDepth: EmotionalDepthSystem;
  openingStrategy: OpeningStrategyType;
  achievements: AchievementSystem;

  // Phase 3: 世界观同步
  worldState: WorldState;
}

export type RelationshipType =
  | 'friend'
  | 'boyfriend'
  | 'girlfriend'
  | 'mentor'
  | 'counselor'
  | 'custom';

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  emotion?: EmotionType;
  audioUrl?: string;
  isPlaying?: boolean;
  stickerUrl?: string;
}

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'fearful'
  | 'neutral'
  | 'loving'
  | 'excited'
  | 'anxious'
  | 'grateful';

export interface ChatSession {
  id: string;
  companionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  summary?: string;
}

export interface VoiceCloneRequest {
  name: string;
  audioFile: File;
  description?: string;
}

export interface VoiceDesignRequest {
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'middle' | 'old';
  style: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number;
  pitch?: number;
}

export interface Memory {
  id: string;
  companionId: string;
  content: string;
  importance: number;
  timestamp: number;
  tags: string[];
}

export interface CompanionState {
  companions: Companion[];
  currentCompanion: Companion | null;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  memories: Memory[];
  voices: Voice[];
  isLoading: boolean;
  error: string | null;
}

export interface Voice {
  id: string;
  name: string;
  type: 'system' | 'cloned' | 'designed';
  previewUrl?: string;
  settings?: VoiceSettings;
}

export interface AppState {
  user: User | null;
  isInitialized: boolean;
  currentView: 'welcome' | 'setup' | 'chat' | 'settings' | 'voice' | 'companions';
}

// ==================== Phase 1: CyberPersona 设计理念 ====================

// 人格维度（简化版大五人格）
export interface PersonalityProfile {
  openness: number;        // 开放性 0-100: 好奇 vs 保守
  extraversion: number;    // 外向性 0-100: 主动 vs 内向
  agreeableness: number;   // 宜人性 0-100: 温柔 vs 直率
  neuroticism: number;     // 神经质 0-100: 敏感 vs 稳定
  conscientiousness: number; // 尽责性 0-100: 认真 vs 随性
}

// 量子态角色卡（对话中逐步坍缩）
export interface CharacterCard {
  // 不可变部分（创建时设定）
  basePersonality: PersonalityProfile;
  archetype: string;  // 人格原型名，如"温柔治愈型"、"古灵精怪型"

  // 量子态部分（对话中逐步填充）
  identity: {
    age?: string;
    hometown?: string;
    profession?: string;
    [key: string]: string | undefined;
  };
  preferences: {
    likes: string[];
    dislikes: string[];
  };
  innerWorld: string[];  // 心事、想法
  habits: string[];      // 习惯、口头禅

  // 收集进度
  collectionProgress: {
    identity: number;    // 已收集的身份数量
    preferences: number; // 已收集的喜好数量
    innerWorld: number;  // 已收集的心事数量
    habits: number;      // 已收集的习惯数量
  };
}

// 好感度等级
export type AffectionLevel =
  | 'stranger'      // 陌生 0-150
  | 'acquaintance'  // 认识 151-300
  | 'friendly'      // 友好 301-500
  | 'close'         // 亲密 501-700
  | 'crush'         // 心动 701-900
  | 'lover';        // 恋人 901-1000

// 好感度系统
export interface AffectionSystem {
  points: number;           // 0-1000
  level: AffectionLevel;
  lastInteraction: number;  // 上次互动时间
  dailyTasks: DailyTask[];  // 每日任务
}

// 每日任务
export interface DailyTask {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  reward: number;  // 好感度奖励
}

// ==================== Phase 2: 关系系统 ====================

// 关系维度（5 维）
export interface RelationshipDimensions {
  trust: number;           // 信任感 0-100: 觉得对方靠不靠谱
  security: number;        // 安全感 0-100: 觉得不会被抛弃
  closeness: number;       // 亲密感 0-100: 情感亲近程度
  neediness: number;       // 依恋度 0-100: 多想和对方待在一起
  possessiveness: number;  // 占有欲 0-100: 对对方与他人的敏感度
}

// 关系维度等级
export type RelationshipLevel = 'frozen' | 'low' | 'medium' | 'high' | 'full';

// 关系系统
export interface RelationshipSystem {
  dimensions: RelationshipDimensions;
  overallLevel: RelationshipLevel;  // 整体关系等级
  lastUpdate: number;
}

// ==================== Phase 2: 情绪深度系统 ====================

// 情绪状态
export interface EmotionalState {
  currentEmotion: EmotionType;
  currentIntensity: number;  // 1-5
  moodFactor: number;        // 情绪因子 0.5-1.5，影响关系变化
  stressLevel: number;       // 压力等级 0-100
  stressSources: StressSource[];  // 压力来源
  lastStressDecay: number;       // 上次压力衰减时间
}

// 情绪深度系统
export interface EmotionalDepthSystem {
  state: EmotionalState;
  history: EmotionalHistoryEntry[];
  factors: MoodFactors;
}

// 情绪历史条目
export interface EmotionalHistoryEntry {
  emotion: EmotionType;
  intensity: number;
  trigger: string;  // 触发原因
  timestamp: number;
}

// 情绪因子
export interface MoodFactors {
  positiveMultiplier: number;  // 正面情绪倍率
  negativeMultiplier: number;  // 负面情绪倍率
  stressMultiplier: number;    // 压力倍率
}

// ==================== Phase 3: 世界观同步 ====================

// 时间段
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

// 季节
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 星期
export type DayOfWeek = 'weekday' | 'weekend';

// 天气
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy';

// 位置
export type Location = 'home' | 'work' | 'school' | 'outdoor' | 'traveling';

// 压力来源
export type StressSource = 'negative_emotion' | 'late_night' | 'long_session';

// 世界状态
export interface WorldState {
  timeOfDay: TimeOfDay;      // 自动
  season: Season;             // 自动
  dayOfWeek: DayOfWeek;       // 自动
  weather: Weather;           // 用户设置
  location: Location;         // 用户设置
}

// ==================== Phase 2: 开场策略 ====================

// 开场策略类型
export type OpeningStrategyType =
  | 'emotion_vent'      // 情绪宣泄
  | 'sensory_share'     // 感官分享
  | 'schrodinger'       // 薛定谔提问
  | 'accidental'        // 假装发错
  | 'observer';         // 观测者静默

// 开场策略
export interface OpeningStrategy {
  type: OpeningStrategyType;
  name: string;
  description: string;
  templates: string[];  // 开场白模板
}

// ==================== Phase 2: 成就系统 ====================

// 成就类型
export type AchievementType =
  | 'interaction'   // 互动类
  | 'voice'         // 语音类
  | 'image'         // 图片类
  | 'relationship'  // 关系类
  | 'time'          // 时间类
  | 'collection';   // 收集类

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string;
  condition: string;  // 达成条件描述
  reward: number;     // 好感度奖励
  unlocked: boolean;
  unlockedAt?: number;
}

// 角色卡成就
export interface CharacterCardAchievement {
  id: string;
  category: 'identity' | 'preference' | 'innerWorld' | 'habit';
  name: string;
  description: string;
  requiredCount: number;  // 需要收集的数量
  unlocked: boolean;
  unlockedAt?: number;
}

// 成就系统
export interface AchievementSystem {
  achievements: Achievement[];
  characterCardAchievements: CharacterCardAchievement[];
  totalPoints: number;
}

// 记忆系统
export interface MemorySystem {
  // 短期记忆（当前会话上下文）
  shortTerm: Message[];

  // 长期记忆（跨会话）
  sessionSummaries: SessionSummary[];  // 最近 5 次会话摘要
  emotionalMemories: EmotionalMemory[]; // 情绪记忆
  revealedFacts: RevealedFact[];        // 已揭示的事实
}

// 会话摘要
export interface SessionSummary {
  id: string;
  sessionId: string;
  summary: string;
  keyEvents: string[];
  emotionTrend: string;
  timestamp: number;
}

// 情绪记忆
export interface EmotionalMemory {
  id: string;
  content: string;
  emotion: EmotionType;
  intensity: number;  // 1-5
  timestamp: number;
}

// 已揭示的事实
export interface RevealedFact {
  id: string;
  category: 'identity' | 'preference' | 'innerWorld' | 'habit';
  content: string;
  timestamp: number;
}
