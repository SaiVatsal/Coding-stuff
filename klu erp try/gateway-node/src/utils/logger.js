/**
 * Structured Logger for Eyefind Middleware Gateway
 * Formats logs with timestamps and log levels.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.LOG_LEVEL ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? 1) : 1;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function formatTimestamp() {
  return new Date().toISOString();
}

const logger = {
  debug(message, meta = '') {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(`${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.magenta}[DEBUG]${COLORS.reset} ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  info(message, meta = '') {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(`${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.green}[INFO]${COLORS.reset}  ${COLORS.cyan}[Eyefind]${COLORS.reset} ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  warn(message, meta = '') {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.yellow}[WARN]${COLORS.reset}  ${COLORS.cyan}[Eyefind]${COLORS.reset} ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  error(message, error = '') {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.red}[ERROR]${COLORS.reset} ${COLORS.cyan}[Eyefind]${COLORS.reset} ${message}`, error instanceof Error ? error.stack : error);
    }
  },
};

module.exports = logger;
