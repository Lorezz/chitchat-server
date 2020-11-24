const chalk = require('chalk');
const isProduction = process.env.NODE_ENV === 'production';
const log = console.log;

const success = (...str) => {
  log(chalk.bgGreen(JSON.stringify(str)));
};
const info = (...str) => {
  log(chalk.blue(JSON.stringify(str)));
};
const warn = (...str) => {
  log(chalk.yellow(JSON.stringify(str)));
};
const assert = (...str) => {
  log(chalk.gray.bold(JSON.stringify(str)));
};
const error = (...str) => {
  log(chalk.bgRed(JSON.stringify(str)));
};
const inverse = (...str) => {
  log(chalk.inverse(JSON.stringify(str)));
};
const wtf = (...str) => {
  log(chalk.bgMagenta(JSON.stringify(str)));
};
const verbose = (...str) => {
  log(chalk.bgCyan(JSON.stringify(str)));
};
const important = (...str) => {
  log(chalk.bgYellow(JSON.stringify(str)));
};

module.exports = {
  success,
  error,
  info,
  warn,
  assert,
  wtf,
  verbose,
  inverse,
  important,
};
