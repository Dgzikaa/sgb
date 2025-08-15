import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Integration específicas
  integrations: [
    // Browser integrations
    new Sentry.BrowserTracing({
      // Trace navigation and interactions
      tracePropagationTargets: [
        "localhost",
        "zykor.com.br",
        /^https:\/\/zykor\.com\.br\/api/,
      ],
    }),
    new Sentry.Replay({
      // Mask all text content and images
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
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      platform: "zykor"
    },
  },
});
