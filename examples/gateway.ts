/**
 * Gateway Example - Gateway 示例
 * 
 * 展示如何启动 Gateway 服务器
 */

import { AwesomeAgent } from '../src/core/agent.js';
import { GatewayServer } from '../src/gateway/server.js';
import { ToolRegistry } from '../src/core/tools/registry.js';
import { BrowserTool } from '../src/core/tools/browser.js';
import { FileSystemTool } from '../src/core/tools/filesystem.js';
import { ExecTool } from '../src/core/tools/exec.js';
import type { AgentConfig, GatewayConfig } from '../src/types/index.js';

async function main() {
  // 1. 配置 Agent
  const agentConfig: AgentConfig = {
    model: {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
    },
    workspace: './workspace',
  };

  // 2. 创建 Agent
  const agent = new AwesomeAgent(agentConfig);

  // 3. 注册工具
  const toolRegistry = agent['toolRegistry'] as ToolRegistry;
  toolRegistry.register(new BrowserTool());
  toolRegistry.register(new FileSystemTool(agentConfig.workspace));
  toolRegistry.register(new ExecTool());

  // 4. 配置 Gateway
  const gatewayConfig: GatewayConfig = {
    port: 18789,
    host: '127.0.0.1',
    auth: {
      mode: 'token',
      token: process.env.GATEWAY_TOKEN || 'demo-token',
    },
  };

  // 5. 启动 Gateway
  const gateway = new GatewayServer(agent, gatewayConfig);
  await gateway.start();

  console.log('🚀 Gateway is running!');
  console.log(`WebSocket: ws://${gatewayConfig.host}:${gatewayConfig.port}`);
  console.log(`Health: http://${gatewayConfig.host}:${gatewayConfig.port}/health`);

  // 保持运行
  process.on('SIGINT', async () => {
    console.log('\nStopping Gateway...');
    await gateway.stop();
    process.exit(0);
  });
}

main().catch(console.error);
