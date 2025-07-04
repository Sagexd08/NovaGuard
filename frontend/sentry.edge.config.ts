// This file configures the initialization of Sentry for edge runtime
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://832d65d79a3de6e1919f5145396175df@o4509612247613440.ingest.de.sentry.io/4509612308037712",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure environment
  environment: process.env.NODE_ENV || 'development',

  // Configure release
  release: process.env.VITE_APP_VERSION || '1.0.0',

  // Configure tags
  initialScope: {
    tags: {
      component: 'edge',
      platform: 'edge-runtime',
      app: 'novaguard',
    },
  },
});
