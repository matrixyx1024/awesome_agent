/**
 * Tool Base Interface
 * 
 * 所有工具的基础接口
 */

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  
  execute(callId: string, args: Record<string, unknown>): Promise<unknown>;
}

export abstract class BaseTool implements AgentTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, unknown>;

  abstract execute(callId: string, args: Record<string, unknown>): Promise<unknown>;

  /**
   * 验证参数
   */
  protected validateArgs(args: Record<string, unknown>): void {
    // 基础验证逻辑
    for (const [key, schema] of Object.entries(this.parameters)) {
      if (!(key in args)) {
        throw new Error(`Missing required parameter: ${key}`);
      }
    }
  }
}
