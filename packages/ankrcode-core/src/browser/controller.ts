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
   * Dismiss cookie consent banners
   * Handles common cookie consent providers (OneTrust, CookieBot, GDPR banners, etc.)
   */
  async dismissCookieBanners(): Promise<{ dismissed: boolean; provider?: string }> {
    if (!this.page) {
      return { dismissed: false };
    }

    // Common cookie consent button selectors (accept/agree/dismiss)
    const cookieSelectors = [
      // OneTrust (NPR, many news sites)
      { selector: '#onetrust-accept-btn-handler', provider: 'OneTrust' },
      { selector: '.onetrust-close-btn-handler', provider: 'OneTrust' },
      { selector: '#accept-recommended-btn-handler', provider: 'OneTrust' },

      // CookieBot
      { selector: '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', provider: 'CookieBot' },
      { selector: '#CybotCookiebotDialogBodyButtonAccept', provider: 'CookieBot' },

      // Quantcast/GDPR
      { selector: '.qc-cmp2-summary-buttons button[mode="primary"]', provider: 'Quantcast' },
      { selector: '.qc-cmp-button', provider: 'Quantcast' },

      // TrustArc
      { selector: '.trustarc-agree-btn', provider: 'TrustArc' },
      { selector: '#truste-consent-button', provider: 'TrustArc' },

      // Generic GDPR/Cookie buttons (common patterns)
      { selector: '[data-testid="cookie-policy-dialog-accept-button"]', provider: 'Generic' },
      { selector: '[data-cookiebanner="accept_button"]', provider: 'Generic' },
      { selector: 'button[data-gdpr-consent="accept"]', provider: 'Generic' },
      { selector: '#cookie-consent-accept', provider: 'Generic' },
      { selector: '#accept-cookies', provider: 'Generic' },
      { selector: '#acceptAllCookies', provider: 'Generic' },
      { selector: '.cookie-accept', provider: 'Generic' },
      { selector: '.accept-cookies', provider: 'Generic' },
      { selector: '.cookies-accept', provider: 'Generic' },
      { selector: '[aria-label="Accept cookies"]', provider: 'Generic' },
      { selector: '[aria-label="Accept all cookies"]', provider: 'Generic' },
      { selector: 'button:has-text("Accept")', provider: 'Generic' },
      { selector: 'button:has-text("Accept all")', provider: 'Generic' },
      { selector: 'button:has-text("Accept All")', provider: 'Generic' },
      { selector: 'button:has-text("Accept cookies")', provider: 'Generic' },
      { selector: 'button:has-text("Allow all")', provider: 'Generic' },
      { selector: 'button:has-text("Allow All")', provider: 'Generic' },
      { selector: 'button:has-text("I agree")', provider: 'Generic' },
      { selector: 'button:has-text("Agree")', provider: 'Generic' },
      { selector: 'button:has-text("Got it")', provider: 'Generic' },
      { selector: 'button:has-text("OK")', provider: 'Generic' },

      // Close buttons on cookie dialogs
      { selector: '.cookie-banner button.close', provider: 'Generic' },
      { selector: '.cookie-notice button.close', provider: 'Generic' },
      { selector: '.gdpr-banner button.close', provider: 'Generic' },
    ];

    try {
      // Wait a moment for banners to appear
      await this.page.waitForTimeout(500);

      for (const { selector, provider } of cookieSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              await element.click({ timeout: 2000 });
              // Wait for banner to disappear
              await this.page.waitForTimeout(500);
              return { dismissed: true, provider };
            }
          }
        } catch {
          // Selector not found or click failed, try next
          continue;
        }
      }

      // Try to find and remove overlay elements directly
      await this.page.evaluate(`
        (() => {
          const overlaySelectors = [
            '#onetrust-consent-sdk',
            '.onetrust-pc-dark-filter',
            '#cookie-banner',
            '.cookie-banner',
            '.cookie-consent',
            '.gdpr-banner',
            '.consent-banner',
            '[class*="cookie-modal"]',
            '[class*="cookie-overlay"]',
            '[class*="consent-modal"]',
            '[id*="cookie-banner"]',
            '[id*="gdpr"]',
          ];

          for (const selector of overlaySelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
                el.remove();
              }
            });
          }

          // Remove any fixed/sticky overlays that might be blocking
          document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]').forEach(el => {
            if (el instanceof HTMLElement) {
              const text = el.innerText?.toLowerCase() || '';
              if (text.includes('cookie') || text.includes('consent') || text.includes('gdpr') || text.includes('privacy')) {
                el.style.display = 'none';
              }
            }
          });
        })()
      `);

      return { dismissed: false };
    } catch {
      return { dismissed: false };
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
          // Auto-dismiss cookie banners after navigation
          await this.dismissCookieBanners();
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

        function isValidCssId(id) {
          // CSS identifiers cannot start with a digit, two hyphens, or hyphen followed by digit
          // Also reject IDs with colons (React-style) as they need escaping
          if (!id) return false;
          if (/^[0-9]/.test(id)) return false;  // starts with digit
          if (/^--/.test(id)) return false;     // starts with --
          if (/^-[0-9]/.test(id)) return false; // starts with -digit
          if (/:/.test(id)) return false;       // contains colon (React IDs)
          return true;
        }

        function getUniqueSelector(el) {
          // Only use ID if it's a valid CSS identifier
          if (el.id && isValidCssId(el.id)) return '#' + el.id;

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
            // Only use ID if it's valid CSS
            if (current.id && isValidCssId(current.id)) {
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

        // Prioritize inputs by putting them first, then other elements
        const inputs = allElements.filter(el => el.tagName === 'input' || el.tagName === 'textarea');
        const others = allElements.filter(el => el.tagName !== 'input' && el.tagName !== 'textarea');
        return [...inputs, ...others].slice(0, 50);
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
