/**
 * Session Manager - 会话管理器
 * 
 * 集成 OpenClaw 的会话管理机制
 * 支持会话隔离、持久化、生命周期管理
 */

import type { Session, Message } from '../../types/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

export class SessionManager {
  private workspaceRoot: string;
  private sessionsDir: string;
  private sessions: Map<string, Session> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.sessionsDir = join(workspaceRoot, 'sessions');
    this.ensureSessionsDir();
  }

  /**
   * 确保会话目录存在
   */
  private async ensureSessionsDir(): Promise<void> {
    if (!existsSync(this.sessionsDir)) {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * 获取或创建会话
   */
  async getOrCreate(sessionId: string): Promise<Session> {
    // 检查内存缓存
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // 尝试从磁盘加载
    const sessionPath = this.getSessionPath(sessionId);
    if (existsSync(sessionPath)) {
      const session = await this.loadSession(sessionId);
      this.sessions.set(sessionId, session);
      return session;
    }

    // 创建新会话
    const session: Session = {
      id: sessionId,
      key: sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    this.sessions.set(sessionId, session);
    await this.save(session);

    return session;
  }

  /**
   * 保存会话
   */
  async save(session: Session): Promise<void> {
    session.updatedAt = Date.now();
    this.sessions.set(session.id, session);

    const sessionPath = this.getSessionPath(session.id);
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
  }

  /**
   * 加载会话
   */
  private async loadSession(sessionId: string): Promise<Session> {
    const sessionPath = this.getSessionPath(sessionId);
    const content = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(content) as Session;
  }

  /**
   * 获取会话路径
   */
  private getSessionPath(sessionId: string): string {
    return join(this.sessionsDir, `${sessionId}.json`);
  }

  /**
   * 删除会话
   */
  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    const sessionPath = this.getSessionPath(sessionId);
    if (existsSync(sessionPath)) {
      await fs.unlink(sessionPath);
    }
  }

  /**
   * 列出所有会话
   */
  async list(): Promise<Session[]> {
    const files = await fs.readdir(this.sessionsDir);
    const sessions: Session[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionId = file.replace('.json', '');
        try {
          const session = await this.loadSession(sessionId);
          sessions.push(session);
        } catch (error) {
          // 忽略损坏的会话文件
          console.warn(`Failed to load session ${sessionId}:`, error);
        }
      }
    }

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
