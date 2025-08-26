// src/utils/performance.js
export class PerformanceMonitor {
  static measurePageLoad() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
    }
    return null;
  }

  static getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fp = paintEntries.find(entry => entry.name === 'first-paint');
    return fp ? fp.startTime : null;
  }

  static getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  static measureUserTiming(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-measure`;

    performance.mark(startMark);
    
    const result = fn();
    
    if (result && typeof result.then === 'function') {
      // Handle async functions
      return result.finally(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      });
    } else {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      return result;
    }
  }

  static logPerformanceMetrics() {
    if ('performance' in window) {
      const metrics = this.measurePageLoad();
      console.log('Performance Metrics:', metrics);
      
      // Send to analytics service in production
      if (process.env.NODE_ENV === 'production') {
        this.sendMetricsToAnalytics(metrics);
      }
    }
  }

  static sendMetricsToAnalytics(metrics) {
    // Implement your analytics service here
    // Example: Google Analytics, Mixpanel, etc.
  }
}
