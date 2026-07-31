@leave @smoke
Feature: Leave Management Application & Validation Friction
  As an OrangeHRM employee
  I want to submit leave applications with validation and feedback
  So that invalid date ranges, balance overages, and rapid clicks are handled cleanly

  Background:
    Given I navigate to the leave management page

  Scenario: Successfully submit a valid leave request
    When I select leave type "US - Annual Leave"
    And I enter from date "2026-08-10" and to date "2026-08-12"
    And I click the apply leave button
    Then the leave success message should display "Leave request submitted successfully!"
    And the leave balance should be updated to "9.0 Days"

  Scenario: Display error when leave end date is before start date
    When I enter from date "2026-08-10" and to date "2026-08-05"
    And I click the apply leave button
    Then the leave error message should display "Invalid date range. End date cannot be before start date."

  Scenario: Display error when requested leave exceeds entitlement balance
    When I enter from date "2026-08-01" and to date "2026-08-20"
    And I click the apply leave button
    Then the leave error message should display "Insufficient leave balance for requested duration."

  Scenario: Escalate to friction warning banner on 3 rapid leave submit attempts
    When I rapidly click the apply leave button 3 times
    Then the leave friction banner should become visible
