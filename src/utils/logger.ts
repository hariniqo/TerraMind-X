/**
 * TerraMind-X Centralized Application Logger
 * Automatically suppresses non-critical logging in production builds.
 */
const isProd = (import.meta as any).env?.PROD || false

export const logger = {
  log: (...args: any[]) => {
    if (!isProd) {
      console.log(...args)
    }
  },
  info: (...args: any[]) => {
    if (!isProd) {
      console.info(...args)
    }
  },
  warn: (...args: any[]) => {
    if (!isProd) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    console.error(...args)
  },
  debug: (...args: any[]) => {
    if (!isProd) {
      console.debug(...args)
    }
  }
}

export default logger
