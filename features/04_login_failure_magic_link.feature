@login @magiclink
Feature: Repeated Login Failures and Magic Link Offer
  As a user experiencing credential issues
  I want the system to offer an alternative login method after multiple failures
  So that I am not locked out or frustrated trying to log in.

  Background:
    Given I navigate to the login page

  Scenario: Display magic link banner after 3 consecutive failed login attempts
    Given the magic link banner is hidden
    When I submit invalid credentials 3 times
    Then the magic link banner should become visible
    And the magic link banner should display text "Too many failed attempts"
    And the frustration survey overlay should auto-open

  Scenario: Suppress magic link banner when user fails 2 attempts and then succeeds
    Given the magic link banner is hidden
    When I submit invalid credentials 2 times
    And I enter email "admin@Talan.com"
    And I enter password "password123"
    And I click the submit button
    Then the magic link banner should remain hidden
    And I should see the login feedback "SUCCESS"
