import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Settings,
  Mic,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Heart,
} from 'lucide-react';
import { Companion } from '../types';
import { AFFECTION_LEVEL_NAMES } from '../utils/characterAnalyzer';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Companion | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    companions, currentCompanion, setCurrentCompanion,
    sessions, setCurrentSession,
    currentView, setCurrentView,
    deleteCompanion,
  } = useAppStore();

  const menuItems = [
    { icon: MessageCircle, label: '聊天', path: '/chat', view: 'chat' as const },
    { icon: Users, label: '伙伴', path: '/companions', view: 'companions' as const },
    { icon: Mic, label: '声音', path: '/voice', view: 'voice' as const },
    { icon: Settings, label: '设置', path: '/settings', view: 'settings' as const },
  ];

  const handleNavigate = (path: string, view: typeof currentView) => {
    setCurrentView(view);
    navigate(path);
  };

  const handleSelectCompanion = (companion: Companion) => {
    setCurrentCompanion(companion);
    const session = sessions.find((s) => s.companionId === companion.id);
    setCurrentSession(session || null);
    handleNavigate('/chat', 'chat');
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCompanion(deleteTarget.id);
      if (currentCompanion?.id === deleteTarget.id) {
        setCurrentCompanion(null);
        setCurrentSession(null);
      }
      setDeleteTarget(null);
    }
  };

  const levelColors: Record<string, string> = {
    stranger: 'bg-gray-400',
    acquaintance: 'bg-blue-400',
    friendly: 'bg-green-400',
    close: 'bg-purple-400',
    crush: 'bg-pink-400',
    lover: 'bg-red-400',
  };

  return (
    <>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-screen bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-lg flex flex-col transition-colors"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold gradient-text">声悦</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NarratorAI</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path && currentView === item.view;

            return (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.path, item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-500 dark:text-orange-400' : ''}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Companion List */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    我的伙伴
                    {companions.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                        ({companions.length})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => handleNavigate('/setup', 'setup')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="创建新伙伴"
                  >
                    <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                {companions.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>还没有伙伴</p>
                    <p className="mt-1">点击 + 创建一个</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {companions.map((companion) => (
                      <div
                        key={companion.id}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          currentCompanion?.id === companion.id
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-700/50'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                        }`}
                        onClick={() => handleSelectCompanion(companion)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                          {companion.avatar.startsWith('data:') ? (
                            <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            companion.avatar
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{companion.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Heart className={`w-3 h-3 ${levelColors[companion.affection?.level] || 'text-gray-400'}`} />
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {AFFECTION_LEVEL_NAMES[companion.affection?.level] || '陌生'}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(companion);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                          title="删除伙伴"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed companion icons */}
          {isCollapsed && (
            <div className="space-y-2">
              {companions.slice(0, 3).map((companion) => (
                <button
                  key={companion.id}
                  onClick={() => handleSelectCompanion(companion)}
                  className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                    currentCompanion?.id === companion.id
                      ? 'bg-orange-100 dark:bg-orange-900/40'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={companion.name}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center text-sm overflow-hidden">
                    {companion.avatar.startsWith('data:') ? (
                      <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      companion.avatar
                    )}
                  </div>
                </button>
              ))}
              {companions.length > 3 && (
                <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                  +{companions.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-3xl">{deleteTarget.avatar}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  删除 {deleteTarget.name}？
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  所有聊天记录和关系数据将被清除，此操作不可撤销。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
