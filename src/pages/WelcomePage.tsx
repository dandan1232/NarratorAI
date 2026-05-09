import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { motion } from 'framer-motion';
import { Heart, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setInitialized, setCurrentView, setUser, companions, isInitialized } = useAppStore();

  const handleStart = () => {
    // 如果已经有伴侣，直接跳转到聊天页面
    if (isInitialized && companions.length > 0) {
      setCurrentView('chat');
      navigate('/chat');
      return;
    }

    // 否则初始化并跳转到设置页面
    setUser({
      id: 'user-1',
      nickname: '',
      preferences: {
        theme: 'light',
        language: 'zh',
        ttsEnabled: true,
        autoPlayVoice: true,
      },
    });
    setInitialized(true);
    setCurrentView('setup');
    navigate('/setup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-2xl w-full py-8"
      >
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 md:mb-8"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 flex items-center justify-center animate-float">
              <div className="w-18 h-18 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-300 via-amber-300 to-yellow-300 flex items-center justify-center">
                <Heart className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <span className="gradient-text">声悦</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-2">NarratorAI</p>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              你的智能情感陪伴伙伴，在这里找到温暖与理解
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12"
          >
            <div className="glass rounded-2xl p-4 md:p-6 card-hover">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm md:text-base">情感陪伴</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                温暖的话语，真诚的倾听，让心灵得到慰藉
              </p>
            </div>

            <div className="glass rounded-2xl p-4 md:p-6 card-hover">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm md:text-base">个性化记忆</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                记住你的喜好，理解你的心情，成为最懂你的人
              </p>
            </div>

            <div className="glass rounded-2xl p-4 md:p-6 card-hover">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm md:text-base">语音对话</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                自然流畅的语音交互，让陪伴更加真实温暖
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-full font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {isInitialized && companions.length > 0 ? '开始聊天' : '开始旅程'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {isInitialized && companions.length > 0 ? '继续与你的陪伴伙伴对话' : '点击开始，遇见你的专属陪伴伙伴'}
          </p>
        </motion.div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20 hidden md:block">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className="w-8 h-8 text-orange-400" />
          </motion.div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-20 hidden md:block">
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Sparkles className="w-8 h-8 text-amber-400" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
