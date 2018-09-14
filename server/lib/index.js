const log = require('./log');
const tetManager = require('./tetManager');
const slack = require('./slack')(tetManager, log.logger);

module.exports = {
  log,
  tetManager,
  slack,
};
