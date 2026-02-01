/**
 * Awesome Agent - Core Agent Implementation
 * 
 * 集成最前沿的 Agent 技术：
 * - OpenClaw: Gateway架构、会话管理、工具系统
 * - LangChain: 工具链、记忆系统
 * - AutoGPT: 自主规划、任务分解
 * - CrewAI: 多Agent协作
 */

import type { AgentConfig, Session, Message, ToolCall, AgentRun } from '../types/index.js';
import { ToolRegistry } from './tools/registry.js';
import { ModelProvider } from './models/provider.js';
import { SessionManager } from './session/manager.js';

type EventListener = (event: unknown) => void;

export class AwesomeAgent {
  private config: AgentConfig;
  private toolRegistry: ToolRegistry;
  private modelProvider: ModelProvider;
  private sessionManager: SessionManager;
  private activeRuns: Map<string, AgentRun> = new Map();
  private eventListeners: Map<string, Set<EventListener>> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
    this.toolRegistry = new ToolRegistry(config.tools || []);
    this.modelProvider = new ModelProvider(config.model);
    this.sessionManager = new SessionManager(config.workspace);
  }

  /**
   * 运行 Agent 循环
   * 集成 OpenClaw 的 Agent Loop 机制
   */
  async run(params: {
    sessionId: string;
    message: string;
    runId?: string;
  }): Promise<AgentRun> {
    const runId = params.runId || `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const run: AgentRun = {
      id: runId,
      sessionId: params.sessionId,
      status: 'pending',
      startedAt: Date.now(),
    };

    this.activeRuns.set(runId, run);
    this.emit('lifecycle', { type: 'lifecycle', runId, data: { phase: 'start' } });

    try {
      run.status = 'running';
      
      // 1. 获取或创建会话
      const session = await this.sessionManager.getOrCreate(params.sessionId);
      
      // 2. 添加用户消息
      session.messages.push({
        role: 'user',
        content: params.message,
        timestamp: Date.now(),
      });

      // 3. Agent Loop（类似 OpenClaw）
      const result = await this.agentLoop(session, runId);
      
      // 4. 保存会话
      await this.sessionManager.save(session);
      
      run.status = 'completed';
      run.endedAt = Date.now();
      
      this.emit('lifecycle', { type: 'lifecycle', runId, data: { phase: 'end', result } });
      
      return run;
    } catch (error) {
      run.status = 'error';
      run.error = error instanceof Error ? error.message : String(error);
      run.endedAt = Date.now();
      
      this.emit('lifecycle', { type: 'lifecycle', runId, data: { phase: 'error', error: run.error } });
      
      throw error;
    } finally {
      this.activeRuns.delete(runId);
    }
  }

  /**
   * Agent Loop - 核心执行循环
   * 参考 OpenClaw 的 agent-loop.md
   */
  private async agentLoop(session: Session, runId: string): Promise<string> {
    const maxIterations = 10;
    let iteration = 0;
    let assistantResponse = '';

    while (iteration < maxIterations) {
      iteration++;

      // 1. 构建上下文（类似 OpenClaw 的系统提示词构建）
      const context = this.buildContext(session);

      // 2. 调用 LLM（支持思考模式）
      const response = await this.modelProvider.generate({
        messages: context,
        thinkingLevel: this.config.thinkingLevel,
        tools: this.toolRegistry.getAvailableTools(),
      });

      // 3. 流式输出助手回复
      if (response.text) {
        assistantResponse += response.text;
        this.emit('assistant', {
          type: 'assistant',
          runId,
          data: { delta: response.text, full: assistantResponse },
        });
      }

      // 4. 检查是否需要工具调用
      if (response.toolCalls && response.toolCalls.length > 0) {
        // 执行工具调用
        const toolResults = await this.executeTools(response.toolCalls, runId);
        
        // 将工具结果添加到会话
        session.messages.push({
          role: 'assistant',
          content: assistantResponse,
          toolCalls: response.toolCalls,
          timestamp: Date.now(),
        });

        // 为每个工具结果创建单独的消息
        for (const result of toolResults) {
          session.messages.push({
            role: 'tool',
            content: JSON.stringify(result.result),
            toolResults: [{
              callId: result.callId,
              name: result.name,
              result: result.result,
              error: result.error,
            }],
            timestamp: Date.now(),
          });
        }

        // 继续循环，让 LLM 根据工具结果继续
        continue;
      }

      // 5. 没有工具调用，完成
      session.messages.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: Date.now(),
      });

      break;
    }

    return assistantResponse;
  }

  /**
   * 构建上下文
   * 集成 OpenClaw 的系统提示词构建 + LangChain 的记忆系统
   */
  private buildContext(session: Session): Message[] {
    const messages: Message[] = [];

    // 1. 系统提示词（类似 OpenClaw）
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(),
      timestamp: Date.now(),
    });

    // 2. 会话历史（最近 N 条，避免上下文过长）
    const recentMessages = session.messages.slice(-20);
    messages.push(...recentMessages);

    return messages;
  }

  /**
   * 构建系统提示词
   * 参考 OpenClaw 的 system-prompt.md
   */
  private buildSystemPrompt(): string {
    const tools = this.toolRegistry.getAvailableTools();
    const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');

    return `You are Awesome Agent, an advanced AI assistant with access to powerful tools.

Available Tools:
${toolDescriptions}

Guidelines:
- Use tools when needed to accomplish tasks
- Think step by step for complex problems
- Provide clear, helpful responses
- If a tool fails, try alternative approaches

Current Configuration:
- Model: ${this.config.model.provider}/${this.config.model.model}
- Thinking Level: ${this.config.thinkingLevel || 'medium'}
- Workspace: ${this.config.workspace}`;
  }

  /**
   * 执行工具调用
   * 集成 OpenClaw 的工具执行机制
   */
  private async executeTools(toolCalls: ToolCall[], runId: string): Promise<Array<{ callId: string; name: string; result: unknown; error?: string }>> {
    const results: Array<{ callId: string; name: string; result: unknown; error?: string }> = [];

    for (const call of toolCalls) {
      try {
        // 发出工具开始事件
        this.emit('tool', {
          type: 'tool',
          runId,
          data: { phase: 'start', name: call.name, callId: call.id },
        });

        // 执行工具
        const tool = this.toolRegistry.get(call.name);
        if (!tool) {
          throw new Error(`Tool not found: ${call.name}`);
        }

        const result = await tool.execute(call.id, call.arguments);

        // 发出工具完成事件
        this.emit('tool', {
          type: 'tool',
          runId,
          data: { phase: 'end', name: call.name, callId: call.id, result },
        });

        results.push({ callId: call.id, name: call.name, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.emit('tool', {
          type: 'tool',
          runId,
          data: {
            phase: 'error',
            name: call.name,
            callId: call.id,
            error: errorMessage,
          },
        });

        results.push({ callId: call.id, name: call.name, result: null, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * 取消运行
   */
  cancel(runId: string): boolean {
    const run = this.activeRuns.get(runId);
    if (run && run.status === 'running') {
      run.status = 'cancelled';
      run.endedAt = Date.now();
      this.activeRuns.delete(runId);
      return true;
    }
    return false;
  }

  /**
   * 获取运行状态
   */
  getRun(runId: string): AgentRun | undefined {
    return this.activeRuns.get(runId);
  }

  /**
   * 事件系统
   */
  on(event: string, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}
