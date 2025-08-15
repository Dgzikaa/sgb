import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Server-specific integrations
  integrations: [
    new Sentry.Http({ tracing: true }),
    new Sentry.Express({ app: undefined }),
  ],
  
  // Error Filtering
  beforeSend(event) {
    // Filter server-side errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      
      // Filter out known harmless server errors
      if (error?.value?.includes('ECONNRESET')) {
        return null;
      }
      if (error?.value?.includes('ENOTFOUND')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Context adicional
  initialScope: {
    tags: {
      component: "backend",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      platform: "zykor"
    },
  },
});
