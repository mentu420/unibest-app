const log: any = wx.getRealtimeLogManager?.()
function logWrapper(logFn: 'error' | 'warn' | 'info' | 'debug') {
  return function (...args: any) {
    console[logFn](...args)
    if (log && import.meta.env.VITE_APP_BUILD_ENVIRONMENT === 'production') {
      log[logFn](...args)
    }
  }
}

export const logger = {
  debug: logWrapper('debug'),
  info: logWrapper('info'),
  warn: logWrapper('warn'),
  error: logWrapper('error'),
  setFilterMsg: (message: any) => {
    if (log?.setFilterMsg && typeof message === 'string') {
      console.log(message)
      log.setFilterMsg(message)
    }
  },
  addFilterMsg: (message: any) => {
    if (log?.addFilterMsg && typeof message === 'string') {
      console.log(message)
      log.addFilterMsg(message)
    }
  },
}

export default logger
