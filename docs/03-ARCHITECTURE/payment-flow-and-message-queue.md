# Payment Flow and Message Queue — Architecture Note

**Created:** 2026-03-14  
**Updated:** 2026-03-17  
**Purpose:** Document payment flow, message queue implementation, success email, and order filter/sort.

---

## 1. Queue Event Published After Successful Payment

**Status:** ✅ Implemented (BullMQ)

The Stripe webhook publishes payment success to a BullMQ queue before any order update. The processor consumes the message and marks the order paid.

```
Stripe (checkout.session.completed)
    → POST /webhooks/stripe
    → StripeWebhookController.handleStripeWebhook()
    → Verify signature via StripeService.handleWebhookEvent()
    → paymentQueue.add('payment.success', { orderId, sessionId })
    → Return 200 immediately
    →
    PaymentEventsProcessor (async)
    → OrderService.markOrderPaidIfPending()
    → DB update (order status, paidAt, stripeSessionId)
    → paymentQueue.add('payment.notify', { orderId })  // email job
```

**Locations:**
- `apps/backend/src/order/stripe-webhook.controller.ts` — webhook handler, queue publish
- `apps/backend/src/order/payment-events.processor.ts` — BullMQ processor
- `apps/backend/src/order/order.service.ts` — markOrderPaidIfPending, payment.notify enqueue

---

## 2. Event Schema and Retry/Dead-Letter Handling

### Job: `payment.success`

| Field    | Type   | Required | Description                    |
|----------|--------|----------|--------------------------------|
| orderId  | string | yes      | Order UUID                     |
| sessionId| string | no       | Stripe Checkout Session ID     |

**Retry config:**
- `attempts: 5`
- `backoff: { type: 'exponential', delay: 2000 }`
- `removeOnComplete: { count: 1000 }`
- `removeOnFail: false` — failed jobs kept for inspection (Bull Board at `/admin/queues`)

### Job: `payment.notify`

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| orderId | string | yes      | Order UUID  |

Same retry config as `payment.success`. Sends order confirmation email to the order owner (registered users only; guest orders have no stored email).

---

## 3. Success Email After Payment

**Status:** ✅ Implemented

When an order is marked paid (`markOrderPaidIfPending`), the service enqueues a `payment.notify` job. The processor calls `OrderService.triggerOrderNotification()`, which:

1. Fetches the order by ID
2. Looks up the user's email (requires `userId` — guest orders are skipped)
3. Calls `EmailService.sendOrderConfirmationEmail()` with order details

**Locations:**
- `order.service.ts` lines 268–281 — enqueue after marking paid
- `payment-events.processor.ts` lines 33–40 — process payment.notify
- `email.service.ts` — `sendOrderConfirmationEmail()` (HTML + text templates)

Email failures are logged but do not affect the checkout flow. The queue provides retries.

---

## 4. Verify-Payment Path (Client-Side Redirect)

When the user returns from Stripe with `session_id` in the URL, the frontend calls `POST /api/v1/checkout/verify-payment`. This path:

1. Verifies the session via Stripe
2. Calls `OrderService.markOrderPaidIfPending()` directly (no queue for the mark-paid step)
3. `markOrderPaidIfPending` still enqueues `payment.notify` for the confirmation email

So both webhook and verify-payment paths trigger the success email via the queue.

---

## 5. Order History Filter and Sort

**Status:** ✅ Implemented

**API:** `GET /api/v1/orders?status=paid&sort=date-desc`

| Param  | Values                                      | Description                    |
|--------|---------------------------------------------|--------------------------------|
| status | `all`, `pending`, `paid`, `shipped`, `completed`, `cancelled`, `refunded` | Filter by order status |
| sort   | `date-desc`, `date-asc`                     | Newest first (default) or oldest first |

**Locations:**
- `apps/backend/src/order/orders.controller.ts` — `getMyOrders()` accepts `status`, `sort`
- `apps/backend/src/order/order.service.ts` — `getOrdersByUserId()` applies filter and sort
- `apps/web/app/account/orders/page.tsx` — UI dropdowns for status filter and date sort
- `apps/web/lib/api/orders.ts` — `fetchMyOrders({ status, sort })`

---

## 6. References

- [task.md](../task.md) — Commerce, Payments, Order Management
- [stripe-webhook.controller.ts](../../ecom/tshirtshop/apps/backend/src/order/stripe-webhook.controller.ts)
- [payment-events.processor.ts](../../ecom/tshirtshop/apps/backend/src/order/payment-events.processor.ts)
- [order.service.ts](../../ecom/tshirtshop/apps/backend/src/order/order.service.ts)
- [email.service.ts](../../ecom/tshirtshop/apps/backend/src/email/email.service.ts)

---

_End of document_
