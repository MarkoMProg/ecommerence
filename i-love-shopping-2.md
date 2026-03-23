The README file contains updated project overview, entity relationship diagram, setup instructions, and usage guide for the commerce functionality

The database schema includes tables and relationships to support the shopping cart functionality, including guest carts and persistent carts for logged-in users.

The shopping cart displays product information for each item, including name, price, and a thumbnail image.

Users can add, remove, and update quantities of items in the cart with real-time total calculations.

A guest cart is implemented for non-registered users, saving their selections temporarily.

A persistent cart is implemented for logged-in users, retaining items across sessions.

The system handles out-of-stock scenarios gracefully when users attempt to add items to the cart.

The system implements a single-page checkout process.

The checkout page collects basic information, address input, and payment selection.

For logged-in users, known information is pre-filled in the checkout form.

The system validates entered shipping address for accuracy.

An order summary is provided during checkout, displaying all items, quantities, and costs.

The system sends an email confirmation to the user after a successful order placement.

The checkout process handles and displays appropriate error messages for invalid inputs or failed transactions.

Verify specific error messages for: missing required fields, invalid formats (email, phone, address), payment validation, and network errors.

The payment system integrates with Stripe, PayPal or other similar simulation sandbox APIs.

The payment form uses the payment provider's secure form elements instead of handling card details directly.

The card validation system checks number format, expiry date, and CVV before form submission.

Student can explain the concept of PCI DSS compliance and why sensitive payment data should not be stored on application servers.

The order system updates status appropriately upon receiving callbacks from payment provider (successful or failed payments).

The payment system publishes status updates to a message queue.

The notification system sends appropriate emails for both successful and failed payment scenarios.

The payment system responds to specific failure scenarios.

System must handle: insufficient funds error, invalid card number error, expired card error, and payment gateway timeout

The inventory system prevents overselling during concurrent payments.

Multiple simultaneous payments for the same product should not result in overselling inventory

The order filtering system allows users to sort by date and order status.

The order details page displays full order information including status updates.

The order cancellation system allows cancellations for unprocessed orders.

The inventory system updates stock levels when orders are placed or cancelled.

All sensitive data stored in database is encrypted at rest for order and payment data.

Check encryption implementation for: order details, shipping addresses, and payment transaction records

Student can explain their approach to testing cart functionality, checkout flows, and payment integration.

Automated tests exist for Unit tests (cart functionality, order calculations) and Critical User Flow tests (registration, checkout process).

Ask the student to explain and demonstrate the functionality of the tests.

Extra
Shopping cart implementation quality, user experience, and data persistence across guest/logged-in scenarios.

Checkout process flow, error handling, and user guidance throughout the payment journey.

Payment integration security, transaction handling, and proper response to various payment scenarios.

Order management functionality, status tracking, and message queue implementation.

Project application is containerized using Docker.

The project uses Docker to containerize the application and its dependencies. Host prerequisites are limited to Docker and payment simulation CLI - all other dependencies are managed within containers.
