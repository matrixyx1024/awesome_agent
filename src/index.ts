/**
 * Awesome Agent - Main Entry Point
 * 
 * 集成最前沿的 Agent 技术方案
 */

export { AwesomeAgent } from './core/agent.js';
export { ToolRegistry } from './core/tools/registry.js';
export { BaseTool } from './core/tools/base.js';
export { BrowserTool } from './core/tools/browser.js';
export { FileSystemTool } from './core/tools/filesystem.js';
export { ExecTool } from './core/tools/exec.js';
export { ModelProvider } from './core/models/provider.js';
export { SessionManager } from './core/session/manager.js';
export { GatewayServer } from './gateway/server.js';

export type {
  AgentConfig,
  ModelConfig,
  Session,
  Message,
  ToolCall,
  ToolResult,
  AgentEvent,
  AgentRun,
  GatewayConfig,
} from './types/index.js';
