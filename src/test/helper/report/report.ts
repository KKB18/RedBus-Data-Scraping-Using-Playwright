import path from "path";
import * as fs from "fs-extra"
type systemInfo = { browser: { name: string; version: string }; platform: { name: string; version: string } };

const report = require("multiple-cucumber-html-reporter");
const currentRepo = path.join(__dirname, '../');
const infoFilePath = path.join(currentRepo, '/testData/systemInfo.json');

async function generateReport() {
    try {
        // Read the JSON file
        let info: systemInfo = {
            browser: {
                name: 'Unknown Browser',
                version: 'Unknown Version',
            },
            platform: {
                name: 'Unknown Platform',
                version: 'Unknown Version',
            },
        };

        if (await fs.pathExists(infoFilePath)) {
            const fileInfo = await fs.readJson(infoFilePath);
            // Merge the default values with the values from the JSON file
            info = {
                browser: {
                    name: fileInfo.browser?.name,
                    version: fileInfo.browser?.version,
                },
                platform: {
                    name: fileInfo.platform?.name,
                    version: fileInfo.platform?.version,
                },
            };
        }

        report.generate({
            jsonDir: "test-results",
            reportPath: "./test-results/reports/",
            reportName: "Playwright Automation Report",
            displayDuration: true,
            metadata: {
                browser: {
                    name: info.browser.name,
                    version: info.browser.version,
                },
                device: info.platform.name,
                platform: {
                    name: "null",
                    version: info.platform.version,
                },
            },
            customData: {
                title: "Run info",
                data: [
                    { label: "Project", value: "Playwright BDD Framework" },
                    { label: "Release", value: "1.0" },
                    { label: "Cycle", value: "NA" },
                    { label: "Execution Start Time", value: Date() }
                ],
            },
        });
    }
    catch (error) {
        console.error('Error reading the JSON file:', error);
    }
}

generateReport().catch(console.error);