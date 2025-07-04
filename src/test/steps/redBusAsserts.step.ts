import { Then } from "@cucumber/cucumber"
import { expect } from "@playwright/test"
import { page } from '../helper/browser/browser';
import path from "path";
import fs from "fs";
import * as ele from "../pages/redBus.page";
import { FromCity, JourneyDate, ToCity } from "./redBusActions.step";

var fourPlusRatingCount: number = 0;
var maxFare: number = 0;
var minFare: number = Number.MAX_SAFE_INTEGER;
var acCount: number = 0;
var nonAcCount: number = 0;

Then('assert that {string} is present on the page', async function (text: string) {
    await expect(ele.eleUsingText(text)).toBeVisible({ timeout: 10000 });
});

Then('assert that {string} label is present on the page', async function (text: string) {
    await expect(page.getByLabel(text)).toBeVisible({ timeout: 10000 });
});

Then('extract and print all bus details', async function () {
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

    // 4. Print as table
    // eslint-disable-next-line no-console
    // console.table(buses);

    this.attach(`Saved bus details to ${csvPath}`, "text/plain");
});

Then('print the count of buses with 4+ rating', async function () {
    // Reuse extraction logic or load from CSV if needed
    const resultsDir = path.join(process.cwd(), "test-results", "csv");
    const csvPath = path.join(resultsDir, `${FromCity}_${ToCity}_${JourneyDate}_Bus_Details.csv`);
    const csv = fs.readFileSync(csvPath, "utf-8");
    const lines = csv.split("\n").slice(1); // skip header
    const buses = lines
        .map(line => {
            const [Travels, Boarding, Dropping, Fare, Rating, busType] = line.split(",").map(s => s.replace(/"/g, "").trim());
            return { Travels, Boarding, Dropping, Fare, Rating, busType };
        })
        .filter(b => b.Travels && !isNaN(parseFloat(b.Rating)));
    const count = buses.filter(b => parseFloat(b.Rating) >= 4).length;
    fourPlusRatingCount = count;
    console.log(`Count of buses with 4+ rating: ${count}`);
    this.attach(`Count of buses with 4+ rating: ${count}`, "text/plain");
});

Then('print the max and min fares for the route', async function () {
    const resultsDir = path.join(process.cwd(), "test-results", "csv");
    const csvPath = path.join(resultsDir, `${FromCity}_${ToCity}_${JourneyDate}_Bus_Details.csv`);
    const csv = fs.readFileSync(csvPath, "utf-8");
    const lines = csv.split("\n").slice(1);
    const fares = lines
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
    this.attach(`Max fare: ₹${maxFare}, Min fare: ₹${minFare}`, "text/plain");
});

Then('print the count of AC and non-AC buses', async function () {
    // You may need to enhance extraction logic to include AC/Non-AC info.
    // For now, let's assume Travels name or another field contains "AC" or "Non AC"
    const resultsDir = path.join(process.cwd(), "test-results", "csv");
    const csvPath = path.join(resultsDir, `${FromCity}_${ToCity}_${JourneyDate}_Bus_Details.csv`);
    const csv = fs.readFileSync(csvPath, "utf-8");
    const lines = csv.split("\n").slice(1);
    let ac = 0, nonAc = 0;
    lines.forEach(line => {
        const busType = line.split(",")[5]?.toLowerCase();
        if (!busType) return;
        if (busType.includes("non a/c")) nonAc++;
        if (busType.includes("a/c")) ac++;
    });
    ac = ac - nonAc; // Adjusting count if needed, as per your original logic
    acCount = ac;
    nonAcCount = nonAc;
    console.log(`AC buses: ${ac}, Non-AC buses: ${nonAc}`);
    this.attach(`AC buses: ${ac}, Non-AC buses: ${nonAc}`, "text/plain");
});

// function to save the details from, to and date of journey, 4+ rating count, max and min fare, ac and non ac count to a csv and append to the existing csv file
Then('save the bus details to a CSV file', async function () {
    const resultsDir = path.join(process.cwd(), "test-results", "csv");
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    const csvPath = path.join(resultsDir, `overall_bus_summary.csv`);
    const header = "FromCity,ToCity,JourneyDate,4+ Rating Count,Max Fare,Min Fare,AC Count,Non-AC Count\n";
    const row = `${FromCity},${ToCity},${JourneyDate},${fourPlusRatingCount},${maxFare},${minFare},${acCount},${nonAcCount}\n`;

    // Write header only if file does not exist
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, header + row, "utf-8");
    } else {
        fs.appendFileSync(csvPath, row, "utf-8");
    }
    this.attach(`Saved bus summary to ${csvPath}`, "text/plain");
});