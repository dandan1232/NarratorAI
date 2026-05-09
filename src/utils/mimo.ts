// 检查环境变量，决定使用代理还是直连
const MIMO_BASE_URL = import.meta.env.VITE_MIMO_BASE_URL || '';
const MIMO_AUTH_TOKEN = import.meta.env.VITE_MIMO_AUTH_TOKEN || '';

// 如果有环境变量，使用直连；否则使用代理路径
const MIMO_PROXY_PATH = MIMO_BASE_URL ? '' : '/mimo';
const MIMO_TTS_PROXY_PATH = MIMO_BASE_URL ? '' : '/mimo-tts';
const MIMO_DIRECT_URL = MIMO_BASE_URL ? MIMO_BASE_URL : '';
const MIMO_TTS_DIRECT_URL = MIMO_BASE_URL ? MIMO_BASE_URL.replace('/anthropic', '') : '';

export interface MimoMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64 data URL
}

export interface MimoResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface MimoTTSRequest {
  text: string;
  voice_id?: string;
  speed?: number;
  pitch?: number;
}

class MimoClient {
  private proxyPath: string;
  private ttsProxyPath: string;

  constructor() {
    this.proxyPath = MIMO_PROXY_PATH;
    this.ttsProxyPath = MIMO_TTS_PROXY_PATH;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // 构建完整的请求URL
    const baseUrl = MIMO_DIRECT_URL || this.proxyPath;
    const url = `${baseUrl}${endpoint}`;

    // 构建请求头，如果是直连模式则添加Authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (MIMO_DIRECT_URL && MIMO_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${MIMO_AUTH_TOKEN}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiMo API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // 对话补全 - 使用 MiMo-V2.5（支持多模态）
  async chat(
    messages: MimoMessage[],
    systemPrompt?: string,
    model: string = 'mimo-v2.5'
  ): Promise<string> {
    // 构建消息数组，支持图片
    const formattedMessages = messages.map(msg => {
      const content: any[] = [
        {
          type: 'text',
          text: msg.content,
        },
      ];

      if (msg.image) {
        // 提取 base64 数据和 MIME 类型
        const match = msg.image.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          content.unshift({
            type: 'image',
            source: {
              type: 'base64',
              media_type: match[1],
              data: match[2],
            },
          });
        }
      }

      return {
        role: msg.role,
        content,
      };
    });

    const body: any = {
      model,
      max_tokens: 2048,
      stream: false,
      messages: formattedMessages,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await this.request<any>('/v1/messages', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 提取文本内容（跳过 thinking 部分）
    const textBlock = response.content?.find((block: any) => block.type === 'text');
    return textBlock?.text || '';
  }

  // TTS 通用请求 - 使用 /v1/chat/completions 端点
  private async ttsRequest(
    model: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    audioConfig: { format?: string; voice?: string }
  ): Promise<ArrayBuffer> {
    // 构建完整的请求URL
    const baseUrl = MIMO_TTS_DIRECT_URL || this.ttsProxyPath;
    const url = `${baseUrl}/v1/chat/completions`;

    // 构建请求头，如果是直连模式则添加Authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (MIMO_TTS_DIRECT_URL && MIMO_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${MIMO_AUTH_TOKEN}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        audio: {
          format: audioConfig.format || 'wav',
          ...(audioConfig.voice && { voice: audioConfig.voice }),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const audioData = result?.choices?.[0]?.message?.audio?.data;
    if (!audioData) {
      throw new Error('No audio data in response');
    }

    // base64 解码为 ArrayBuffer
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 语音合成 - 使用预置音色
  async tts(
    text: string,
    voiceId?: string,
    styleInstruction?: string
  ): Promise<ArrayBuffer> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (styleInstruction) {
      messages.push({ role: 'user', content: styleInstruction });
    }
    messages.push({ role: 'assistant', content: text });

    return this.ttsRequest('mimo-v2.5-tts', messages, {
      format: 'wav',
      voice: voiceId || 'mimo_default',
    });
  }

  // 声音克隆 - 
  // 基于音频样本复刻音色并合成
  async cloneVoice(
    audioFile: File,
    text: string,
    styleInstruction?: string
  ): Promise<ArrayBuffer> {
    // 读取音频文件为 base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    const mimeType = audioFile.type || 'audio/wav';
    const voiceData = `data:${mimeType};base64,${base64Audio}`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (styleInstruction) {
      messages.push({ role: 'user', content: styleInstruction });
    }
    messages.push({ role: 'assistant', content: text });

    return this.ttsRequest('mimo-v2.5-tts-voiceclone', messages, {
      format: 'wav',
      voice: voiceData,
    });
  }

  // 声音设计 - 通过文本描述生成音色
  async designVoice(
    voiceDescription: string,
    text: string
  ): Promise<ArrayBuffer> {
    return this.ttsRequest('mimo-v2.5-tts-voicedesign', [
      { role: 'user', content: voiceDescription },
      { role: 'assistant', content: text },
    ], { format: 'wav' });
  }

  // 情绪检测
  async detectEmotion(text: string): Promise<{ emotion: string; confidence: number }> {
    const response = await this.chat(
      [{ role: 'user', content: text }],
      `你是一个情绪分析助手。请分析用户文本的情绪，返回 JSON 格式：
      {
        "emotion": "happy|sad|angry|surprised|fearful|neutral|loving|excited|anxious|grateful",
        "confidence": 0.0-1.0
      }
      只返回 JSON，不要其他内容。`
    );

    try {
      return JSON.parse(response);
    } catch {
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }
}

export const mimoClient = new MimoClient();
