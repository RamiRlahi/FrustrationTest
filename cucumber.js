module.exports = {
  default: {
    paths: ['features/*.feature'],
    require: ['features/step_definitions/steps.js'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    publishQuiet: true
  }
};
