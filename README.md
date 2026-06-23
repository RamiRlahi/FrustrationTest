# Talan Frustration Detection Demo

A small Node.js and Playwright project that demonstrates a login interface with user-frustration detection patterns, feedback prompts, session recording, and adversarial browser tests.

The app presents a Talan-style login screen and detects several frustration signals, including rapid submit clicks, repeated failed logins, repeated locked SSO clicks, erratic mouse movement, and repeated cancel/backtracking attempts.

## Features

- Login form with validation and demo credentials
- Frustration detection banners for rage clicks, failed attempts, SSO friction, and mouse jitter
- Frustration survey overlay with a 1-5 rating slider
- Backtracking confirmation modal
- Floating session recorder that captures clicks, inputs, mouse movement, and triggered frustration events
- Recording API that saves session JSON files locally
- Playwright end-to-end tests for the main frustration behaviors
- Adversarial audit runner with boundary, reset, positive, negative, and recovery checks

## Tech Stack

- Node.js
- Native `http` server
- HTML, CSS, and vanilla JavaScript
- Playwright Test

## Project Structure

```text
.
|-- app/
|   |-- index.html          # Login UI, frustration logic, and recorder logic
|   `-- style.css           # App styling
|-- scripts/
|   `-- adversary/
|       |-- adversary.js    # Adversarial test scenarios
|       |-- run.js          # CLI runner for adversarial audits
|       `-- sandbox.js      # Isolated browser launcher
|-- tests/
|   |-- frustration.spec.js # Main Playwright frustration tests
|   `-- recorder.spec.js    # Session recorder and API test
|-- server.js               # Static server and recording API
|-- playwright.config.js    # Playwright configuration
`-- package.json
```

## Getting Started

Install dependencies:

```bash
npm install
```

If Playwright browsers are not installed yet, install them:

```bash
npx playwright install
```

Start the local server:

```bash
npm run start
```

Open the app at:

```text
http://localhost:3000
```

## Demo Login

Successful login credentials:

```text
Email: admin@Talan.com
Password: password123
```

Any other valid-looking email and password combination will count as a failed login attempt. After three failed attempts, the app suggests using a one-time magic link.

## Session Recorder

Use the floating recorder widget in the bottom-right corner of the app:

1. Click `Start`.
2. Interact with the login form.
3. Trigger frustration behaviors if needed.
4. Click `Stop`.
5. Enter a session name.
6. Click `Save to Test Schemes`.

Saved recordings are written as JSON files under:

```text
scripts/manual test schemes/
```

The folder is created automatically when the first recording is saved.

## Running Tests

Run the Playwright test suite:

```bash
npx playwright test
```

Open the Playwright HTML report:

```bash
npx playwright show-report
```

## Adversarial Audit

Run the adversarial audit:

```bash
npm run adversary
```

The audit starts the local server if needed, runs a set of attack scenarios in Chromium, and then attempts the same checks in Firefox as an optional pass.

The adversarial tests cover:

- Positive detections that should fire
- Negative cases that should stay silent
- Boundary cases just below detection thresholds
- Reset-window behavior
- Recovery behavior after a survey is dismissed

## API

### `POST /api/record`

Saves a session recording JSON file.

Example payload:

```json
{
  "name": "sso_test_session",
  "durationMs": 5200,
  "frustrationDetected": {
    "rageClick": false,
    "ssoLocked": true,
    "magicLink": false,
    "mouseJitter": false,
    "backtrack": false
  },
  "events": []
}
```

The `name` value is sanitized before being used as a filename.

## Notes

- The app runs on port `3000`.
- The Playwright config reuses an existing local server outside CI.
- Generated Playwright reports, test results, browser cache files, and `node_modules` are ignored by Git.
