import { page } from "../helper/browser/browser";

// Below Elements is generic and can be used entire application
export const eleUsingText = (text: string) => page.locator(`//*[text()="${text}"]`).first();
export const boardingPointIcon = () => page.locator(`//i[contains(@class,"boarding_point")]`).first();
export const srcDestInput = () => page.locator(`//input[@id="srcDest"]`).first();
export const destinationPointIcon = () => page.locator(`//i[contains(@class,"dropping_point")]`).first();
export const cityList = (city: string) => page.locator(`//div[contains(@class,"searchCategory")]//div[contains(@class,"listHeader")][normalize-space(text())="${city}"]`).first();
export const busCount = () => page.locator(`//span[contains(@class,"subtitle")]`)
export const dateEleCalenderIcon = (fieldLabel: string) => page.locator(`//span[normalize-space(text())="${fieldLabel}"]//..//..//..//i[contains(@class,"icon-date_range")]`).first();


const nextMonthButton = () => page.locator(`//i[contains(@class,"right")]`);
const monthYearText = () => page.locator(`//p[contains(@class,"monthYear")]`);
const dateSelector = (date: number) => page.locator(`//div[contains(@class,"calendarDate")]//span[normalize-space(text())="${date}"]`);


// Enables the user to interact with Date picker element within the application
export const datePicker = async (date: Date) => {

    // Storing the year, date, month in their individual variables
    let [d, m, y] = String(date).split('-');

    // Setting the equivalent Month text for the numeric month value
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    let month: string = monthNames[Number(m) - 1];

    // Clicks on the month dropdown and selects the specified month
    while (true) {
        if ((await monthYearText().textContent())?.includes(month) && (await monthYearText().textContent())?.includes(y)) {
            break; // Exit the loop if the month and year match
        }
        // click on the next month button if the current year is less than the target year and if the current month is less than the target month
        if (Number(y) > new Date().getFullYear() || (Number(y) === new Date().getFullYear() && monthNames.indexOf(month) > new Date().getMonth())) {
            await nextMonthButton().click();
        }
    }
    // Clicks on the specified date
    await dateSelector(Number(d)).scrollIntoViewIfNeeded({ timeout: 5000 });
    await dateSelector(Number(d)).click();

}