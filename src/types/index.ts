/**
 * Awesome Agent - Core Types
 * 
 * 集成 OpenClaw、LangChain、AutoGPT、CrewAI 等框架的最佳实践
 */

export interface AgentConfig {
  model: ModelConfig;
  workspace: string;
  tools?: ToolConfig[];
  maxConcurrent?: number;
  timeoutSeconds?: number;
  thinkingLevel?: ThinkingLevel;
  verboseLevel?: VerboseLevel;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type VerboseLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high';

export interface ToolConfig {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  enabled?: boolean;
  allowlist?: string[];
  denylist?: string[];
}

export interface Session {
  id: string;
  key: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface AgentEvent {
  type: 'lifecycle' | 'assistant' | 'tool' | 'error';
  runId: string;
  data: unknown;
  timestamp: number;
}

export interface AgentRun {
  id: string;
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  startedAt?: number;
  endedAt?: number;
  error?: string;
}

export interface GatewayConfig {
  port: number;
  host: string;
  auth?: {
    mode: 'token' | 'password' | 'none';
    token?: string;
    password?: string;
  };
}
