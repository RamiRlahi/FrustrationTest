@login @smoke
Feature: Standard Authentication and Form Validation
  As a user accessing the console
  I want to log in with my email and password
  So that I can securely access the console or see helpful input validation errors.

  Background:
    Given I navigate to the login page

  @valid_login
  Scenario: Successful login with valid administrator credentials
    When I enter email "admin@Talan.com"
    And I enter password "password123"
    And I click the submit button
    Then I should see the login feedback "SUCCESS"

  @invalid_email
  Scenario: Validation error when email format is invalid
    When I enter email "invalid-email-format"
    And I enter password "password123"
    And I click the submit button
    Then I should see the email validation error "Please enter a valid email address."
    And the login card should perform a shake animation

  @short_password
  Scenario: Validation error when password is shorter than 8 characters
    When I enter email "admin@Talan.com"
    And I enter password "short"
    And I click the submit button
    Then I should see the password validation error "Password must be at least 8 characters."
    And the login card should perform a shake animation

  @invalid_credentials
  Scenario: Failed authentication attempt with unknown credentials
    When I enter email "user@company.com"
    And I enter password "WrongPassword123"
    And I click the submit button
    Then I should see the login feedback "Invalid username or password."
    And the login card should perform a shake animation
