import { BrowserContext, Page } from "@playwright/test";

export async function startTracing(context: BrowserContext, name: string, title: string) {
    await context.tracing.start({
        name,
        title,
        sources: true,
        screenshots: true,
        snapshots: true
    });
}

export async function stopTracing(context: BrowserContext, path: string) {
    await context.tracing.stop({ path });
}