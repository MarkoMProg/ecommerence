# Payment Flow and Message Queue — Architecture Note

**Created:** 2026-03-14  
**Purpose:** Document current payment flow vs task.md message queue requirement.

---

## 1. task.md Requirement

> Publish the payment status to a message queue. The Order Service consumes the message to update the order based on the payment status.
>
> Use message queues (e.g., RabbitMQ, Apache Kafka) for order processing and updates.

---

## 2. Current Implementation

The platform uses a **direct webhook-to-service** flow:

```
Stripe (checkout.session.completed)
    → POST /webhooks/stripe
    → StripeWebhookController.handleStripeWebhook()
    → OrderService.markOrderPaidIfPending()
    → DB update (order status, paidAt, stripeSessionId)
```

**Location:** `apps/backend/src/order/stripe-webhook.controller.ts`

- Stripe sends webhook with signature; we verify it.
- On success, we call `orderService.markOrderPaidIfPending()` synchronously.
- No message queue is involved.

---

## 3. Gap

| Requirement | Status | Notes |
|-------------|--------|-------|
| Publish payment status to message queue | ❌ Not implemented | Webhook updates order directly |
| Order Service consumes message | ❌ N/A | No queue |
| Dead letter queue for failures | ❌ Not implemented | Webhook returns 4xx/5xx on failure; Stripe retries |

---

## 4. Rationale for Current Approach

- **Simplicity:** Single-process monolith; no extra infrastructure.
- **Reliability:** Stripe retries failed webhooks; we return 200 only after DB update succeeds.
- **ACID:** Order update is transactional; no eventual consistency.
- **Scope:** Suitable for MVP and learning project.

---

## 5. Path to Full Compliance

To satisfy the message queue requirement:

1. Add RabbitMQ or Kafka to the stack (e.g. via Docker).
2. In `StripeWebhookController`: verify webhook → publish `{ orderId, sessionId, status }` to queue → return 200.
3. Create a consumer (NestJS microservice or Bull queue processor) that:
   - Consumes messages
   - Calls `OrderService.markOrderPaidIfPending()`
   - Handles retries and dead-letter queue on failure.
4. Configure dead-letter queue for failed messages.

---

## 6. References

- [task.md](../task.md) — Commerce, Payments, Order Management (lines 168–221)
- [stripe-webhook.controller.ts](../../ecom/tshirtshop/apps/backend/src/order/stripe-webhook.controller.ts)
- [order.service.ts](../../ecom/tshirtshop/apps/backend/src/order/order.service.ts)

---

_End of document_
