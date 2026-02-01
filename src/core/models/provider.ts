/**
 * Model Provider - 多模型提供商支持
 * 
 * 集成 OpenAI、Anthropic、Qwen 等
 * 统一接口，支持切换模型
 */

import type { ModelConfig, ThinkingLevel } from '../../types/index.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface GenerateOptions {
  messages: Array<{ role: string; content: string }>;
  thinkingLevel?: ThinkingLevel;
  tools?: Array<{ name: string; description: string; parameters: unknown }>;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ModelProvider {
  private config: ModelConfig;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor(config: ModelConfig) {
    this.config = config;

    // 初始化客户端
    if (config.provider === 'openai' || config.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
    }

    if (config.provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey,
      });
    }
  }

  /**
   * 生成回复
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    switch (this.config.provider) {
      case 'openai':
        return this.generateOpenAI(options);
      case 'anthropic':
        return this.generateAnthropic(options);
      case 'qwen':
        return this.generateQwen(options);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * OpenAI 生成
   */
  private async generateOpenAI(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = options.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      tools: options.tools
        ? options.tools.map((tool) => ({
            type: 'function' as const,
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters as Record<string, unknown>,
            },
          }))
        : undefined,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // 提取工具调用
    const toolCalls = message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}'),
    }));

    return {
      text: message.content || '',
      toolCalls,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  /**
   * Anthropic Claude 生成
   */
  private async generateAnthropic(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    // 转换消息格式
    const systemMessages: string[] = [];
    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg.content);
      } else {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
      system: systemMessages.join('\n\n'),
      messages: conversationMessages,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      tools: options.tools
        ? options.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters as Record<string, unknown>,
          }))
        : undefined,
    });

    const content = response.content[0];
    
    // 提取文本和工具调用
    let text = '';
    const toolCalls: GenerateResult['toolCalls'] = [];

    if (content.type === 'text') {
      text = content.text;
    } else if (content.type === 'tool_use') {
      toolCalls.push({
        id: content.id,
        name: content.name,
        arguments: content.input as Record<string, unknown>,
      });
    }

    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Qwen 生成（兼容 OpenAI API）
   */
  private async generateQwen(options: GenerateOptions): Promise<GenerateResult> {
    // Qwen 使用 OpenAI 兼容的 API
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });
    }

    return this.generateOpenAI(options);
  }
}
