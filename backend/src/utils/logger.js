const chalk = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

const timestamp = () => new Date().toISOString().slice(11, 19);

const logger = {
  info: (msg, ...args) => console.log(`${chalk.gray(timestamp())} ${chalk.blue('ℹ')} ${msg}`, ...args),
  success: (msg, ...args) => console.log(`${chalk.gray(timestamp())} ${chalk.green('✅')} ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`${chalk.gray(timestamp())} ${chalk.yellow('⚠️')} ${msg}`, ...args),
  error: (msg, ...args) => console.error(`${chalk.gray(timestamp())} ${chalk.red('❌')} ${msg}`, ...args),
  webhook: (msg, ...args) => console.log(`${chalk.gray(timestamp())} ${chalk.green('📩')} ${msg}`, ...args),
  message: (dir, from, type) => {
    const arrow = dir === 'incoming' ? '⬇️' : '⬆️';
    console.log(`${chalk.gray(timestamp())} ${arrow} ${dir.toUpperCase()} [${from}] type=${type}`);
  },
};

module.exports = logger;
