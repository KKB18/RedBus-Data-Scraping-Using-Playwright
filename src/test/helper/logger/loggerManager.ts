import { Logger, createLogger } from 'winston';
import { options } from "./logger";

export function createTestLogger(scenarioName: string): Logger {
    return createLogger(options(scenarioName));
}