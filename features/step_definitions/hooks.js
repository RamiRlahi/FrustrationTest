const { setWorldConstructor, BeforeAll, AfterAll, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const LoginPage = require('../pages/LoginPage');
const FrustrationSurveyModal = require('../pages/FrustrationSurveyModal');
const DashboardPage = require('../pages/DashboardPage');
const LeavePage = require('../pages/LeavePage');

setDefaultTimeout(60000);

let serverProcess = null;

BeforeAll(async function () {
  const isServerRunning = await new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000/', () => resolve(true));
    req.on('error', () => resolve(false));
    req.end();
  });

  if (!isServerRunning) {
    const serverPath = path.join(__dirname, '..', '..', 'server.js');
    serverProcess = spawn('node', [serverPath], { stdio: 'ignore' });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      const running = await new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:3000/', () => resolve(true));
        req.on('error', () => resolve(false));
        req.end();
      });
      if (running) break;
    }
  }
});

AfterAll(async function () {
  if (serverProcess) {
    serverProcess.kill();
  }
});

class CustomWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.loginPage = null;
    this.surveyModal = null;
    this.dashboardPage = null;
    this.leavePage = null;
    this.recordedEvents = [];
    this.attackResult = null;
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  this.browser = await chromium.launch({ headless: false });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();

  // Attach Page Objects
  this.loginPage = new LoginPage(this.page);
  this.surveyModal = new FrustrationSurveyModal(this.page);
  this.dashboardPage = new DashboardPage(this.page);
  this.leavePage = new LeavePage(this.page);
});

After(async function () {
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
  if (this.browser) await this.browser.close();
});
