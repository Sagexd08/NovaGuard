// Sentry utilities and examples for NovaGuard
import * as Sentry from "@sentry/nextjs";

// Get the logger instance
const { logger } = Sentry;

// Export logger for use throughout the app
export { logger };

/**
 * Capture an exception and log it to Sentry
 * Use this in try-catch blocks or areas where exceptions are expected
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Create a custom span for UI interactions
 * Use for meaningful actions like button clicks, form submissions
 */
export const trackUIAction = (
  actionName: string,
  operation: string,
  attributes?: Record<string, any>,
  callback?: () => void | Promise<void>
) => {
  return Sentry.startSpan(
    {
      op: operation,
      name: actionName,
    },
    async (span) => {
      // Add attributes to the span
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Execute the callback if provided
      if (callback) {
        await callback();
      }

      return span;
    }
  );
};

/**
 * Create a custom span for API calls
 * Use for tracking performance of external API requests
 */
export const trackAPICall = async <T>(
  method: string,
  endpoint: string,
  apiCall: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> => {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `${method.toUpperCase()} ${endpoint}`,
    },
    async (span) => {
      // Add default attributes
      span.setAttribute("http.method", method.toUpperCase());
      span.setAttribute("http.url", endpoint);

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      try {
        const startTime = Date.now();
        const result = await apiCall();
        const duration = Date.now() - startTime;
        
        span.setAttribute("http.status_code", 200);
        span.setAttribute("http.response_time_ms", duration);
        
        return result;
      } catch (error) {
        span.setAttribute("http.status_code", 500);
        span.setAttribute("error", true);
        
        if (error instanceof Error) {
          span.setAttribute("error.message", error.message);
        }
        
        throw error;
      }
    }
  );
};

/**
 * Track smart contract audit operations
 */
export const trackAuditOperation = (
  operationType: string,
  contractAddress?: string,
  network?: string,
  attributes?: Record<string, any>
) => {
  return Sentry.startSpan(
    {
      op: "audit.operation",
      name: `Smart Contract ${operationType}`,
    },
    (span) => {
      // Add audit-specific attributes
      if (contractAddress) {
        span.setAttribute("contract.address", contractAddress);
      }
      if (network) {
        span.setAttribute("blockchain.network", network);
      }
      
      span.setAttribute("audit.operation", operationType);

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      return span;
    }
  );
};

/**
 * Track payment operations
 */
export const trackPaymentOperation = (
  operation: string,
  amount?: number,
  currency?: string,
  planId?: string,
  attributes?: Record<string, any>
) => {
  return Sentry.startSpan(
    {
      op: "payment.operation",
      name: `Payment ${operation}`,
    },
    (span) => {
      // Add payment-specific attributes
      span.setAttribute("payment.operation", operation);
      
      if (amount) {
        span.setAttribute("payment.amount", amount);
      }
      if (currency) {
        span.setAttribute("payment.currency", currency);
      }
      if (planId) {
        span.setAttribute("payment.plan_id", planId);
      }

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      return span;
    }
  );
};

/**
 * Log structured messages with different severity levels
 */
export const logMessage = {
  trace: (message: string, context?: Record<string, any>) => {
    logger.trace(message, context);
  },
  
  debug: (message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  },
  
  info: (message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  },
  
  warn: (message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  },
  
  error: (message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  },
  
  fatal: (message: string, context?: Record<string, any>) => {
    logger.fatal(message, context);
  },
};

/**
 * Example usage functions (for reference)
 */
export const examples = {
  // UI Component tracking
  handleButtonClick: () => {
    trackUIAction(
      "Audit Button Click",
      "ui.click",
      {
        component: "AuditButton",
        section: "dashboard",
      },
      () => {
        // Button click logic here
        logMessage.info("User initiated smart contract audit", {
          userId: "user_123",
          timestamp: new Date().toISOString(),
        });
      }
    );
  },

  // API call tracking
  fetchUserData: async (userId: string) => {
    return trackAPICall(
      "GET",
      `/api/users/${userId}`,
      async () => {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        return data;
      },
      {
        userId,
        source: "dashboard",
      }
    );
  },

  // Smart contract audit tracking
  auditContract: (contractAddress: string, network: string) => {
    return trackAuditOperation(
      "Analysis",
      contractAddress,
      network,
      {
        auditType: "security",
        automated: true,
      }
    );
  },

  // Payment tracking
  processPayment: (amount: number, planId: string) => {
    return trackPaymentOperation(
      "Create Order",
      amount,
      "INR",
      planId,
      {
        provider: "razorpay",
        environment: "production",
      }
    );
  },
};

// Export Sentry for direct use when needed
export { Sentry };
