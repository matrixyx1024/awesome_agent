# 🚀 Awesome Agent

**一个集成最前沿技术的 AI Agent 框架**

综合参考 OpenClaw、LangChain、AutoGPT、CrewAI 等框架的最佳实践，实现了一个功能完整、生产就绪的 AI Agent 系统。

---

## ✨ 核心特性

### 🎯 集成最前沿技术

- **OpenClaw 架构**: Gateway 控制平面、会话管理、工具系统
- **LangChain 工具链**: 丰富的工具集成、记忆系统
- **AutoGPT 自主规划**: 任务分解、循环执行
- **CrewAI 多 Agent**: 支持多 Agent 协作（规划中）

### 🔧 核心能力

- ✅ **多模型支持**: OpenAI、Anthropic Claude、Qwen 等
- ✅ **工具系统**: 浏览器控制、文件操作、命令执行
- ✅ **会话管理**: 完善的会话隔离和状态持久化
- ✅ **流式输出**: 实时反馈和工具进度
- ✅ **Gateway 架构**: WebSocket 统一控制平面
- ✅ **安全控制**: 工具权限、沙箱隔离

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│         Gateway Server              │
│    (WebSocket + HTTP API)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Awesome Agent                │
│  ┌──────────┐  ┌──────────┐        │
│  │ Agent    │  │ Session  │        │
│  │ Loop     │  │ Manager  │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │ Model    │  │ Tool     │        │
│  │ Provider │  │ Registry │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Tools                        │
│  Browser │ Filesystem │ Exec        │
└─────────────────────────────────────┘
```

---

## 🚀 快速开始

### 安装

```bash
npm install
npm run build
```

### 配置

创建 `awesome-agent.config.json`:

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "sk-..."
  },
  "workspace": "./workspace",
  "thinkingLevel": "medium",
  "maxConcurrent": 4
}
```

### 使用 CLI

```bash
# 运行 Agent
npm run start agent -- --message "打开 GitHub 并截图"

# 启动 Gateway
npm run start gateway -- --port 18789 --token your-token
```

### 使用 API

```typescript
import { AwesomeAgent } from 'awesome-agent';

const agent = new AwesomeAgent({
  model: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  workspace: './workspace',
});

// 运行 Agent
const run = await agent.run({
  sessionId: 'main',
  message: '你好，介绍一下自己',
});

// 监听事件
agent.on('assistant', (event) => {
  console.log(event.data.delta);
});
```

---

## 🛠️ 工具系统

### 内置工具

**1. Browser Tool（浏览器控制）**
```typescript
// 打开网页
await agent.run({
  sessionId: 'main',
  message: '打开 https://github.com',
});

// 截图
await agent.run({
  sessionId: 'main',
  message: '截图当前页面',
});
```

**2. FileSystem Tool（文件操作）**
```typescript
// 读取文件
await agent.run({
  sessionId: 'main',
  message: '读取 README.md 文件',
});

// 写入文件
await agent.run({
  sessionId: 'main',
  message: '创建一个 hello.txt 文件，内容为 "Hello World"',
});
```

**3. Exec Tool（命令执行）**
```typescript
// 执行命令
await agent.run({
  sessionId: 'main',
  message: '运行 ls -la 命令',
});
```

### 自定义工具

```typescript
import { BaseTool } from 'awesome-agent';

class MyCustomTool extends BaseTool {
  name = 'my_tool';
  description = 'My custom tool';
  parameters = {
    input: { type: 'string' },
  };

  async execute(callId: string, args: Record<string, unknown>) {
    // 实现工具逻辑
    return { result: 'success' };
  }
}

// 注册工具
toolRegistry.register(new MyCustomTool());
```

---

## 🌐 Gateway API

### WebSocket 协议

**连接:**
```javascript
const ws = new WebSocket('ws://localhost:18789');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'req',
    id: '1',
    method: 'connect',
    params: {
      auth: { token: 'your-token' }
    }
  }));
};
```

**运行 Agent:**
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

**监听事件:**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'event') {
    if (message.event === 'agent') {
      // 处理 Agent 事件
      console.log(message.payload);
    }
  }
};
```

---

## 📊 模型支持

### OpenAI

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "sk-..."
  }
}
```

### Anthropic Claude

```json
{
  "model": {
    "provider": "anthropic",
    "model": "claude-opus-4-5",
    "apiKey": "sk-ant-..."
  }
}
```

### Qwen（通义千问）

```json
{
  "model": {
    "provider": "qwen",
    "model": "qwen-max",
    "apiKey": "sk-...",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
}
```

---

## 🔒 安全特性

### 工具权限控制

```json
{
  "tools": [
    {
      "name": "exec",
      "enabled": true,
      "allowlist": ["ls", "cat", "grep"],
      "denylist": ["rm -rf", "format"]
    }
  ]
}
```

### 沙箱隔离（规划中）

```json
{
  "sandbox": {
    "enabled": true,
    "mode": "docker",
    "workspace": "./sandbox-workspace"
  }
}
```

---

## 📚 架构亮点

### 1. Agent Loop（参考 OpenClaw）

- **串行执行**: 每个会话串行执行，避免冲突
- **工具调用**: 自动工具调用和结果处理
- **循环迭代**: 支持多轮工具调用
- **超时控制**: 防止无限循环

### 2. 会话管理（参考 OpenClaw）

- **会话隔离**: 每个会话独立状态
- **持久化**: JSON 格式存储会话历史
- **生命周期**: 自动清理过期会话

### 3. 工具系统（参考 OpenClaw + LangChain）

- **工具注册**: 灵活的工具注册机制
- **权限控制**: 白名单/黑名单
- **执行管理**: 统一的工具执行接口

### 4. 多模型支持（参考 LangChain）

- **统一接口**: 不同模型使用相同接口
- **自动切换**: 支持模型切换和回退
- **工具兼容**: 适配不同模型的工具调用格式

---

## 🎯 与 OpenClaw 的对比

| 特性 | Awesome Agent | OpenClaw |
|------|---------------|----------|
| **Gateway 架构** | ✅ | ✅ |
| **多模型支持** | ✅ | ✅ |
| **浏览器控制** | ✅ | ✅ |
| **会话管理** | ✅ | ✅ |
| **流式输出** | ✅ | ✅ |
| **多渠道集成** | 🔄 规划中 | ✅ |
| **沙箱隔离** | 🔄 规划中 | ✅ |
| **节点系统** | ❌ | ✅ |

---

## 🚧 路线图

### v0.1.0（当前）
- ✅ 核心 Agent Loop
- ✅ 工具系统
- ✅ 多模型支持
- ✅ Gateway 服务器
- ✅ 会话管理

### v0.2.0（规划中）
- 🔄 多 Agent 协作（CrewAI 风格）
- 🔄 记忆系统（LangChain 风格）
- 🔄 任务规划（AutoGPT 风格）
- 🔄 沙箱隔离
- 🔄 更多工具集成

### v0.3.0（规划中）
- 🔄 多渠道集成（WhatsApp、Telegram 等）
- 🔄 Web UI 控制面板
- 🔄 插件系统
- 🔄 性能优化

---

## 📖 文档

- **架构设计**: `docs/architecture.md`
- **API 文档**: `docs/api.md`
- **工具开发**: `docs/tools.md`
- **示例代码**: `examples/`

---

## 🤝 贡献

欢迎贡献！请查看 `CONTRIBUTING.md` 了解贡献指南。

---

## 📄 许可证

MIT License

---

## 🙏 致谢

本项目参考了以下优秀框架的设计和实现：

- **OpenClaw**: Gateway 架构、会话管理、工具系统
- **LangChain**: 工具链设计、记忆系统
- **AutoGPT**: 自主规划、任务分解
- **CrewAI**: 多 Agent 协作理念

---

## 🎉 开始使用

```bash
# 克隆仓库
git clone <repo-url>
cd awesome-agent

# 安装依赖
npm install

# 构建
npm run build

# 运行示例
npm run start agent -- --message "你好"
```

**祝你使用愉快！** 🚀
