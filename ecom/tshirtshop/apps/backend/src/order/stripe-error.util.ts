/**
 * Maps Stripe API errors to stable error codes and user-facing messages.
 * Used for checkout, verify-payment, and refund flows.
 *
 * Stripe error types: StripeCardError, StripeInvalidRequestError,
 * StripeApiConnectionError, StripeRateLimitError, StripeAuthenticationError.
 * See: https://stripe.com/docs/error-handling
 */

export interface MappedStripeError {
  code: string;
  userMessage: string;
}

/** Check if error is a Stripe SDK error (has type/code). */
function isStripeError(
  err: unknown,
): err is { type?: string; code?: string; message?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('type' in err || 'code' in err) &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

/**
 * Map Stripe error to our stable code and user-facing message.
 * Returns null if not a Stripe error (caller should use original error).
 */
export function mapStripeError(err: unknown): MappedStripeError | null {
  if (!isStripeError(err)) return null;

  const code = (err.code ?? '').toLowerCase();
  const type = String((err as { type?: string }).type ?? '').toLowerCase();
  const message = err.message ?? 'Payment service error';

  // Card errors (typically from Payment Intents / refunds; Checkout handles most on their page)
  if (type === 'card_error' || code === 'card_declined') {
    return {
      code: 'CARD_DECLINED',
      userMessage:
        'Your card was declined. Please try another card or contact your bank.',
    };
  }
  if (code === 'insufficient_funds') {
    return {
      code: 'INSUFFICIENT_FUNDS',
      userMessage:
        'Insufficient funds. Please try another card or payment method.',
    };
  }
  if (code === 'expired_card') {
    return {
      code: 'EXPIRED_CARD',
      userMessage: 'Your card has expired. Please use a different card.',
    };
  }
  if (code === 'incorrect_cvc' || code === 'invalid_cvc') {
    return {
      code: 'INVALID_CVC',
      userMessage: 'Invalid security code. Please check and try again.',
    };
  }
  if (code === 'incorrect_number' || code === 'invalid_number') {
    return {
      code: 'INVALID_CARD',
      userMessage: 'Invalid card number. Please check and try again.',
    };
  }

  // Gateway / network errors
  if (type === 'api_connection_error' || code === 'api_connection_error') {
    return {
      code: 'GATEWAY_TIMEOUT',
      userMessage:
        'Payment service is temporarily unavailable. Please try again in a few minutes.',
    };
  }
  if (type === 'rate_limit_error' || code === 'rate_limit_error') {
    return {
      code: 'GATEWAY_ERROR',
      userMessage: 'Too many requests. Please wait a moment and try again.',
    };
  }
  if (type === 'api_error' || code === 'api_error') {
    return {
      code: 'GATEWAY_ERROR',
      userMessage:
        'Payment service encountered an error. Please try again in a few minutes.',
    };
  }

  // Invalid request (e.g. resource not found)
  if (type === 'invalid_request_error') {
    if (
      code === 'resource_missing' ||
      message.toLowerCase().includes('no such')
    ) {
      return {
        code: 'SESSION_NOT_FOUND',
        userMessage:
          'This payment session is invalid or expired. Please place your order again.',
      };
    }
    return {
      code: 'INVALID_REQUEST',
      userMessage: message,
    };
  }

  // Authentication (misconfiguration)
  if (type === 'authentication_error') {
    return {
      code: 'GATEWAY_ERROR',
      userMessage: 'Payment configuration error. Please contact support.',
    };
  }

  // Fallback for unknown Stripe errors
  return {
    code: 'GATEWAY_ERROR',
    userMessage:
      'Payment service encountered an error. Please try again in a few minutes.',
  };
}
