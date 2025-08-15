import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Edge runtime specific configuration
  integrations: [],
  
  // Error Filtering
  beforeSend(event) {
    // Filter edge runtime errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      
      // Filter out known edge runtime issues
      if (error?.value?.includes('Dynamic Code Evaluation')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Context adicional
  initialScope: {
    tags: {
      component: "edge",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      platform: "zykor"
    },
  },
});
