import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, MessageCircle, Heart, ArrowRight,
} from 'lucide-react';
import { Companion } from '../types';
import { AFFECTION_LEVEL_NAMES } from '../utils/characterAnalyzer';

export default function CompanionsPage() {
  const navigate = useNavigate();
  const {
    companions, currentCompanion, setCurrentCompanion,
    sessions, setCurrentSession,
    deleteCompanion,
  } = useAppStore();
  const [deleteTarget, setDeleteTarget] = useState<Companion | null>(null);

  const handleSelectCompanion = (companion: Companion) => {
    setCurrentCompanion(companion);
    const session = sessions.find((s) => s.companionId === companion.id);
    setCurrentSession(session || null);
    navigate('/chat');
  };

  const handleCreateCompanion = () => {
    navigate('/setup', {
      state: { mode: 'add_companion', from: '/companions' },
    });
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
    stranger: 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
    acquaintance: 'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
    friendly: 'from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40',
    close: 'from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40',
    crush: 'from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40',
    lover: 'from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40',
  };

  const levelBorderColors: Record<string, string> = {
    stranger: 'border-gray-200 dark:border-gray-600',
    acquaintance: 'border-blue-200 dark:border-blue-700',
    friendly: 'border-green-200 dark:border-green-700',
    close: 'border-purple-200 dark:border-purple-700',
    crush: 'border-pink-200 dark:border-pink-700',
    lover: 'border-red-200 dark:border-red-700',
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">我的伙伴</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {companions.length > 0 ? `共 ${companions.length} 位伙伴` : '还没有伙伴，创建一个吧'}
            </p>
          </div>
          <button
            onClick={handleCreateCompanion}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            创建新伙伴
          </button>
        </div>

        {companions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center">
              <Users className="w-12 h-12 text-orange-400 dark:text-orange-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              还没有伙伴
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              创建你的第一个陪伴伙伴，开始对话之旅
            </p>
            <button
              onClick={handleCreateCompanion}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              创建伙伴
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companions.map((companion, index) => {
              const isActive = currentCompanion?.id === companion.id;
              const session = sessions.find((s) => s.companionId === companion.id);
              const messageCount = session?.messages.length || 0;
              const lastMessage = session?.messages[session.messages.length - 1];

              return (
                <motion.div
                  key={companion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative group glass rounded-2xl p-6 border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                    isActive
                      ? `${levelBorderColors[companion.affection?.level || 'stranger']} ring-2 ring-orange-200 dark:ring-orange-700`
                      : 'border-transparent hover:border-orange-200 dark:hover:border-orange-700'
                  }`}
                  onClick={() => handleSelectCompanion(companion)}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${levelColors[companion.affection?.level || 'stranger']} flex items-center justify-center text-3xl shrink-0 overflow-hidden`}>
                      {companion.avatar.startsWith('data:') ? (
                        <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        companion.avatar
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name & Relationship */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                          {companion.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {companion.relationship}
                        </span>
                      </div>

                      {/* Personality */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                        {companion.personality}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{AFFECTION_LEVEL_NAMES[companion.affection?.level || 'stranger']}</span>
                          <span>({companion.affection?.points || 0})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{messageCount} 条消息</span>
                        </div>
                      </div>

                      {/* Last message preview */}
                      {lastMessage && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                          {lastMessage.role === 'user' ? '你: ' : `${companion.name}: `}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCompanion(companion);
                      }}
                      className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-400 hover:text-orange-500 transition-colors"
                      title="开始聊天"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(companion);
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除伙伴"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

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
    </div>
  );
}
