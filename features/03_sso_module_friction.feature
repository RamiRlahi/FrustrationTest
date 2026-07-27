Feature: Single Sign-On (SSO) Module Friction Escalation
  As a user interacting with enterprise authentication options
  I want clear feedback when SSO/Passkey authentication is unavailable
  So that I am guided to use standard email & password when repeated clicks occur.

  Background:
    Given I navigate to the login page

  Scenario: Display disabled notice on first click of locked SSO button
    Given the SSO tooltip is hidden
    When I click the SSO button 1 time
    Then the SSO tooltip should become visible
    And the SSO tooltip should contain "disabled"
    And the SSO tooltip should not contain "locked"

  Scenario: Escalate to locked warning banner on 3 rapid SSO button clicks
    Given the SSO tooltip is hidden
    When I rapidly click the SSO button 3 times
    Then the SSO tooltip should become visible
    And the SSO tooltip should contain "SSO is temporarily locked"
    And the SSO button should trigger a shake animation
    And the frustration survey overlay should auto-open
