/**
 * Browser Controller
 * Playwright-based browser automation for Computer Use
 */
import type { BrowserAction, BrowserConfig, PageState } from './types.js';
/**
 * Browser Controller - Manages browser instance and actions
 */
export declare class BrowserController {
    private browser;
    private context;
    private page;
    private config;
    private playwright;
    constructor(config?: Partial<BrowserConfig>);
    /**
     * Initialize browser
     */
    init(): Promise<void>;
    /**
     * Close browser
     */
    close(): Promise<void>;
    /**
     * Dismiss cookie consent banners
     * Handles common cookie consent providers (OneTrust, CookieBot, GDPR banners, etc.)
     */
    dismissCookieBanners(): Promise<{
        dismissed: boolean;
        provider?: string;
    }>;
    /**
     * Execute a browser action
     */
    execute(action: BrowserAction): Promise<{
        success: boolean;
        error?: string;
        data?: any;
    }>;
    /**
     * Take a screenshot
     */
    screenshot(): Promise<string>;
    /**
     * Get current page state
     */
    getPageState(): Promise<PageState>;
    /**
     * Get page HTML (for debugging)
     */
    getHTML(): Promise<string>;
    /**
     * Check if browser is running
     */
    isRunning(): boolean;
    /**
     * Get current URL
     */
    getCurrentUrl(): string;
}
export declare function getBrowserController(config?: Partial<BrowserConfig>): BrowserController;
export declare function closeBrowser(): Promise<void>;
//# sourceMappingURL=controller.d.ts.map