Feature: Rage Click Frustration Detection
  As a system monitoring user interaction
  I want to detect rapid repeated clicking on the login submit button
  So that I can offer assistance before the user gets overly frustrated.

  Background:
    Given I navigate to the login page

  Scenario: Detect rage clicking when user rapidly clicks submit 5 times
    Given the rage click banner is hidden
    When I rapidly click the submit button 5 times within 3 seconds
    Then the rage click banner should become visible
    And the rage click banner should display text "Need assistance?"
    And the frustration survey overlay should auto-open

  Scenario: Suppress rage click detection when click count is below threshold (4 clicks)
    Given the rage click banner is hidden
    When I click the submit button 4 times
    Then the rage click banner should remain hidden

  Scenario: Reset rage click counter when gap between click bursts exceeds 3 seconds
    Given the rage click banner is hidden
    When I click the submit button 3 times
    And I wait for 4 seconds
    And I click the submit button 3 times
    Then the rage click banner should remain hidden
