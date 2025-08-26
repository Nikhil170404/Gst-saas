class ErrorTracker {
  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'javascript'
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason,
        type: 'promise'
      });
    });
  }

  static logError(errorInfo) {
    console.error('Error tracked:', errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, or custom endpoint
      this.sendToErrorService(errorInfo);
    }
  }

  static sendToErrorService(errorInfo) {
    // Implement your error tracking service here
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(err => console.warn('Failed to send error to tracking service:', err));
  }

  static captureException(error, context = {}) {
    this.logError({
      message: error.message,
      stack: error.stack,
      error,
      context,
      type: 'manual'
    });
  }
}

export { ErrorTracker };