import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { Companion } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
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

const steps = [
  { id: 1, title: '昵称设置', icon: User },
  { id: 2, title: '选择伙伴', icon: Heart },
  { id: 3, title: '个性定制', icon: Sparkles },
  { id: 4, title: '开始聊天', icon: MessageCircle },
];

const companionTemplates = [
  {
    id: 'boyfriend',
    name: '温柔男友',
    avatar: '👨',
    relationship: 'boyfriend' as const,
    personality: '温柔体贴、善解人意、成熟稳重',
    description: '一个温柔体贴的男朋友，总是关心你、支持你，陪你度过每一个开心或难过的时刻。',
    traits: ['温柔', '体贴', '幽默', '成熟'],
    greeting: '宝贝，今天过得怎么样？有什么想和我分享的吗？',
  },
  {
    id: 'girlfriend',
    name: '甜美女友',
    avatar: '👩',
    relationship: 'girlfriend' as const,
    personality: '活泼开朗、善解人意、甜美可爱',
    description: '一个甜美可爱的女朋友，总是带给你快乐和温暖，是你最好的倾听者。',
    traits: ['活泼', '可爱', '体贴', '聪明'],
    greeting: '亲爱的，想我了吗？今天有什么开心的事想告诉我？',
  },
  {
    id: 'friend',
    name: '知己好友',
    avatar: '🧑',
    relationship: 'friend' as const,
    personality: '真诚可靠、善解人意、幽默风趣',
    description: '一个真诚可靠的好朋友，无论何时何地都会支持你、陪伴你。',
    traits: ['真诚', '可靠', '幽默', '乐观'],
    greeting: '嘿，最近怎么样？有什么想聊的吗？',
  },
  {
    id: 'mentor',
    name: '智慧导师',
    avatar: '👴',
    relationship: 'mentor' as const,
    personality: '睿智、耐心、富有洞察力',
    description: '一位智慧的人生导师，用丰富的经验和深刻的见解帮助你成长。',
    traits: ['睿智', '耐心', '洞察力', '鼓励'],
    greeting: '年轻人，今天有什么困惑需要我帮你梳理吗？',
  },
  {
    id: 'counselor',
    name: '心灵导师',
    avatar: '🧑‍⚕️',
    relationship: 'counselor' as const,
    personality: '专业、温暖、富有同理心',
    description: '一位专业的心灵导师，用温暖和专业帮助你找到内心的平静。',
    traits: ['专业', '温暖', '同理心', '倾听'],
    greeting: '你好，这里是安全的空间，可以自由地表达你的心情。',
  },
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customPersonality, setCustomPersonality] = useState('');
  const navigate = useNavigate();
  const { setUser, addCompanion, setCurrentCompanion, setCurrentView, user } = useAppStore();

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Update user nickname
    if (user) {
      setUser({ ...user, nickname: nickname || '用户' });
    } else {
      setUser({
        id: 'user-1',
        nickname: nickname || '用户',
        preferences: {
          theme: 'light',
          language: 'zh',
          ttsEnabled: true,
          autoPlayVoice: true,
        },
      });
    }

    // Create companion
    const template = companionTemplates.find((t) => t.id === selectedTemplate);
    if (template) {
      const newCompanion: Companion = {
        id: `companion-${Date.now()}`,
        name: template.name,
        avatar: template.avatar,
        personality: customPersonality || template.personality,
        relationship: template.relationship,
        description: template.description,
        traits: template.traits,
        greeting: template.greeting,
        // Phase 1: 初始化角色卡、好感度、记忆系统
        characterCard: createInitialCharacterCard(),
        affection: createInitialAffection(),
        memory: createInitialMemory(),
        // Phase 2: 关系系统、情绪深度、开场策略、成就系统
        relationshipSystem: createInitialRelationshipSystem(),
        emotionalDepth: createInitialEmotionalDepthSystem(),
        openingStrategy: getRandomOpeningStrategy(),
        achievements: createInitialAchievementSystem(),
        // Phase 3: 世界观同步
        worldState: createInitialWorldState(),
      };
      addCompanion(newCompanion);
      setCurrentCompanion(newCompanion);
    }

    setCurrentView('chat');
    navigate('/chat');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                你好，很高兴见到你
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">请告诉我你的昵称，这样我就能更好地陪伴你</p>
            </div>

            <div className="max-w-sm mx-auto">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称..."
                className="w-full px-4 md:px-6 py-3 md:py-4 rounded-2xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 dark:text-gray-100 text-center text-base md:text-lg transition-colors"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                选择你的陪伴伙伴
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">选择一个你喜欢的伙伴类型，或者自定义一个</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {companionTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative p-4 md:p-6 rounded-2xl transition-all duration-300 ${
                    selectedTemplate === template.id
                      ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300 shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  )}
                  <div className="text-2xl md:text-4xl mb-2 md:mb-3">{template.avatar}</div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base">{template.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{template.relationship}</p>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                定制个性特点
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                描述你希望伙伴具有的性格特点，或者使用默认设置
              </p>
            </div>

            <div className="max-w-md mx-auto">
              {selectedTemplate && (
                <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm md:text-base">默认性格特点：</h4>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {companionTemplates
                      .find((t) => t.id === selectedTemplate)
                      ?.traits.map((trait) => (
                        <span
                          key={trait}
                          className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-white text-xs md:text-sm text-orange-600 border border-orange-200 dark:border-gray-600"
                        >
                          {trait}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <textarea
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="描述你想要的性格特点，例如：温柔、幽默、善解人意..."
                className="w-full h-24 md:h-32 px-3 md:px-4 py-2 md:py-3 rounded-2xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-700 dark:text-gray-100 resize-none transition-colors text-sm md:text-base"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6 text-center"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center animate-float">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-300 to-amber-300 flex items-center justify-center">
                <Heart className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              一切准备就绪
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              {nickname || '用户'}，你的陪伴伙伴已经准备好认识你了。
              点击开始，开启你们的对话之旅。
            </p>

            {selectedTemplate && (
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-white shadow-sm">
                <span className="text-xl md:text-2xl">
                  {companionTemplates.find((t) => t.id === selectedTemplate)?.avatar}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-100 text-sm md:text-base">
                  {companionTemplates.find((t) => t.id === selectedTemplate)?.name}
                </span>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full py-8"
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 md:mb-12 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 dark:text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 md:w-20 h-1 mx-1 md:mx-2 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass rounded-3xl p-4 md:p-8 mb-6 md:mb-8 min-h-[250px] md:min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 text-sm md:text-base ${
              currentStep === 1
                ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={currentStep === 2 && !selectedTemplate}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 text-sm md:text-base ${
                currentStep === 2 && !selectedTemplate
                  ? 'opacity-50 cursor-not-allowed bg-gray-300'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
              }`}
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 text-sm md:text-base"
            >
              开始聊天
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
