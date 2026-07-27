Feature: Frustration Survey and Rating Overlay
  As a product team
  I want users to rate their frustration level on a scale of 1 to 5 when friction occurs
  So that we can gather feedback and refine trigger models.

  Background:
    Given I navigate to the login page

  Scenario: Display frustration survey overlay when frustration is detected
    Given the frustration survey overlay is hidden
    When I trigger frustration by rapidly clicking submit 5 times
    Then the frustration survey overlay should become visible
    And the slider default value should be "3"
    And the rating display should show "3/5 - Neutral / Impatient"

  Scenario: Submit rating on frustration slider
    Given the frustration survey overlay is visible
    When I adjust the frustration slider to "5"
    And I click the survey submit button
    Then the feedback success message should display "Thank you"
    And the survey overlay attribute "data-submitted-rating" should be set to "5"

  Scenario: Enforce once-per-session survey display rule
    Given the frustration survey overlay was displayed and dismissed by the user
    When I trigger frustration again by rapidly clicking submit 5 times
    Then the frustration survey overlay should remain hidden
