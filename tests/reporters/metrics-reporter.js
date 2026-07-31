const fs = require('fs');
const path = require('path');

class MetricsReporter {
  constructor() {
    this.suiteStartTime = 0;
    this.results = [];
  }

  onBegin(config, suite) {
    this.suiteStartTime = Date.now();
  }

  onTestEnd(test, result) {
    this.results.push({
      title: test.title,
      file: path.basename(test.location.file),
      project: test.projectName,
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
      errors: result.errors.map(e => e.message),
    });
  }

  onEnd(result) {
    const totalDuration = Date.now() - this.suiteStartTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    const report = {
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: total ? parseFloat((passed / total).toFixed(4)) : 0,
        totalDurationMs: totalDuration,
        averageTestDurationMs: total ? parseFloat((totalDuration / total).toFixed(2)) : 0,
        status: result.status,
      },
      tests: this.results,
      timestamp: new Date().toISOString(),
    };

    const outputPath = path.join(process.cwd(), 'test-results', 'playwright-metrics.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n[MetricsReporter] Saved Playwright metrics summary to ${outputPath}`);
  }
}

module.exports = MetricsReporter;
