import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Image,
  Smile,
  MoreVertical,
  Play,
  Volume2,
  Loader2,
  ChevronDown,
  Copy,
  Trash2,
  X,
} from 'lucide-react';
import { Message, RevealedFact } from '../types';
import { useSticker } from '../hooks/useSticker';
import { mimoClient, MimoMessage } from '../utils/mimo';
import {
  calculateAffectionChange,
  generateSessionSummary,
  updateEmotionalState,
  checkAchievements,
  checkCharacterCardAchievements,
  getOpeningMessage,
  getWorldState,
  detectStressSource,
  calculateStressDecay,
  detectTaskCompletion,
  shouldResetDailyTasks,
} from '../utils/characterAnalyzer';
import {
  buildStructuredTurnPrompt,
  calculateEffectiveDelta,
  createFallbackTurnResult,
  enumDeltaToNumber,
  parseTurnJson,
  validateStructuredTurnResult,
} from '../utils/turnEngine';
import { collapseCityFromText, fetchWttrWeather } from '../utils/worldSync';
import { AffectionDisplay } from '../components/AffectionDisplay';
import { RelationshipPanel } from '../components/RelationshipPanel';
import { CollectionToast } from '../components/CollectionToast';
import { AchievementToast } from '../components/AchievementToast';

// 日期格式化
function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

// 判断是否需要显示日期分隔线
function shouldShowDateSeparator(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true;
  const currDate = new Date(current.timestamp).toDateString();
  const prevDate = new Date(previous.timestamp).toDateString();
  return currDate !== prevDate;
}

// 快捷回复生成
function getQuickReplies(lastMessage: string): string[] {
  const replies: string[] = [];
  const lower = lastMessage.toLowerCase();

  if (lower.includes('?') || lower.includes('？') || lower.includes('吗') || lower.includes('呢') || lower.includes('什么') || lower.includes('怎么') || lower.includes('为什么')) {
    replies.push('嗯嗯，说得对', '让我想想', '继续说说');
  } else if (lower.includes('开心') || lower.includes('高兴') || lower.includes('哈哈') || lower.includes('笑')) {
    replies.push('哈哈哈', '你好可爱', '继续说');
  } else if (lower.includes('难过') || lower.includes('伤心') || lower.includes('哭') || lower.includes('委屈')) {
    replies.push('抱抱你', '别难过', '我在这里');
  } else if (lower.includes('想你') || lower.includes('喜欢') || lower.includes('爱') || lower.includes('宝贝')) {
    replies.push('我也想你', '么么哒', '你最好了');
  } else {
    replies.push('继续说', '然后呢？', '换个话题');
  }

  return replies.slice(0, 3);
}

// 常用表情
const EMOJI_LIST = [
  '😊', '😂', '🥰', '😍', '🤗', '😘', '💕', '🥺',
  '😭', '🤣', '😌', '😏', '🤔', '😮', '😢', '😤',
  '🥰', '😴', '🫣', '🤭', '😋', '🤪', '😎', '🥺',
  '👍', '👋', '🤝', '💪', '❤️', '🔥', '⭐', '🎉',
  '☕', '🌙', '☀️', '🌸', '🎵', '📱', '💬', '✅',
];

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [newFact, setNewFact] = useState<RevealedFact | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [newAchievement, setNewAchievement] = useState<{ name: string; icon: string; reward: number } | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number; content: string } | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null); // base64 data URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { getStickerForText, isLoading: isStickerLoading } = useSticker();

  const {
    currentCompanion,
    currentSession,
    sessions,
    addMessage,
    addSession,
    setCurrentSession,
    addAffectionPoints,
    addRevealedFact,
    addSessionSummary,
    addEmotionalMemory,
    updateRelationshipDimensions,
    updateEmotionalState: updateEmotionalStateStore,
    addEmotionalHistoryEntry,
    unlockAchievement,
    unlockCharacterCardAchievement,
    deleteMessage,
    updateWorldState,
    completeDailyTask,
    resetDailyTasks,
    updateCharacterCard,
    modelConfig,
  } = useAppStore();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!showScrollBtn) {
      scrollToBottom();
    }
  }, [currentSession?.messages, showScrollBtn, scrollToBottom]);

  // Detect scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Initialize session if needed
  useEffect(() => {
    if (!currentCompanion) return;

    const sessionBelongsToCompanion = currentSession?.companionId === currentCompanion.id;

    if (!sessionBelongsToCompanion) {
      const existingSession = sessions.find(
        (s: any) => s.companionId === currentCompanion.id
      );

      if (existingSession) {
        setCurrentSession(existingSession);
      } else {
        const openingMessage = getOpeningMessage(currentCompanion.openingStrategy);
        const greetingContent = openingMessage || currentCompanion.greeting;

        const newSession: any = {
          id: `session-${Date.now()}`,
          companionId: currentCompanion.id,
          messages: [
            {
              id: `msg-${Date.now()}`,
              content: greetingContent,
              role: 'assistant',
              timestamp: Date.now(),
              emotion: openingMessage ? 'neutral' : 'loving',
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addSession(newSession);
        setCurrentSession(newSession);
      }
    }
  }, [currentCompanion, currentSession, sessions, addSession, setCurrentSession]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Update world state (time, season) on mount and trigger stress decay
  useEffect(() => {
    if (!currentCompanion) return;

    const newWorldState = getWorldState();
    // Preserve user-set weather and location, update auto-detected fields
    updateWorldState(currentCompanion.id, {
      timeOfDay: newWorldState.timeOfDay,
      hour: newWorldState.hour,
      season: newWorldState.season,
      dayOfWeek: newWorldState.dayOfWeek,
      festival: newWorldState.festival,
    });

    if (currentCompanion.worldState.locationCollapsed && currentCompanion.worldState.cityName) {
      fetchWttrWeather(currentCompanion.worldState.cityName).then((weatherResult) => {
        if (!weatherResult) return;
        updateWorldState(currentCompanion.id, {
          weather: weatherResult.weather,
        });
      });
    }

    // Stress decay
    const { stressLevel, lastStressDecay } = calculateStressDecay(
      currentCompanion.emotionalDepth.state.stressLevel,
      currentCompanion.emotionalDepth.state.lastStressDecay || currentCompanion.emotionalDepth.state.lastStressDecay,
      Date.now()
    );
    if (stressLevel !== currentCompanion.emotionalDepth.state.stressLevel) {
      updateEmotionalStateStore(currentCompanion.id, {
        stressLevel,
        lastStressDecay,
      });
    }

    // 每日任务重置（凌晨 3:00 后）
    if (shouldResetDailyTasks(currentCompanion.affection.lastDailyReset)) {
      resetDailyTasks(currentCompanion.id);
    }
  }, [currentCompanion?.id, currentCompanion?.worldState?.cityName]);

  const handleSend = async (text?: string) => {
    const sendText = text || inputText;
    if (!sendText.trim() || !currentCompanion || !currentSession) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: sendText,
      role: 'user',
      timestamp: Date.now(),
      imageUrl: pendingImage || undefined,
    };

    addMessage(currentSession.id, userMessage);
    const imageToSend = pendingImage;
    setInputText('');
    setPendingImage(null);
    setQuickReplies([]);
    setIsTyping(true);

    const collapsedCity = currentCompanion.worldState.locationCollapsed
      ? null
      : collapseCityFromText(sendText);
    if (collapsedCity) {
      updateWorldState(currentCompanion.id, {
        cityName: collapsedCity,
        locationCollapsed: true,
        location: 'traveling',
      });
      fetchWttrWeather(collapsedCity).then((weatherResult) => {
        if (!weatherResult) return;
        updateWorldState(currentCompanion.id, {
          weather: weatherResult.weather,
        });
      });
    }

    try {
      const latestCompanion = useAppStore.getState().currentCompanion || currentCompanion;
      const systemPrompt = buildStructuredTurnPrompt(latestCompanion);

      // 过滤掉 greeting，保留后续对话
      const historyMessages = currentSession.messages
        .filter((msg: Message) => msg.role !== 'assistant' || msg.id !== currentSession.messages[0]?.id);

      const recentMessages = historyMessages.slice(-9);

      const messages: MimoMessage[] = [];

      // 如果历史超过 10 条，注入会话摘要作为上下文
      if (historyMessages.length > 9 && currentCompanion.memory.sessionSummaries.length > 0) {
        const latestSummary = currentCompanion.memory.sessionSummaries[currentCompanion.memory.sessionSummaries.length - 1];
        const summaryParts = [latestSummary.summary];
        if (latestSummary.keyEvents.length > 0) {
          summaryParts.push(`关键事件: ${latestSummary.keyEvents.join('、')}`);
        }
        if (latestSummary.emotionTrend) {
          summaryParts.push(`情绪趋势: ${latestSummary.emotionTrend}`);
        }
        messages.push({
          role: 'system' as const,
          content: `【之前对话摘要】${summaryParts.join('；')}`,
        });
      }

      recentMessages.forEach((msg: Message) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      messages.push({
        role: 'user',
        content: sendText,
        ...(imageToSend && { image: imageToSend }),
      });

      let turnResult;
      try {
        const rawTurnResult = await mimoClient.chat(
          messages,
          systemPrompt,
          modelConfig.model || 'mimo-v2.5',
          modelConfig
        );
        turnResult = validateStructuredTurnResult(parseTurnJson(rawTurnResult));
      } catch (turnError) {
        console.error('Structured turn failed:', turnError);
        turnResult = createFallbackTurnResult(sendText);
      }

      const responseText = turnResult.visibleText;

      const stickerUrl = await getStickerForText(responseText);

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: responseText,
        role: 'assistant',
        timestamp: Date.now(),
        stickerUrl: stickerUrl || undefined,
      };

      addMessage(currentSession.id, assistantMessage);

      // Generate quick replies
      setQuickReplies(getQuickReplies(responseText));

      // Phase 1 post-processing
      const affectionChange = calculateAffectionChange(
        sendText,
        responseText,
        currentCompanion.affection.level
      );
      addAffectionPoints(currentCompanion.id, affectionChange);

      const allMessages = [...currentSession.messages, userMessage, assistantMessage];
      const newFacts = turnResult.memoryUpdate.revealedFactsAdd.map((fact) => ({
        id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        category: fact.category,
        content: fact.content,
        timestamp: Date.now(),
      }));
      if (newFacts.length > 0) {
        newFacts.forEach((fact) => {
          addRevealedFact(currentCompanion.id, fact);
        });
        setNewFact(newFacts[0]);
        setTimeout(() => setNewFact(null), 3000);
      }

      if (allMessages.length > 0 && allMessages.length % 10 === 0) {
        const summary = await generateSessionSummary(allMessages);
        if (summary) {
          addSessionSummary(currentCompanion.id, summary);
        }
      }

      // Phase 2 post-processing
      const relationshipDelta = Object.fromEntries(
        Object.entries(turnResult.stateDelta)
          .map(([key, delta]) => [
            key,
            calculateEffectiveDelta(currentCompanion, key as any, delta),
          ])
          .filter(([, value]) => value !== 0)
      ) as any;
      if (Object.keys(relationshipDelta).length > 0) {
        updateRelationshipDimensions(currentCompanion.id, relationshipDelta);
      }

      const emotion = turnResult.currentEmotion as any;
      const intensity = Math.max(
        1,
        Math.min(5, Math.abs(enumDeltaToNumber(turnResult.stressDelta)) >= 10 ? 5 : 3)
      );
      const stressSource = detectStressSource(sendText, currentCompanion.worldState);
      const newEmotionalState = updateEmotionalState(
        currentCompanion.emotionalDepth.state,
        emotion,
        intensity,
        stressSource
      );
      updateEmotionalStateStore(currentCompanion.id, newEmotionalState);
      addEmotionalHistoryEntry(currentCompanion.id, {
        emotion,
        intensity,
        trigger: turnResult.shortTermUpdate.emotionTrigger || sendText.slice(0, 50),
        timestamp: Date.now(),
      });

      // 记录情绪记忆
      turnResult.memoryUpdate.emotionalMemoriesAdd.forEach((memory) => {
        addEmotionalMemory(currentCompanion.id, {
          id: `emo-${Date.now()}`,
          content: memory.content,
          emotion: memory.emotion,
          intensity: memory.intensity,
          timestamp: Date.now(),
        });
      });

      if (turnResult.memoryUpdate.emotionalMemoriesAdd.length === 0 && emotion !== 'neutral') {
        addEmotionalMemory(currentCompanion.id, {
          id: `emo-${Date.now()}`,
          content: turnResult.shortTermUpdate.emotionTrigger || sendText.slice(0, 50),
          emotion,
          intensity,
          timestamp: Date.now(),
        });
      }

      const cardUpdate = turnResult.characterCardUpdate;
      const hasCardUpdate =
        Object.keys(cardUpdate.identity).length > 0 ||
        (cardUpdate.preferences.likes?.length || 0) > 0 ||
        (cardUpdate.preferences.dislikes?.length || 0) > 0 ||
        cardUpdate.innerWorld.length > 0 ||
        cardUpdate.habits.length > 0;
      if (hasCardUpdate) {
        const nextLikes = Array.from(new Set([
          ...currentCompanion.characterCard.preferences.likes,
          ...(cardUpdate.preferences.likes || []),
        ])).slice(-20);
        const nextDislikes = Array.from(new Set([
          ...currentCompanion.characterCard.preferences.dislikes,
          ...(cardUpdate.preferences.dislikes || []),
        ])).slice(-20);
        const nextInnerWorld = Array.from(new Set([
          ...currentCompanion.characterCard.innerWorld,
          ...cardUpdate.innerWorld,
        ])).slice(-20);
        const nextHabits = Array.from(new Set([
          ...currentCompanion.characterCard.habits,
          ...cardUpdate.habits,
        ])).slice(-20);
        const nextIdentity = {
          ...currentCompanion.characterCard.identity,
          ...cardUpdate.identity,
        };

        updateCharacterCard(currentCompanion.id, {
          identity: nextIdentity,
          preferences: {
            likes: nextLikes,
            dislikes: nextDislikes,
          },
          innerWorld: nextInnerWorld,
          habits: nextHabits,
          collectionProgress: {
            identity: Object.keys(nextIdentity).length,
            preferences: nextLikes.length + nextDislikes.length,
            innerWorld: nextInnerWorld.length,
            habits: nextHabits.length,
          },
        });
      }

      const userMessageCount = allMessages.filter((m) => m.role === 'user').length;

      // 自动完成每日任务
      const completedTaskIds = detectTaskCompletion(sendText, userMessageCount);
      completedTaskIds.forEach((taskId) => {
        const task = currentCompanion.affection.dailyTasks.find((t) => t.id === taskId);
        if (task && !task.completed) {
          completeDailyTask(currentCompanion.id, taskId);
          addAffectionPoints(currentCompanion.id, task.reward);
        }
      });

      const newAchievementIds = checkAchievements(currentCompanion, userMessageCount);
      newAchievementIds.forEach((id) => unlockAchievement(currentCompanion.id, id));

      const newCardAchievementCategories = checkCharacterCardAchievements(currentCompanion);
      newCardAchievementCategories.forEach((category) => unlockCharacterCardAchievement(currentCompanion.id, category));

      if (newAchievementIds.length > 0) {
        const achievement = currentCompanion.achievements.achievements.find((a) => a.id === newAchievementIds[0]);
        if (achievement) {
          setNewAchievement({ name: achievement.name, icon: achievement.icon, reward: achievement.reward });
          setTimeout(() => setNewAchievement(null), 3000);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: '抱歉，我暂时无法回复，请稍后再试。',
        role: 'assistant',
        timestamp: Date.now(),
      };
      addMessage(currentSession.id, errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      messageId: message.id,
      x: e.clientX,
      y: e.clientY,
      content: message.content,
    });
  };

  const handleCopyText = () => {
    if (contextMenu) {
      navigator.clipboard.writeText(contextMenu.content);
      setContextMenu(null);
    }
  };

  const handleDeleteMsg = () => {
    if (contextMenu && currentSession) {
      deleteMessage(currentSession.id, contextMenu.messageId);
      setContextMenu(null);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = inputText.slice(0, start) + emoji + inputText.slice(end);
      setInputText(newText);
      // 光标移到表情后面
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setInputText(inputText + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!currentCompanion) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center">
            <Smile className="w-12 h-12 text-orange-400 dark:text-orange-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            选择一个伙伴开始聊天
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            从左侧选择一个陪伴伙伴，或者创建一个新的
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-2xl overflow-hidden">
                {currentCompanion.avatar.startsWith('data:') ? (
                  <img src={currentCompanion.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentCompanion.avatar
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                  {currentCompanion.name}
                </h2>
                <AffectionDisplay affection={currentCompanion.affection} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Volume2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showPanel ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                title="关系档案"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 relative">
          <AnimatePresence>
            {currentSession?.messages.map((message: Message, index: number) => {
              const prevMessage = index > 0 ? currentSession.messages[index - 1] : undefined;
              const showDate = shouldShowDateSeparator(message, prevMessage);

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center my-4"
                    >
                      <div className="px-4 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        {formatDateLabel(message.timestamp)}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flex items-start gap-2 max-w-[86%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                          {currentCompanion.avatar.startsWith('data:') ? (
                            <img src={currentCompanion.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            currentCompanion.avatar
                          )}
                        </div>
                        <div className="message-stack min-w-0">
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {currentCompanion.name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div
                            className="message-bubble assistant cursor-pointer select-text"
                            onContextMenu={(e) => handleContextMenu(e, message)}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>

                            {message.imageUrl && (
                              <div className="mt-2">
                                <img
                                  src={message.imageUrl}
                                  alt="图片"
                                  className="max-w-[240px] max-h-[240px] rounded-lg shadow-sm"
                                />
                              </div>
                            )}

                            {message.audioUrl && (
                              <div className="mt-2">
                                <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600">
                                  <Play className="w-4 h-4" />
                                  播放语音
                                </button>
                              </div>
                            )}
                          </div>
                          {message.stickerUrl && (
                            <div className="mt-2 inline-flex max-w-[220px] rounded-2xl rounded-tl-md bg-white dark:bg-gray-800 p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                              <img
                                src={message.stickerUrl}
                                alt="表情包"
                                className="max-w-[180px] max-h-[180px] rounded-xl object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="message-stack flex w-fit max-w-[86%] flex-col items-end gap-1">
                        <div
                          className="message-bubble user cursor-pointer select-text"
                          onContextMenu={(e) => handleContextMenu(e, message)}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>

                          {message.imageUrl && (
                            <div className="mt-2">
                              <img
                                src={message.imageUrl}
                                alt="图片"
                                className="max-w-[240px] max-h-[240px] rounded-lg shadow-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div className="px-1 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-2 max-w-[86%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {currentCompanion.avatar.startsWith('data:') ? (
                    <img src={currentCompanion.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentCompanion.avatar
                  )}
                </div>
                <div className="message-stack min-w-0">
                  <div className="mb-1 px-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {currentCompanion.name}
                    </span>
                  </div>
                  <div className="message-bubble assistant">
                    <div className="flex items-center gap-2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      {isStickerLoading && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>找表情包中...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <AnimatePresence>
          {quickReplies.length > 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-6 pb-2 flex gap-2 flex-wrap"
            >
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="px-4 py-2 rounded-full text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/50 transition-colors"
        >
          <div className="flex items-end gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <div className="flex items-end rounded-2xl border-2 border-orange-200 bg-white transition-colors focus-within:border-orange-400 dark:border-gray-600 dark:bg-gray-700 dark:focus-within:border-orange-500">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你想说的话..."
                  className="min-w-0 flex-1 resize-none bg-transparent px-4 py-3 text-gray-900 outline-none placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />

                <div className="flex items-center gap-1 pb-2 pr-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="发送图片"
                  >
                    <Image className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      showEmojiPicker ? 'bg-orange-100 dark:bg-orange-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="表情"
                  >
                    <Smile className={`w-5 h-5 ${showEmojiPicker ? 'text-orange-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute bottom-full right-0 z-30 mb-2 w-[292px] max-w-[calc(100vw-2rem)] p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700" />
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_LIST.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isRecording ? '停止录音' : '语音输入'}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  inputText.trim()
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Image Preview */}
        <AnimatePresence>
          {pendingImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 relative inline-block"
            >
              <img
                src={pendingImage}
                alt="待发送图片"
                className="max-h-32 rounded-xl border border-gray-200 dark:border-gray-600"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collection Toast */}
        <CollectionToast
          fact={newFact}
          onDismiss={() => setNewFact(null)}
        />

        {/* Achievement Toast */}
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors z-20"
          >
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              复制文本
            </button>
            <button
              onClick={handleDeleteMsg}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除消息
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship Panel */}
      <AnimatePresence>
        {showPanel && currentCompanion && (
          <RelationshipPanel
            companion={currentCompanion}
            onClose={() => setShowPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
