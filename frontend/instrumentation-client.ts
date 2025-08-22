import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring (FREE TIER: reduzir para economizar quota)
  tracesSampleRate: 0.1, // 10% das transações
  
  // Session Replay (FREE TIER: reduzir para economizar)
  replaysSessionSampleRate: 0.01, // 1% das sessões
  replaysOnErrorSampleRate: 0.5, // 50% dos erros
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Integrations corretas para Sentry v10+
  integrations: [
    // Usar browserTracingIntegration em vez de BrowserTracing
    Sentry.browserTracingIntegration(),
    // Usar replayIntegration em vez de Replay
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Error Filtering
  beforeSend(event) {
    // Filter out known harmless errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Non-Error promise rejection captured')) {
        return null;
      }
      if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    return event;
  },
  
  // Tags adicionais
  initialScope: {
    tags: {
      component: "frontend",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0",
      platform: "zykor"
    },
  },
});
