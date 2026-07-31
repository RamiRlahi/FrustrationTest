Feature: Adversarial Sensitivity Boundaries and Anti-False-Positive Rules
  As a QA automation & security lead
  I want adversarial test checks to verify positive detection, boundary precision, timeout resets, and recovery behaviors
  So that the frustration detection system maintains high precision without false alarms.

  Background:
    Given I navigate to the login page

  Scenario Outline: Verify threshold boundaries for frustration detection signals
    When I trigger the attack scenario "<attackScenario>"
    Then the expected frustration detection result should be "<expectedResult>"
    And the detail message should confirm "<detailKeyword>"

    Examples:
      | attackScenario         | expectedResult | detailKeyword                             |
      | slowRageClick          | fired          | Banner fires correctly                    |
      | almostRageClick        | silent         | Correctly silent at 4 clicks              |
      | rageClickReset         | silent         | Counter resets correctly after 3s gap     |
      | ssoSingleClick         | first-tier     | Single SSO click                          |
      | ssoExactThreshold      | escalated      | 3rd SSO click correctly escalates         |
      | loginFailThenSucceed   | silent         | 2 failures + success correctly suppresses |
      | loginFailExactThreshold| fired          | 3 failures correctly triggers             |
      | gentleMouseMovement    | silent         | Smooth arc produces zero direction changes|
      | borderlineJitter       | silent         | 5 zigzag moves (4 reversals) correctly stays below |
      | backtrackTwice         | silent         | 2 cancel clicks correctly produces no     |
      | backtrackTimeout       | silent         | Counter resets after 2s gap               |
      | surveyDoesNotReTrigger | suppressed     | Survey correctly suppressed after dismiss |
