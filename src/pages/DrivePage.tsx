import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Send, Home } from 'lucide-react';
import { Message } from '../types';
import { mimoClient, MimoMessage } from '../utils/mimo';
import {
  buildSystemPrompt,
  calculateAffectionChange,
  extractCharacterFacts,
  generateSessionSummary,
  calculateRelationshipDelta,
  detectEmotionFromText,
  updateEmotionalState,
  getOpeningMessage,
  detectTaskCompletion,
  shouldResetDailyTasks,
  AFFECTION_LEVEL_NAMES,
} from '../utils/characterAnalyzer';

const emotionEmoji: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠', surprised: '😲', fearful: '😨',
  neutral: '😐', loving: '🥰', excited: '🤩', anxious: '😰', grateful: '🙏',
};

function getQuickReplies(lastMessage: string): string[] {
  const replies: string[] = [];
  const lower = lastMessage.toLowerCase();
  if (lower.includes('?') || lower.includes('？') || lower.includes('吗') || lower.includes('什么')) {
    replies.push('嗯嗯', '继续说', '然后呢');
  } else if (lower.includes('开心') || lower.includes('哈哈')) {
    replies.push('哈哈', '真好', '继续说');
  } else if (lower.includes('难过') || lower.includes('伤心')) {
    replies.push('抱抱', '别难过', '我在这');
  } else if (lower.includes('想你') || lower.includes('爱')) {
    replies.push('我也想你', '么么', '你最好了');
  } else {
    replies.push('继续说', '然后呢', '好的');
  }
  return replies.slice(0, 3);
}

export default function DrivePage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    companions, currentCompanion, currentSession, sessions,
    setCurrentCompanion, setCurrentSession,
    addMessage, addSession,
    addAffectionPoints, addRevealedFact, addSessionSummary,
    updateRelationshipDimensions,
    updateEmotionalState: updateEmotionalStateStore,
    addEmotionalHistoryEntry, addEmotionalMemory,
    completeDailyTask, resetDailyTasks,
  } = useAppStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, scrollToBottom]);

  // Initialize session
  useEffect(() => {
    if (!currentCompanion) return;
    const sessionBelongsToCompanion = currentSession?.companionId === currentCompanion.id;
    if (!sessionBelongsToCompanion) {
      const existingSession = sessions.find((s) => s.companionId === currentCompanion.id);
      if (existingSession) {
        setCurrentSession(existingSession);
      } else {
        const openingMessage = getOpeningMessage(currentCompanion.openingStrategy);
        const greetingContent = openingMessage || currentCompanion.greeting;
        const newSession: any = {
          id: `session-${Date.now()}`,
          companionId: currentCompanion.id,
          messages: [{
            id: `msg-${Date.now()}`,
            content: greetingContent,
            role: 'assistant',
            timestamp: Date.now(),
            emotion: openingMessage ? 'neutral' : 'loving',
          }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addSession(newSession);
        setCurrentSession(newSession);
      }
    }
  }, [currentCompanion, currentSession, sessions, addSession, setCurrentSession]);

  // Daily reset check
  useEffect(() => {
    if (!currentCompanion) return;
    if (shouldResetDailyTasks(currentCompanion.affection.lastDailyReset)) {
      resetDailyTasks(currentCompanion.id);
    }
  }, [currentCompanion?.id]);

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
    setShowInput(false);
    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(currentCompanion);

      const historyMessages = currentSession.messages
        .filter((msg: Message) => msg.role !== 'assistant' || msg.id !== currentSession.messages[0]?.id);
      const recentMessages = historyMessages.slice(-20);

      const messages: MimoMessage[] = [];

      if (historyMessages.length > 20 && currentCompanion.memory.sessionSummaries.length > 0) {
        const latestSummary = currentCompanion.memory.sessionSummaries[currentCompanion.memory.sessionSummaries.length - 1];
        const summaryParts = [latestSummary.summary];
        if (latestSummary.keyEvents.length > 0) summaryParts.push(`关键事件: ${latestSummary.keyEvents.join('、')}`);
        if (latestSummary.emotionTrend) summaryParts.push(`情绪趋势: ${latestSummary.emotionTrend}`);
        messages.push({ role: 'system' as const, content: `【之前对话摘要】${summaryParts.join('；')}` });
      }

      recentMessages.forEach((msg: Message) => {
        messages.push({ role: msg.role, content: msg.content });
      });

      messages.push({ role: 'user', content: sendText });

      const responseText = await mimoClient.chat(messages, systemPrompt);

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: responseText,
        role: 'assistant',
        timestamp: Date.now(),
      };

      addMessage(currentSession.id, assistantMessage);
      setQuickReplies(getQuickReplies(responseText));

      // Post-processing
      const affectionChange = calculateAffectionChange(sendText, responseText, currentCompanion.affection.level);
      addAffectionPoints(currentCompanion.id, affectionChange);

      const allMessages = [...currentSession.messages, userMessage, assistantMessage];
      const newFacts = await extractCharacterFacts(allMessages);
      newFacts.forEach((fact) => addRevealedFact(currentCompanion.id, fact));

      if (allMessages.length > 0 && allMessages.length % 10 === 0) {
        const summary = await generateSessionSummary(allMessages);
        if (summary) addSessionSummary(currentCompanion.id, summary);
      }

      const relationshipDelta = calculateRelationshipDelta(sendText, responseText, currentCompanion.characterCard.basePersonality);
      if (Object.keys(relationshipDelta).length > 0) updateRelationshipDimensions(currentCompanion.id, relationshipDelta);

      const { emotion, intensity } = detectEmotionFromText(responseText);
      const newEmotionalState = updateEmotionalState(currentCompanion.emotionalDepth.state, emotion, intensity);
      updateEmotionalStateStore(currentCompanion.id, newEmotionalState);
      addEmotionalHistoryEntry(currentCompanion.id, { emotion, intensity, trigger: sendText.slice(0, 50), timestamp: Date.now() });

      if (emotion !== 'neutral') {
        addEmotionalMemory(currentCompanion.id, { id: `emo-${Date.now()}`, content: sendText.slice(0, 50), emotion, intensity, timestamp: Date.now() });
      }

      // Auto-complete tasks
      const userMessageCount = allMessages.filter((m) => m.role === 'user').length;
      const completedTaskIds = detectTaskCompletion(sendText, userMessageCount);
      completedTaskIds.forEach((taskId) => {
        const task = currentCompanion.affection.dailyTasks.find((t) => t.id === taskId);
        if (task && !task.completed) {
          completeDailyTask(currentCompanion.id, taskId);
          addAffectionPoints(currentCompanion.id, task.reward);
        }
      });

      // TTS auto-play (placeholder - would need TTS integration)
      // if (user.preferences.ttsEnabled) {
      //   const audio = await mimoClient.tts(responseText, currentCompanion.voiceId);
      //   playAudio(audio);
      // }
    } catch (error) {
      console.error('Drive chat error:', error);
      addMessage(currentSession.id, {
        id: `msg-${Date.now() + 1}`,
        content: '抱歉，我暂时无法回复。',
        role: 'assistant',
        timestamp: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleSelectCompanion = (companion: typeof companions[0]) => {
    setCurrentCompanion(companion);
    const existingSession = sessions.find((s) => s.companionId === companion.id);
    if (existingSession) {
      setCurrentSession(existingSession);
    } else {
      const openingMessage = getOpeningMessage(companion.openingStrategy);
      const greetingContent = openingMessage || companion.greeting;
      const newSession: any = {
        id: `session-${Date.now()}`,
        companionId: companion.id,
        messages: [{
          id: `msg-${Date.now()}`,
          content: greetingContent,
          role: 'assistant',
          timestamp: Date.now(),
          emotion: openingMessage ? 'neutral' : 'loving',
        }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addSession(newSession);
      setCurrentSession(newSession);
    }
    setShowSelector(false);
  };

  // Companion Selector Screen
  if (showSelector || !currentCompanion) {
    return (
      <div className="h-screen flex flex-col bg-gray-950 text-white select-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <button
            onClick={() => {
              if (currentCompanion) setShowSelector(false);
              else navigate('/chat');
            }}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">选择伙伴</h1>
          <button
            onClick={() => navigate('/chat')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {companions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-xl mb-4">还没有伙伴</p>
              <button onClick={() => navigate('/chat')} className="px-6 py-3 bg-orange-500 rounded-xl text-lg text-white">
                去创建
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {companions.map((c) => (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectCompanion(c)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    currentCompanion?.id === c.id
                      ? 'border-orange-400 bg-orange-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center overflow-hidden shadow-lg">
                    {c.avatar.startsWith('data:') ? (
                      <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{c.avatar}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{c.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{AFFECTION_LEVEL_NAMES[c.affection.level]}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const lastAssistantMsg = [...(currentSession?.messages || [])].reverse().find((m) => m.role === 'assistant');
  const currentEmotion = currentCompanion.emotionalDepth.state.currentEmotion;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button
          onClick={() => setShowSelector(true)}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 text-lg hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
        >
          <span className="text-2xl">{emotionEmoji[currentEmotion] || '😐'}</span>
          <span className="text-gray-400">{AFFECTION_LEVEL_NAMES[currentCompanion.affection.level]}</span>
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      {/* Center Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Avatar */}
        <motion.div
          animate={isTyping ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: isTyping ? Infinity : 0 }}
          className="mb-4"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/20">
            {currentCompanion.avatar.startsWith('data:') ? (
              <img src={currentCompanion.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">{currentCompanion.avatar}</span>
            )}
          </div>
        </motion.div>

        {/* Name */}
        <h1 className="text-2xl font-bold mb-6">{currentCompanion.name}</h1>

        {/* Latest Message */}
        <div className="w-full max-w-lg mb-6">
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-lg">思考中...</span>
                </div>
              </motion.div>
            ) : lastAssistantMsg ? (
              <motion.div
                key={lastAssistantMsg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 backdrop-blur rounded-2xl px-6 py-4 border border-white/10"
              >
                <p className="text-xl leading-relaxed text-center">{lastAssistantMsg.content}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Quick Replies */}
        <AnimatePresence>
          {quickReplies.length > 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 mb-6"
            >
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="px-6 py-3 rounded-full text-lg bg-white/10 hover:bg-orange-500/30 border border-white/20 hover:border-orange-400 transition-all"
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="px-6 pb-8 pt-4 shrink-0">
        <AnimatePresence>
          {showInput ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入消息..."
                autoFocus
                className="flex-1 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`p-4 rounded-2xl transition-all ${
                  inputText.trim()
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-white/10 text-gray-500'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
              <button
                onClick={() => { setShowInput(false); setInputText(''); }}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-400 transition-colors"
              >
                ✕
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={toggleRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-9 h-9" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
              <button
                onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                点击输入文字
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
