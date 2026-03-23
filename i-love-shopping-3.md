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
