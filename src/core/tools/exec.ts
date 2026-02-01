/**
 * Execution Tool - 命令执行工具
 * 
 * 支持执行系统命令（类似 OpenClaw 的 bash 工具）
 * 包含安全限制和沙箱支持
 */

import { BaseTool } from './base.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExecToolConfig {
  timeout?: number;
  maxOutputBytes?: number;
  allowedCommands?: string[];
  blockedCommands?: string[];
  sandbox?: boolean;
}

export class ExecTool extends BaseTool {
  name = 'exec';
  description = 'Execute shell commands (use with caution)';
  parameters = {
    command: {
      type: 'string',
      description: 'Shell command to execute',
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds',
    },
    cwd: {
      type: 'string',
      description: 'Working directory',
    },
  };

  private config: ExecToolConfig;

  constructor(config: ExecToolConfig = {}) {
    super();
    this.config = {
      timeout: config.timeout ?? 30000,
      maxOutputBytes: config.maxOutputBytes ?? 1000000,
      allowedCommands: config.allowedCommands,
      blockedCommands: config.blockedCommands ?? ['rm -rf', 'format', 'del /f'],
      sandbox: config.sandbox ?? false,
    };
  }

  async execute(callId: string, args: Record<string, unknown>): Promise<unknown> {
    this.validateArgs(args);

    const command = args.command as string;
    const timeout = (args.timeout as number) || this.config.timeout || 30000;
    const cwd = (args.cwd as string) || process.cwd();

    // 安全检查
    this.validateCommand(command);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd,
        maxBuffer: this.config.maxOutputBytes,
      });

      // 限制输出大小
      const truncatedStdout = this.truncateOutput(stdout);
      const truncatedStderr = this.truncateOutput(stderr);

      return {
        success: true,
        command,
        stdout: truncatedStdout,
        stderr: truncatedStderr,
        exitCode: 0,
      };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; code?: number };
      
      return {
        success: false,
        command,
        stdout: this.truncateOutput(execError.stdout || ''),
        stderr: this.truncateOutput(execError.stderr || ''),
        exitCode: execError.code || 1,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 验证命令安全性
   */
  private validateCommand(command: string): void {
    // 检查阻止的命令
    if (this.config.blockedCommands) {
      for (const blocked of this.config.blockedCommands) {
        if (command.includes(blocked)) {
          throw new Error(`Blocked command pattern: ${blocked}`);
        }
      }
    }

    // 检查允许的命令（如果设置了白名单）
    if (this.config.allowedCommands && this.config.allowedCommands.length > 0) {
      const allowed = this.config.allowedCommands.some((pattern) =>
        command.includes(pattern)
      );
      if (!allowed) {
        throw new Error('Command not in allowlist');
      }
    }
  }

  /**
   * 截断输出
   */
  private truncateOutput(output: string): string {
    const maxBytes = this.config.maxOutputBytes || 1000000;
    if (output.length > maxBytes) {
      return output.substring(0, maxBytes) + '\n... (truncated)';
    }
    return output;
  }
}
