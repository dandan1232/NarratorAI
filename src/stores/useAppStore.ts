import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState, CompanionState, User, Companion, ChatSession, Message, Memory, Voice,
  CharacterCard, AffectionSystem, AffectionLevel, RevealedFact, SessionSummary, EmotionalMemory,
  RelationshipDimensions, RelationshipLevel, EmotionalState, EmotionalHistoryEntry,
  WorldState
} from '../types';
import {
  createInitialCharacterCard,
  createInitialAffection,
  createInitialMemory,
  createInitialRelationshipSystem,
  createInitialEmotionalDepthSystem,
  getRandomOpeningStrategy,
  createInitialAchievementSystem,
  createInitialWorldState,
} from '../utils/characterAnalyzer';

// 好感度等级计算
function calculateAffectionLevel(points: number): AffectionLevel {
  if (points <= 150) return 'stranger';
  if (points <= 300) return 'acquaintance';
  if (points <= 500) return 'friendly';
  if (points <= 700) return 'close';
  if (points <= 900) return 'crush';
  return 'lover';
}

// 迁移旧数据：确保伴侣有所有必需字段
function migrateCompanion(companion: any): Companion {
  // 迁移 emotionalState：补充 stressSources 和 lastStressDecay
  let emotionalDepth = companion.emotionalDepth || createInitialEmotionalDepthSystem();
  if (emotionalDepth.state && !emotionalDepth.state.stressSources) {
    emotionalDepth = {
      ...emotionalDepth,
      state: {
        ...emotionalDepth.state,
        stressSources: [],
        lastStressDecay: emotionalDepth.state.lastStressDecay || Date.now(),
      },
    };
  }

  return {
    ...companion,
    characterCard: companion.characterCard || createInitialCharacterCard(),
    affection: companion.affection || createInitialAffection(),
    memory: companion.memory || createInitialMemory(),
    relationshipSystem: companion.relationshipSystem || createInitialRelationshipSystem(),
    emotionalDepth,
    openingStrategy: companion.openingStrategy || getRandomOpeningStrategy(),
    achievements: companion.achievements || createInitialAchievementSystem(),
    worldState: companion.worldState || createInitialWorldState(),
  };
}

interface AppStore extends AppState, CompanionState {
  // User actions
  setUser: (user: User) => void;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;

  // Companion actions
  setCompanions: (companions: Companion[]) => void;
  addCompanion: (companion: Companion) => void;
  updateCompanion: (id: string, updates: Partial<Companion>) => void;
  deleteCompanion: (id: string) => void;
  setCurrentCompanion: (companion: Companion | null) => void;

  // Chat actions
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;

  // Memory actions
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Memory) => void;
  deleteMemory: (id: string) => void;

  // Voice actions
  setVoices: (voices: Voice[]) => void;
  addVoice: (voice: Voice) => void;
  deleteVoice: (id: string) => void;

  // App actions
  setCurrentView: (view: AppState['currentView']) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Phase 1: CyberPersona 设计理念
  // 角色卡相关
  updateCharacterCard: (companionId: string, updates: Partial<CharacterCard>) => void;
  addRevealedFact: (companionId: string, fact: RevealedFact) => void;

  // 好感度相关
  addAffectionPoints: (companionId: string, points: number) => void;
  completeDailyTask: (companionId: string, taskId: string) => void;
  resetDailyTasks: (companionId: string) => void;

  // 记忆相关
  addSessionSummary: (companionId: string, summary: SessionSummary) => void;
  addEmotionalMemory: (companionId: string, memory: EmotionalMemory) => void;

  // Phase 2: 深化体验
  // 关系系统相关
  updateRelationshipDimensions: (companionId: string, updates: Partial<RelationshipDimensions>) => void;

  // 情绪深度系统相关
  updateEmotionalState: (companionId: string, updates: Partial<EmotionalState>) => void;
  addEmotionalHistoryEntry: (companionId: string, entry: EmotionalHistoryEntry) => void;

  // 世界观相关
  updateWorldState: (companionId: string, updates: Partial<WorldState>) => void;

  // 成就系统相关
  unlockAchievement: (companionId: string, achievementId: string) => void;
  unlockCharacterCardAchievement: (companionId: string, category: string) => void;
}

const initialState: AppState & {
  companions: Companion[];
  currentCompanion: Companion | null;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  memories: Memory[];
  voices: Voice[];
  isLoading: boolean;
  error: string | null;
} = {
  user: null,
  isInitialized: false,
  currentView: 'welcome',
  companions: [],
  currentCompanion: null,
  sessions: [],
  currentSession: null,
  memories: [],
  voices: [],
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      // User actions
      setUser: (user) => set({ user }),
      updateUserPreferences: (preferences) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, preferences: { ...state.user.preferences, ...preferences } }
            : null,
        })),

      // Companion actions
      setCompanions: (companions) => set({ companions }),
      addCompanion: (companion) =>
        set((state) => ({ companions: [...state.companions, companion] })),
      updateCompanion: (id, updates) =>
        set((state) => ({
          companions: state.companions.map((c: Companion) => (c.id === id ? { ...c, ...updates } : c)),
          currentCompanion:
            state.currentCompanion?.id === id
              ? { ...state.currentCompanion, ...updates }
              : state.currentCompanion,
        })),
      deleteCompanion: (id) =>
        set((state) => ({
          companions: state.companions.filter((c: Companion) => c.id !== id),
          currentCompanion: state.currentCompanion?.id === id ? null : state.currentCompanion,
        })),
      setCurrentCompanion: (companion) => set({ currentCompanion: companion }),

      // Chat actions
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s: ChatSession) => (s.id === id ? { ...s, ...updates } : s)),
          currentSession:
            state.currentSession?.id === id
              ? { ...state.currentSession, ...updates }
              : state.currentSession,
        })),
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s: ChatSession) => s.id !== id),
          currentSession: state.currentSession?.id === id ? null : state.currentSession,
        })),
      setCurrentSession: (session) => set({ currentSession: session }),
      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s: ChatSession) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
              : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? {
                  ...state.currentSession,
                  messages: [...state.currentSession.messages, message],
                  updatedAt: Date.now(),
                }
              : state.currentSession,
        })),
      updateMessage: (sessionId, messageId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m: Message) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? {
                  ...state.currentSession,
                  messages: state.currentSession.messages.map((m: Message) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : state.currentSession,
        })),
      deleteMessage: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.filter((m: Message) => m.id !== messageId) }
              : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, messages: state.currentSession.messages.filter((m: Message) => m.id !== messageId) }
              : state.currentSession,
        })),

      // Memory actions
      setMemories: (memories) => set({ memories }),
      addMemory: (memory) =>
        set((state) => ({ memories: [...state.memories, memory] as Memory[] })),
      deleteMemory: (id) =>
        set((state) => ({ memories: state.memories.filter((m: Memory) => m.id !== id) })),

      // Voice actions
      setVoices: (voices) => set({ voices }),
      addVoice: (voice) => set((state) => ({ voices: [...state.voices, voice] })),
      deleteVoice: (id) =>
        set((state) => ({ voices: state.voices.filter((v: Voice) => v.id !== id) })),

      // App actions
      setCurrentView: (view) => set({ currentView: view }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),

      // Phase 1: CyberPersona 设计理念
      // 角色卡相关
      updateCharacterCard: (companionId, updates) =>
        set((state) => ({
          companions: state.companions.map((c: Companion) =>
            c.id === companionId
              ? { ...c, characterCard: { ...c.characterCard, ...updates } }
              : c
          ),
          currentCompanion:
            state.currentCompanion?.id === companionId
              ? { ...state.currentCompanion, characterCard: { ...state.currentCompanion.characterCard, ...updates } }
              : state.currentCompanion,
        })),

      addRevealedFact: (companionId, fact) =>
        set((state) => ({
          companions: state.companions.map((c: Companion) => {
            if (c.id !== companionId) return c;
            if (c.memory.revealedFacts.length >= 30) return c;
            return {
              ...c,
              memory: {
                ...c.memory,
                revealedFacts: [...c.memory.revealedFacts, fact],
              },
            };
          }),
          currentCompanion:
            state.currentCompanion?.id === companionId
              ? state.currentCompanion.memory.revealedFacts.length >= 30
                ? state.currentCompanion
                : {
                    ...state.currentCompanion,
                    memory: {
                      ...state.currentCompanion.memory,
                      revealedFacts: [...state.currentCompanion.memory.revealedFacts, fact],
                    },
                  }
              : state.currentCompanion,
        })),

      // 好感度相关
      addAffectionPoints: (companionId, points) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const newPoints = Math.min(1000, Math.max(0, companion.affection.points + points));
          const newLevel = calculateAffectionLevel(newPoints);

          const updatedAffection: AffectionSystem = {
            ...companion.affection,
            points: newPoints,
            level: newLevel,
            lastInteraction: Date.now(),
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, affection: updatedAffection } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, affection: updatedAffection }
                : state.currentCompanion,
          };
        }),

      completeDailyTask: (companionId, taskId) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const task = companion.affection.dailyTasks.find((t) => t.id === taskId);
          if (!task || task.completed) return state;

          const updatedTasks = companion.affection.dailyTasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          );

          const updatedAffection: AffectionSystem = {
            ...companion.affection,
            dailyTasks: updatedTasks,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, affection: updatedAffection } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, affection: updatedAffection }
                : state.currentCompanion,
          };
        }),

      resetDailyTasks: (companionId) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const updatedTasks = companion.affection.dailyTasks.map((t) => ({
            ...t,
            completed: false,
          }));

          const updatedAffection: AffectionSystem = {
            ...companion.affection,
            dailyTasks: updatedTasks,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, affection: updatedAffection } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, affection: updatedAffection }
                : state.currentCompanion,
          };
        }),

      // 记忆相关
      addSessionSummary: (companionId, summary) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          // 保持最近 5 次会话摘要
          const updatedSummaries = [...companion.memory.sessionSummaries, summary].slice(-5);

          const updatedMemory = {
            ...companion.memory,
            sessionSummaries: updatedSummaries,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, memory: updatedMemory } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, memory: updatedMemory }
                : state.currentCompanion,
          };
        }),

      addEmotionalMemory: (companionId, memory) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          // 保持最近 20 条情绪记忆
          const updatedMemories = [...companion.memory.emotionalMemories, memory].slice(-20);

          const updatedMemory = {
            ...companion.memory,
            emotionalMemories: updatedMemories,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, memory: updatedMemory } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, memory: updatedMemory }
                : state.currentCompanion,
          };
        }),

      // Phase 2: 深化体验
      // 关系系统相关
      updateRelationshipDimensions: (companionId, updates) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const newDimensions = { ...companion.relationshipSystem.dimensions, ...updates };

          // 计算整体关系等级
          const avg = (newDimensions.trust + newDimensions.security + newDimensions.closeness + newDimensions.neediness + newDimensions.possessiveness) / 5;
          let overallLevel: RelationshipLevel = 'frozen';
          if (avg >= 81) overallLevel = 'full';
          else if (avg >= 61) overallLevel = 'high';
          else if (avg >= 41) overallLevel = 'medium';
          else if (avg >= 21) overallLevel = 'low';

          const updatedRelationshipSystem = {
            ...companion.relationshipSystem,
            dimensions: newDimensions,
            overallLevel,
            lastUpdate: Date.now(),
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, relationshipSystem: updatedRelationshipSystem } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, relationshipSystem: updatedRelationshipSystem }
                : state.currentCompanion,
          };
        }),

      // 情绪深度系统相关
      updateEmotionalState: (companionId, updates) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const updatedState = { ...companion.emotionalDepth.state, ...updates };

          const updatedEmotionalDepth = {
            ...companion.emotionalDepth,
            state: updatedState,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, emotionalDepth: updatedEmotionalDepth } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, emotionalDepth: updatedEmotionalDepth }
                : state.currentCompanion,
          };
        }),

      addEmotionalHistoryEntry: (companionId, entry) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          // 保持最近 50 条情绪历史
          const updatedHistory = [...companion.emotionalDepth.history, entry].slice(-50);

          const updatedEmotionalDepth = {
            ...companion.emotionalDepth,
            history: updatedHistory,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, emotionalDepth: updatedEmotionalDepth } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, emotionalDepth: updatedEmotionalDepth }
                : state.currentCompanion,
          };
        }),

      // 世界观相关
      updateWorldState: (companionId, updates) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const updatedWorldState = { ...companion.worldState, ...updates };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, worldState: updatedWorldState } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, worldState: updatedWorldState }
                : state.currentCompanion,
          };
        }),

      // 成就系统相关
      unlockAchievement: (companionId, achievementId) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const updatedAchievements = companion.achievements.achievements.map((a) =>
            a.id === achievementId ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
          );

          const totalPoints = updatedAchievements
            .filter((a) => a.unlocked)
            .reduce((sum, a) => sum + a.reward, 0);

          const updatedAchievementSystem = {
            ...companion.achievements,
            achievements: updatedAchievements,
            totalPoints,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, achievements: updatedAchievementSystem } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, achievements: updatedAchievementSystem }
                : state.currentCompanion,
          };
        }),

      unlockCharacterCardAchievement: (companionId, category) =>
        set((state) => {
          const companion = state.companions.find((c: Companion) => c.id === companionId);
          if (!companion) return state;

          const updatedAchievements = companion.achievements.characterCardAchievements.map((a) =>
            a.category === category ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
          );

          const updatedAchievementSystem = {
            ...companion.achievements,
            characterCardAchievements: updatedAchievements,
          };

          return {
            companions: state.companions.map((c: Companion) =>
              c.id === companionId ? { ...c, achievements: updatedAchievementSystem } : c
            ),
            currentCompanion:
              state.currentCompanion?.id === companionId
                ? { ...state.currentCompanion, achievements: updatedAchievementSystem }
                : state.currentCompanion,
          };
        }),
    }),
    {
      name: 'narrator-ai-storage',
      partialize: (state) => ({
        user: state.user,
        companions: state.companions,
        currentCompanion: state.currentCompanion,
        sessions: state.sessions,
        currentSession: state.currentSession,
        memories: state.memories,
        voices: state.voices,
        isInitialized: state.isInitialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.companions) {
          state.companions = state.companions.map(migrateCompanion);
          if (state.currentCompanion) {
            state.currentCompanion = migrateCompanion(state.currentCompanion);
          }
        }
      },
    }
  )
);
