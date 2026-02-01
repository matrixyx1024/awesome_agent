# 📚 Awesome Agent API 文档

完整的 API 参考文档。

---

## Core API

### AwesomeAgent

主要的 Agent 类。

```typescript
import { AwesomeAgent } from 'awesome-agent';

const agent = new AwesomeAgent(config: AgentConfig);
```

#### Methods

**run(params)**
运行一个 Agent 循环。

```typescript
const run = await agent.run({
  sessionId: string;
  message: string;
  runId?: string;
});
```

**cancel(runId)**
取消正在运行的 Agent。

```typescript
const cancelled = agent.cancel(runId: string): boolean;
```

**getRun(runId)**
获取运行状态。

```typescript
const run = agent.getRun(runId: string): AgentRun | undefined;
```

#### Events

```typescript
agent.on('lifecycle', (event) => { ... });
agent.on('assistant', (event) => { ... });
agent.on('tool', (event) => { ... });
```

---

## Tool API

### ToolRegistry

工具注册表。

```typescript
import { ToolRegistry } from 'awesome-agent';

const registry = new ToolRegistry(configs?: ToolConfig[]);
```

#### Methods

**register(tool)**
注册工具。

```typescript
registry.register(tool: AgentTool): void;
```

**get(name)**
获取工具。

```typescript
const tool = registry.get(name: string): AgentTool | undefined;
```

**getAvailableTools()**
获取所有可用工具。

```typescript
const tools = registry.getAvailableTools(): Array<{...}>;
```

---

## Model API

### ModelProvider

模型提供商。

```typescript
import { ModelProvider } from 'awesome-agent';

const provider = new ModelProvider(config: ModelConfig);
```

#### Methods

**generate(options)**
生成回复。

```typescript
const result = await provider.generate({
  messages: Array<{ role: string; content: string }>;
  thinkingLevel?: ThinkingLevel;
  tools?: Array<{...}>;
});
```

---

## Gateway API

### GatewayServer

Gateway 服务器。

```typescript
import { GatewayServer } from 'awesome-agent';

const gateway = new GatewayServer(agent, config);
```

#### Methods

**start()**
启动 Gateway。

```typescript
await gateway.start(): Promise<void>;
```

**stop()**
停止 Gateway。

```typescript
await gateway.stop(): Promise<void>;
```

**broadcast(event)**
广播事件。

```typescript
gateway.broadcast(event: GatewayEvent): void;
```

---

## Session API

### SessionManager

会话管理器。

```typescript
import { SessionManager } from 'awesome-agent';

const manager = new SessionManager(workspaceRoot: string);
```

#### Methods

**getOrCreate(sessionId)**
获取或创建会话。

```typescript
const session = await manager.getOrCreate(sessionId: string): Promise<Session>;
```

**save(session)**
保存会话。

```typescript
await manager.save(session: Session): Promise<void>;
```

**delete(sessionId)**
删除会话。

```typescript
await manager.delete(sessionId: string): Promise<void>;
```

**list()**
列出所有会话。

```typescript
const sessions = await manager.list(): Promise<Session[]>;
```

---

## WebSocket API

### 连接

```javascript
const ws = new WebSocket('ws://localhost:18789');
```

### 认证

```javascript
ws.send(JSON.stringify({
  type: 'req',
  id: '1',
  method: 'connect',
  params: {
    auth: { token: 'your-token' }
  }
}));
```

### 运行 Agent

```javascript
ws.send(JSON.stringify({
  type: 'req',
  id: '2',
  method: 'agent',
  params: {
    sessionId: 'main',
    message: '你好',
  }
}));
```

### 监听事件

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'event') {
    console.log(message.event, message.payload);
  }
};
```

---

## HTTP API

### Health Check

```bash
GET /health
```

响应:
```json
{
  "status": "ok",
  "clients": 2
}
```

---

## 类型定义

### AgentConfig

```typescript
interface AgentConfig {
  model: ModelConfig;
  workspace: string;
  tools?: ToolConfig[];
  maxConcurrent?: number;
  timeoutSeconds?: number;
  thinkingLevel?: ThinkingLevel;
  verboseLevel?: VerboseLevel;
}
```

### ModelConfig

```typescript
interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}
```

### Session

```typescript
interface Session {
  id: string;
  key: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  metadata?: Record<string, unknown>;
}
```

---

**完整的类型定义请查看 `src/types/index.ts`**
