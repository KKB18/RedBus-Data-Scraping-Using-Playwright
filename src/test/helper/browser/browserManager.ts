import { Browser, BrowserContext, Page, chromium, firefox, webkit, LaunchOptions } from "@playwright/test";
import { getEnv } from "../env/env";

class BrowserManager {
    private _browser: Browser | null = null;
    private _context: BrowserContext | null = null;
    private _page: Page | null = null;

    private getLaunchOptions(): LaunchOptions {
        getEnv();
        const headless = process.env.npm_config_HEAD || process.env.HEAD;
        return {
            headless: headless === "headless",
            timeout: 100000,
            args: ['--start-maximized']
        };
    }

    private getBrowserType(): string {
        return process.env.npm_config_BROWSER || process.env.BROWSER || "chrome";
    }

    public async launchBrowser(): Promise<Browser> {
        if (this._browser) return this._browser;
        const type = this.getBrowserType();
        const options = this.getLaunchOptions();
        switch (type) {
            case "chrome": this._browser = await chromium.launch(options); break;
            // To launch any local browser we need to specify the executable path as shown below.
            // case "brave": this._browser = await chromium.launch({ ...options, executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" }); break;
            case "firefox": this._browser = await firefox.launch(options); break;
            case "webkit": this._browser = await webkit.launch(options); break;
            default: throw new Error(`Unknown browser type: ${type}`);
        }
        return this._browser;
    }

    public async createContextAndPage(): Promise<[BrowserContext, Page]> {
        if (!this._browser) await this.launchBrowser();
        this._context = await this._browser!.newContext({
            acceptDownloads: true,
            recordVideo: {
                dir: "test-results/videos"
            },
            viewport: null,
            httpCredentials: process.env.AUTH_USER && process.env.AUTH_PASS ? {
                username: process.env.AUTH_USER,
                password: process.env.AUTH_PASS
            } : undefined
        });
        this._page = await this._context.newPage();
        return [this._context, this._page];
    }

    public get browser(): Browser {
        if (!this._browser) throw new Error("Browser not initialized");
        return this._browser;
    }
    public get context(): BrowserContext {
        if (!this._context) throw new Error("Context not initialized");
        return this._context;
    }
    public get page(): Page {
        if (!this._page) throw new Error("Page not initialized");
        return this._page;
    }

    public async closeAll(): Promise<void> {
        if (this._page) await this._page.close();
        if (this._context) await this._context.close();
        if (this._browser) await this._browser.close();
    }
}

export const browserManager = new BrowserManager();