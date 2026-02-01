/**
 * Browser Tool - 浏览器控制工具
 * 
 * 集成 OpenClaw 的浏览器控制机制
 * 使用 CDP + Playwright
 */

import { BaseTool } from './base.js';
import type { Browser as PlaywrightBrowser } from 'playwright';

export interface BrowserToolConfig {
  headless?: boolean;
  executablePath?: string;
}

export class BrowserTool extends BaseTool {
  name = 'browser';
  description = 'Control a web browser to navigate, click, type, and take screenshots';
  parameters = {
    action: {
      type: 'string',
      enum: ['open', 'navigate', 'click', 'type', 'screenshot', 'snapshot', 'close'],
      description: 'The browser action to perform',
    },
    url: {
      type: 'string',
      description: 'URL to open or navigate to',
    },
    selector: {
      type: 'string',
      description: 'CSS selector for click/type actions',
    },
    text: {
      type: 'string',
      description: 'Text to type',
    },
    fullPage: {
      type: 'boolean',
      description: 'Take full page screenshot',
    },
  };

  private browser: PlaywrightBrowser | null = null;
  private page: any = null;
  private config: BrowserToolConfig;

  constructor(config: BrowserToolConfig = {}) {
    super();
    this.config = config;
  }

  async execute(callId: string, args: Record<string, unknown>): Promise<unknown> {
    this.validateArgs(args);

    const action = args.action as string;

    try {
      // 延迟导入 Playwright（可选依赖）
      const { chromium } = await import('playwright');

      // 初始化浏览器（如果需要）
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: this.config.headless ?? false,
          executablePath: this.config.executablePath,
        });
      }

      // 获取或创建页面
      if (!this.page) {
        const context = await this.browser.newContext();
        this.page = await context.newPage();
      }

      switch (action) {
        case 'open':
        case 'navigate':
          if (!args.url) throw new Error('URL required for open/navigate');
          await this.page.goto(args.url as string);
          return { success: true, url: args.url };

        case 'click':
          if (!args.selector) throw new Error('Selector required for click');
          await this.page.click(args.selector as string);
          return { success: true, action: 'clicked', selector: args.selector };

        case 'type':
          if (!args.selector || !args.text) {
            throw new Error('Selector and text required for type');
          }
          await this.page.fill(args.selector as string, args.text as string);
          return { success: true, action: 'typed', selector: args.selector };

        case 'screenshot':
          const screenshot = await this.page.screenshot({
            fullPage: args.fullPage as boolean ?? false,
          });
          return {
            success: true,
            screenshot: screenshot.toString('base64'),
            format: 'png',
          };

        case 'snapshot':
          // 获取页面快照（DOM结构）
          const content = await this.page.content();
          const title = await this.page.title();
          return {
            success: true,
            title,
            content: content.substring(0, 10000), // 限制大小
          };

        case 'close':
          if (this.page) {
            await this.page.close();
            this.page = null;
          }
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
          }
          return { success: true, action: 'closed' };

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Browser tool error: ${message}`);
    }
  }
}
