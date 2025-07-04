export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BROWSER: "chrome" | "firefox" | "webkit",
            ENV: "redBus",
            BASEURL: string,
            HEAD: "headed" | "headless",
            TAGS: string
        }
    }
}