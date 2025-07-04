@f1
Feature: Automation Script to get bus count from redBus

    Background: Navigating to redBus website and booking bus tickets
        Given user navigates to the redBus website
        When user clicks on "Bus Tickets" text
        Then assert that "India's No. 1 online bus ticket booking site" is present on the page

    @l1
    Scenario Outline: Extract Bus Count and Details for the given route
        When user enters "<FromCity>" in From field
            And user enters "<ToCity>" in To field
            And user selects "<JourneyDate>" date from "Date of Journey" field
            And user clicks on "Search buses" button
        Then assert that "<FromCity> to <ToCity>" label is present on the page
            And extract and print all bus details
            And print the count of buses with 4+ rating
            And print the max and min fares for the route
            And print the count of AC and non-AC buses
            And save the bus details to a CSV file
    Examples:
        | FromCity  | ToCity    | JourneyDate |
        | Bangalore | Chennai   | 25-08-2025  |
        | Chennai   | Bangalore | 16-08-2025  |
        | Hyderabad | Mumbai    | 17-08-2025  |