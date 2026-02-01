/**
 * Basic Example - 基础示例
 * 
 * 展示如何使用 Awesome Agent
 */

import { AwesomeAgent } from '../src/core/agent.js';
import { ToolRegistry } from '../src/core/tools/registry.js';
import { BrowserTool } from '../src/core/tools/browser.js';
import { FileSystemTool } from '../src/core/tools/filesystem.js';
import { ExecTool } from '../src/core/tools/exec.js';
import type { AgentConfig } from '../src/types/index.js';

async function main() {
  // 1. 配置 Agent
  const config: AgentConfig = {
    model: {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
    },
    workspace: './workspace',
    thinkingLevel: 'medium',
    maxConcurrent: 4,
  };

  // 2. 创建 Agent
  const agent = new AwesomeAgent(config);

  // 3. 注册工具
  const toolRegistry = agent['toolRegistry'] as ToolRegistry;
  toolRegistry.register(new BrowserTool());
  toolRegistry.register(new FileSystemTool(config.workspace));
  toolRegistry.register(new ExecTool());

  // 4. 监听事件
  agent.on('lifecycle', (event) => {
    console.log('Lifecycle:', event);
  });

  agent.on('assistant', (event) => {
    process.stdout.write(event.data.delta as string);
  });

  agent.on('tool', (event) => {
    console.log('\nTool:', event.data.name, event.data.phase);
  });

  // 5. 运行 Agent
  console.log('Running agent...\n');
  const run = await agent.run({
    sessionId: 'example',
    message: '打开 GitHub，搜索 "awesome agent"，截图第一页结果',
  });

  console.log('\n\n✅ Run completed:', run.status);
}

main().catch(console.error);
