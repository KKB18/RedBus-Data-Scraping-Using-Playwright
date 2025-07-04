// page.ts
import { browserManager } from "./browserManager";
import { logger } from "../hooks/hooks";
import { Browser, BrowserContext, Page } from "@playwright/test";

// Declare variables first
export let page!: Page;
export let context!: BrowserContext;
export let browser!: Browser;

// Initializes these variables once the browser is ready
export function initBrowserRefs() {
    if (!browserManager.page ||
        !browserManager.context ||
        !browserManager.browser) {
        throw new Error("Browser, context, or page is not initialized.");
    }
    page = browserManager.page;
    context = browserManager.context;
    browser = browserManager.browser;
}

export { logger };
export const closeAll = async () => {
    try {
        await browserManager.closeAll();
    } catch (error) {
        logger.error(`Error closing browser: ${error}`);
    }
};