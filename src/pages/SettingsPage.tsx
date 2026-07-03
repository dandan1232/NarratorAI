import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Globe,
  Shield,
  Trash2,
  Save,
  Check,
  Download,
  Upload,
  Camera,
  KeyRound,
} from 'lucide-react';
import { ModelApiFormat } from '../types';
import { hasUsableModelConfig, normalizeModelConfig } from '../utils/modelConfig';

const AVATAR_OPTIONS = [
  '👨', '👩', '🧑', '👴', '👵', '🧑‍⚕️',
  '👦', '👧', '🧒', '👶', '🧒🏻', '👩‍🦰',
  '👨‍🦱', '👩‍🦳', '🧑‍🎤', '👨‍💻', '👩‍🎨', '🧑‍🍳',
  '🦊', '🐱', '🐶', '🐰', '🐼', '🐨',
  '🦋', '🌸', '⭐', '🔥', '💎', '🌙',
];

export default function SettingsPage() {
  const {
    user, setUser, updateUserPreferences,
    currentCompanion, updateCompanion,
    reset, setCurrentView,
    modelConfig, updateModelConfig,
  } = useAppStore();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [companionName, setCompanionName] = useState(currentCompanion?.name || '');
  const [companionAvatar, setCompanionAvatar] = useState(currentCompanion?.avatar || '');
  const [companionPersonality, setCompanionPersonality] = useState(currentCompanion?.personality || '');
  const [modelBaseUrl, setModelBaseUrl] = useState(modelConfig.baseUrl);
  const [modelApiKey, setModelApiKey] = useState(modelConfig.apiKey);
  const [modelName, setModelName] = useState(modelConfig.model);
  const [modelApiFormat, setModelApiFormat] = useState<ModelApiFormat>(modelConfig.apiFormat);
  const [saved, setSaved] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const showSaved = (label: string) => {
    setSaved(label);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleSaveNickname = () => {
    if (nickname.trim() && nickname !== user.nickname) {
      setUser({ ...user, nickname: nickname.trim() });
      showSaved('昵称已保存');
    }
  };

  const handleSaveCompanion = () => {
    if (currentCompanion) {
      updateCompanion(currentCompanion.id, {
        name: companionName,
        avatar: companionAvatar,
        personality: companionPersonality,
      });
      showSaved('伙伴设置已保存');
    }
  };

  const handleSaveModelConfig = () => {
    const nextConfig = normalizeModelConfig({
      baseUrl: modelBaseUrl,
      apiKey: modelApiKey,
      model: modelName,
      apiFormat: modelApiFormat,
    });
    if (!hasUsableModelConfig(nextConfig)) {
      alert('请填写 Base URL、API Key 和模型名。');
      return;
    }
    updateModelConfig(nextConfig);
    showSaved('模型配置已保存');
  };

  const handleReset = () => {
    reset();
    setCurrentView('welcome');
    navigate('/');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    // 限制文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCompanionAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const data = localStorage.getItem('narrator-ai-storage');
    if (!data) return;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `narrator-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSaved('数据已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        // 验证基本结构
        if (!data.state || !data.state.companions) {
          alert('文件格式不正确，请选择正确的备份文件');
          return;
        }

        localStorage.setItem('narrator-ai-storage', text);
        showSaved('数据已导入，刷新页面生效');
      } catch {
        alert('文件解析失败，请确认文件格式正确');
      }
    };
    reader.readAsText(file);
    // 清空 input 以便重复导入同一文件
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold gradient-text mb-8">设置</h1>

        {/* Save feedback */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">{saved}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Settings */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">个人信息</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">昵称</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                  placeholder="输入你的昵称"
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={!nickname.trim() || nickname === user.nickname}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">偏好设置</h2>
          </div>

          <div className="space-y-3">
            {/* Theme */}
            <SettingToggle
              icon={user.preferences.theme === 'dark' ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              label="主题"
              description={user.preferences.theme === 'dark' ? '深色模式' : '浅色模式'}
              active={user.preferences.theme === 'dark'}
              activeColor="bg-amber-500"
              onClick={() => updateUserPreferences({ theme: user.preferences.theme === 'dark' ? 'light' : 'dark' })}
            />

            {/* Language */}
            <SettingToggle
              icon={<Globe className="w-5 h-5 text-blue-500" />}
              label="语言"
              description={user.preferences.language === 'zh' ? '中文' : 'English'}
              active={user.preferences.language === 'en'}
              activeColor="bg-blue-500"
              onClick={() => updateUserPreferences({ language: user.preferences.language === 'zh' ? 'en' : 'zh' })}
            />

            {/* TTS */}
            <SettingToggle
              icon={user.preferences.ttsEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              label="语音播放"
              description={user.preferences.ttsEnabled ? '已开启' : '已关闭'}
              active={user.preferences.ttsEnabled}
              activeColor="bg-green-500"
              onClick={() => updateUserPreferences({ ttsEnabled: !user.preferences.ttsEnabled })}
            />

            {/* Auto Play Voice */}
            <SettingToggle
              icon={<Bell className="w-5 h-5 text-orange-500" />}
              label="自动播放语音"
              description={user.preferences.autoPlayVoice ? '已开启' : '已关闭'}
              active={user.preferences.autoPlayVoice}
              activeColor="bg-orange-500"
              onClick={() => updateUserPreferences({ autoPlayVoice: !user.preferences.autoPlayVoice })}
            />
          </div>
        </div>

        {/* Model Settings */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">大模型配置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">API 格式</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'mimo', label: 'MiMo / Messages' },
                  { value: 'openai', label: 'OpenAI Compatible' },
                ] as Array<{ value: ModelApiFormat; label: string }>).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setModelApiFormat(option.value)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      modelApiFormat === option.value
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Base URL</label>
              <input
                type="url"
                value={modelBaseUrl}
                onChange={(e) => setModelBaseUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                placeholder={modelApiFormat === 'openai' ? 'https://api.openai.com' : 'https://你的-mimo-api'}
              />
              <p className="mt-1 text-xs text-gray-400">必填，填写模型服务的根地址。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">API Key</label>
              <input
                type="password"
                value={modelApiKey}
                onChange={(e) => setModelApiKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                placeholder="仅保存在当前浏览器本地"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">模型</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                placeholder="填写你的服务实际模型名"
              />
            </div>

            <button
              onClick={handleSaveModelConfig}
              disabled={!hasUsableModelConfig({ baseUrl: modelBaseUrl, apiKey: modelApiKey, model: modelName, apiFormat: modelApiFormat })}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              保存模型配置
            </button>
          </div>
        </div>

        {/* Companion Settings */}
        {currentCompanion && (
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center text-xl overflow-hidden">
                {currentCompanion.avatar.startsWith('data:') ? (
                  <img src={currentCompanion.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentCompanion.avatar
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {currentCompanion.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">伙伴设置</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">名称</label>
                <input
                  type="text"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">头像</label>
                {/* Current avatar preview */}
                {companionAvatar && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 flex items-center justify-center overflow-hidden">
                      {companionAvatar.startsWith('data:') ? (
                        <img src={companionAvatar} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{companionAvatar}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">当前头像</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setCompanionAvatar(emoji)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        companionAvatar === emoji
                          ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-400 shadow-md scale-110'
                          : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* Upload custom photo button */}
                  <button
                    onClick={() => avatarFileRef.current?.click()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-500 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                    title="上传自定义头像"
                  >
                    <Camera className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">性格特点</label>
                <textarea
                  value={companionPersonality}
                  onChange={(e) => setCompanionPersonality(e.target.value)}
                  className="w-full h-24 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none resize-none transition-colors"
                />
              </div>

              <button
                onClick={handleSaveCompanion}
                disabled={
                  companionName === currentCompanion.name &&
                  companionAvatar === currentCompanion.avatar &&
                  companionPersonality === currentCompanion.personality
                }
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                保存设置
              </button>
            </div>
          </div>
        )}

        {/* Data Management */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">数据管理</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            导出所有数据（聊天记录、伙伴设置、偏好等）为 JSON 文件，可用于备份或迁移到其他设备。
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <label className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-orange-50 dark:hover:bg-gray-700 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              导入数据
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">危险区域</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            清除所有数据，包括聊天记录、伙伴设置、偏好设置等。此操作不可撤销。
          </p>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            清除所有数据
          </button>
        </div>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">确认清除所有数据？</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  所有伙伴、聊天记录、设置将被永久删除，此操作不可撤销。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700/50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                >
                  确认清除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable setting toggle component
function SettingToggle({
  icon,
  label,
  description,
  active,
  activeColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
          active ? `${activeColor} text-white` : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
        }`}
      >
        切换
      </button>
    </div>
  );
}
