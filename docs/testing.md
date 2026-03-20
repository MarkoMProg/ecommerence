I love shopping 1/3

Mandatory
The README file contains a clear project overview, entity relationship diagram, setup instructions, and usage guide

The platform implements a Business-to-Consumer (B2C) e-commerce model.

The system implements both email-password and OAuth authentication methods.

CAPTCHA is integrated into the registration process.

Student can explain the concept of JWT and its components (header, payload, signature).

Access tokens are stored in memory.

Refresh token rotation is implemented with single-use validation.

Verify that each refresh token can only be used once and new refresh token is issued with each refresh. Old refresh tokens must be rejected.

Token revocation mechanism is in place for both access and refresh tokens.

Password recovery and reset functionality via email is implemented.

Two-factor authentication (2FA) is available as an optional, user-enabled feature.

User input validation is implemented on both client and server sides for authentication forms.

Student can explain the chosen database's scalability features and how they support potential growth of the e-commerce platform.

Student can explain ACID properties and their importance in e-commerce database design.

An Entity Relationship Diagram (ERD) is provided, clearly showing entities, attributes, relationships, primary keys, foreign keys, cardinality, and modality.

Student can demonstrate and explain the search implementation including database design and basic text search functionality.

The product data model includes all required fields: id, name, description, price, stock quantity, category, brand, images, and weight/dimensions (in both metric and imperial units).

Products are organized into categories with an intuitive browsing structure.

Faceted search is implemented, allowing users to refine results by product attributes (e.g., price range, brand, category).

Product listing includes sorting options for relevance, price and rating.

Product images are stored with proper file handling and basic serving functionality.

Student can explain their approach to testing, integration of automated and usage of manual tests throughout the development process.

Automated tests exist for Unit, API integration, and Security tests covering authentication and product catalog functionality.

Ask the student to explain and demonstrate the functionality of the tests.

Student can explain their chosen architectural approach and justify how it aligns with their platform's scalability requirements.

Extra
Authentication system implementation quality, security measures, and user experience.

Database design quality, ERD completeness, and adherence to ACID properties.

Product catalog organization, search functionality, and filtering system implementation.

Project application is containerized using Docker.

The project uses Docker to containerize the application and its dependencies. Docker is the only host prerequisite - all other dependencies are managed within containers.

I love shopping 2/3:

Mandatory
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

I love Shopping 3/3:

Mandatory
The README file contains complete project overview, entity relationship diagram, performance analysis report, setup instructions, and usage guide

Star rating system is implemented with the average star rating calculated from all reviews.

The review system allows users to submit text reviews for purchased products.

The review sorting system orders reviews by helpfulness votes.

The system enforces 2FA for all admin accounts.

The product management system allows CRUD operations for products with all required fields.

Admins can add, edit, delete, update and manage products, caregories, orders and refunds

Admins can manage delivery options and order status updates.

Admins can view all users and assign roles.

Platform supports bulk upload products via JSON/CSV files.

Home page showcases featured products and collections.

Product listing page includes product details, ratings, filters, grid/list views, search, and sorting options.

Product detail page shows complete product information, images, reviews, CTA and related/recommended products.

Shopping cart page lists items with thumbnails, prices, quantities, allows updates/removals, displays total (excluding shipping), and provides clear CTA.

Checkout page contains guest/signed-in user order summary, address input, shipping, and payment selection.

Order confirmation page displays order summary estimated delivery and reference number.

Search results page includes filtering, sorting, result count and pagination.

Admin page provides CRUD functionality for products, order management, user management, review moderation, and bulk uploads.

Contact/Support page includes functioning contact form.

About page includes companies information, mission, team and links to social media.

Error page (404) includes catch-all error message.

Quick cart preview (pop-up/drop-down or similar) is implemented.

Quick search with dynamic suggestions is implemented.

Product images are stored and served in multiple sizes to support different views (e.g., thumbnails, full-size images).

Platform maintains functionality across various (320px, 768px, 1024px, 1440px) viewports.

Self signed TLS certificate is configured.

All sensitive data stored in database is encrypted at rest.

Check encryption implementation for: user credentials, personally identifiable information, shipping addresses, order details and session tokens

Token bucket rate limiting is implemented.

Student can explain CIA (Confidentiality, Integrity, Availability) principles.

The platform implements basic SEO best practices including title tags under 60 characters, proper heading hierarchy (H2-H6), logical URL structure, and descriptive alt text for images.

All meaningful images include descriptive alt text.

Text remains readable when zoomed to 200%.

Student can explain the importance of semantic HTML for accessibility.

Student can explain their approach to testing, integration of automated and usage of manual tests throughout the development process.

Automated tests exist for Unit, API integration, User flow and Security tests.

Ask the student to explain and demonstrate the functionality of the tests.

Load test report identifies maximum concurrent users before response times exceed 5 seconds.

Load test report shows transaction throughput.

Student has identified potential bottlenecks and can propose solutions.

Extra
Platform's UI/UX design quality, consistency, and responsiveness across all pages.

Admin interface functionality, data presentation, and workflow efficiency.

Error handling and user guidance throughout all platform interactions and edge cases.

Implementation of additional features that enhance shopping experience beyond basic requirements.

Security implementation quality, performance optimization, and accessibility compliance.

Project application is containerized using Docker.

The project uses Docker to containerize the application and its dependencies. Host prerequisites are limited to Docker and payment simulation CLI - all other dependencies are managed within containers.

Integrator:

Mandatory
The README file contains project overview, setup instructions, and usage guide

Student can explain the approach and reasoning behind their chosen stack

At the beginning of review, the platform is deployed in a stable, unmodified version

The CI/CD pipeline is configured with a clear trigger mechanism (push-to-master or equivalent)

Verify the pipeline automatically triggers when code changes are pushed to the main branch

Student can demonstrate pipeline failure handling by introducing a failing test and showing pipeline response

Failed tests must halt the pipeline with actionable error messages for debugging

Student can demonstrate security failure detection by introducing hardcoded secrets or vulnerable code

Failed security checks must halt the pipeline with actionable messages

Student can demonstrate complete happy path deployment

After resolving any introduced issues and incorporating database schema changes (new column/table/index), the complete pipeline executes successfully through deployment

The build stage creates a clean, consistent environment that matches production setup

All project dependencies are automatically installed during the build process

Verify package managers (npm, pip, etc.) successfully resolve and install all required dependencies

Environment variables are securely injected during the build phase.

Check that database URLs, API keys, and configuration values are handled through environment variables

The pipeline produces deployable build artifacts with all necessary components

Verify the build stage outputs a complete, self-contained package ready for deployment

All existing automated test suites execute successfully during the pipeline

Unit tests, integration tests, and other automated tests from previous projects must run and pass

Test results are preserved and accessible in a readable format

Static Application Security Testing (SAST) is integrated into the pipeline to scan source code for vulnerabilities

Verify the pipeline includes automated code analysis for SQL injection, XSS, and other common security vulnerabilities

Security findings are categorized by severity level with clear classification criteria

The pipeline includes automated scanning for hardcoded secrets, API keys, and sensitive credentials

Git history is analyzed for previously committed secrets that may have been removed

Dependency vulnerability scanning identifies security issues in third-party packages and libraries

Database migration scripts are automatically detected and validated before execution

Automatic database backups are created before applying any migration changes

Each migration execution must be preceded by a complete database backup for rollback purposes

Migration execution includes proper transaction handling and error recovery mechanisms

Failed migrations should leave the database in a consistent state without partial updates

The deployment process transfers application artifacts to the target environment and activates them

Verify automated deployment scripts handle file transfer, service configuration, and application startup

Post-deployment validation verifies service health and database connectivity

The pipeline must confirm all required services are running and can communicate with external dependencies

Critical user flows are automatically tested after deployment to ensure functionality

Deployable artifacts are stored with version information for rollback capabilities

Student can demonstrate rollback functionality by reverting from current version to previous stable version

The application must return to the previous working state with database consistency preserved

Rollback mechanism can be triggered quickly when deployment issues are detected

Database rollback strategy preserves data integrity during application version changes

Rollback validation confirms the previous version functions correctly after reversion

Extra
Pipeline configuration quality and maintainability

Security scanning implementation depth, vulnerability handling, and risk assessment accuracy

Database migration automation reliability, error handling, and rollback strategy effectiveness

Deployment automation robustness, validation completeness, and failure recovery mechanisms

CI/CD pipeline builds and tests project using Docker

The project includes a Dockerfile or script that allows the pipeline to build the application and run automated tests inside the container. The build and test process should be reproducible through Docker.

Observability:

Mandatory
The README includes project overview, architecture, setup, dashboards, alerts, and data scripts

Student can explain the importance for observability in production systems

How observability helps detect, understand, and resolve issues proactively, and why this matters for user experience and business outcomes.

Student can explain and justify the chosen observability stack (collection, storage, visualization, alerting)

Metrics and logs are persisted in appropriate storage backends (time-series DB, log aggregator)

At least four dashboards exist covering Business Intelligence, Product & Customer, Technical Performance, and Security domains

The Business Intelligence Dashboard displays at least two unique metrics that provide business performance insights

Student can justify the choice of metrics for the Business Intelligence Dashboard and how these metrics help inform future decisions.

The Product & Customer Dashboard includes at least two unique metrics that provide insights into product performance and customer behavior

Student can justify the choice of metrics for the Product & Customer Dashboard and how these metrics help inform future decisions.

The Technical Performance Dashboard monitors at least two unique metrics that provide system performance insights

Student can justify the choice of metrics for the Technical Performance Dashboard and how these metrics help inform future decisions.

The Security Dashboard tracks at least two unique metrics that provide security monitoring insights

Student can justify the choice of metrics for the Security Dashboard and how these metrics help inform future decisions.

At least two correlated metrics are defined and implemented that connect signals to reveal actionable insights

Student demonstrates how correlated metrics reveal insights not visible from individual metrics alone

At least two alerting rules are configured

The student must be able to demonstrate the alerts in action.

Alerts deliver notifications through a configured channel (email, Slack, Discord, etc.)

Student can explain principles of actionable alert design and avoiding alert fatigue

Student outlines how to choose alert conditions that matter, set thresholds, route notifications appropriately, and reduce noise with grouping, deduplication, and suppressions.

Seed data provides historical records for business and product metrics

Database contains baseline users, products, orders, and reviews that populate dashboard visualizations

Traffic simulation generates live requests that produce technical and security metrics

Student can explain how to choose meaningful metrics and avoid vanity metrics

Extra
Dashboard design clarity, signal-to-noise ratio, and usefulness for decision-making

Charts use clear units, time ranges, and consistent naming

Assess whether each visualization has obvious units, sensible default time windows, and consistent metric/label naming across dashboards.

Metrics selection are relevant and meaningful for the project

Correlated metrics provide relevant and actionable insights

Alerting rules are relevant and meaningful for the project


