import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Shield, Users, Link, Lock, Zap, Award,
  ClipboardList, BookOpen, CheckCircle2, Circle,
} from 'lucide-react';
import { Companion, AffectionSystem } from '../types';
import {
  RELATIONSHIP_LEVEL_NAMES,
  RELATIONSHIP_DIMENSION_NAMES,
  AFFECTION_LEVEL_NAMES,
} from '../utils/characterAnalyzer';
import { useAppStore } from '../stores/useAppStore';

interface RelationshipPanelProps {
  companion: Companion;
  onClose: () => void;
}

type TabKey = 'relation' | 'tasks' | 'card' | 'achievements';

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
];

export function RelationshipPanel({ companion, onClose }: RelationshipPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('relation');
  const { relationshipSystem, emotionalDepth, affection, achievements, memory, characterCard } = companion;
  const { addAffectionPoints, completeDailyTask } = useAppStore();

  const handleCompleteTask = (taskId: string, reward: number) => {
    const task = affection.dailyTasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      completeDailyTask(companion.id, taskId);
      addAffectionPoints(companion.id, reward);
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 h-full bg-white/95 backdrop-blur-xl border-l border-white/20 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-800">关系档案</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                activeTab === tab.key
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
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
              onComplete={handleCompleteTask}
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
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-pink-500" />
          <span className="font-medium text-gray-700">好感度</span>
          <span className="ml-auto text-sm text-gray-500">
            {AFFECTION_LEVEL_NAMES[affection.level]}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${affection.points / 10}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">
          {affection.points} / 1000
        </div>
      </div>

      {/* Relationship Dimensions */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-700">关系维度</span>
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
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {RELATIONSHIP_DIMENSION_NAMES[key as keyof typeof RELATIONSHIP_DIMENSION_NAMES]}
                  </span>
                  <span className="ml-auto text-xs font-medium text-gray-600">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
          <span className="font-medium text-gray-700">情绪状态</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">
            {emotionEmoji[emotionalDepth.state.currentEmotion] || '😐'}
          </span>
          <div>
            <div className="text-sm font-medium text-gray-700">
              {emotionNames[emotionalDepth.state.currentEmotion] || '平静'}
            </div>
            <div className="text-xs text-gray-400">
              强度 {emotionalDepth.state.currentIntensity}/5
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">压力</span>
            <span className="text-xs text-gray-400">{emotionalDepth.state.stressLevel}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
  onComplete,
}: {
  tasks: Companion['affection']['dailyTasks'];
  onComplete: (taskId: string, reward: number) => void;
}) {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">今日进度</span>
        <span className="text-sm font-medium text-orange-600">
          {completedCount} / {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onComplete(task.id, task.reward)}
            disabled={task.completed}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              task.completed
                ? 'bg-green-50 border border-green-100'
                : 'bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-orange-100'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${task.completed ? 'text-green-700' : 'text-gray-700'}`}>
                {task.name}
              </div>
              <div className="text-xs text-gray-400">{task.description}</div>
            </div>
            <span className={`text-xs font-medium shrink-0 ${task.completed ? 'text-green-500' : 'text-orange-500'}`}>
              +{task.reward}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ============ Character Card Tab ============

function CharacterCardTab({
  memory,
  characterCard,
}: {
  memory: Companion['memory'];
  characterCard: Companion['characterCard'];
}) {
  const categories = [
    { key: 'identity', label: '身份', icon: '👤', items: memory.revealedFacts.filter((f) => f.category === 'identity') },
    { key: 'preference', label: '喜好', icon: '💜', items: memory.revealedFacts.filter((f) => f.category === 'preference') },
    { key: 'innerWorld', label: '心事', icon: '💭', items: memory.revealedFacts.filter((f) => f.category === 'innerWorld') },
    { key: 'habit', label: '习惯', icon: '🔄', items: memory.revealedFacts.filter((f) => f.category === 'habit') },
  ];

  const totalCollected = memory.revealedFacts.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
      {/* Archetype */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="text-xs text-purple-500 mb-1">人格原型</div>
        <div className="text-sm font-medium text-purple-700">{characterCard.archetype}</div>
        <div className="text-xs text-gray-400 mt-1">
          已收集 {totalCollected} 条信息
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key} className="rounded-xl bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              <span className="ml-auto text-xs text-gray-400">{cat.items.length}</span>
            </div>
            {cat.items.length === 0 ? (
              <div className="text-xs text-gray-300 italic">尚未发现</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((fact) => (
                  <span
                    key={fact.id}
                    className="px-2 py-0.5 rounded-full bg-white text-xs text-gray-600 border border-gray-100"
                  >
                    {fact.content}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Session Summaries */}
      {memory.sessionSummaries.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">近期记忆</div>
          <div className="space-y-2">
            {memory.sessionSummaries.slice(-3).map((s) => (
              <div key={s.id} className="p-2 rounded-lg bg-gray-50 text-xs text-gray-600">
                {s.summary}
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
                : 'bg-gray-50 opacity-60'
            }`}
          >
            <span className="text-xl">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">{a.name}</div>
              <div className="text-xs text-gray-400 truncate">{a.description}</div>
            </div>
            {a.unlocked && (
              <span className="text-xs text-amber-600 font-medium">+{a.reward}</span>
            )}
          </div>
        ))}
      </div>

      {/* Character Card Achievements */}
      <div className="text-xs font-medium text-gray-500 mb-2">角色卡收集</div>
      <div className="grid grid-cols-2 gap-2">
        {achievements.characterCardAchievements.map((card) => (
          <div
            key={card.id}
            className={`text-center p-2.5 rounded-lg text-xs ${
              card.unlocked
                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                : 'bg-gray-50 text-gray-400'
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
