import { useState, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Upload, Wand2, Play, Pause, Volume2, Trash2, Plus, Check, Loader2, Square,
} from 'lucide-react';
import { mimoClient } from '../utils/mimo';

// MiMo 预置音色列表
const PRESET_VOICES = [
  { id: 'mimo_default', name: 'MiMo-默认', lang: '中文', gender: '女声' },
  { id: '冰糖', name: '冰糖', lang: '中文', gender: '女声' },
  { id: '茉莉', name: '茉莉', lang: '中文', gender: '女声' },
  { id: '苏打', name: '苏打', lang: '中文', gender: '男声' },
  { id: '白桦', name: '白桦', lang: '中文', gender: '男声' },
  { id: 'Mia', name: 'Mia', lang: '英文', gender: '女声' },
  { id: 'Chloe', name: 'Chloe', lang: '英文', gender: '女声' },
  { id: 'Milo', name: 'Milo', lang: '英文', gender: '男声' },
  { id: 'Dean', name: 'Dean', lang: '英文', gender: '男声' },
];

export default function VoicePage() {
  const [activeTab, setActiveTab] = useState<'test' | 'clone' | 'design' | 'library'>('test');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TTS test
  const [testText, setTestText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('mimo_default');
  const [styleInstruction, setStyleInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clone
  const [cloneText, setCloneText] = useState('');
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null);
  const cloneAudioRef = useRef<HTMLAudioElement>(null);

  // Design
  const [voiceDescription, setVoiceDescription] = useState('');
  const [designText, setDesignText] = useState('');
  const [designAudioUrl, setDesignAudioUrl] = useState<string | null>(null);
  const designAudioRef = useRef<HTMLAudioElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { voices, deleteVoice, currentCompanion, updateCompanion } = useAppStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleTtsTest = async () => {
    if (!testText.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const arrayBuffer = await mimoClient.tts(
        testText,
        selectedVoice,
        styleInstruction || undefined
      );
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);

      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    } catch (err) {
      setError(`语音合成失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('TTS error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloneVoice = async () => {
    if (!audioFile || !cloneText.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await mimoClient.cloneVoice(audioFile, cloneText);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (cloneAudioUrl) URL.revokeObjectURL(cloneAudioUrl);
      setCloneAudioUrl(url);

      setTimeout(() => {
        cloneAudioRef.current?.play();
      }, 100);
    } catch (err) {
      setError(`声音克隆失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('Voice clone error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDesignVoice = async () => {
    if (!voiceDescription.trim() || !designText.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await mimoClient.designVoice(voiceDescription, designText);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (designAudioUrl) URL.revokeObjectURL(designAudioUrl);
      setDesignAudioUrl(url);

      setTimeout(() => {
        designAudioRef.current?.play();
      }, 100);
    } catch (err) {
      setError(`声音设计失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('Voice design error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetCompanionVoice = (voiceId: string) => {
    if (currentCompanion) {
      updateCompanion(currentCompanion.id, {
        voiceId,
        voiceSettings: { voiceId, speed: 1, pitch: 1, volume: 1 },
      });
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const tabs = [
    { id: 'test' as const, label: '语音试听', icon: Volume2 },
    { id: 'clone' as const, label: '声音克隆', icon: Mic },
    { id: 'design' as const, label: '声音设计', icon: Wand2 },
    { id: 'library' as const, label: '声音库', icon: Plus },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">声音中心</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">定制专属于你的声音，让陪伴更加真实</p>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                  : 'glass hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* TTS Test */}
          {activeTab === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">语音试听</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                输入文字，选择音色，让 AI 用声音说出来
              </p>

              {currentCompanion && (
                <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                  {currentCompanion.avatar.startsWith('data:') ? (
                    <img src={currentCompanion.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl">{currentCompanion.avatar}</span>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {currentCompanion.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentCompanion.voiceId ? `已绑定声音: ${currentCompanion.voiceId}` : '使用默认声音'}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* 音色选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">选择音色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_VOICES.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-3 rounded-xl text-left transition-all text-sm ${
                          selectedVoice === voice.id
                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-2 border-orange-300 dark:border-orange-600'
                            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-orange-200'
                        }`}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-100">{voice.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{voice.lang} · {voice.gender}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 风格指令 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    风格指令 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={styleInstruction}
                    onChange={(e) => setStyleInstruction(e.target.value)}
                    placeholder="例如：用温柔轻声的语气，语速稍慢"
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* 合成文本 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">合成文本</label>
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="输入想让 AI 说的话，例如：宝贝，今天过得怎么样？"
                    className="w-full h-32 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none resize-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <button
                  onClick={handleTtsTest}
                  disabled={!testText.trim() || isGenerating}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    !testText.trim() || isGenerating
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      生成语音
                    </>
                  )}
                </button>

                {/* Audio Player */}
                {audioUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          if (!audioRef.current) return;
                          if (audioRef.current.paused) {
                            audioRef.current.play();
                            setIsPlaying(true);
                          } else {
                            audioRef.current.pause();
                            setIsPlaying(false);
                          }
                        }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-center hover:shadow-lg transition-all"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">语音预览</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {PRESET_VOICES.find(v => v.id === selectedVoice)?.name || '默认音色'}
                        </div>
                      </div>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Clone Voice */}
          {activeTab === 'clone' && (
            <motion.div
              key="clone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">声音克隆</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                上传一段音频，AI 将用这个声音合成你指定的文本
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div
                    className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {audioFile ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{audioFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-orange-400" />
                        <p className="font-medium text-gray-800 dark:text-gray-100">点击或拖拽上传音频</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          支持 MP3、WAV 格式，Base64 编码后不超过 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mp3,audio/wav,audio/mpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="mt-4">
                    <button
                      onClick={toggleRecording}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-5 h-5" />
                          录制中... 点击停止
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          或者直接录制
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">要合成的文本</label>
                    <textarea
                      value={cloneText}
                      onChange={(e) => setCloneText(e.target.value)}
                      placeholder="输入想用克隆声音说的话..."
                      className="w-full h-32 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none resize-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <button
                    onClick={handleCloneVoice}
                    disabled={!audioFile || !cloneText.trim() || isProcessing}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
                      !audioFile || !cloneText.trim() || isProcessing
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        开始克隆
                      </>
                    )}
                  </button>

                  {/* Clone Audio Player */}
                  {cloneAudioUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => cloneAudioRef.current?.play()}
                          className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center hover:shadow-lg transition-all"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">克隆声音预览</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">点击播放</div>
                        </div>
                        <audio ref={cloneAudioRef} src={cloneAudioUrl} className="hidden" />
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">使用提示</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• 音频越清晰，克隆效果越好</li>
                      <li>• 建议在安静环境下录制</li>
                      <li>• 支持 MP3 和 WAV 格式</li>
                      <li>• Base64 编码后不超过 10MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Design Voice */}
          {activeTab === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">声音设计</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                用文字描述你想要的声音，AI 将为你生成独特的音色
              </p>

              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">声音描述</label>
                  <textarea
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="例如：一位年迈的老先生，语速缓慢而沉稳，嗓音略带沙哑和沧桑感"
                    className="w-full h-24 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none resize-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    描述越具体越好：性别、年龄、音色质感、情绪语气、语速节奏
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">合成文本</label>
                  <textarea
                    value={designText}
                    onChange={(e) => setDesignText(e.target.value)}
                    placeholder="输入想用这个声音说的话..."
                    className="w-full h-24 px-4 py-3 rounded-xl border-2 border-orange-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none resize-none transition-colors bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <button
                  onClick={handleDesignVoice}
                  disabled={!voiceDescription.trim() || !designText.trim() || isProcessing}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
                    !voiceDescription.trim() || !designText.trim() || isProcessing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      生成声音
                    </>
                  )}
                </button>

                {/* Design Audio Player */}
                {designAudioUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => designAudioRef.current?.play()}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white flex items-center justify-center hover:shadow-lg transition-all"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">设计声音预览</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">点击播放</div>
                      </div>
                      <audio ref={designAudioRef} src={designAudioUrl} className="hidden" />
                    </div>
                  </motion.div>
                )}

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">描述技巧</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                    <li>• 写清性别与年龄</li>
                    <li>• 描述音色质感（磁性、沙哑、清亮等）</li>
                    <li>• 加入情绪和语气（温柔、慵懒、活泼等）</li>
                    <li>• 可以设定场景（深夜电台DJ、评书先生等）</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Voice Library */}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">声音库</h2>
                  <p className="text-gray-600 dark:text-gray-400">管理你的声音资源</p>
                </div>
                <button
                  onClick={() => setActiveTab('clone')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加声音
                </button>
              </div>

              {/* 预置音色列表 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">预置音色</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_VOICES.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        currentCompanion?.voiceId === voice.id
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-200 dark:border-orange-700'
                          : 'bg-white dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">{voice.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {voice.lang} · {voice.gender}
                            {currentCompanion?.voiceId === voice.id && ' · 当前使用'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSetCompanionVoice(voice.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            currentCompanion?.voiceId === voice.id
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}
                          title="设为伙伴声音"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 自定义声音 */}
              {voices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">自定义声音</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {voices.map((voice: any) => (
                      <motion.div
                        key={voice.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-100">{voice.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {voice.type === 'cloned' ? '克隆声音' : '设计声音'}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteVoice(voice.id)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {voices.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  还没有自定义声音，去"声音克隆"或"声音设计"创建一个吧
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
