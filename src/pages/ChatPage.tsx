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
} from 'lucide-react';
import { Message, RevealedFact } from '../types';
import { useSticker } from '../hooks/useSticker';
import { mimoClient, MimoMessage } from '../utils/mimo';
import {
  buildSystemPrompt,
  calculateAffectionChange,
  extractCharacterFacts,
  generateSessionSummary,
  calculateRelationshipDelta,
  detectEmotionFromText,
  updateEmotionalState,
  checkAchievements,
  checkCharacterCardAchievements,
  getOpeningMessage,
} from '../utils/characterAnalyzer';
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
    updateRelationshipDimensions,
    updateEmotionalState: updateEmotionalStateStore,
    addEmotionalHistoryEntry,
    unlockAchievement,
    unlockCharacterCardAchievement,
    deleteMessage,
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

  const handleSend = async (text?: string) => {
    const sendText = text || inputText;
    if (!sendText.trim() || !currentCompanion || !currentSession) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: sendText,
      role: 'user',
      timestamp: Date.now(),
    };

    addMessage(currentSession.id, userMessage);
    setInputText('');
    setQuickReplies([]);
    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(currentCompanion);

      const messages: MimoMessage[] = currentSession.messages
        .filter((msg: Message) => msg.role !== 'assistant' || msg.id !== currentSession.messages[0]?.id)
        .map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
        }));

      messages.push({
        role: 'user',
        content: sendText,
      });

      const responseText = await mimoClient.chat(messages, systemPrompt);

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
      const newFacts = await extractCharacterFacts(allMessages);
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
      const relationshipDelta = calculateRelationshipDelta(
        sendText,
        responseText,
        currentCompanion.characterCard.basePersonality
      );
      if (Object.keys(relationshipDelta).length > 0) {
        updateRelationshipDimensions(currentCompanion.id, relationshipDelta);
      }

      const { emotion, intensity } = detectEmotionFromText(responseText);
      const newEmotionalState = updateEmotionalState(
        currentCompanion.emotionalDepth.state,
        emotion,
        intensity
      );
      updateEmotionalStateStore(currentCompanion.id, newEmotionalState);
      addEmotionalHistoryEntry(currentCompanion.id, {
        emotion,
        intensity,
        trigger: sendText.slice(0, 50),
        timestamp: Date.now(),
      });

      const userMessageCount = allMessages.filter((m) => m.role === 'user').length;
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-2xl">
                {currentCompanion.avatar}
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
                    <div
                      className={`message-bubble ${
                        message.role === 'user' ? 'user' : 'assistant'
                      } cursor-pointer select-text`}
                      onContextMenu={(e) => handleContextMenu(e, message)}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{currentCompanion.avatar}</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {currentCompanion.name}
                          </span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{message.content}</p>

                      {message.stickerUrl && (
                        <div className="mt-3">
                          <img
                            src={message.stickerUrl}
                            alt="表情包"
                            className="max-w-[200px] max-h-[200px] rounded-lg shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
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

                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
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
              <div className="message-bubble assistant">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{currentCompanion.avatar}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {currentCompanion.name}
                  </span>
                </div>
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
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你想说的话..."
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none resize-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />

              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="发送图片"
                >
                  <Image className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="表情"
                >
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
              </div>
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
