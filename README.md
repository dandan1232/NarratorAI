# 声悦 - NarratorAI

智能情感陪伴聊天机器人前端项目

## 功能特性

- 🎭 多种陪伴角色（男友、女友、好友、导师等）
- 💬 情感陪伴聊天（MiMo AI 驱动）
- 😊 情绪表情包自动匹配
- 🎤 语音对话
- 🔊 声音克隆与设计
- 💾 个性化记忆
- 🎨 柔和温暖的界面设计

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- Framer Motion (动画)
- Lucide React (图标)
- MiMo AI API (对话、TTS、声音克隆)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
VITE_MIMO_BASE_URL=https://api.xiaomimimo.com/anthropic
VITE_MIMO_AUTH_TOKEN=你的MiMo API Key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/     # 组件
│   ├── Layout.tsx
│   └── Sidebar.tsx
├── hooks/          # 自定义 Hooks
│   ├── useAudio.ts
│   ├── useRecorder.ts
│   └── useSticker.ts    # 表情包搜索
├── pages/          # 页面
│   ├── WelcomePage.tsx
│   ├── SetupPage.tsx
│   ├── ChatPage.tsx
│   ├── SettingsPage.tsx
│   └── VoicePage.tsx
├── stores/         # 状态管理
│   └── useAppStore.ts
├── types/          # TypeScript 类型
│   └── index.ts
├── utils/          # 工具函数
│   ├── api.ts
│   └── mimo.ts     # MiMo API 客户端
├── App.tsx
├── main.tsx
└── index.css
```

## API 接口

### MiMo AI API

通过 Vite 代理调用，避免 CORS 问题：

| 功能 | 代理路径 | 模型 |
|------|----------|------|
| 对话 | `/mimo/v1/messages` | mimo-v2.5-pro |
| 语音合成 | `/mimo/audio/speech` | MiMo-V2.5-TTS |
| 声音克隆 | `/mimo/audio/voices/clone` | MiMo-V2.5-TTS-VoiceClone |
| 声音设计 | `/mimo/audio/voices/design` | MiMo-V2.5-TTS-VoiceDesign |

### 表情包 API

| 功能 | 代理路径 | 说明 |
|------|----------|------|
| 搜索表情包 | `/sticker/a/biaoq.php` | 根据关键词搜索，返回 JSON 数组 |

## 使用说明

1. 首次打开会进入欢迎页面
2. 点击"开始旅程"进入设置流程
3. 设置昵称、选择陪伴伙伴
4. 开始聊天，享受陪伴

## 特色功能

### AI 对话
使用 MiMo-V2.5-Pro 模型，支持上下文记忆，自然流畅的对话体验

### 情绪表情包
AI 回复时自动匹配情绪关键词，搜索并展示对应的表情包

### 声音克隆
上传音频文件，AI 会学习并克隆该声音

### 声音设计
通过文字描述生成独特的声音

### 情感识别
AI 会识别对话中的情感，提供更贴心的回应

### 个性化记忆
记住你的喜好和重要时刻
