// src/lib/utils/logger.js - Development logging utility

const isDev = import.meta.env.DEV
const suppressLogs = import.meta.env.VITE_SUPPRESS_DEV_LOGS === 'true'

/**
 * Development logger that respects VITE_SUPPRESS_DEV_LOGS
 */
export const devLog = {
  info: (...args) => {
    if (isDev && !suppressLogs) {
      console.log(...args)
    }
  },
  warn: (...args) => {
    if (isDev && !suppressLogs) {
      console.warn(...args)
    }
  },
  error: (...args) => {
    // Always show errors
    console.error(...args)
  },
  debug: (...args) => {
    if (isDev && !suppressLogs && import.meta.env.VITE_DEBUG === 'true') {
      console.debug(...args)
    }
  },
  group: (label) => {
    if (isDev && !suppressLogs) {
      console.group(label)
    }
  },
  groupEnd: () => {
    if (isDev && !suppressLogs) {
      console.groupEnd()
    }
  }
}

/**
 * Production-safe logger
 */
export const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: isDev ? console.debug : () => {}
}

export default devLog 