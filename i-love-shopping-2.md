The README file contains updated project overview, entity relationship diagram, setup instructions, and usage guide for the commerce functionality

**It does. The README covers the full project including cart, checkout, and order management, with setup steps and links to the ERD in the docs folder.**

The database schema includes tables and relationships to support the shopping cart functionality, including guest carts and persistent carts for logged-in users.

**Yes it does. The cart table has a nullable userId field — when userId is NULL it is a guest cart identified by a UUID stored in a cookie, and when userId is set it is a persistent cart for a logged-in user. The cart_item table links to cart with cascade delete and has a unique index on cartId, productId, and selectedOption to prevent duplicate entries.**

The shopping cart displays product information for each item, including name, price, and a thumbnail image.

**It does. Each cart item returns the product name, price in cents, and the primary product image as a thumbnail. The frontend calculates and displays the line total per item and the cart subtotal in real time.**

Users can add, remove, and update quantities of items in the cart with real-time total calculations.

**Yes. There are dedicated endpoints for adding an item, removing an item, and updating the quantity of an item. The frontend recalculates totals immediately on any change without a page reload.**

A guest cart is implemented for non-registered users, saving their selections temporarily.

**It is. When a guest adds to cart a UUID is generated and returned in the x-cart-id response header, which the frontend stores in a cookie. The guest cart persists for that browsing session and is identified by that UUID on every request.**

A persistent cart is implemented for logged-in users, retaining items across sessions.

**Yes. Logged-in users have their cart linked to their userId in the database so it survives across sessions and devices. When a user logs in their guest cart is automatically merged into their account cart by combining quantities, and the guest cart is deleted after the merge.**

The system handles out-of-stock scenarios gracefully when users attempt to add items to the cart.

**It does. Before adding or updating an item the backend calls assertSufficientStock which aggregates the current cart quantity for that product across all options and checks it against the stock level. If there is not enough stock it throws a BadRequestException with the code INSUFFICIENT_STOCK and the frontend displays an appropriate message to the user.**

The system implements a single-page checkout process.

**Yes it is a single-page checkout. The user fills in their shipping address, selects a delivery method, and optionally applies a coupon all on one page. Submitting creates the order and redirects to Stripe Checkout for payment, then brings the user back to the confirmation page.**

The checkout page collects basic information, address input, and payment selection.

**It collects full name, street address line 1 and optional line 2, city, state or province, postal code, country, and an optional phone number. Delivery method is selected from admin-configured options like standard or express. Payment is handled by Stripe Checkout so no card details are entered on the page.**

For logged-in users, known information is pre-filled in the checkout form.

**If the logged-in user has a Stripe customer ID saved, Stripe Checkout will display their saved payment methods and pre-fill the email. The shipping address fields on the checkout page are pre-populated from the user's most recently used address if one exists in their order history.**

The system validates entered shipping address for accuracy.

**Yes. The validateShippingAddress function checks that required fields are present and within length limits, strips control characters and null bytes, rejects any HTML content to prevent injection, validates the phone number format requiring at least 10 digits, validates the country against a supported countries whitelist, and validates the postal code format for the selected country. Any validation failure returns a field-level error message.**

An order summary is provided during checkout, displaying all items, quantities, and costs.

**It is. There is a GET /api/v1/checkout/summary endpoint that returns all cart items with names, quantities, and prices, the selected delivery option and its cost, any applied coupon discount, and the total. The frontend renders this as a live order summary panel on the checkout page.**

The system sends an email confirmation to the user after a successful order placement.

**Yes. When the Stripe webhook confirms payment the backend enqueues a payment.notify job in BullMQ. The processor then calls EmailService.sendOrderConfirmationEmail using Resend as the email provider. For logged-in users the email goes to their stored address and for guests it comes from the Stripe session customer_details.email field.**

The checkout process handles and displays appropriate error messages for invalid inputs or failed transactions.

**It does. Address validation returns field-level errors that the frontend maps to inline messages next to each input. Payment errors returned from Stripe are mapped to user-friendly messages by a stripe-error utility, and network errors show a generic retry message. If the Stripe session expires before payment the user is sent back to checkout with a session expired message.**

Verify specific error messages for: missing required fields, invalid formats (email, phone, address), payment validation, and network errors.

**Missing required fields show "This field is required". Invalid phone shows "Phone number must contain at least 10 digits". Invalid postal code shows a format-specific message per country. On the payment side, an invalid card shows "Your card number is invalid", expired card shows "Your card has expired", insufficient funds shows "Your card has insufficient funds", and a gateway timeout shows "Payment service is temporarily unavailable, please try again".**

The payment system integrates with Stripe, PayPal or other similar simulation sandbox APIs.

**It integrates with Stripe. The backend uses the Stripe Node SDK to create Checkout Sessions. In development the Stripe test mode keys are used so you can test with Stripe's test card numbers like 4242424242424242 without real charges. The Stripe CLI is used locally to forward webhooks to the dev server.**

The payment form uses the payment provider's secure form elements instead of handling card details directly.

**Yes. The user is redirected to Stripe's hosted Checkout page where all card entry happens inside Stripe's iframe. The application never sees or handles the raw card number, expiry, or CVV at any point. This is exactly why we chose Stripe Checkout — it keeps us completely out of scope for PCI DSS.**

The card validation system checks number format, expiry date, and CVV before form submission.

**Stripe's Checkout form handles all of this client-side before the payment is submitted. It validates the card number using the Luhn algorithm, checks that the expiry date is in the future, and requires a CVV. The backend the verifySession call also cross-checks that the amount Stripe charged matches the order total to prevent any tampering.**

Student can explain the concept of PCI DSS compliance and why sensitive payment data should not be stored on application servers.

**PCI DSS stands for Payment Card Industry Data Security Standard and it is a set of rules that any business handling cardholder data must follow. The core reason not to store card data on your own servers is that it makes you a high-value target — a breach would expose card numbers, and the compliance requirements to store it safely (encryption, access control, audit logging, penetration testing) are extremely costly. By using Stripe Checkout we achieve SAQ A compliance which is the simplest level, meaning Stripe takes on full responsibility for card data and the system is completely out of scope. The server only ever sees a Stripe session ID and payment intent reference, never any card details.**

The order system updates status appropriately upon receiving callbacks from payment provider (successful or failed payments).

**Yes. Stripe sends webhooks to the POST /api/v1/stripe/webhook endpoint. The checkout.session.completed event triggers a payment.success job which calls markOrderPaidIfPending and transitions the order from pending to paid. The checkout.session.expired and checkout.session.async_payment_failed events trigger a payment.failed job. The webhook controller validates the Stripe-Signature header using the webhook secret before processing any event.**

The payment system publishes status updates to a message queue.

**It does. I use BullMQ backed by Redis with a queue called payment-events. When the Stripe webhook arrives the controller immediately enqueues a job and returns 200 to Stripe, then the processor handles it asynchronously. This means webhook processing is decoupled from the HTTP response and can be retried independently. The three job types are payment.success, payment.notify, and payment.failed each with exponential backoff retry policies.**

The notification system sends appropriate emails for both successful and failed payment scenarios.

**Yes. On success the payment.notify job sends an order confirmation email via Resend. On failure the payment.failed job sends a payment failed email that includes a link for the user to retry their purchase. Both emails are sent through the same EmailService using Resend as the provider. Email failures are fire-and-forget and do not block order processing.**

The payment system responds to specific failure scenarios.

**All four scenarios are handled. Insufficient funds maps to INSUFFICIENT_FUNDS with the message "Your card has insufficient funds". An invalid card number maps to INVALID_CARD with "Your card number is invalid". An expired card maps to EXPIRED_CARD with "Your card has expired". A gateway timeout maps to GATEWAY_TIMEOUT with "Payment service is temporarily unavailable, please try again". These mappings live in stripe-error.util.ts and cover all major Stripe error codes.**

The inventory system prevents overselling during concurrent payments.

**Yes. When a payment is confirmed the markOrderPaidIfPending function runs inside a database transaction. Products are locked in a consistent order by ID to prevent deadlocks. Only after the locks are held does it check and decrement stock. If concurrent payments race for the last unit, only one transaction will succeed and the other will see zero stock.**

Multiple simultaneous payments for the same product should not result in overselling inventory

**This is guaranteed by the locking mechanism. If a payment confirms and stock allocation fails because another transaction just took the last unit, the order is moved to an oversold status rather than being marked paid. The payment has already been captured by Stripe at that point so an automatic refund is triggered via tryRefundOversoldOrder and the stripeRefundId is stored to prevent double-refunding.**

The order filtering system allows users to sort by date and order status.

**It does. The GET /api/v1/orders endpoint accepts an optional status query parameter to filter by a specific order status like paid, shipped, or completed, and an optional sort parameter that accepts date-asc or date-desc, defaulting to date-desc so the most recent orders appear first.**

The order details page displays full order information including status updates.

**Yes. The order details page shows the order ID, current status, order date, all line items with product name, quantity, selected size option, and price at time of purchase, the decrypted shipping address, the delivery method, any applied coupon, and the full cost breakdown including subtotal, shipping, and total.**

The order cancellation system allows cancellations for unprocessed orders.

**It does. Pending orders that have not yet been paid can be cancelled directly with a status change to cancelled. Paid orders that have not yet shipped can also be cancelled, which automatically issues a full Stripe refund, stores the stripeRefundId to prevent duplicate refunds, and updates the refundedAt timestamp. Orders that are already shipped or completed cannot be cancelled through the standard cancellation endpoint. Ownership is enforced so users can only cancel their own orders.**

The inventory system updates stock levels when orders are placed or cancelled.

**Yes. When an order is marked paid the decrementStockForOrderWithTx function atomically reduces stock for every item in the order within the same transaction. When an order is cancelled or refunded and it was previously in a paid status, incrementStockForOrder restores the stock for each item. This means the stock level is always accurate and reflects only items in active paid orders.**

All sensitive data stored in database is encrypted at rest for order and payment data.

**It is. All shipping address fields on the order record are encrypted using AES-256-GCM with a 256-bit key from the ENCRYPTION_KEY environment variable. Each field gets a random 12-byte IV so the same address produces a different ciphertext each time, stored as iv:authtag:ciphertext. Payment card data is never stored at all since Stripe handles it. User emails are also encrypted using the same algorithm in the auth module.**

Check encryption implementation for: order details, shipping addresses, and payment transaction records

**Shipping addresses: all eight fields including full name, both address lines, city, state, postal code, country, and phone are encrypted before INSERT and decrypted on read. Order details like product names, quantities, and prices are stored plaintext as they are not sensitive personal data. Payment transaction records: we only store the Stripe Session ID and Stripe Refund ID which are references and not sensitive data, so they do not require encryption.**

Student can explain their approach to testing cart functionality, checkout flows, and payment integration.

**For cart there are DTO validation tests and API integration tests that cover adding, updating, removing items and the stock validation logic. For orders there are unit tests for markOrderPaidIfPending covering the pending to paid transition, the pending to oversold race condition, and idempotency. There are encryption round-trip tests that verify all shipping fields encrypt and decrypt correctly and that the same input produces different ciphertexts. There are Stripe error mapping tests for all the failure codes. For E2E there are Playwright tests that run the full checkout flow in the browser with the E2E_SKIP_STRIPE_CHECKOUT flag for Continuous Integration.**

Automated tests exist for Unit tests (cart functionality, order calculations) and Critical User Flow tests (registration, checkout process).

**Yes. Unit tests cover cart DTO validation, order service payment processing, order encryption, order filtering, and Stripe error mapping. Integration tests cover the cart API and full order API. E2E Playwright tests cover the checkout flow from adding items to cart through order confirmation. The backend tests run with npm test using Jest and the E2E tests run with npm run test:e2e using Playwright.**

Ask the student to explain and demonstrate the functionality of the tests.

**The order.service.spec.ts tests mock the database, inventory service, Stripe service, and BullMQ queue to isolate the markOrderPaidIfPending logic. One test verifies that when stock is available the order transitions to paid and a payment.notify job is enqueued. Another verifies that when stock runs out during the transaction the order goes to oversold and a refund is triggered. The order.encryption.spec.ts tests verify the round-trip by encrypting an address, reading it back, and asserting the decrypted values match the originals. The stripe-error.util.spec.ts tests pass in mocked Stripe error objects and assert the correct user-facing error codes and messages come out.**

Extra
Shopping cart implementation quality, user experience, and data persistence across guest/logged-in scenarios.

**The cart supports both guest and authenticated users. Guest carts use a UUID cookie and persist for the browser session. On login the guest cart is automatically merged into the user's cart so nothing is lost. The cart validates stock in real time on every add and update. The unique index on cartId, productId, and selectedOption ensures no duplicate entries so quantity always accurately reflects what the user intends.**

Checkout process flow, error handling, and user guidance throughout the payment journey.

**The checkout is a single page where the user enters their shipping address, selects delivery, and optionally applies a coupon. Validation runs before submission with field-level inline error messages. After submission the user is redirected to Stripe Checkout which handles the payment securely. On return the verify-payment endpoint confirms the session and the user lands on a confirmation page. If they abandon the Stripe page a payment failed email is sent with a retry link. Every step has clear error states and recovery paths.**

Payment integration security, transaction handling, and proper response to various payment scenarios.

**Stripe Checkout is used so card data never touches the servers, giving a SAQ A personal data compliance. Webhooks are verified using the Stripe-Signature header before any processing happens. Payment events are handled asynchronously through BullMQ with retry policies so temporary failures do not cause missed notifications. The amount is verified on the verify-payment path to prevent session tampering. Refunds store the stripeRefundId to be idempotent against webhook retries.**

Order management functionality, status tracking, and message queue implementation.

**Orders move through a seven-state lifecycle: pending, paid, oversold, shipped, completed, cancelled, and refunded. Stock is decremented at payment time and the oversold state handles the rare case where concurrent payments exhaust stock after capture. BullMQ with Redis manages three job types for payment processing and notifications, each with exponential backoff. Cancellations trigger automatic Stripe refunds and stock restoration. All order operations enforce ownership so users can only act on their own orders.**

Project application is containerized using Docker.

**Yes. Docker is the only prerequisite on the host machine. A single command brings up all services including the Next.js frontend, NestJS backend, PostgreSQL database, and Redis for BullMQ. The Stripe CLI for local webhook forwarding is the only additional tool needed for payment testing, and it runs as a separate container in the dev compose file.**
