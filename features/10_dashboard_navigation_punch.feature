@dashboard @smoke
Feature: Dashboard Navigation and Time Punching
  As an OrangeHRM employee
  I want to interact with dashboard clocking widgets and navigation shortcuts
  So that I can manage my work hours and navigate to key HR modules

  Background:
    Given I navigate to the dashboard page

  Scenario: Toggle work punch clock status from Dashboard
    Then the punch clock status should be "Logged in as Admin (PUNCHED IN)"
    And the punch button label should be "Punch Out"
    When I click the punch clock button
    Then the punch clock status should be "Logged in as Admin (PUNCHED OUT)"
    And the punch button label should be "Punch In"

  Scenario: Navigate from Dashboard to Leave Management via sidebar menu
    When I click the sidebar "Leave" menu item
    Then I should be navigated to the "Apply Leave" page

  Scenario: Navigate from Dashboard to Leave Management via Quick Launch
    When I click the "Apply Leave" quick launch card
    Then I should be navigated to the "Apply Leave" page

  Scenario: User logout redirects to login page
    When I click the logout button on the dashboard
    Then I should be navigated to the "login" page
