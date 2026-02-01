/**
 * Tool Registry - 工具注册表
 * 
 * 集成 OpenClaw 的工具系统设计
 * 支持工具发现、权限控制、执行管理
 */

import type { ToolConfig } from '../../types/index.js';
import type { AgentTool } from './base.js';

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();
  private configs: Map<string, ToolConfig> = new Map();

  constructor(configs: ToolConfig[] = []) {
    for (const config of configs) {
      this.configs.set(config.name, config);
    }
  }

  /**
   * 注册工具
   */
  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 获取工具
   */
  get(name: string): AgentTool | undefined {
    const tool = this.tools.get(name);
    if (!tool) return undefined;

    // 检查工具是否启用
    const config = this.configs.get(name);
    if (config?.enabled === false) {
      return undefined;
    }

    return tool;
  }

  /**
   * 获取所有可用工具
   */
  getAvailableTools(): Array<{ name: string; description: string; parameters: unknown }> {
    const available: Array<{ name: string; description: string; parameters: unknown }> = [];

    for (const [name, tool] of this.tools) {
      const config = this.configs.get(name);
      if (config?.enabled === false) continue;

      available.push({
        name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }

    return available;
  }

  /**
   * 检查工具权限
   */
  checkPermission(toolName: string, context?: Record<string, unknown>): boolean {
    const config = this.configs.get(toolName);
    if (!config) return true;

    // 检查 allowlist
    if (config.allowlist && config.allowlist.length > 0) {
      // 实现权限检查逻辑
      return true; // 简化实现
    }

    // 检查 denylist
    if (config.denylist && config.denylist.includes(toolName)) {
      return false;
    }

    return true;
  }
}
