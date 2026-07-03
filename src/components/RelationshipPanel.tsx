import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Shield, Users, Link, Lock, Zap, Award,
  ClipboardList, BookOpen, CheckCircle2, Circle, Globe,
} from 'lucide-react';
import { Companion, AffectionSystem, Weather, Location } from '../types';
import {
  RELATIONSHIP_LEVEL_NAMES,
  RELATIONSHIP_DIMENSION_NAMES,
  AFFECTION_LEVEL_NAMES,
  TIME_OF_DAY_NAMES,
  SEASON_NAMES,
} from '../utils/characterAnalyzer';
import { useAppStore } from '../stores/useAppStore';

interface RelationshipPanelProps {
  companion: Companion;
  onClose: () => void;
}

type TabKey = 'relation' | 'tasks' | 'card' | 'achievements' | 'world';

const dimensionIcons: Record<string, typeof Heart> = {
  trust: Shield,
  security: Lock,
  closeness: Users,
  neediness: Link,
  possessiveness: Heart,
};

const emotionEmoji: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠', surprised: '😲', fearful: '😨',
  neutral: '😐', loving: '🥰', excited: '🤩', anxious: '😰', grateful: '🙏',
};

const emotionNames: Record<string, string> = {
  happy: '开心', sad: '难过', angry: '生气', loving: '爱你', excited: '兴奋',
  anxious: '焦虑', grateful: '感恩', surprised: '惊讶', fearful: '害怕', neutral: '平静',
};

const tabs: { key: TabKey; label: string; icon: typeof Heart }[] = [
  { key: 'relation', label: '关系', icon: Heart },
  { key: 'tasks', label: '任务', icon: ClipboardList },
  { key: 'card', label: '角色卡', icon: BookOpen },
  { key: 'achievements', label: '成就', icon: Award },
  { key: 'world', label: '世界', icon: Globe },
];

export function RelationshipPanel({ companion, onClose }: RelationshipPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('relation');
  const { relationshipSystem, emotionalDepth, affection, achievements, memory, characterCard } = companion;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-l border-white/20 dark:border-gray-700/50 flex flex-col transition-colors"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 dark:text-gray-100">关系档案</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700">
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                activeTab === tab.key
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'relation' && (
            <RelationTab
              key="relation"
              affection={affection}
              relationshipSystem={relationshipSystem}
              emotionalDepth={emotionalDepth}
            />
          )}
          {activeTab === 'tasks' && (
            <TasksTab
              key="tasks"
              tasks={affection.dailyTasks}
            />
          )}
          {activeTab === 'card' && (
            <CharacterCardTab
              key="card"
              memory={memory}
              characterCard={characterCard}
            />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab
              key="achievements"
              achievements={achievements}
            />
          )}
          {activeTab === 'world' && (
            <WorldTab
              key="world"
              companion={companion}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============ Relation Tab ============

function RelationTab({
  affection,
  relationshipSystem,
  emotionalDepth,
}: {
  affection: AffectionSystem;
  relationshipSystem: Companion['relationshipSystem'];
  emotionalDepth: Companion['emotionalDepth'];
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Affection */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-pink-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200">好感度</span>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {AFFECTION_LEVEL_NAMES[affection.level]}
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${affection.points / 10}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
          {affection.points} / 1000
        </div>
      </div>

      {/* Relationship Dimensions */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200">关系维度</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {RELATIONSHIP_LEVEL_NAMES[relationshipSystem.overallLevel]}
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(relationshipSystem.dimensions).map(([key, value]) => {
            const Icon = dimensionIcons[key] || Heart;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {RELATIONSHIP_DIMENSION_NAMES[key as keyof typeof RELATIONSHIP_DIMENSION_NAMES]}
                  </span>
                  <span className="ml-auto text-xs font-medium text-gray-600 dark:text-gray-300">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotional State */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200">情绪状态</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">
            {emotionEmoji[emotionalDepth.state.currentEmotion] || '😐'}
          </span>
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {emotionNames[emotionalDepth.state.currentEmotion] || '平静'}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              强度 {emotionalDepth.state.currentIntensity}/5
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">压力</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{emotionalDepth.state.stressLevel}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                emotionalDepth.state.stressLevel > 70
                  ? 'bg-red-400'
                  : emotionalDepth.state.stressLevel > 40
                  ? 'bg-yellow-400'
                  : 'bg-green-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${emotionalDepth.state.stressLevel}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============ Tasks Tab ============

function TasksTab({
  tasks,
}: {
  tasks: Companion['affection']['dailyTasks'];
}) {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-300">今日进度</span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            通过聊天内容自动完成
          </p>
        </div>
        <span className="text-sm font-medium text-orange-600">
          {completedCount} / {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
              task.completed
                ? 'bg-green-50 border border-green-100'
                : 'bg-gray-50 dark:bg-gray-700/50 border-transparent'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${task.completed ? 'text-green-700' : 'text-gray-700 dark:text-gray-200'}`}>
                {task.name}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{task.description}</div>
            </div>
            <span className={`text-xs font-medium shrink-0 ${task.completed ? 'text-green-500' : 'text-orange-500'}`}>
              +{task.reward}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============ Character Card Tab ============

const FACT_LIMIT = 30;

function CharacterCardTab({
  memory,
  characterCard,
}: {
  memory: Companion['memory'];
  characterCard: Companion['characterCard'];
}) {
  const categories = [
    { key: 'identity', label: '身份', icon: '👤', barColor: 'bg-blue-400', items: memory.revealedFacts.filter((f) => f.category === 'identity') },
    { key: 'preference', label: '喜好', icon: '💜', barColor: 'bg-purple-400', items: memory.revealedFacts.filter((f) => f.category === 'preference') },
    { key: 'innerWorld', label: '心事', icon: '💭', barColor: 'bg-pink-400', items: memory.revealedFacts.filter((f) => f.category === 'innerWorld') },
    { key: 'habit', label: '习惯', icon: '🔄', barColor: 'bg-green-400', items: memory.revealedFacts.filter((f) => f.category === 'habit') },
  ];

  const totalCollected = memory.revealedFacts.length;
  const recentEmotions = memory.emotionalMemories.slice(-10).reverse();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
      {/* Overall Progress */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-purple-500">人格原型</div>
          <span className="text-xs font-medium text-purple-600">{totalCollected} / {FACT_LIMIT}</span>
        </div>
        <div className="text-sm font-medium text-purple-700 mb-2">{characterCard.archetype}</div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalCollected / FACT_LIMIT) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Categories with mini progress */}
      <div className="space-y-2 mb-4">
        {categories.map((cat) => (
          <div key={cat.key} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span>{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{cat.label}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{cat.items.length}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${cat.barColor}`}
                style={{ width: `${Math.min(100, (cat.items.length / 10) * 100)}%` }}
              />
            </div>
            {cat.items.length === 0 ? (
              <div className="text-xs text-gray-300 italic">尚未发现</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((fact) => (
                  <span
                    key={fact.id}
                    className="px-2 py-0.5 rounded-full bg-white text-xs text-gray-600 dark:text-gray-300 border border-gray-100"
                  >
                    {fact.content}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Emotion Timeline */}
      {recentEmotions.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">情绪轨迹</div>
          <div className="space-y-1.5">
            {recentEmotions.map((emo) => (
              <div key={emo.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-base shrink-0">{emotionEmoji[emo.emotion] || '😐'}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{emo.content}</span>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(emo.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Summaries */}
      {memory.sessionSummaries.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">会话记忆</div>
          <div className="space-y-2">
            {memory.sessionSummaries.slice(-3).reverse().map((s) => (
              <div key={s.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{s.summary}</div>
                {s.keyEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.keyEvents.map((event, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-600">
                        {event}
                      </span>
                    ))}
                  </div>
                )}
                {s.emotionTrend && (
                  <div className="text-[10px] text-gray-400 mt-1.5">
                    情绪趋势: {s.emotionTrend}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============ Achievements Tab ============

function AchievementsTab({
  achievements,
}: {
  achievements: Companion['achievements'];
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
      {/* Total Points */}
      <div className="mb-4 text-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
        <div className="text-xs text-amber-600 mb-1">成就点数</div>
        <div className="text-2xl font-bold text-amber-700">{achievements.totalPoints}</div>
      </div>

      {/* Achievements */}
      <div className="space-y-2 mb-4">
        {achievements.achievements.map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
              a.unlocked
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-gray-50 dark:bg-gray-700/50 opacity-60'
            }`}
          >
            <span className="text-xl">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{a.name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{a.description}</div>
            </div>
            {a.unlocked && (
              <span className="text-xs text-amber-600 font-medium">+{a.reward}</span>
            )}
          </div>
        ))}
      </div>

      {/* Character Card Achievements */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">角色卡收集</div>
      <div className="grid grid-cols-2 gap-2">
        {achievements.characterCardAchievements.map((card) => (
          <div
            key={card.id}
            className={`text-center p-2.5 rounded-lg text-xs ${
              card.unlocked
                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
            }`}
          >
            <div className="font-medium">{card.name}</div>
            <div className="text-[10px] mt-0.5">{card.description}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============ World Tab ============

const WEATHER_OPTIONS: { value: Weather; label: string; icon: string }[] = [
  { value: 'sunny', label: '晴天', icon: '☀️' },
  { value: 'cloudy', label: '多云', icon: '☁️' },
  { value: 'rainy', label: '下雨', icon: '🌧️' },
  { value: 'snowy', label: '下雪', icon: '❄️' },
  { value: 'windy', label: '刮风', icon: '🌬️' },
  { value: 'stormy', label: '暴风雨', icon: '⛈️' },
];

const LOCATION_OPTIONS: { value: Location; label: string; icon: string }[] = [
  { value: 'home', label: '在家', icon: '🏠' },
  { value: 'work', label: '上班', icon: '💼' },
  { value: 'school', label: '上学', icon: '📚' },
  { value: 'outdoor', label: '户外', icon: '🌳' },
  { value: 'traveling', label: '旅行', icon: '✈️' },
];

function WorldTab({ companion }: { companion: Companion }) {
  const { updateWorldState } = useAppStore();
  const { worldState, emotionalDepth } = companion;

  const handleWeatherChange = (weather: Weather) => {
    updateWorldState(companion.id, { weather });
  };

  const handleLocationChange = (location: Location) => {
    updateWorldState(companion.id, { location });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Auto-detected info */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200">世界状态</span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">时间自动</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-xs text-blue-500 mb-0.5">时间</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">
              {TIME_OF_DAY_NAMES[worldState.timeOfDay]} · {worldState.hour}:00
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-xs text-green-500 mb-0.5">季节</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">
              {SEASON_NAMES[worldState.season]}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 col-span-2">
            <div className="text-xs text-purple-500 mb-0.5">
              {worldState.dayOfWeek === 'weekend' ? '周末' : '工作日'}
            </div>
            {worldState.festival && (
              <div className="font-medium text-gray-700 dark:text-gray-200">
                {worldState.festival}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weather selector */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">天气</div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          首次提到城市后坍缩，并基于 wttr.in 自动同步 15 分钟缓存
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {WEATHER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleWeatherChange(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                worldState.weather === opt.value
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location selector */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">位置</div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          城市：{worldState.locationCollapsed && worldState.cityName ? worldState.cityName : '未坍缩'}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {LOCATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleLocationChange(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                worldState.location === opt.value
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stress info */}
      <div className="p-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">压力状态</div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1">
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  emotionalDepth.state.stressLevel > 70
                    ? 'bg-red-400'
                    : emotionalDepth.state.stressLevel > 40
                    ? 'bg-yellow-400'
                    : 'bg-green-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${emotionalDepth.state.stressLevel}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-10 text-right">
            {emotionalDepth.state.stressLevel}%
          </span>
        </div>

        {emotionalDepth.state.stressSources.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">压力来源</div>
            <div className="flex flex-wrap gap-1">
              {emotionalDepth.state.stressSources.map((source, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs"
                >
                  {source === 'negative_emotion' ? '负面情绪' :
                   source === 'late_night' ? '深夜' :
                   source === 'long_session' ? '长时间对话' : source}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          压力每小时自动衰减 2 点
        </p>
      </div>
    </motion.div>
  );
}
