Feature: Floating Session Recorder and Scheme API Storage
  As a QA engineer or security analyst
  I want to record live user sessions and save them locally
  So that I can replay and analyze user frustration patterns.

  Background:
    Given I navigate to the login page

  Scenario: Start session recording from floating recorder widget
    When I click the recorder "Start" button
    Then the recorder status indicator should show recording active
    And the recorder event counter should start incrementing on user interactions

  Scenario: Record live user clicks, input events, and frustration triggers
    Given I have started session recording
    When I type "test@company.com" in the email input
    And I type "password123" in the password input
    And I rapidly click the submit button 5 times
    Then the recorder event counter should reflect captured clicks, inputs, and the "rageClick" trigger

  Scenario: Stop recording, name session, and save JSON via API
    Given I have recorded a session with events
    When I click the recorder "Stop" button
    And I enter session name "test_gherkin_session"
    And I click "Save to Test Schemes"
    Then the API endpoint "/api/record" should return success
    And the file "scripts/manual test schemes/test_gherkin_session.json" should exist on disk
