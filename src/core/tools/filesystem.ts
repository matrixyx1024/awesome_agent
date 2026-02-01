/**
 * File System Tool - 文件系统工具
 * 
 * 支持文件读写、编辑、列表等操作
 */

import { BaseTool } from './base.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class FileSystemTool extends BaseTool {
  name = 'filesystem';
  description = 'Read, write, edit, and list files in the workspace';
  parameters = {
    action: {
      type: 'string',
      enum: ['read', 'write', 'list', 'delete'],
      description: 'The file system action',
    },
    path: {
      type: 'string',
      description: 'File or directory path',
    },
    content: {
      type: 'string',
      description: 'Content to write (for write action)',
    },
    recursive: {
      type: 'boolean',
      description: 'List recursively (for list action)',
    },
  };

  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    super();
    this.workspaceRoot = workspaceRoot;
  }

  async execute(callId: string, args: Record<string, unknown>): Promise<unknown> {
    this.validateArgs(args);

    const action = args.action as string;
    const path = args.path as string;

    // 安全检查：防止路径遍历
    const safePath = this.resolveSafePath(path);

    try {
      switch (action) {
        case 'read':
          const content = await fs.readFile(safePath, 'utf-8');
          return {
            success: true,
            path,
            content,
            size: content.length,
          };

        case 'write':
          if (!args.content) throw new Error('Content required for write');
          await fs.mkdir(resolve(safePath, '..'), { recursive: true });
          await fs.writeFile(safePath, args.content as string, 'utf-8');
          return {
            success: true,
            path,
            message: 'File written successfully',
          };

        case 'list':
          const entries = await fs.readdir(safePath, { withFileTypes: true });
          const items = await Promise.all(
            entries.map(async (entry) => {
              const fullPath = join(safePath, entry.name);
              const stat = await fs.stat(fullPath);
              return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stat.size,
                modified: stat.mtime.getTime(),
              };
            })
          );
          return {
            success: true,
            path,
            items,
          };

        case 'delete':
          await fs.unlink(safePath);
          return {
            success: true,
            path,
            message: 'File deleted successfully',
          };

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`File system error: ${message}`);
    }
  }

  /**
   * 解析安全路径（防止路径遍历攻击）
   */
  private resolveSafePath(inputPath: string): string {
    const resolved = resolve(this.workspaceRoot, inputPath);
    const workspaceResolved = resolve(this.workspaceRoot);

    if (!resolved.startsWith(workspaceResolved)) {
      throw new Error('Path traversal detected');
    }

    return resolved;
  }
}
