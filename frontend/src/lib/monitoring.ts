import * as Sentry from "@sentry/nextjs";

// Tipos para monitoramento
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface BusinessMetric {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: number;
}

// Performance Monitoring
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  // Medir tempo de execução de funções
  measureTime<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, error: 'true' }
      });
      
      throw error;
    }
  }
  
  // Medir tempo de execução de funções async
  async measureTimeAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, error: 'true' }
      });
      
      throw error;
    }
  }
  
  // Registrar métrica customizada
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Enviar para Sentry
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metric.name}: ${metric.value}${metric.unit}`,
      level: 'info',
      data: {
        ...metric.tags,
        value: metric.value,
        unit: metric.unit
      }
    });
    
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${metric.name} = ${metric.value}${metric.unit}`, metric.tags);
    }
    
    // Limitar cache de métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }
  
  // Obter métricas
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  // Limpar métricas
  clearMetrics() {
    this.metrics = [];
  }
}

// Business Metrics
export class BusinessMonitor {
  // Tracking de eventos de negócio
  trackEvent(event: string, properties: Record<string, any> = {}, userId?: string) {
    const metric: BusinessMetric = {
      event,
      properties,
      userId,
      timestamp: Date.now()
    };
    
    // Enviar para Sentry
    Sentry.addBreadcrumb({
      category: 'business',
      message: event,
      level: 'info',
      data: properties
    });
    
    // Se tiver userId, adicionar ao scope
    if (userId) {
      Sentry.setUser({ id: userId });
    }
    
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Business Event: ${event}`, properties);
    }
  }
  
  // Tracking específicos do Zykor
  trackPageView(page: string, userId?: string) {
    this.trackEvent('page_view', { page }, userId);
  }
  
  trackUserAction(action: string, component: string, userId?: string) {
    this.trackEvent('user_action', { action, component }, userId);
  }
  
  trackBusinessMetric(metric: string, value: number, unit: string, userId?: string) {
    this.trackEvent('business_metric', { metric, value, unit }, userId);
  }
  
  trackError(error: Error, context?: Record<string, any>, userId?: string) {
    this.trackEvent('error_occurred', { 
      error: error.message, 
      stack: error.stack,
      ...context 
    }, userId);
    
    // Também enviar para Sentry como erro
    Sentry.captureException(error, {
      tags: context,
      user: userId ? { id: userId } : undefined
    });
  }
}

// Error Monitoring
export class ErrorMonitor {
  // Capturar erros com contexto
  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: context,
      extra: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }
    });
  }
  
  // Capturar mensagem de erro
  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error') {
    Sentry.captureMessage(message, level);
  }
  
  // Wrapper para async functions com error handling
  withErrorHandling<T>(fn: () => Promise<T>, errorContext?: Record<string, any>): Promise<T> {
    return fn().catch((error) => {
      this.captureError(error, errorContext);
      throw error;
    });
  }
}

// Instances globais
export const performanceMonitor = new PerformanceMonitor();
export const businessMonitor = new BusinessMonitor();
export const errorMonitor = new ErrorMonitor();

// Helpers para uso fácil
export const trackPageView = (page: string, userId?: string) => 
  businessMonitor.trackPageView(page, userId);

export const trackUserAction = (action: string, component: string, userId?: string) => 
  businessMonitor.trackUserAction(action, component, userId);

export const measureTime = <T>(name: string, fn: () => T, tags?: Record<string, string>) => 
  performanceMonitor.measureTime(name, fn, tags);

export const measureTimeAsync = <T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>) => 
  performanceMonitor.measureTimeAsync(name, fn, tags);

export const captureError = (error: Error, context?: Record<string, any>) => 
  errorMonitor.captureError(error, context);

// Hook para React
export const useMonitoring = () => {
  return {
    trackPageView,
    trackUserAction,
    measureTime,
    measureTimeAsync,
    captureError,
    recordMetric: (metric: PerformanceMetric) => performanceMonitor.recordMetric(metric),
    trackEvent: (event: string, properties?: Record<string, any>, userId?: string) => 
      businessMonitor.trackEvent(event, properties, userId)
  };
};
