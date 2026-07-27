Feature: Erratic Mouse Movement (Jitter) Frustration Detection
  As a user experiencing stress or hesitation
  I want the system to detect rapid erratic mouse movements over the form
  So that live help is offered automatically.

  Background:
    Given I navigate to the login page

  Scenario: Detect mouse jitters when user moves mouse erratically with 5+ direction reversals
    Given the mouse jitter banner is hidden
    When I move the mouse inside the login card with 25 rapid zig-zag reversals
    Then the mouse jitter banner should become visible
    And the mouse jitter banner should display text "Feeling stuck?"
    And the frustration survey overlay should auto-open

  Scenario: Suppress mouse jitter banner on smooth linear mouse movements
    Given the mouse jitter banner is hidden
    When I move the mouse smoothly across the login card in 25 linear steps
    Then the mouse jitter banner should remain hidden

  Scenario: Suppress mouse jitter banner on borderline movements (4 direction reversals)
    Given the mouse jitter banner is hidden
    When I move the mouse with neutral priming followed by 5 zig-zag moves
    Then the mouse jitter banner should remain hidden
