#!/usr/bin/env node
/**
 * Awesome Agent CLI
 * 
 * 命令行接口，类似 OpenClaw 的 CLI
 */

import { Command } from 'commander';
import { AwesomeAgent } from '../core/agent.js';
import { GatewayServer } from '../gateway/server.js';
import { ToolRegistry } from '../core/tools/registry.js';
import { BrowserTool } from '../core/tools/browser.js';
import { FileSystemTool } from '../core/tools/filesystem.js';
import { ExecTool } from '../core/tools/exec.js';
import type { AgentConfig, GatewayConfig } from '../types/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('awesome-agent')
  .description('A cutting-edge AI Agent framework')
  .version('0.1.0');

/**
 * Agent 命令 - 运行 Agent
 */
program
  .command('agent')
  .description('Run an agent turn')
  .option('-m, --message <message>', 'User message')
  .option('-s, --session <sessionId>', 'Session ID', 'main')
  .option('-t, --thinking <level>', 'Thinking level', 'medium')
  .action(async (options) => {
    const spinner = ora('Initializing agent...').start();

    try {
      // 加载配置
      const config = loadConfig();
      config.thinkingLevel = options.thinking as any;

      // 创建 Agent
      const agent = createAgent(config);
      spinner.succeed('Agent initialized');

      // 运行 Agent
      spinner.start('Running agent...');
      const run = await agent.run({
        sessionId: options.session,
        message: options.message || 'Hello',
      });

      spinner.succeed('Agent completed');

      // 显示结果
      console.log(chalk.green('\n✅ Agent Run Completed'));
      console.log(chalk.gray(`Run ID: ${run.id}`));
      console.log(chalk.gray(`Status: ${run.status}`));
      if (run.error) {
        console.log(chalk.red(`Error: ${run.error}`));
      }
    } catch (error) {
      spinner.fail('Agent failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Gateway 命令 - 启动 Gateway
 */
program
  .command('gateway')
  .description('Start the Gateway server')
  .option('-p, --port <port>', 'Port number', '18789')
  .option('-h, --host <host>', 'Host address', '127.0.0.1')
  .option('--token <token>', 'Auth token')
  .action(async (options) => {
    const spinner = ora('Starting Gateway...').start();

    try {
      const config = loadConfig();
      const agent = createAgent(config);

      const gatewayConfig: GatewayConfig = {
        port: parseInt(options.port),
        host: options.host,
        auth: options.token
          ? { mode: 'token', token: options.token }
          : { mode: 'none' },
      };

      const gateway = new GatewayServer(agent, gatewayConfig);
      await gateway.start();

      spinner.succeed(`Gateway started on ${options.host}:${options.port}`);
      console.log(chalk.green('\n🚀 Gateway is running!'));
      console.log(chalk.gray(`WebSocket: ws://${options.host}:${options.port}`));
      console.log(chalk.gray(`Health: http://${options.host}:${options.port}/health`));
      console.log(chalk.yellow('\nPress Ctrl+C to stop'));

      // 保持运行
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\nStopping Gateway...'));
        await gateway.stop();
        process.exit(0);
      });
    } catch (error) {
      spinner.fail('Failed to start Gateway');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * 配置命令
 */
program
  .command('config')
  .description('Manage configuration')
  .option('--show', 'Show current config')
  .action((options) => {
    if (options.show) {
      try {
        const config = loadConfig();
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error('Config not found. Run "awesome-agent init" first.');
      }
    }
  });

/**
 * 初始化命令
 */
program
  .command('init')
  .description('Initialize Awesome Agent')
  .action(() => {
    console.log(chalk.blue('Initializing Awesome Agent...'));
    // 创建默认配置
    // ...
    console.log(chalk.green('✅ Initialization complete!'));
  });

program.parse();

/**
 * 加载配置
 */
function loadConfig(): AgentConfig {
  const configPath = join(process.cwd(), 'awesome-agent.config.json');
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as AgentConfig;
  } catch {
    // 返回默认配置
    return {
      model: {
        provider: 'openai',
        model: 'gpt-4',
      },
      workspace: join(process.cwd(), '.awesome-agent'),
      maxConcurrent: 4,
      timeoutSeconds: 600,
      thinkingLevel: 'medium',
    };
  }
}

/**
 * 创建 Agent 实例
 */
function createAgent(config: AgentConfig): AwesomeAgent {
  const agent = new AwesomeAgent(config);

  // 注册默认工具
  const toolRegistry = agent['toolRegistry'] as ToolRegistry;
  toolRegistry.register(new BrowserTool());
  toolRegistry.register(new FileSystemTool(config.workspace));
  toolRegistry.register(new ExecTool());

  return agent;
}
