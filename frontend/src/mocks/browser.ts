import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Configure MSW worker for browser
export const worker = setupWorker(...handlers)

// Start worker in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: {
      url: '/mockServiceWorker.js'
    }
  })
} 