The README file contains a clear project overview, entity relationship diagram, setup instructions, and usage guide

**Readme exists and goes over all the project, how to start it step by step.**

The platform implements a Business-to-Consumer (B2C) e-commerce model.

**It does. People can make purchages from the website.**

The system implements both email-password and OAuth authentication methods.

**It both implements that through better auth. I chose better auth as I really wanted to work with it and I love the simplicity of it.**

CAPTCHA is integrated into the registration process.

**It is integrated, so if you haven't done the recaptcha you will not be able to register**

Student can explain the concept of JWT and its components (header, payload, signature).

**The concept of JWT is to have the information stored in a self contained JSON object and being able to access it whenever it is needed so there is no need to make a call to the database. The header is in what encryption is used and also the type either the JWT or JWE(encrypted payload), the payload is the information that it contains example the expiry of the token, and signature is to verify if the token is valid and not tampered with.**

Access tokens are stored in memory.

**They are, and the session tokens are not stored within localstorage or session storage.**

Refresh token rotation is implemented with single-use validation.

**yes database has refresh token table where if you add in the postman request when you do getsession an expired token, it will revoke your access and log you out, each time the JWT expires and hits the database it will change the refresh token.**

Verify that each refresh token can only be used once and new refresh token is issued with each refresh. Old refresh tokens must be rejected.

**Same as above,you can and you're able to see it through postman by adding in the last refresh token that it will not return it.**

Token revocation mechanism is in place for both access and refresh tokens.

**Yes it is, you can revoke a single session through signOut and by calling revokeSession which kills that session, or revoke all sessions at once through revokeAllSessions. The refresh tokens are stored as SHA256 hashes in the database and once used they get marked so they can't be reused, and if someone tries to use an old one it flags the session.**

Password recovery and reset functionality via email is implemented.

**It is implemented using Resend as the email service. When you request a password reset it generates a time-limited link and sends it to your email, you click the link and it takes you to the reset password page on the frontend where you enter your new password.**

Two-factor authentication (2FA) is available as an optional, user-enabled feature.

**Yes it is, it uses TOTP-based 2FA through Better Auth's twoFactor plugin. You can enable it in your account settings, and it also generates backup codes. When you login you have to enter the 6-digit code from your authenticator.**

User input validation is implemented on both client and server sides for authentication forms.

**It is on both sides. On the client side we validate email format, password complexity, name length, and we check for HTML tags and control characters to prevent XSS. The server side has the same validation rules plus reCAPTCHA verification on signup, and there are sanitization functions that strip control chars and collapse whitespace.**

Student can explain the chosen database's scalability features and how they support potential growth of the e-commerce platform.

**PostgreSQL which supports horizontal scaling if needed. For scalability the connection pooling has been configured, frequently queried columns like slugs and tokens, pagination on product listings so we don't load everything at once, and batch queries using Promise.all to reduce round trips. The connection pool can be scaled up as traffic grows.**

Student can explain ACID properties and their importance in e-commerce database design.

**ACID stands for Atomicity, Consistency, Isolation, and Durability. In e-commerce this is critical because you need transactions to be all-or-nothing, like when processing an order you don't want to charge someone but not create the order. Atomicity means the whole operation succeeds or fails together, Consistency means foreign keys and unique constraints keep the data valid, Isolation means concurrent transactions don't interfere with each other like two people buying the last item, and Durability means once a transaction is committed it's saved even if the server crashes. PostgreSQL gives us all of this natively.**

An Entity Relationship Diagram (ERD) is provided, clearly showing entities, attributes, relationships, primary keys, foreign keys, cardinality, and modality.

**Yes it is provided in the docs folder and also referenced in the README with diagrams. It covers all three domains: Identity & Auth, Catalog & Reviews , and Commerce. It shows all the PKs, FKs, cardinality like one-to-many between user and sessions, and modality like optional user_id on cart for guest checkout.**

Student can demonstrate and explain the search implementation including database design and basic text search functionality.

**The search uses ILIKE which is case-insensitive pattern matching in PostgreSQL. There's a search suggestions endpoint that returns matching products, categories, and brands as you type with a minimum of 2 characters. It escapes special characters to prevent SQL injection. The full product search matches against both name and description fields, and runs the queries in parallel with Promise.all for performance.**

The product data model includes all required fields: id, name, description, price, stock quantity, category, brand, images, and weight/dimensions (in both metric and imperial units).

**It does, the product table has id, name, slug, description, priceCents stored as integer in cents, stockQuantity, categoryId as a foreign key, brand, and then weight and dimensions in both metric and imperial. Since it's a t-shirt shop it also has apparel-specific fields like sizeOptions, material, fit, and careInstructions. Images are in a separate product_image table with support for multiple images per product and a primary image flag.**

Products are organized into categories with an intuitive browsing structure.

**They are, categories have a parentCategoryId which allows for nested hierarchical categories. Each category has a slug for clean URLs so you can browse like /shop?category=t-shirts. The frontend has a category sidebar in the shop page for easy browsing and filtering.**

Faceted search is implemented, allowing users to refine results by product attributes (e.g., price range, brand, category).

**It is implemented, you can filter by brand with exact match, price range with min and max price, category by slug, and text search query. The backend builds the WHERE clause dynamically combining all the active filters together with AND conditions, so you can stack multiple filters at once.**

Product listing includes sorting options for relevance, price and rating.

**Yes there are several sort options: newest which is the default sorting by creation date, relevance which prioritizes exact name matches first, price ascending and descending, name ascending and descending alphabetically, and rating descending which sorts by average review rating.**

Product images are stored with proper file handling and basic serving functionality.

**They are, images are uploaded through a dedicated upload endpoint that validates file type, enforces a size limit, and stores them on disk organized by category and product name. There's directory traversal protection and folder name sanitization for security. Each product can have multiple images with alt text and a primary image flag in the database.**

Student can explain their approach to testing, integration of automated and usage of manual tests throughout the development process.

**Jest for backend unit and integration tests and Playwright for frontend end-to-end tests. The approach is to test each layer: unit tests for individual services and validation logic, API integration tests for the full request-response cycle, security tests for things like XSS prevention and rate limiting, and E2E tests that simulate real user flows in the browser. Manual testing is done through browser testing for the UI and userflow**

Automated tests exist for Unit, API integration, and Security tests covering authentication and product catalog functionality.

**Yes there are 24 backend test files and 6 E2E test files. Unit tests cover auth service, catalog service, cart operations, admin guards, DTO validation, and address encryption. API integration tests cover full product CRUD and cart operations. Security tests check for XSS/HTML injection prevention, rate limiting with token bucket, admin role-based access control, and encryption of personal data. E2E tests cover signup flow, login with 2FA, catalog browsing with filters, checkout flow, and guest cart persistence.**

Ask the student to explain and demonstrate the functionality of the tests.

**The tests can be run with npm test in the backend which runs Jest. Each test file targets a specific module, for example auth.service.spec.ts tests registration, login, and session management, dto.spec.ts tests all the input validation rules including edge cases like HTML injection attempts, and the E2E tests simulate real user interactions like signing up, browsing products, filtering, and checking out.**

Student can explain their chosen architectural approach and justify how it aligns with their platform's scalability requirements.

**The backend is NestJS with domain-based modules (Auth, Catalog, Cart, Order, Review, Admin, etc.) each with their own service, controller, and DTOs. The frontend is Next.js with App Router. This approach lets us keep things organized by domain while still being simple to deploy as a single unit. For scalability, the structure means we could extract any module into its own microservice later**

Extra

Authentication system implementation quality, security measures, and user experience.

**The auth system uses Better Auth with JWT access tokens stored in memory (not localStorage), refresh token rotation with SHA256 hashing, reCAPTCHA on registration, optional TOTP 2FA with backup codes, rate limiting with token bucket algorithm, and encrypted email storage.**

Database design quality, ERD completeness, and adherence to ACID properties.

**The database has lots of tables across different domains with proper foreign keys, cascade deletes, unique constraints, and indexes. The ERD documents all entities with their attributes, relationships, cardinality and modality. PostgreSQL ensures ACID compliance. Personal information fields like emails and addresses are encrypted with AES-256-GCM with blind indexing for lookups.**

Product catalog organization, search functionality, and filtering system implementation.

**The catalog has categories, full product model with apparel-specific fields, multiple images per product, and reviews with ratings. Search uses ILIKE with input escaping and has both autocomplete suggestions and full product search. Filtering supports brand, price range, category, and text query with dynamic WHERE clause building. Sorting has 7 options including relevance scoring. Everything is paginated and uses batch queries for performance.**

Project application is containerized using Docker.

**The project uses Docker to create a container of the application and its dependencies with a single command. Docker is the only host prerequisite - all other dependencies are managed within containers.**
