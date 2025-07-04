import fs from "fs-extra";
import * as os from "os";
import path from "path";

export async function writeSystemInfo(browserName: string, browserVersion: string) {
    const platformInfo = { name: os.platform(), version: os.release() };
    const info = {
        browser: { name: browserName, version: browserVersion },
        platform: platformInfo
    };
    const currentRepo = path.join(__dirname, '../');
    const infoFilePath = path.join(currentRepo, '/testData/systemInfo.json');
    await fs.writeJson(infoFilePath, info);
}