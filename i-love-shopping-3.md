The README file contains complete project overview, entity relationship diagram, performance analysis report, setup instructions, and usage guide

**It does. The README covers the full platform including auth, catalog, cart, checkout, and order management, links to the ERD in the docs folder, and includes a performance analysis section with load test results showing the system's behaviour under stress.**

Star rating system is implemented with the average star rating calculated from all reviews.

**Yes. Reviews use a 1 to 5 integer rating and the average is calculated using a SQL aggregate with round(avg(review.rating)::numeric, 1) with a coalesce fallback to 0 so products with no reviews show 0. The getProductsRatingStats method batches the aggregation across multiple products at once to avoid N+1 queries when listing the shop.**

The review system allows users to submit text reviews for purchased products.

**It does. Reviews have an optional title up to 100 characters and a required body up to 2000 characters. Before a user can submit a review the hasPurchasedProduct check confirms they have a paid, shipped, or completed order containing that product — if not they get a PURCHASE_REQUIRED error. A unique index on the product and user combination means one review per product per user. All text is sanitised server-side by stripping HTML and control characters.**

The review sorting system orders reviews by helpfulness votes.

**Yes. There is a review_helpful_vote table with a unique constraint per user per review so each user can only vote once. A helpfulCount field on the review record is updated after every vote. Reviews are sorted by helpfulCount descending then createdAt descending by default. Users cannot vote on their own reviews — the backend returns a SELF_VOTE error if they try.**

The system enforces 2FA for all admin accounts.

**Admin accounts are enforced to enable 2FA, they are unable to access the admin side of the website unless they have 2FA enabled. The twoFactorEnabled field is visible in the admin user list so it is easy to verify which accounts have it active. 2FA uses Better Auth's twoFactor plugin with a 6-digit TOTP code and backup codes.**

The product management system allows CRUD operations for products with all required fields.

**Yes. Admins can create products with name, description, priceCents, categoryId, brand, stockQuantity, weight and dimensions in both metric and imperial, sizeOptions, material, fit, careInstructions, and multiple images. Slugs are auto-generated from the name with a 6-character UUID to ensure uniqueness. Products can be updated via PATCH which supports all fields including isArchived for soft deletion, and hard deleted via DELETE which cascades to images and reviews.**

Admins can add, edit, delete, update and manage products, categories, orders and refunds

**Yes. The admin panel has full CRUD for products and categories. For orders, admins can list all orders, update order status through allowed transitions (for example pending to paid, paid to shipped), and issue full Stripe refunds via a dedicated refund endpoint that calls Stripe and updates the order status to refunded. Categories support a parentCategoryId for nested hierarchies and the delete endpoint checks for in-use categories before allowing deletion.**

Admins can manage delivery options and order status updates.

**They can. There is a GET and PUT endpoint at /api/v1/admin/delivery, each with a label, priceCents, sortOrder, active flag, and isDefault flag. Admins can also set the freeShippingThresholdCents for order-level free shipping. Order status updates go through the PATCH /api/v1/admin/orders/:orderId/status endpoint which validates the transition is allowed before applying it.**

Admins can view all users and assign roles.

**Yes. The GET /api/v1/admin/users endpoint returns a paginated list of all users with their id, name, email, emailVerified, twoFactorEnabled, role, banned status, banReason, order count, and timestamps. Emails and names are decrypted from encrypted storage before being returned. Role assignment is managed through the role column on the user table and is enforced throughout the backend by the AdminGuard.**

Platform supports bulk upload products via JSON/CSV files.

**It does. There is a POST /api/v1/admin/products/bulk endpoint that accepts a multipart file upload. The file format is auto-detected by filename — CSV files are parsed assuming a header row and JSON files are parsed as an array of objects. Each row is validated individually and the response includes a structured result with total, succeeded, failed counts and a per-row status so the admin can see exactly which rows failed and why.**

Home page showcases featured products and collections.

**Yes. The home page has a full-width video hero section with a Shop Now CTA, a featured products grid showing 4 items sorted by rating, an editorial section with a large image and brand text, and a category navigation grid. If the catalog service is unavailable the page shows a graceful fallback message rather than an error.**

Product listing page includes product details, ratings, filters, grid/list views, search, and sorting options.

**It does. The shop page shows a responsive product grid with name, price, star rating and review count per card. Filters include category, brand, price range min and max, and a text search. Sorting options are newest, relevance, price ascending, price descending, name ascending, name descending, and rating descending. The search input is debounced at 250ms and shows live suggestions as you type. Pagination is handled via limit and page query parameters.**

Product detail page shows complete product information, images, reviews, CTA and related/recommended products.

**Yes. The product detail page shows the full product name, price, star rating, description, a gallery with a primary image and thumbnails, a size or option selector if applicable, and an add to cart button. The reviews section shows the rating breakdown and individual review cards sorted by helpfulness. At the bottom there is a related products carousel showing 3 items from the same category fetched server-side. The page also has dynamic title and meta description tags for SEO.**

Shopping cart page lists items with thumbnails, prices, quantities, allows updates/removals, displays total (excluding shipping), and provides clear CTA.

**It does. The cart page has a two-column layout on desktop with items on the left and the summary on the right. Each line item shows the product thumbnail, name, selected size, price, increment and decrement quantity controls, and a remove button. The summary shows the subtotal excluding shipping with a Proceed to Checkout button. There is also a You Might Also Like carousel. An empty cart shows a message with a link back to the shop.**

Checkout page contains guest/signed-in user order summary, address input, shipping, and payment selection.

**Yes. The checkout page has a form on the left and a live order summary on the right. The form collects full name, email, phone, the full shipping address, the selected delivery option from the admin-configured list, and an optional coupon code. Logged-in users have their Stripe saved payment methods available at the Stripe Checkout step. The order summary shows all items, their prices, the delivery cost, any coupon discount, and the grand total.**

Order confirmation page displays order summary estimated delivery and reference number.

**It does. The confirmation page shows the order ID as the reference number, the current order status, all line items with quantities and prices, the shipping address, the delivery method, and the total amount charged. There are buttons to view the order status, return to the shop, download an invoice, and cancel the order if it is still eligible.**

Search results page includes filtering, sorting, result count and pagination.

**Yes. The search results are served through the /shop page with a q query parameter. The heading updates to show Search: followed by the query. All the same filters (brand, category, price range) and sorting options apply to search results. A no products found message is shown when the query returns nothing. Pagination is handled via query parameters.**

Admin page provides CRUD functionality for products, order management, user management, review moderation, and bulk uploads.

**It does. The admin panel has a sidebar navigation with sections for the dashboard overview, products (list, create, edit, delete, bulk upload), categories (full CRUD), orders (list, detail, status updates, refunds), reviews (list and delete for moderation), users (list, detail, ban management), and delivery settings. All sections are protected and redirect to login if the user is not an admin.**

Contact/Support page includes functioning contact form.

**Yes. The contact page has a form with name, email, and message fields. Submission hits the POST /api/v1/contact endpoint which is rate-limited, validates and sanitises the input server-side, and queues the email. The form shows confirmation on success and an error message if submission fails.**

About page includes companies information, mission, team and links to social media.

**It does. The about page is a statically rendered page at /about covering the company background, mission statement, and team introduction with links to social media profiles.**

Error page (404) includes catch-all error message.

**Yes. The app/not-found.tsx file renders a page not found message with a link back to the shop whenever a route is not matched. Next.js catches unmatched routes and renders this page automatically.**

Quick cart preview (pop-up/drop-down or similar) is implemented.

**It is. There is a CartDrawer component that slides in from the side when the cart icon in the header is clicked. It shows all cart items with thumbnails, names, quantities, and prices, with inline increment and decrement controls and a remove button per item. At the bottom there are View Cart and Checkout CTAs. There is also a You Might Also Like section with related product suggestions. An empty state message is shown when the cart has no items.**

Quick search with dynamic suggestions is implemented.

**Yes. The ShopSearchInput component in the header debounces input at 250ms and starts showing suggestions after 2 characters. The dropdown shows up to 8 results per group across products, categories, and brands. There is also a SearchModal accessible via a search button that shows 6 result rows plus 5 featured products with thumbnails, category, and price, and a View All Results link to the full shop search.**

Product images are stored and served in multiple sizes to support different views (e.g., thumbnails, full-size images).

**Yes. The Next.js Image component is used throughout with explicit sizes attributes so the browser requests the appropriate image size for the context. Search result thumbnails use sizes="48px", cart items use sizes="100px", the product grid uses sizes="(max-width: 640px) 50vw, 25vw" for the responsive 2 to 4 column layout, and the product detail page uses sizes="(max-width: 768px) 100vw, 50vw" for the full gallery view.**

Platform maintains functionality across various (320px, 768px, 1024px, 1440px) viewports.

**It does. The platform is built mobile-first with Tailwind CSS. At 320px layouts are single or 2-column and forms are full width. At 768px the layout shifts to 2-column side-by-side for hero and content sections. At 1024px the product grid expands to 4 columns and the admin sidebar becomes persistent. At 1440px the container is capped at max-w-[1400px] with appropriate padding. The sm:, md:, and lg: Tailwind prefixes are used throughout.**

Self signed TLS certificate is configured.

**Yes. The Nginx config listens on port 3001 with SSL enabled using a self-signed cert.pem and key.pem stored in the Docker container at /etc/nginx/certs. The protocols are restricted to TLSv1.2 and TLSv1.3 with a strong cipher suite of HIGH:!aNULL:!MD5. The setup is documented in docs/LOCAL-HTTPS-SETUP.md and the frontend is served behind the Nginx proxy with the X-Forwarded-Proto: https header.**

All sensitive data stored in database is encrypted at rest.

**Yes. AES-256-GCM is used for all personal data with a random 12-byte IV per field so the same value always produces a different ciphertext. Passwords are hashed by Better Auth and never stored in plaintext. Refresh tokens are stored as SHA-256 hashes. Email lookup uses HMAC-SHA256 blind indexing with a separate secret key so the email can be found without decrypting it.**

Check encryption implementation for: user credentials, personally identifiable information, shipping addresses, order details and session tokens

**User credentials: passwords are bcrypt-hashed by Better Auth, never stored plaintext. PII: user name and email are encrypted with AES-256-GCM and the email also has an HMAC blind index for lookups. Shipping addresses: all eight fields on the order record (full name, both address lines, city, state, postal code, country, phone) are individually encrypted before INSERT and decrypted on read. Order details: product names, quantities, and prices are stored plaintext as they are not sensitive personal data. Session tokens: stored as httpOnly cookies not in localStorage, and refresh tokens are SHA-256 hashed in the manual_refresh_token table with rotation on every use.**

Token bucket rate limiting is implemented.

**Yes. The token-bucket-rate-limit.ts middleware implements a token bucket algorithm with configurable capacity and refill rate per second per endpoint. The bucket key is the combination of the client IP and the request path, using the X-Forwarded-For header when behind a proxy. When the bucket is exhausted the middleware returns HTTP 429 with an X-Retry-After header. The rules are defined per path, for example the sign-in endpoint has a capacity of 10 with a refill of 1 token per second.**

Student can explain CIA (Confidentiality, Integrity, Availability) principles.

**CIA stands for Confidentiality, Integrity, and Availability. Confidentiality means only authorised parties can access data — this is achieved with this AES-256-GCM encryption for PII and addresses, TLS 1.2/1.3 in transit, httpOnly cookies for session tokens, and role-based access control so users cannot see each other's orders. Integrity means data is accurate and untampered — I use PostgreSQL transactions for ACID guarantees, foreign key constraints, unique indexes, refresh token hash comparison to detect tampering, and server-side DTO validation before anything reaches the database. Availability means the system remains accessible under load, verified this through k6 load testing which showed the system handles up to 1,650 concurrent users with response times under 5 seconds, and I use database connection pooling, pagination on heavy endpoints, and batch queries to reduce pressure.**

The platform implements basic SEO best practices including title tags under 60 characters, proper heading hierarchy (H2-H6), logical URL structure, and descriptive alt text for images.

**Yes. Title tags are generated dynamically per page — for example the home page is Darkloom | Premium DnD Apparel and product pages are the product name followed by | Darkloom, truncated to keep under 60 characters. Each page has a single H1 and uses H2 for section headings without skipping levels. URLs are human-readable slugs like /shop/dragon-tee-a1b2c3 and category filtering uses clean query parameters like ?category=t-shirts. Product images use the product name as alt text and meta descriptions are set to 155 characters per page.**

All meaningful images include descriptive alt text.

**Yes. Product images use alt={product.name} which gives a meaningful description of the item shown. Decorative background elements are marked aria-hidden so screen readers skip them. The Next.js Image component enforces that alt is provided.**

Text remains readable when zoomed to 200%.

**Yes. All font sizes use Tailwind's relative utility classes which scale with the browser zoom level. Buttons have minimum touch target heights. The layout is responsive so at 200% zoom the columns reflow to a stacked single-column layout rather than overflowing. No fixed pixel widths are used for text containers.**

Student can explain the importance of semantic HTML for accessibility.

**Semantic HTML means using the correct HTML element for the content's purpose — a button element for clickable actions, label elements associated with form inputs, nav for navigation, headings in order, and lists for groups of items. This matters for accessibility because screen readers announce elements by their role and semantics. A div with a click handler is invisible to a screen reader but a button element is announced as a button and is keyboard focusable by default. Correct heading order lets screen reader users navigate the page structure by jumping between headings. Form labels read out loud when the input is focused so users know what to type.**

Student can explain their approach to testing, integration of automated and usage of manual tests throughout the development process.

**The approach is to test each layer independently and then together. Unit tests cover individual services and validation logic in isolation using mocks for external dependencies. API integration tests cover the full request-response cycle hitting real or near-real database state. Security tests specifically verify XSS prevention in review input, rate limiting behaviour returning 429, admin guard returning 403 for non-admins, and encryption round-trips. E2E Playwright tests run full user flows in the browser including signup, browsing, filtering, adding to cart, and checking out. Load testing with k6 covers realistic traffic, stress, and spike scenarios. Manual testing is done in the browser for visual layout, edge cases in forms, and payment flows using Stripe test cards.**

Automated tests exist for Unit, API integration, User flow and Security tests.

**Yes. There are 24 backend test files covering unit tests for auth, catalog, cart, order, and review services, DTO validation for all input types, API integration tests for full endpoint cycles, and security tests for rate limiting, encryption, XSS prevention, and admin access control. There are 6 Playwright E2E test files covering smoke checks, catalog browsing, guest cart, checkout flow, signup, and authenticated user flows. Load tests use k6 with smoke, load, stress, and spike scripts.**

Ask the student to explain and demonstrate the functionality of the tests.

**The backend tests run with npm test which runs Jest. For example token-bucket-rate-limit.spec.ts sets up a bucket with a known capacity and fires requests until it gets a 429, then waits for the refill interval and confirms requests succeed again. The crypto.util.spec.ts tests encrypt a string then decrypt it and assert the values match, and also confirm that encrypting the same string twice produces different ciphertexts due to the random IV. The order.service.spec.ts mocks the database, inventory service, Stripe, and BullMQ queue, then calls markOrderPaidIfPending and asserts the correct status transition and job enqueue depending on whether stock allocation succeeds or fails. The Playwright tests can be run headed with npm run test:e2e:headed to watch them interact with the browser in real time.**

Load test report identifies maximum concurrent users before response times exceed 5 seconds.

**Yes. The load test report from the k6 stress test identifies 1,650 concurrent virtual users as the last point where the p95 response time stays below 5 seconds at 4.67 seconds. At 1,750 virtual users the p95 crosses the threshold at 5.06 seconds. The test ramped up from 0 to 160 VUs in the stress scenario and also ran a separate capacity analysis stepping up to find the exact breaking point.**

Load test report shows transaction throughput.

**Yes. The stress test at 160 VUs achieved approximately 99,000 total requests over the test duration at a throughput of 103.34 requests per second with a 0% error rate and a p99 response time of 2,860ms which passed the 3,000ms threshold. The load test targeting realistic traffic showed higher throughput efficiency with stricter thresholds of p95 below 500ms and error rate below 1%.**

Student has identified potential bottlenecks and can propose solutions.

**Yes, five bottlenecks were identified and documented. The database connection pool is set to max 5 connections which creates a queue under high concurrency — the solution is to increase the pool size or add PgBouncer. The catalog service performs wide joins on product listings without scoped indexes — adding indexes on foreign key columns and tightening pagination would reduce scan times. The order listing has an N+1 pattern where getOrderById is called in a loop — batching this into a single join query would fix it. The add-to-cart flow has multiple sequential awaits per request — combining the validation and upsert into a single transaction would reduce the number of round trips. Finally several foreign key columns like product_image.product_id and order_item.order_id are missing indexes which PostgreSQL would need to scan fully under load.**

Extra
Platform's UI/UX design quality, consistency, and responsiveness across all pages.

**The platform uses a consistent dark aesthetic with Tailwind CSS throughout. Every page follows the same header, content, and footer structure. The product cards, buttons, form fields, and drawer components all use the same design tokens. The layout is mobile-first and tested across 320px to 1440px. Loading states, empty states, and error states are handled on every page so the UI never shows a blank or broken state to the user.**

Admin interface functionality, data presentation, and workflow efficiency.

**The admin panel has a persistent sidebar for navigation across all management sections. Product listing shows key fields at a glance with inline edit and delete actions. The bulk upload flow gives immediate row-by-row feedback so admins can fix and re-upload without guessing which rows failed. Order management shows the full status lifecycle and the refund action is one click from the order detail. The user list shows 2FA status at a glance which is useful for verifying admin account security.**

Error handling and user guidance throughout all platform interactions and edge cases.

**Every API error is mapped to a user-facing message rather than exposing internal details. Form validation shows inline field-level errors immediately on submit. Stock errors on add-to-cart tell the user exactly what is not available. Payment errors from Stripe are translated into plain English. Network errors show a retry prompt. Abandoned Stripe sessions trigger a payment failed email with a retry link. The 404 page catches any unmatched route with a clear message and a link back to the shop.**

Implementation of additional features that enhance shopping experience beyond basic requirements.

**Additional features include the CartDrawer quick preview with product recommendations, the SearchModal with keyboard shortcut access, a reorder feature on past orders that adds previous items back to cart at current prices, coupon code support at checkout, helpfulness voting on reviews, a You Might Also Like carousel on the cart page, related products on the product detail page fetched server-side, and guest cart merging on login so nothing is lost when a guest registers.**

Security implementation quality, performance optimization, and accessibility compliance.

**Security covers AES-256-GCM encryption for all PII and addresses, blind indexing for email lookups, SHA-256 hashed refresh tokens with rotation, reCAPTCHA on registration, token bucket rate limiting per endpoint, SELECT FOR UPDATE locking for concurrent payment safety, Stripe Checkout for zero PCI scope, and Stripe-Signature webhook verification. Performance optimisations include batch queries with Promise.all, pagination on all listing endpoints, database indexes on high-traffic columns, and connection pooling. Accessibility is handled through semantic HTML elements, relative font sizes that scale with zoom, meaningful alt text on all product images, and associated form labels.**

Project application is containerized using Docker.

**Yes. Docker is the only prerequisite on the host machine. A single command brings up the Next.js frontend, NestJS backend, PostgreSQL database, and Redis for BullMQ. The self-signed TLS certificate is generated inside the Docker build so HTTPS works immediately. The Stripe CLI for local webhook forwarding runs as a separate container in the development compose file.**
