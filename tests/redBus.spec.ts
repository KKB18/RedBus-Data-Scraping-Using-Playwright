import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

var fourPlusRatingCount: number = 0;
var maxFare: number = 0;
var minFare: number = Number.MAX_SAFE_INTEGER;
var acCount: number = 0;
var nonAcCount: number = 0;
// Utility to parse CSV
function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const [header, ...lines] = content.trim().split('\n');
  const keys = header.split(',').map(k => k.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
  });
}

const csvPath = path.join(__dirname, '../csvData/redBusInputs.csv');
const inputRows = parseCSV(csvPath);

inputRows.forEach(({ FromCity, ToCity, JourneyDate }) => {
  test(`Bus search: ${FromCity} to ${ToCity} on ${JourneyDate}`, async ({ page }) => {
    // 1. Go to redBus
    await page.goto('https://www.redbus.in/', { waitUntil: 'domcontentloaded' });

    // 2. Click "Bus Tickets" text if needed
    await page.getByText('Bus Tickets').first().click();

    // 3. Assert homepage label
    await expect(page.getByText("India's No. 1 online bus ticket booking site")).toBeVisible();

    // 4. Fill From/To fields
    await page.locator('//i[contains(@class,"boarding_point")]').first().click();
    await page.locator('//input[@id="srcDest"]').first().fill(FromCity);
    await page.locator(`//div[contains(@class,"searchCategory")]//div[contains(@class,"listHeader")][normalize-space(text())="${FromCity}"]`).first().click();

    await page.locator('//input[@id="srcDest"]').first().fill(ToCity);
    await page.locator(`//div[contains(@class,"searchCategory")]//div[contains(@class,"listHeader")][normalize-space(text())="${ToCity}"]`).first().click();

    // 5. Select date (assumes DD_MM_YYYY)
    const [d, m, y] = JourneyDate.split('_').map(Number);
    await page.locator(`//span[normalize-space(text())="Date of Journey"]//..//..//..//i[contains(@class,"icon-date_range")]`).first().click();

    // Calendar navigation (simplified, may need adjustment for your UI)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[m - 1];
    while (true) {
      const monthYear = await page.locator(`//p[contains(@class,"monthYear")]`).textContent();
      if (monthYear?.includes(month) && monthYear?.includes(y.toString())) break;
      await page.locator(`//i[contains(@class,"right")]`).click();
    }
    await page.locator(`//div[contains(@class,"calendarDate")]//span[normalize-space(text())="${d}"]`).click();

    // 6. Click Search buses
    await page.getByRole('button', { name: 'Search buses' }).first().click();

    // 7. Assert route label
    await expect(page.getByLabel(`${FromCity} to ${ToCity}`)).toBeVisible();

    // 8. Extract bus details (same logic as your step)
    // 1. Scroll until "End of list" is visible
    let maxScrolls = 100000;
    let prevCount = 0;
    for (let i = 0; i < maxScrolls; i++) {
      const endOfListVisible = await page.locator('//*[contains(text(),"End of list")]').first().isVisible().catch(() => false);
      if (endOfListVisible) {
        console.log("Reached 'End of list' message, stopping scroll.");
        break;
      }
      const lastLi = page.locator('//ul[contains(@class,"srpList")]/li[last()]');
      await lastLi.scrollIntoViewIfNeeded();
      await (page.locator(`//*[contains(text(),"Factors Affecting Bus Ticket Prices")]`)).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    console.log("Reached the end of the list, extracting bus details...");

    const busCount = await page.locator('//ul[contains(@class,"srpList")]/li').count();
    console.log(`Total buses found: ${busCount}`);

    // 2. Extract all bus details in one go using evaluate and XPath
    const buses = await page.evaluate(() => {
      // Helper to get text by XPath relative to a node
      function getTextByXPath(node: Element, xpath: string): string {
        const doc = node.ownerDocument || document;
        const result = doc.evaluate(xpath, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue ? (result.singleNodeValue.textContent?.trim() || "") : "";
      }

      const snapshot = document.evaluate('//ul[contains(@class,"srpList")]/li', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const liNodes = [];
      for (let i = 0; i < snapshot.snapshotLength; i++) {
        liNodes.push(snapshot.snapshotItem(i));
      }
      const buses = [];
      for (let i = 0; i < liNodes.length; i++) {
        const li = liNodes[i];
        if (!li || li.nodeType !== Node.ELEMENT_NODE) continue;
        const el = li as Element; // <-- Explicit cast after the check
        buses.push({
          Travels: getTextByXPath(el, './/div[contains(@class,"travelsName")]'),
          Boarding: getTextByXPath(el, './/p[contains(@class,"boardingTime")]'),
          Dropping: getTextByXPath(el, './/p[contains(@class,"droppingTime")]'),
          busType: getTextByXPath(el, './/p[contains(@class,"busType")]'),
          Fare: getTextByXPath(el, './/p[contains(@class,"finalFare")]'),
          Rating: getTextByXPath(el, './/div[contains(@class,"ratingTag")]//div[contains(@class,"rating_")]')
        });
      }
      return buses;
    });


    console.log(`Extracted ${buses.length} bus details.`);
    // 3. Save as CSV
    const csvRows = [
      "Travels,Boarding,Dropping,Fare,Rating,Bus Type",
      ...buses.map(b => {
        // Clean up each field
        const Travels = b.Travels && b.Travels.trim() ? b.Travels.trim() : "Not Available";
        const Boarding = b.Boarding && b.Boarding.trim() ? b.Boarding.trim() : "Not Available";
        const Dropping = b.Dropping && b.Dropping.trim() ? b.Dropping.trim() : "Not Available";
        // Remove ₹ and commas from Fare
        let Fare = b.Fare && b.Fare.trim() ? b.Fare.trim().replace(/₹|,/g, "") : "Not Available";
        if (!Fare) Fare = "Not Available";
        const Rating = b.Rating && b.Rating.trim() ? b.Rating.trim() : "Not Available";
        const busType = b.busType && b.busType.trim() ? b.busType.trim() : "Not Available";
        return `"${Travels}","${Boarding}","${Dropping}","${Fare}","${Rating}","${busType}"`;
      })
    ];
    // csv file should be saved with name FromCity_ToCity_JourneyDate.csv
    const resultsDir = path.join(process.cwd(), "test-results", "csv");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    const csvPath = path.join(resultsDir, `${FromCity}_${ToCity}_${JourneyDate}_Bus_Details.csv`);
    fs.writeFileSync(csvPath, csvRows.join("\n"), "utf-8");

    const csv = fs.readFileSync(csvPath, "utf-8");
    const lines1 = csv.split("\n").slice(1); // skip header
    const buses1 = lines1
      .map(line => {
        const [Travels, Boarding, Dropping, Fare, Rating, busType] = line.split(",").map(s => s.replace(/"/g, "").trim());
        return { Travels, Boarding, Dropping, Fare, Rating, busType };
      })
      .filter(b => b.Travels && !isNaN(parseFloat(b.Rating)));
    const count = buses.filter(b => parseFloat(b.Rating) >= 4).length;
    fourPlusRatingCount = count;
    console.log(`Count of buses with 4+ rating: ${count}`);

    const lines2 = csv.split("\n").slice(1);
    const fares = lines2
      .map(line => {
        const fareStr = line.split(",")[3]?.replace(/"/g, "").replace(/[^\d]/g, "");
        return parseInt(fareStr, 10);
      })
      .filter(f => !isNaN(f) && f >= 100);
    const max = Math.max(...fares);
    const min = Math.min(...fares);
    maxFare = max;
    minFare = min;
    console.log(`Max fare: ₹${maxFare}, Min fare: ₹${minFare}`);

    const lines3 = csv.split("\n").slice(1);
    let ac = 0, nonAc = 0;
    lines3.forEach(line => {
      const busType = line.split(",")[5]?.toLowerCase();
      if (!busType) return;
      if (busType.includes("non a/c")) nonAc++;
      if (busType.includes("a/c")) ac++;
    });
    ac = ac - nonAc; // Adjusting count if needed, as per your original logic
    acCount = ac;
    nonAcCount = nonAc;
    console.log(`AC buses: ${ac}, Non-AC buses: ${nonAc}`);

    const csvPathResults = path.join(resultsDir, `overall_bus_summary.csv`);
    const header = "FromCity,ToCity,JourneyDate,4+ Rating Count,Max Fare,Min Fare,AC Count,Non-AC Count\n";
    const row = `${FromCity},${ToCity},${JourneyDate},${fourPlusRatingCount},${maxFare},${minFare},${acCount},${nonAcCount}\n`;

    // Write header only if file does not exist
    if (!fs.existsSync(csvPathResults)) {
      fs.writeFileSync(csvPathResults, header + row, "utf-8");
    } else {
      fs.appendFileSync(csvPathResults, row, "utf-8");
    }
  });
});