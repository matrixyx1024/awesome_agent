/**
 * Gateway Server - WebSocket Gateway
 * 
 * 参考 OpenClaw 的 Gateway 架构
 * 提供统一的控制平面
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import type { AgentConfig, GatewayConfig } from '../types/index.js';
import { AwesomeAgent } from '../core/agent.js';
import type { IncomingMessage } from 'http';

export interface GatewayRequest {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface GatewayResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
}

export interface GatewayEvent {
  type: 'event';
  event: string;
  payload: unknown;
}

export class GatewayServer {
  private agent: AwesomeAgent;
  private config: GatewayConfig;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(agent: AwesomeAgent, config: GatewayConfig) {
    this.agent = agent;
    this.config = config;
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.setupWebSocket();
    this.setupHttp();
  }

  /**
   * 启动 Gateway
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`Gateway started on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * 停止 Gateway
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('Gateway stopped');
          resolve();
        });
      });
    });
  }

  /**
   * 设置 WebSocket
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // 认证检查
      if (!this.authenticate(req)) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      this.clients.add(ws);
      console.log(`Client connected (${this.clients.size} total)`);

      // 发送欢迎消息
      this.send(ws, {
        type: 'event',
        event: 'connected',
        payload: { message: 'Welcome to Awesome Agent Gateway' },
      });

      // 处理消息
      ws.on('message', async (data: Buffer) => {
        try {
          const request = JSON.parse(data.toString()) as GatewayRequest;
          await this.handleRequest(ws, request);
        } catch (error) {
          this.sendError(ws, 'invalid_request', 'Invalid request format');
        }
      });

      // 清理
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected (${this.clients.size} total)`);
      });

      // 订阅 Agent 事件
      this.agent.on('lifecycle', (event) => {
        this.send(ws, { type: 'event', event: 'agent', payload: event });
      });

      this.agent.on('assistant', (event) => {
        this.send(ws, { type: 'event', event: 'agent', payload: event });
      });

      this.agent.on('tool', (event) => {
        this.send(ws, { type: 'event', event: 'agent', payload: event });
      });
    });
  }

  /**
   * 设置 HTTP 端点
   */
  private setupHttp(): void {
    // 健康检查
    this.server.on('request', (req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', clients: this.clients.size }));
        return;
      }

      // 404
      res.writeHead(404);
      res.end('Not Found');
    });
  }

  /**
   * 处理请求
   */
  private async handleRequest(ws: WebSocket, request: GatewayRequest): Promise<void> {
    try {
      let payload: unknown;

      switch (request.method) {
        case 'connect':
          payload = { message: 'Connected successfully' };
          break;

        case 'agent':
          const run = await this.agent.run({
            sessionId: (request.params.sessionId as string) || 'main',
            message: request.params.message as string,
            runId: request.params.runId as string,
          });
          payload = { runId: run.id, status: run.status };
          break;

        case 'health':
          payload = {
            status: 'ok',
            clients: this.clients.size,
            agent: 'ready',
          };
          break;

        case 'status':
          payload = {
            activeRuns: Array.from(this.agent['activeRuns'].keys()),
            sessions: (await this.agent['sessionManager'].list()).length,
          };
          break;

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      this.sendResponse(ws, request.id, true, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.sendResponse(ws, request.id, false, undefined, {
        code: 'INTERNAL_ERROR',
        message,
      });
    }
  }

  /**
   * 认证检查
   */
  private authenticate(req: IncomingMessage): boolean {
    if (!this.config.auth || this.config.auth.mode === 'none') {
      return true;
    }

    if (this.config.auth.mode === 'token') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      return token === this.config.auth.token;
    }

    // 其他认证方式...
    return false;
  }

  /**
   * 发送响应
   */
  private sendResponse(
    ws: WebSocket,
    id: string,
    ok: boolean,
    payload?: unknown,
    error?: { code: string; message: string }
  ): void {
    const response: GatewayResponse = {
      type: 'res',
      id,
      ok,
      payload,
      error,
    };
    this.send(ws, response);
  }

  /**
   * 发送错误
   */
  private sendError(ws: WebSocket, code: string, message: string): void {
    ws.send(
      JSON.stringify({
        type: 'res',
        id: 'error',
        ok: false,
        error: { code, message },
      })
    );
  }

  /**
   * 发送消息
   */
  private send(ws: WebSocket, message: GatewayEvent | GatewayResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 广播事件
   */
  broadcast(event: GatewayEvent): void {
    for (const client of this.clients) {
      this.send(client, event);
    }
  }
}
