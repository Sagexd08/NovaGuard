// This file configures the initialization of Sentry on the server side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://832d65d79a3de6e1919f5145396175df@o4509612247613440.ingest.de.sentry.io/4509612308037712",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Integrations for server-side
  integrations: [
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
      component: 'backend',
      platform: 'server',
      app: 'novaguard',
    },
  },

  // Configure beforeSend to filter out unwanted errors
  beforeSend(event, hint) {
    // Filter out development-only errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.exception) {
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = error.message as string;
          
          // Filter out common development errors
          if (message.includes('ENOENT') && message.includes('.env')) {
            return null;
          }
        }
      }
    }

    return event;
  },
});
