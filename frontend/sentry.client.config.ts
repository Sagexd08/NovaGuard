// This file configures the initialization of Sentry on the browser/client side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://832d65d79a3de6e1919f5145396175df@o4509612247613440.ingest.de.sentry.io/4509612308037712",
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],

  // Enable logging in Sentry
  _experiments: {
    enableLogs: true,
  },

  // Configure environment
  environment: process.env.NODE_ENV || 'development',

  // Configure release
  release: process.env.VITE_APP_VERSION || '1.0.0',

  // Configure tags
  initialScope: {
    tags: {
      component: 'frontend',
      platform: 'web',
      app: 'novaguard',
    },
  },

  // Configure beforeSend to filter out unwanted errors
  beforeSend(event, hint) {
    // Filter out network errors that are not actionable
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out common browser extension errors
        if (message.includes('Non-Error promise rejection captured') ||
            message.includes('ResizeObserver loop limit exceeded') ||
            message.includes('Script error')) {
          return null;
        }
      }
    }

    return event;
  },
});
