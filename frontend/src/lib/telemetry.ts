import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';
import { metrics, trace } from '@opentelemetry/api';

// Configuração do Resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'zykor-frontend',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// Configuração para diferentes ambientes
const getExporters = () => {
  if (process.env.NODE_ENV === 'production') {
    // Em produção, exportar para serviços como Jaeger, Zipkin, etc.
    return [];
  } else {
    // Em desenvolvimento, usar console
    return [new ConsoleSpanExporter()];
  }
};

// Inicialização do SDK
let sdk: NodeSDK | null = null;

export function initializeTelemetry() {
  if (typeof window !== 'undefined') {
    // Não inicializar no browser
    return;
  }

  if (sdk) {
    // Já inicializado
    return;
  }

  sdk = new NodeSDK({
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Configurações específicas
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Desabilitar instrumentação de filesystem
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          requestHook: (span, request) => {
            span.setAttributes({
              'http.request.header.user-agent': request.headers['user-agent'] || '',
              'zykor.request.id': generateRequestId(),
            });
          },
          responseHook: (span, response) => {
            span.setAttributes({
              'http.response.status_text': response.statusMessage || '',
            });
          },
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
      }),
    ],
    spanProcessor: new BatchSpanProcessor(
      getExporters()[0] || new ConsoleSpanExporter()
    ),
  });

  try {
    sdk.start();
    console.log('🔍 OpenTelemetry iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar OpenTelemetry:', error);
  }
}

// Helper para gerar IDs únicos de request
function generateRequestId(): string {
  return `zykor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Client-side telemetry (para browser)
export class ClientTelemetry {
  private tracer = trace.getTracer('zykor-frontend-client', '1.0.0');
  private meter = metrics.getMeter('zykor-frontend-client', '1.0.0');
  
  // Counters
  private pageViewCounter = this.meter.createCounter('zykor_page_views', {
    description: 'Número de visualizações de página',
  });
  
  private userActionCounter = this.meter.createCounter('zykor_user_actions', {
    description: 'Número de ações do usuário',
  });
  
  private apiCallCounter = this.meter.createCounter('zykor_api_calls', {
    description: 'Número de chamadas de API',
  });
  
  // Histograms
  private pageLoadTime = this.meter.createHistogram('zykor_page_load_time', {
    description: 'Tempo de carregamento da página em milissegundos',
    unit: 'ms',
  });
  
  private apiResponseTime = this.meter.createHistogram('zykor_api_response_time', {
    description: 'Tempo de resposta da API em milissegundos',
    unit: 'ms',
  });

  // Trace de carregamento de página
  tracePageLoad(pageName: string, userId?: string) {
    const span = this.tracer.startSpan('page_load', {
      attributes: {
        'page.name': pageName,
        'user.id': userId || 'anonymous',
        'zykor.component': 'frontend',
      },
    });

    // Medir performance
    const startTime = performance.now();
    
    return {
      end: () => {
        const loadTime = performance.now() - startTime;
        
        span.setAttributes({
          'page.load_time_ms': loadTime,
          'page.load_time_category': this.categorizeLoadTime(loadTime),
        });
        
        // Registrar métricas
        this.pageViewCounter.add(1, {
          page: pageName,
          user_id: userId || 'anonymous',
        });
        
        this.pageLoadTime.record(loadTime, {
          page: pageName,
        });
        
        span.end();
      },
    };
  }

  // Trace de ação do usuário
  traceUserAction(action: string, component: string, userId?: string, metadata?: Record<string, any>) {
    const span = this.tracer.startSpan('user_action', {
      attributes: {
        'user.action': action,
        'ui.component': component,
        'user.id': userId || 'anonymous',
        'zykor.component': 'frontend',
        ...metadata,
      },
    });

    this.userActionCounter.add(1, {
      action,
      component,
      user_id: userId || 'anonymous',
    });

    return {
      addAttribute: (key: string, value: string | number) => {
        span.setAttributes({ [key]: value });
      },
      end: () => span.end(),
    };
  }

  // Trace de chamada de API
  traceApiCall(method: string, url: string, userId?: string) {
    const span = this.tracer.startSpan('api_call', {
      attributes: {
        'http.method': method,
        'http.url': url,
        'user.id': userId || 'anonymous',
        'zykor.component': 'api_client',
      },
    });

    const startTime = performance.now();

    return {
      setResponseStatus: (status: number, statusText?: string) => {
        span.setAttributes({
          'http.status_code': status,
          'http.status_text': statusText || '',
        });
      },
      setError: (error: Error) => {
        span.recordException(error);
        span.setAttributes({
          'error': true,
          'error.message': error.message,
        });
      },
      end: () => {
        const responseTime = performance.now() - startTime;
        
        span.setAttributes({
          'http.response_time_ms': responseTime,
          'http.response_time_category': this.categorizeResponseTime(responseTime),
        });
        
        // Registrar métricas
        this.apiCallCounter.add(1, {
          method,
          url: new URL(url, window.location.origin).pathname,
        });
        
        this.apiResponseTime.record(responseTime, {
          method,
          endpoint: new URL(url, window.location.origin).pathname,
        });
        
        span.end();
      },
    };
  }

  // Trace de erro
  traceError(error: Error, context?: Record<string, any>, userId?: string) {
    const span = this.tracer.startSpan('error_occurred', {
      attributes: {
        'error.type': error.constructor.name,
        'error.message': error.message,
        'user.id': userId || 'anonymous',
        'zykor.component': 'frontend',
        ...context,
      },
    });

    span.recordException(error);
    span.end();
  }

  // Categorizar tempo de carregamento
  private categorizeLoadTime(timeMs: number): string {
    if (timeMs < 1000) return 'fast';
    if (timeMs < 3000) return 'moderate';
    if (timeMs < 5000) return 'slow';
    return 'very_slow';
  }

  // Categorizar tempo de resposta
  private categorizeResponseTime(timeMs: number): string {
    if (timeMs < 100) return 'excellent';
    if (timeMs < 500) return 'good';
    if (timeMs < 1000) return 'acceptable';
    if (timeMs < 2000) return 'slow';
    return 'very_slow';
  }
}

// Instância global do client telemetry
export const clientTelemetry = new ClientTelemetry();

// Hooks para React
export const useTelemetry = () => {
  return {
    tracePageLoad: clientTelemetry.tracePageLoad.bind(clientTelemetry),
    traceUserAction: clientTelemetry.traceUserAction.bind(clientTelemetry),
    traceApiCall: clientTelemetry.traceApiCall.bind(clientTelemetry),
    traceError: clientTelemetry.traceError.bind(clientTelemetry),
  };
};

// Instrumentação automática para fetch (browser)
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    const trace = clientTelemetry.traceApiCall(method, url);
    
    try {
      const response = await originalFetch(input, init);
      trace.setResponseStatus(response.status, response.statusText);
      trace.end();
      return response;
    } catch (error) {
      trace.setError(error as Error);
      trace.end();
      throw error;
    }
  };
}
