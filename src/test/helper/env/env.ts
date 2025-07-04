import * as dotenv from "dotenv"
let envType = typeof (process.env.npm_config_ENV) == "string" ? process.env.npm_config_ENV : "orangeHrmLive";

export const getEnv = () => {
    dotenv.config({
        override: true,
        path: "./src/test/helper/env/.env." + envType 
    })
}