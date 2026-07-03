# 声悦 - NarratorAI

> 一个有记忆、有性格、会成长的 AI 情感陪伴系统

设计理念如下，构建有温度的赛博陪伴体验。角色在对话中逐步成型（量子态坍缩），好感度随互动增长，记忆跨会话保留。
- **量子态角色生成** — 种子只给「轴」不给「点」，角色通过对话自然坍缩出完整人格（代码层硬约束：validator 拒绝 + 强制清空，物理隔离量子态泄漏）
- **大五人格系统** — L2 层 Big Five（开放性/尽责性/外向性/宜人性/神经质），OCEAN 标准排序，心理学理论支撑
- **五维度关系系统** — L3 层（信任感/安全感/亲密感/依恋度/占有欲），动态积分制 0-100
- **三阶段调制** — `effective_Δ = raw_Δ_enum × l2_factor × mood_factor`，枚举化防幻觉
- **压力系统** — 独立短期状态，通过 mood_factor 影响所有关系维度变化
- **情绪深度** — emotionHistory / emotionalMemories / moodFactors，情绪驱动行为
- **角色卡系统** — characterCard 统一数据源，6 类量子态动态 KV（身份/外形/性格/喜好/心事/习惯），成就驱动收集
- **世界观同步** — 天气基于 wttr.in 查询并 15 分钟缓存，节日感知覆盖 16 个固定节日 + 4 个农历节日，时间强制 Asia/Shanghai 时区（7 时段 + 精确小时），位置在首次提到城市时量子态坍缩
- **五种开场策略** — 情绪宣泄 / 感官分享 / 薛定谔提问 / 假装发错 / 观测者静默，脚本随机分配
- **记忆系统** — 跨 session 摘要，角色记忆（revealedFacts，setting 不可变 / experience 可修订）
- **语音** — Agent 直接调用 mimo-tts（voice design → clone 工作流）
- **图片** — Agent 直接调用 image-api，gpt-image-2 生成 + 参考照片 edit API
- **表情包** — tangdouz API 免费表情包搜索，情绪驱动
- **游戏化** — 18 个成就 + 6 张角色卡成就，好感度系统（0-1000），每日任务，收集系统
- **Cheat 模式** — `cheat on/off` 控制信息展示（回合小结、聊天建议、详细总结）
- **Debug 模式** — `debug on/off` + 丰富的调试命令

> 当前前端已落地“稳定核心版”：结构化回合、关系结算、记忆写入、角色卡坍缩、本地模型配置。语音/图片/表情包/Debug/Cheat 中和 Hermes Agent、Telegram 投递强绑定的能力。

## 核心机制

NarratorAI 的聊天体验已经迁移为“结构化回合 + 状态结算”模型。它本质上仍是聊天页，但每一轮聊天不再只是展示模型文本，而是走完整的角色状态机：

```
用户消息 → 构造状态 prompt → 模型输出 TurnResult JSON → 校验/兜底 → 显示 visibleText → 结算关系/记忆/角色卡
```

### 核心原则：量子态

> 没有提及就是无限可能，一旦提及，则立刻限定。

角色不会在创建时被一次性写死。创建时只确定人格轴、关系初值和开场策略，身份、喜好、心事、习惯等信息会在对话中自然出现，并通过结构化回合结果写入角色卡。

- **未提及不固定**：模型不能为了丰满人设而凭空写年龄、职业、故乡、秘密、口头禅。
- **提及后坍缩**：只有当角色在 `visibleText` 中自然说出信息，才允许同步进入 `characterCardUpdate`。
- **已知信息保持一致**：已揭示事实会进入后续 prompt，防止角色前后矛盾。
- **程序层校验**：关系变化只接受枚举值；非法字段会被重置为 neutral，避免模型幻觉直接污染状态。

### 四层状态架构

| 层级 | 名称 | 说明 |
|------|------|------|
| L1 | 角色卡层 | 身份、喜好、心事、习惯等量子态字段，随对话坍缩 |
| L2 | 人格层 | Big Five 和人格原型，决定角色表达方式和关系变化敏感度 |
| L3 | 关系层 | trust / security / closeness / neediness / possessiveness，0-100 动态积分 |
| L4 | 记忆层 | revealedFacts、sessionSummaries、emotionalMemories，跨会话保留 |

### 世界观同步

世界状态作为环境上下文进入系统提示词，不要求角色机械播报，而是让角色在对话中自然感知。

- **天气**：基于 `wttr.in` 按坍缩城市查询，结果写入世界状态并在浏览器本地缓存 15 分钟，避免每轮对话重复请求。
- **节日**：内置 16 个固定公历节日，以及春节、元宵、端午、中秋 4 个农历节日。
- **时间**：强制使用 `Asia/Shanghai` 时区，提供 7 个时段（清晨/早上/中午/下午/晚上/深夜/凌晨）和精确小时。
- **位置**：初始保持量子态；当用户首次提到城市时坍缩为确定城市，后续天气和环境描述依赖该城市。

### 结构化回合输出

模型每轮需要返回 JSON，而不是自由文本。前端只展示 `visibleText`，其余字段用于状态结算。

```json
{
  "analysis": "简短分析这句话如何影响关系",
  "visibleText": "角色真正回复给用户看的文字",
  "currentEmotion": "happy|sad|angry|surprised|fearful|neutral|loving|excited|anxious|grateful",
  "stateDelta": {
    "trust": "neutral",
    "security": "minor_increase",
    "closeness": "minor_increase",
    "neediness": "neutral",
    "possessiveness": "neutral"
  },
  "stressDelta": "neutral",
  "shortTermUpdate": {
    "emotionTrigger": "被用户关心",
    "interactionTrend": "关系升温"
  },
  "memoryUpdate": {
    "revealedFactsAdd": [
      { "category": "preference", "content": "喜欢雨天窝在家里" }
    ],
    "emotionalMemoriesAdd": [
      { "content": "用户在她疲惫时安慰她", "emotion": "grateful", "intensity": 3 }
    ],
    "lastSummary": "用户关心了她的状态"
  },
  "characterCardUpdate": {
    "identity": {},
    "preferences": { "likes": ["雨天窝在家里"], "dislikes": [] },
    "innerWorld": [],
    "habits": []
  }
}
```

### 关系结算

关系变化使用 CyberPersona 的枚举化 delta，避免模型直接输出任意数字：

| 枚举 | 原始分值 | 使用场景 |
|------|----------|----------|
| `major_decrease` | -10 | 严重背叛、重大冲突、发现谎言 |
| `minor_decrease` | -3 | 小失望、轻微误解、冷落 |
| `neutral` | 0 | 普通闲聊、信息交换、无明显影响 |
| `minor_increase` | +3 | 关心、记住小事、普通支持 |
| `major_increase` | +10 | 关键承诺、深层情感支持、重要时刻陪伴 |

实际结算不是简单加减，而是：

```txt
effective_delta = raw_delta × personality_factor × mood_factor
```

- **raw_delta**：模型选择的枚举值。
- **personality_factor**：Big Five 调制，例如高神经质会更容易放大安全感和占有欲变化。
- **mood_factor**：压力调制，压力高时负面变化更强，正面安慰效果会变弱。

### 本地大模型配置

用户可以在 **设置 → 大模型配置** 中填写自己的模型服务，配置会保存在浏览器本地 `localStorage`，不会写入仓库。

支持两类接口：

| API 格式 | 适用服务 | 调用路径 |
|----------|----------|----------|
| MiMo / Messages | MiMo、Anthropic Messages 兼容服务 | `/v1/messages` |
| OpenAI Compatible | OpenAI、兼容 OpenAI Chat Completions 的服务 | `/v1/chat/completions` |

如果 Base URL 留空，则继续使用项目现有的 Vite 代理或环境变量配置。

<div align="center">

![欢迎页面](images/welcome.png)

</div>

## 页面预览

### 聊天界面

| 基础聊天 | 表情包互动 | 好感度面板 |
|:---:|:---:|:---:|
| ![聊天页面](images/chat-sticker.png) | ![表情包](images/chat.png) | ![好感度](images/chat-relationship.png) |

### 任务与角色

| 每日任务 | 角色卡片 | 新发现 |
|:---:|:---:|:---:|
| ![每日任务](images/chat-tasks.png) | ![角色卡片](images/chat-character.png) | ![新发现](images/chat-discovery.png) |

### 成就系统

| 成就面板 |
|:---:|
| ![成就面板](images/chat-achievements.png) |

### 其他页面

| 伙伴管理 | 声音中心 | 设置 |
|:---:|:---:|:---:|
| ![伙伴管理](images/companions.png) | ![声音中心](images/voice.png) | ![设置](images/settings.png) |

## 功能特性

- **多角色陪伴** — 男友、女友、好友、导师等多种陪伴角色，自由设定人设
- **AI 智能对话** — MiMo-V2.5-Pro 驱动，支持上下文记忆，自然流畅
- **情绪表情包** — AI 回复时自动匹配情绪关键词，搜索并展示对应表情包
- **语音对话** — 实时语音交互，支持 TTS 语音合成
- **声音克隆** — 上传音频文件，AI 学习并克隆该声音
- **声音设计** — 通过文字描述生成独特声音
- **伙伴管理** — 独立管理页面，展示所有伙伴卡片、好感度、消息统计
- **好感度系统** — 互动提升好感度，解锁成就与特殊对话
- **成就与收集** — 聊天过程中解锁成就，获得收集品
- **日期分隔线** — 不同日期消息之间显示今天、昨天、具体日期标签
- **快捷回复** — AI 回复后显示 2-3 个上下文相关的快捷回复按钮
- **消息操作** — 右键/长按消息弹出菜单，可复制文本或删除消息
- **自动调整输入** — 输入多行时自动变高，最多 5 行
- **回到底部** — 向上滚动时右下角浮动按钮，点击平滑滚回
- **深色/浅色主题** — 自适应主题切换
- **个性化记忆** — 记住你的喜好和重要时刻

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| 路由 | React Router 6 |
| AI 接口 | MiMo AI API (MiMo-V2.5 多模态对话 / TTS / 声音克隆) |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

你可以用两种方式配置大模型：

**方式一：浏览器本地配置（推荐给普通用户）**

启动应用后进入 **设置 → 大模型配置**，填写：

- API 格式：`MiMo / Messages` 或 `OpenAI Compatible`
- Base URL
- API Key
- 模型名

配置会保存在当前浏览器本地，不会提交到仓库。

**方式二：开发环境变量**

复制示例文件并填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
VITE_MIMO_AUTH_TOKEN=你的MiMo API Key
```

> **注意：** `.env` 文件已加入 `.gitignore`，不会被提交到仓库。若用户在设置页填写 API Key，则密钥保存在浏览器本地；若使用 `.env`，API Key 通过 Vite 代理或直连配置参与请求。

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
├── components/          # 通用组件
│   ├── Layout.tsx         # 页面布局
│   ├── Sidebar.tsx        # 侧边导航栏
│   ├── AffectionDisplay.tsx  # 好感度展示
│   ├── RelationshipPanel.tsx # 关系面板
│   ├── AchievementToast.tsx  # 成就提示
│   └── CollectionToast.tsx   # 收集品提示
├── hooks/               # 自定义 Hooks
│   ├── useAudio.ts        # 音频播放
│   ├── useRecorder.ts     # 录音
│   ├── useSticker.ts      # 表情包搜索
│   └── useTheme.ts        # 主题切换
├── pages/               # 页面
│   ├── WelcomePage.tsx    # 欢迎页
│   ├── SetupPage.tsx      # 初始设置
│   ├── ChatPage.tsx       # 聊天主界面
│   ├── CompanionsPage.tsx # 伙伴管理
│   ├── SettingsPage.tsx   # 设置
│   └── VoicePage.tsx      # 语音设置
├── stores/              # 状态管理
│   └── useAppStore.ts     # 全局状态 (Zustand)
├── types/               # TypeScript 类型
│   └── index.ts
├── utils/               # 工具函数
│   ├── api.ts             # 通用 API
│   ├── mimo.ts            # MiMo API 客户端
│   ├── characterAnalyzer.ts # 角色、关系、情绪、成就分析
│   └── turnEngine.ts      # CyberPersona 结构化回合协议与状态结算
├── App.tsx
├── main.tsx
└── index.css
```

## API 接口

### 对话模型 API

聊天模型支持项目代理、环境变量直连，以及用户在设置页填写的本地配置。

| 格式 | 路径 | 说明 |
|------|------|------|
| MiMo / Messages | `/v1/messages` | 默认结构，兼容当前 MiMo 多模态对话 |
| OpenAI Compatible | `/v1/chat/completions` | 兼容 OpenAI Chat Completions 的服务 |

### MiMo AI API

| 功能 | 代理路径 | 目标路径 | 模型 |
|------|----------|----------|------|
| 对话 | `/mimo/v1/messages` | `/anthropic/v1/messages` | mimo-v2.5 |
| 语音合成 | `/mimo-tts/v1/chat/completions` | `/v1/chat/completions` | mimo-v2.5-tts |
| 声音克隆 | `/mimo-tts/v1/chat/completions` | `/v1/chat/completions` | mimo-v2.5-tts-voiceclone |
| 声音设计 | `/mimo-tts/v1/chat/completions` | `/v1/chat/completions` | mimo-v2.5-tts-voicedesign |

### 表情包 API

| 功能 | 代理路径 | 说明 |
|------|----------|------|
| 搜索表情包 | `/sticker/a/biaoq.php` | 根据关键词搜索，返回 JSON 数组 |

## 使用流程

1. 首次打开进入 **欢迎页面**，了解功能介绍
2. 点击"开始旅程"进入 **初始设置**，设定昵称、选择陪伴角色
3. 在 **设置 → 大模型配置** 中填写自己的模型服务，或继续使用项目默认代理
4. 进入 **聊天界面**，开始与 AI 伙伴对话
5. 每轮对话会生成结构化 TurnResult，自动结算关系、记忆、角色卡和成就
6. 通过 **伙伴管理** 页面查看所有伙伴的好感度和消息统计
7. 在 **设置** 中调整昵称、切换主题、管理声音配置

## 许可证

[MIT License](LICENSE)

Copyright (c) 2026 念安@dandan1232
