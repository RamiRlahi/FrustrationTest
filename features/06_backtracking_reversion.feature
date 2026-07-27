Feature: Backtracking and Page Reversion Detection
  As a user attempting to abandon or cancel a login attempt repeatedly
  I want the system to display a confirmation modal
  So that I am offered help or can safely confirm discarding my session.

  Background:
    Given I navigate to the login page

  Scenario: Display reversion modal on 3 rapid cancel clicks
    Given the reversion modal is hidden
    When I click the cancel button 3 times
    Then the reversion modal should become visible
    And the reversion modal should contain "Need to head back?"

  Scenario: Suppress reversion modal on 2 cancel clicks
    Given the reversion modal is hidden
    When I click the cancel button 2 times
    Then the reversion modal should remain hidden

  Scenario: Reset cancel click counter after 2-second timeout window
    Given the reversion modal is hidden
    When I click the cancel button 2 times
    And I wait for 3 seconds
    And I click the cancel button 2 times
    Then the reversion modal should remain hidden

  Scenario: Allow user to stay on current page when clicking "Stay Here"
    Given the reversion modal is visible after 3 cancel clicks
    When I click the modal "Stay Here" button
    Then the reversion modal should become hidden

  Scenario: Allow user to save recording and exit when clicking "Discard & Go Back"
    Given the session recorder is actively recording
    And the reversion modal is visible after 3 cancel clicks
    When I click the modal "Discard & Go Back" button
    Then the session recording should automatically save and navigate away
