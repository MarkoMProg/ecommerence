/**
 * Unit tests for Stripe error mapping (payment failure scenarios).
 */
import { mapStripeError } from '../stripe-error.util';

describe('mapStripeError', () => {
  it('returns null for non-Stripe errors', () => {
    expect(mapStripeError(new Error('generic'))).toBeNull();
    expect(mapStripeError('string')).toBeNull();
    expect(mapStripeError(null)).toBeNull();
  });

  it('maps card_declined to CARD_DECLINED', () => {
    const result = mapStripeError({
      code: 'card_declined',
      type: 'card_error',
      message: 'Declined',
    });
    expect(result).toEqual({
      code: 'CARD_DECLINED',
      userMessage:
        'Your card was declined. Please try another card or contact your bank.',
    });
  });

  it('maps insufficient_funds to INSUFFICIENT_FUNDS', () => {
    const result = mapStripeError({
      code: 'insufficient_funds',
      message: 'Insufficient',
    });
    expect(result?.code).toBe('INSUFFICIENT_FUNDS');
    expect(result?.userMessage).toContain('Insufficient funds');
  });

  it('maps expired_card to EXPIRED_CARD', () => {
    const result = mapStripeError({ code: 'expired_card', message: 'Expired' });
    expect(result?.code).toBe('EXPIRED_CARD');
    expect(result?.userMessage).toContain('expired');
  });

  it('maps api_connection_error to GATEWAY_TIMEOUT', () => {
    const result = mapStripeError({
      type: 'api_connection_error',
      message: 'Network',
    });
    expect(result?.code).toBe('GATEWAY_TIMEOUT');
    expect(result?.userMessage).toContain('temporarily unavailable');
  });

  it('maps rate_limit_error to GATEWAY_ERROR', () => {
    const result = mapStripeError({
      type: 'rate_limit_error',
      message: 'Too many',
    });
    expect(result?.code).toBe('GATEWAY_ERROR');
    expect(result?.userMessage).toContain('Too many requests');
  });

  it('maps resource_missing to SESSION_NOT_FOUND', () => {
    const result = mapStripeError({
      type: 'invalid_request_error',
      code: 'resource_missing',
      message: 'No such checkout.session',
    });
    expect(result?.code).toBe('SESSION_NOT_FOUND');
  });
});
