import { Given, When } from "@cucumber/cucumber"
import { pageNavigation } from "../pages/pageNavigation";
import { page, logger } from '../helper/browser/browser';
import * as ele from "../pages/redBus.page";

export let FromCity: string;
export let ToCity: string;
export let JourneyDate: string;

Given('user navigates to the redBus website', async () => {
    await pageNavigation.navigateToUrl();
    await page.waitForLoadState('networkidle', { timeout: 100000 });
    logger.info("Going to the target application")
});

When('user clicks on {string} button', async function (buttonText: string) {
    await page.getByRole('button').getByText(buttonText).nth(0).click();
});

When('user clicks on {string} text', async function (text: string) {
    await page.getByText(text).first().click();
});

When('user enters {string} in From field', async function (value: string) {
    FromCity = value;
    await ele.boardingPointIcon().click();
    await ele.srcDestInput().fill(value);
    await ele.cityList(value).click();
});
``
When('user enters {string} in To field', async function (value: string) {
    ToCity = value;
    // await ele.destinationPointIcon().click();
    await ele.srcDestInput().fill(value);
    await ele.cityList(value).click();
});

When('user selects {string} date from {string} field', async function (date: Date, dateField: string) {
    let [d, m, y] = String(date).split('-');
    JourneyDate = `${d}_${m}_${y}`;
    await ele.dateEleCalenderIcon(dateField).click();
    await ele.datePicker(date);
});