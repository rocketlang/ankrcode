/**
 * Browser Controller
 * Playwright-based browser automation for Computer Use
 */

import type {
  BrowserAction,
  BrowserConfig,
  PageState,
  ElementInfo,
} from './types.js';

// Playwright types (dynamic import)
type Browser = any;
type BrowserContext = any;
type Page = any;

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  viewport: { width: 1280, height: 720 },
  timeout: 30000,
  userAgent: 'AnkrCode/2.41 (Computer Use Agent)',
};

/**
 * Browser Controller - Manages browser instance and actions
 */
export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;
  private playwright: any = null;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize browser
   */
  async init(): Promise<void> {
    if (this.browser) return;

    try {
      // Dynamic import of playwright
      const pw = await import('playwright');
      this.playwright = pw;

      this.browser = await pw.chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
      });

      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
      });

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.config.timeout || 30000);
    } catch (err) {
      throw new Error(`Failed to initialize browser: ${(err as Error).message}. Run: npx playwright install chromium`);
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Execute a browser action
   */
  async execute(action: BrowserAction): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      switch (action.type) {
        case 'goto': {
          if (!action.url) {
            return { success: false, error: 'URL required for goto action' };
          }
          await this.page.goto(action.url, {
            waitUntil: 'domcontentloaded',
            timeout: action.timeout || this.config.timeout,
          });
          return { success: true };
        }

        case 'click': {
          if (!action.selector) {
            return { success: false, error: 'Selector required for click action' };
          }
          await this.page.click(action.selector, {
            timeout: action.timeout || 5000,
          });
          return { success: true };
        }

        case 'type': {
          if (!action.selector || action.value === undefined) {
            return { success: false, error: 'Selector and value required for type action' };
          }
          await this.page.fill(action.selector, action.value);
          return { success: true };
        }

        case 'press': {
          if (!action.key) {
            return { success: false, error: 'Key required for press action' };
          }
          if (action.selector) {
            await this.page.press(action.selector, action.key);
          } else {
            await this.page.keyboard.press(action.key);
          }
          return { success: true };
        }

        case 'hover': {
          if (!action.selector) {
            return { success: false, error: 'Selector required for hover action' };
          }
          await this.page.hover(action.selector);
          return { success: true };
        }

        case 'scroll': {
          const amount = action.amount || 300;
          const direction = action.direction || 'down';

          let deltaX = 0;
          let deltaY = 0;

          switch (direction) {
            case 'down':
              deltaY = amount;
              break;
            case 'up':
              deltaY = -amount;
              break;
            case 'right':
              deltaX = amount;
              break;
            case 'left':
              deltaX = -amount;
              break;
          }

          await this.page.mouse.wheel(deltaX, deltaY);
          return { success: true };
        }

        case 'select': {
          if (!action.selector || !action.value) {
            return { success: false, error: 'Selector and value required for select action' };
          }
          await this.page.selectOption(action.selector, action.value);
          return { success: true };
        }

        case 'wait': {
          const timeout = action.timeout || 1000;
          if (action.selector) {
            await this.page.waitForSelector(action.selector, { timeout });
          } else {
            await this.page.waitForTimeout(timeout);
          }
          return { success: true };
        }

        case 'screenshot': {
          const screenshot = await this.page.screenshot({
            type: 'png',
            fullPage: false,
          });
          return {
            success: true,
            data: { screenshot: screenshot.toString('base64') },
          };
        }

        case 'evaluate': {
          if (!action.script) {
            return { success: false, error: 'Script required for evaluate action' };
          }
          const result = await this.page.evaluate(action.script);
          return { success: true, data: { result } };
        }

        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    const buffer = await this.page.screenshot({ type: 'png', fullPage: false });
    return buffer.toString('base64');
  }

  /**
   * Get current page state
   */
  async getPageState(): Promise<PageState> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const url = this.page.url();
    const title = await this.page.title();

    // Get interactive elements (runs in browser context)
    const elements = await this.page.evaluate(`
      (() => {
        const interactiveSelectors = [
          'a[href]',
          'button',
          'input',
          'textarea',
          'select',
          '[role="button"]',
          '[role="link"]',
          '[onclick]',
          '[tabindex]',
        ];

        const allElements = [];
        const seen = new Set();

        for (const selector of interactiveSelectors) {
          const found = document.querySelectorAll(selector);
          found.forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);

            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 &&
              window.getComputedStyle(el).visibility !== 'hidden' &&
              window.getComputedStyle(el).display !== 'none';

            if (!isVisible) return;

            allElements.push({
              selector: getUniqueSelector(el),
              tagName: el.tagName.toLowerCase(),
              text: el.innerText?.slice(0, 100) || '',
              placeholder: el.placeholder || '',
              ariaLabel: el.getAttribute('aria-label') || '',
              role: el.getAttribute('role') || '',
              href: el.href || '',
              type: el.type || '',
              isVisible: true,
              isEnabled: !el.disabled,
              boundingBox: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              },
            });
          });
        }

        function getUniqueSelector(el) {
          if (el.id) return '#' + el.id;
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c).slice(0, 2).join('.');
            if (classes) {
              const withClass = el.tagName.toLowerCase() + '.' + classes;
              if (document.querySelectorAll(withClass).length === 1) {
                return withClass;
              }
            }
          }

          const path = [];
          let current = el;
          while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
              selector = '#' + current.id;
              path.unshift(selector);
              break;
            }
            const siblings = current.parentElement?.children;
            if (siblings && siblings.length > 1) {
              const index = Array.from(siblings).indexOf(current) + 1;
              selector += ':nth-child(' + index + ')';
            }
            path.unshift(selector);
            current = current.parentElement;
          }
          return path.join(' > ');
        }

        return allElements.slice(0, 50);
      })()
    `);

    // Get scroll position
    const scrollPosition = await this.page.evaluate(`
      ({ x: window.scrollX, y: window.scrollY })
    `);

    // Get viewport
    const viewport = this.page.viewportSize() || this.config.viewport;

    return {
      url,
      title,
      elements,
      scrollPosition,
      viewport: viewport!,
    };
  }

  /**
   * Get page HTML (for debugging)
   */
  async getHTML(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return await this.page.content();
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser !== null;
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page?.url() || '';
  }
}

// Singleton instance
let browserInstance: BrowserController | null = null;

export function getBrowserController(config?: Partial<BrowserConfig>): BrowserController {
  if (!browserInstance) {
    browserInstance = new BrowserController(config);
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
