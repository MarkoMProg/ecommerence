i-love-shopping (1/3)
The situation 👀
"Give me your credit card number, expiry date and that little code on the back and I'll send you this thing you see on the picture" - In the early 90s that sounded like a plot of a bad movie. Fast forward to today and we're talking about $6.88 trillion industry, projected to reach $8.03 trillion by 2027.
E-commerce is reshaping entire economies and creating job markets that didn't exist a decade ago. From Pizza Hut's first online order back in 1994 to today's one-click purchases and next day deliveries, we've come a long way.

Online retail seems to be booming and Jeff managed to make a few bucks out of it, so why don't you give it a go?

Functional requirements 📋
You'll have to build a Business-to-Consumer (B2C) E-commerce Platform. You're free to choose a category of featured products as long as they meet the criteria outlined below.
Some examples to get your started:

Electronics and Technology
Pet Supplies
Home and Furniture
Books and Media
The build of the e-commerce platform is broken down into 3 interconnected projects:

Project 1 (Foundation) - Core system that powers everything. Secure user accounts, a well-structured database, and a product catalog that customers can easily search and browse.
Project 2 (Commerce) - Shopping experience. Let users fill their carts, guide them through checkout, handle payments safely, and manage their orders from start to finish.
Project 3 (Experience) - Complete user interface and management tools. Build all customer-facing pages, create admin dashboards for managing the business, and add the security and performance features needed for real-world use.
Rome wasn't built in a day. Have the whole picture in mind, but focus on placing each stone with precision.

User Registration, Authentication and Authorization
User management is the backbone of your platform's security and user experience. There's a good chance that everyone has abandoned a site because of an uncomfortable registration procedure or poorly implemented security measures. Think about times when you've felt uneasy about how a site handles your personal information - that's what we're trying to avoid here.
You want tight security, but not so tight that users feel like they're cracking a safe just to buy socks. And take care not to end up on the list of "oopsies" (Aadhaar, Yahoo, LinkedIn)

Registration and login should be handled through email-password and OAuth (e.g., Google, Facebook).
Add CAPTCHA (e.g., Google reCAPTCHA) during registration.
JWT with access and refresh tokens.
Access token is used for authenticating API requests, Refresh token is used to obtain new access token when it has expired.
Short lived access tokens (15-60 minutes), longer-lived refresh tokens (3-7 days).
Access tokens must be stored in memory, not in local or session storage.
Refresh token rotation with each token refresh (single use validation).
Token revocation mechanism for both.
Include password recovery and reset via email.
Implement an optional, user enabled two-factor authentication (e.g., Google Authenticator, Authy).
Validate user inputs and show helpful error messages when things go wrong.
Database
When choosing which Database to go with, consider the following points:

Data Structure and Complexity: e-commerce typically involves structured data and relational databases are better suited for handling complex relationships and transactions.
Your project is already big, and it will grow bigger - plan for it.
Expect your platform to get rapid, heavy traffic during peak promotions and holiday shopping: evaluate read-write operations and features like caching to optimize for performance.
Above all, your database must follow ACID properties:

Atomicity - critical processes involving multiple steps must all succeed or fail together.
Consistency - maintain data integrity after transactions, bringing database from one valid state to another.
Isolation - concurrent executions leave the database in the same state as if they were executed sequentially.
Durability - if transaction is commited, it will remain commited even in case of system failure.
To better visualize the big picture and identify requirements, design an Entity Relationship Diagram (ERD). The key components of ERD typically include:

Entities
Attributes
Relationships
Primary Keys
Foreign Keys
Cardinality
Modality
Product Catalog
A solid product catalog is like a well-organized shop where everything's easy to find and looks great on the shelf. What's under the hood? Data structure that would make Marie Kondo proud.
A good catalog doesn't just list products; it guides your customers on a shopping journey. So when you're setting this up, think like a shopper. What would make you click 'Add to Cart' instead of 'Back to Google'?

Product should have at least the following data models:
id, name, description, price, stock quantity, category, brand, images, weight/dimensions (metric and imperial)
Organize products into categories and make them easy to browse.
Implement faceted search, allowing users to refine results by multiple attributes (e.g., price range, brand, ratings, etc).
Display dynamic search suggestions as users type, based on their input.
Offer sorting options like relevance, price, and ratings to better help users find what they want.
Testing
A thousand tests today save a million headaches tomorrow.

Invest your time in creating a comprehensive testing suite that will help you catch bugs early and follow test-driven development practices.
Below are outlined minimum required tests but you're welcome to be as thorough as you'd like.

Automated Tests
While you're not required to implement CI/CD pipeline (yet), these tests should be automated and run frequently, ideally before any bugs make their way to your master code repository.

Unit Tests

JWT Token Handling - test token generation, validation, and expiration.
User Input Validation - verify proper handling of various input scenarios.
Product Data Model - verify correct data structure and validation.
API Integration Tests

API Endpoints - validate correct responses and error handling for all endpoints.
Database Operations - ensure proper data persistence and retrieval.
Security Tests

Input Validation - test protection against injection attacks and malformed inputs.
Test hard and test smart. Use up-to-date, reputable testing frameworks and libraries to enhance the quality and efficiency.

Manual Tests
Automated tests are great but special care must be taken to ensure that security-critical parts of your platform are protected from vulnerabilities seeking bots. Following tests should be run periodically to ensure they serve their purpose as intended.

CAPTCHA Verification - ensure proper integration and user experience.
OAuth Integration - verify seamless third-party authentication flows.
Two-Factor Authentication (2FA) - test setup process and login flow with 2FA enabled.
Important Considerations ❗
Scalable Architecture - design the system with scalability in mind from the start. Choose an architectural approach that fits your project goals - whether that's a traditional monolith, modular monolith, or microservices architecture.
Robust Security Measures - implement comprehensive security practices throughout the development process.
Performance Optimization - focus on optimizing performance from the beginning. This includes efficient database queries, caching strategies, and front-end optimizations.
Flexible Product Management - design a product catalog system that can easily accommodate various product types, attributes, and categories.
API-First Approach - develop with an API-first mindset. Well-designed, documented, and versioned APIs will facilitate easier integration with future services, mobile applications, or third-party systems.
Compliance and Regulatory Awareness - stay informed about e-commerce regulations and data protection laws, like GDPR.
Useful links 🔗
The Twelve-Factor App
E-commerce Design
Docker
Extra requirements 📚
Dockerization
Containerize the project: use Docker to simplify setup and execution:
Provide a Dockerfile (or multiple, if the project includes separate frontend and backend components)
Include a simple startup command or script that builds and runs the entire application with one step
Docker is the only prerequisites for running and reviewing this project, with all application dependencies included in the Docker setup
What you'll learn 🧠
Develop a full-scale B2C e-commerce platform, covering all essential components from user management to order processing
Design and build a scalable database structure with ACID properties, suitable for handling complex e-commerce data relationships
Implement industry-standard security practices and data protection measures for a robust and trustworthy online retail environment
Create a responsive and accessible user interface that adheres to modern UI/UX principles and WCAG 2.1 Level A criteria
Apply best practices in software testing, including automated and manual testing strategies, to ensure platform reliability and performance
Deliverables and Review Requirements 📁
All source code and configuration files
A README file with:
Project overview
Entity Relationship Diagram
Setup and installation instructions
Usage guide
Any additional features or bonus functionality implemented
During the review, be prepared to:

Demonstrate your platforms's functionality
Explain your code and design choices
Discuss any challenges you faced and how you overcame them


i-love-shopping (2/3)
Functional requirements 📋
Project 1 (Foundation) - Core system that powers everything. Secure user accounts, a well-structured database, and a product catalog that customers can easily search and browse.
Project 2 (Commerce) - Shopping experience. Let users fill their carts, guide them through checkout, handle payments safely, and manage their orders from start to finish.
Project 3 (Experience) - Complete user interface and management tools. Build all customer-facing pages, create admin dashboards for managing the business, and add the security and performance features needed for real-world use.
Shopping Cart
Ever abandoned a cart because it was too much hassle?
Well designed shopping cart is where you encourage window shoppers to become paying customers. Transparent costs, easy to modify, you know the drill.
Smooth cart experience is like a good waiter - there when you need it, invisible when you don't, and never makes you do math in your head.

Display essential product information for each item, including name, price, and a thumbnail image.
Enable users to add and remove items, update quantities, and view real-time total calculations.
Develop a guest cart for non-registered users, ensuring their selections are saved temporarily.
Create a persistent cart that retains items across sessions for logged-in users.
Incorporate a section for related or recommended products based on the items in the cart.
Checkout Process
You've got them to the cart, now push it over the finish line.

Implement a single-page checkout that collects basic information, address input and payment selection (prefill known information for logged in users).
Include shipping options and validate the address for accuracy.
Provide order summary with an option to update quantities or remove items.
After completing the checkout, display an order confirmation page with a summary, and send an email confirmation.
Payments
Time to talk money - specifically, how you're going to handle it. This isn't the area where you want to cut corners or get creative.
PCI compliance isn't just a bunch of fancy letters. In the real world, a slip-up in payment handling procedures may cost millions (Equifax), tank the reputation (Target) or lose the right to handle payments alltogether (Heartland Payment Systems).

Simulate payments using Stripe/PayPal sandboxes, handling payment validation, order processing, and payment failure scenarios.
Use secure payment forms that adhere to best practices — no sensitive payment information (e.g., card details) should be stored on your server.
Implement front-end validation for card details.
Manage payment statuses (Pending/Success/Failure) linked to the order state:
Set the order status to "Pending Payment" upon order placement and payment initiation.
Update the order to "Payment Successful" or "Payment Failed" after processing.
Publish the payment status to a message queue.
The Order Service consumes the message to update the order based on the payment status.
Notify the customer via email of the order status and adjust inventory accordingly.
Consider common payment failures and edge cases such as insufficient funds, incorrect payment details, or gateway errors.

Theoretical concepts
PCI Compliance - familiarize yourself with PCI DSS requirements for securely handling card information.
SSL/TLS - understand how SSL/TLS encrypts data between client and server.
Refunds and Cancellations - learn the processes for managing refunds and cancellations.
Order Management
Sale's done but your job isn't. Order management should give your customers the complete overview of their purchases, statuses and tracking.
As a side perk, it will save your inbox from the flood of "Where's my order?" emails.

Allow users to filter orders by date and status.
Provide a detailed order view with status updates and tracking.
Allow cancellations before the order is processed and set up a refund workflow.
Use message queues (e.g., RabbitMQ, Apache Kafka) for order processing and updates.
  +--------------------+    Payment Request    +----------------------+
  |                    |  -------------------> |                      |
  |    Order Service   |                       |    Payment Service   |
  |    (Place Order)   |                       |   (Process Payment)  |
  |                    |                       |                      |
  +--------------------+                       +----------------------+
            |                                           |
            v                                           |
  +--------------------+        Payment Status          |
  |                    |  <-----------------------------+
  |   Message Queue    |                                |
  |  (RabbitMQ/Kafka)  |                                |
  +--------------------+                                |
            |                                           v
            v                                  +----------------------+
  +--------------------+                       |                      |
  |                    |     Update Order      |     Order Service    |
  |   Order Service    | --------------------> | (Update Order State) |
  | (Consume Message)  |                       |                      |
  +--------------------+                       +----------------------+
Testing
Automated Tests
Unit Tests

Cart Functionality - ensure accurate item management and total calculations.
Order Summary Calculations - confirm precise pricing and shipping calculations.
Critical User Flow Tests

Registration - verify smooth user registration process and data storage.
Checkout - test complete checkout flow, including guest and logged-in user scenarios.
Manual Tests
Data Encryption - confirm proper encryption of sensitive data in transit and at rest.
Important Considerations ❗
Cart Persistence Strategy - balance performance vs. data consistency for guest/user carts
Payment Security - never store sensitive payment data; use tokenization
Transaction Integrity - implement proper rollback mechanisms for failed payments
Message Queue Reliability - handle message failures and implement dead letter queues
Inventory Management - prevent overselling through proper stock validation
Extra requirements 📚
Dockerization
Containerize the project: use Docker to simplify setup and execution:
Provide a Dockerfile (or multiple, if the project includes separate frontend and backend components)
Include a simple startup command or script that builds and runs the entire application with one step
Docker and payment simulation CLI are the only prerequisites for running and reviewing this project, with all application dependencies included in the Docker setup
Deliverables and Review Requirements 📁
All source code and configuration files
A README file with:
Project overview
Entity Relationship Diagram
Setup and installation instructions
Usage guide
Any additional features or bonus functionality implemented
During the review, be prepared to:

Demonstrate your platforms's functionality
Explain your code and design choices
Discuss any challenges you faced and how you overcame them



i-love-shopping (3/3)
Functional requirements 📋
Project 1 (Foundation) - Core system that powers everything. Secure user accounts, a well-structured database, and a product catalog that customers can easily search and browse.
Project 2 (Commerce) - Shopping experience. Let users fill their carts, guide them through checkout, handle payments safely, and manage their orders from start to finish.
Project 3 (Experience) - Complete user interface and management tools. Build all customer-facing pages, create admin dashboards for managing the business, and add the security and performance features needed for real-world use.
User Reviews and Ratings
Have you bought something because a stranger on the internet said it was great? That's the power of user reviews. They're not just feedback — they're a trust-building tool and a sales driver rolled into one.
Set up a solid review system, and watch your products sell themselves.

Implement star ratings system and allow users to leave text reviews.
Display the average rating for each product based on user feedback.
Include a "helpful" voting feature for reviews to allow users to rate the usefulness of other reviews.
Admin Functionality
This is your command center where you manage products, monitor orders, and keep your finger on the pulse of your business.
It's great when everything works as designed, but when it doesn't and you need to pop the hood and get your hands dirty, it's even better having all the tools in the right place and knowing which levers to pull.

Allow admins to add, edit, delete, update and manage products, categories, orders, and refunds.
Provide the ability to manually update shipping statuses and manage delivery options.
Enable viewing and managing user accounts, including roles and permissions (e.g., admin, support, sales).
Support bulk uploads of product data (JSON/CSV).
Include review moderation.
Ensure these features are intuitive yet secure, with proper role-based access controls in place.
All admins must have 2FA enabled.

UI
A user interface is like a joke. If you have to explain it, it's not that good.

First impressions matter. Your UI is the face of your e-commerce platform - it's what users see, click, and interact with.
You're not just building pages; you're crafting a shopping experience. From the homepage to the checkout, every element should guide users smoothly through their journey.
Keep it clean, keep it responsive, and for crying out loud, make sure it looks good on mobile.

Page	Description
Home Page	Displays featured products and categories/collections.
Product/Category Listing Page (PLP)	Shows product images, titles, ratings; include faceted search, filters, grid/list view toggle, and pagination.
Product Detail Page (PDP)	Displays product images, detailed information, reviews and ratings, call-to-action (CTA), and related or recommended products.
Shopping Cart Page	Lists items with thumbnails, prices, quantities; allow updates/removals, displays total (excluding shipping), and provides a clear CTA.
Checkout Page	Includes shipping and billing addresses, shipping method, payment method, order summary, and support guest checkout/sign-in.
Order Confirmation Page	Shows order summary, estimated delivery, order ID, and reference number.
User Account Page	Allows users to manage profile information, view order history, and manage addresses.
Search Results Page	Shows search results, with filtering and sorting options, along with result count and pagination.
Admin Page	Provides CRUD functionality for products, order management, user management, review moderation, and bulk uploads.
Contact/Support Page	Simple (or not, up to you) contact form for users to reach out.
About Page	Presents company information, mission, team, and links to social media.
Error Page (404)	Displays a friendly error message when a page isn't found.
Optionally:
Page	Description
Terms and Conditions Page	Includes a privacy policy regarding data collection and usage, and terms of service.
FAQ Page	Lists common issues (shipping, payment, returns) with clear explanations.
Additional UI Features (available on every page):

Quick Shopping Cart Preview - pop-up/drop-down preview of cart contents.
Quick Search with Suggestions - dynamic search suggestions as users type.
Good UI isn't about fancy animations or cutting-edge design (though those can be nice). It's about making shopping so easy and enjoyable that customers don't even have to think about it.

Security
Security is tricky. The better it gets, the cleverer the bad actors become at exploiting vulnerabilities.
Lock it down like Svalbard Global Seed Vault and you'll frustrate your customers. Cut corners and you'll see your data on sale on the dark web.
It's a constant game of cat and mouse. You're not just setting up a firewall and calling it a day. It's about staying on your toes, keeping up with the latest threats, and patching holes before they become craters.

Create a Self-Signed TLS Certificate for secure connections.
Implement Data Encryption for all sensitive data, both in transit and at rest. This includes user credentials, personally identifiable information (PII), order details, session cookies etc.
Add a Token Bucket rate limiting
Input validation:
Client and Server side
Syntactic Validation (format of inputs for emails, payment information, addresses and similar)
Semantic Validation (contextually appropriate data)
Whitelisting
Ultimately, the platforms security comes down to CIA triad principles: Confidentiality, Integrity, and Availability, ensuring that customer data is protected from unauthorized access, remains accurate and reliable, and is accessible to legitimate users.

SEO
It wouldn't be an e-commerce platform if it didn't have Search Engine Optimization. Biggest players in the business have dedicated SEO teams who continuously work on boosting visibility and performance in search engines. This involves analyzing complex data, developing algorithms, implementing AI and ML, etc.
However, you don't have to have a PhD to give your platform a boost in the search engines.

Title tags - keep under 60 characters, include primary unique keywords
Meta descriptions - 155-160 characters, include natural keywords, write compelling summary
H1 tags - one per page, similar to title tag
H2-H6 tags - structure content hierarchically, include relevant keywords
Ensure all tags are unique and descriptive for each page
Just by implementing above practices, your platform will be more search-engine-friendly and have a better chance in ranking well in search results.

Accessibility
Your platform needs to ensure inclusivity and accessibility, and take into account users with diverse abilities and needs.
Web Content Accessibility Guidelines (WCAG) are technical standards that help make the digital world accessible to people with disabilities.

To follow WCAG 2.1 Level A success criteria, the platform must have the following:

Semantic HTML - appropriate HTML5 elements, logically structured headings and proper list and table elements.
Keyboard navigation - all interactive elements must be focusable with logical tab order.
ARIA implementation - to be used only if native HTML elements are not enough.
Color contrast - 4:5:1 ratio for normal text, 3:1 for larger text.
Image Alt text - descriptive alt attributes to meaningful images
Responsive text - relative units for font sizes, text and layout remains readable when at zoomed at 200%
Testing
Automated Tests
Unit Tests

Product Data Model - verify correct data structure and validation.
Cart Functionality - ensure accurate item management and total calculations.
Order Summary Calculations - confirm precise pricing and shipping calculations.
JWT Token Handling - test token generation, validation, and expiration.
User Input Validation - verify proper handling of various input scenarios.
API Integration Tests

API Endpoints - validate correct responses and error handling for all endpoints.
Database Operations - ensure proper data persistence and retrieval.
Critical User Flow Tests

Product Search - confirm accurate and efficient product search functionality.
Security Tests

Rate Limiting - verify effectiveness of rate limiting mechanisms to prevent abuse.
Load Testing
This is a great way to evaluate your platforms performance, and what should be taken into account in further development. Regular load testing will help you establish required optimizations for high traffic periods (promotions, holiday seasons) and bring out any bottlenecks.

You are free to choose your preferred open source Load Testing Tool. When creating test scenarios (at least 3), try to mimic actual user behavavior on the platfrom, for example:

Browsing product catalogs
Searching for products
Adding items to cart
Completing the checkout process
User registration and login
Some objectives you should aim for:

90% of users requests are processed withing 2 seconds.
Platform supports at least 50 concurrent users without noticeable performance degredation.
Throughput of at least 10 transactions per second during peak load conditions.
98% of transactions complete successfully during high traffic.
Error rate of less than 5% during load tests.
By the end of the project, you should've identified and ready to present:

Maximum number of concurrent users before response times exceed 5 seconds.
Expected throughput (transaction per second)
Normal operating conditions, expected peak loads.
The load that makes your CPU and/or memory go over 90%.
Performance bottlenecks.
Important Considerations ❗
Admin Security - implement principle of least privilege and audit logging
Content Delivery - consider CDN strategy for images and static assets
Search Optimization - balance search accuracy with response time
Extra requirements 📚
Dockerization
Containerize the project: use Docker to simplify setup and execution:
Provide a Dockerfile (or multiple, if the project includes separate frontend and backend components)
Include a simple startup command or script that builds and runs the entire application with one step
Docker and payment simulation CLI are the only prerequisites for running and reviewing this project, with all application dependencies included in the Docker setup
Deliverables and Review Requirements 📁
All source code and configuration files
A README file with:
Project overview
Entity Relationship Diagram
Performance analysis report
Setup and installation instructions
Usage guide
Any additional features or bonus functionality implemented
During the review, be prepared to:

Demonstrate your platforms's functionality
Explain your code and design choices
Discuss any challenges you faced and how you overcame them

integrator
You've built your e-commerce platform, run tests, debugged mysterious errors, configured environments, wrestled with databases and finally, it works! Your customers can browse products, fill their carts and actually complete purchases without 404s. Awesome, let's keep adding cool features - personalized recommendations? mobile app? AI?

Since your platform is already pretty complex, adding more features will very likely break stuff. All that building, testing and deployment work you just finished? You'll need to do it all over again for every feature, every bug fix, every tiny tweak. What once was a fun technical challenge and learning opportunity will quickly start to feel like digital Groundhog Day. Fortunately, developers are inherently lazy in the best possible way — they've automated all the boring, repetitive stuff so they can focus on building the features that actually matter.

Enter CI/CD - Continuous Integration and Continuous Deployment (or Delivery)

The situation 👀
At the core of it, CI/CD creates a series of automated gates that code must pass through, eliminating the soul-crushing, error-prone manual work that used to consume an enormous amount of developers' time and energy. Each gate performs specific checks - running automated tests, scanning for security vulnerabilities, verifying performance benchmarks, and ensuring compatibility across different systems. Only code that successfully passes all these checkpoints reaches users.

This automation serves several key purposes:

Reduces human error by eliminating manual deployment steps that developers might forget or perform incorrectly.
Provides consistency, ensuring that every deployment follows consistent process.
Enables rapid feedback - developers learn within minutes if their changes break something, rather than discovering problems days or weeks later.
CI/CD pipelines provide high value across every software domain, with core principles remaining consistent. The difference comes from domain-specific needs, regulations, and constraints that shape implementation details.

E-commerce takes all these general CI/CD benefits and cranks the difficulty to 11:

E-commerce never sleeps - customers shop at different times in different time zones and automated systems process orders around the clock. Deployment windows don't exist.
Every second counts - a single minute of downtime can cost $220,318.80.
Customer trust is everything - online shoppers have zero tolerance for broken experience.
Numerous external services - payment processors, shipping companies, inventory management systems, recommendation engines, analytics platforms, and marketing tools - each integration represents a potential failure point.
Functional requirements 📋
Specific domain and unique requirements will ultimately dictate the complexity and depth of your CI/CD pipeline. In the real world, you might need separate pipelines for different environments, complex approval workflows, or specialized testing strategies. However, this project focuses on building a solid foundation that covers the essential aspects of continuous integration and deployment.

Your pipeline must complete four core stages in sequence:

Build and Test
Security and Dependency Scan
Database Migration
Core Delivery
At this level, a single pipeline with a simple push-to-master trigger will sufficiently demonstrate the core concepts, though you're welcome to explore multi-environment pipelines or alternative trigger methods for more complex workflows.

Stack
When choosing your tools, you'll discover there's no shortage of options - from cloud-native platform like GitHub Actions, GitLab CI/CD to self-hosted solutions like Jenkins, TeamCity or GitLab Runner. Each approach has its trade-offs: cloud-native platform offer convenience and built-in integrations but may have usage limits or costs, while self-hosted solutions provide complete control and customization but require more setup and maintenance.

Most modern CI/CD platforms come with built-in security scanning capabilities or integrations that can handle static analysis and dependency checking without requiring separate tools. However, you might want to explore more specialized open-source security tools like Snyk or OWASP dependency checkers that offer more detailed analysis and customization options.

For deployment targets, consider where your e-commerce platform will actually run - traditional VPS providers, cloud platforms like AWS/GCP/Azure, containerized environments with Docker, or even simple shared hosting.

You know your project inside and out, so the key is matching your toolchain to your deployment environment and complexity needs. You can chase cutting-edge trends with the latest industry tools or stick with simple, proven workflows that just work. Both approaches have their strengths, but at the end of the day, what matters most is having a pipeline that works consistently and gives you confidence in every deployment.

1. Build and Test
The build automation and test execution phase serves as the quality gate of your CI/CD pipeline. In this step you want to go from source code to deployable artifact ensuring it meets your quality standards.

Build
Build Environment - creates a clean, consistent environment that matches the setup.
Dependency Installation - fetches and installs all required libraries, packages, and tools the application needs.
Compilation and bundling - transforms source code into executable form and validates syntax.
Build Artifact - packages the application into a deployable format with everything needed to run.
Test
Test Execution - executes tests and provides actionable feedback grouping tests by type, importance, and execution time to optimize performance.
Failure Handling - defines what happens when tests fail and provides clear paths to resolution. If any tests fail, execution should stop and provide enough information to fix the problem.
Result Analysis - interprets test outcomes and presents them in a useful format, since raw output is often verbose and hard to parse. If something went wrong - this is where debugging starts from.
Test Reporting - preserves test results, reports, and evidence for analysis and compliance. Create a simple document that shows the overall picture of the testing phase and allows tracking of the platform's quality over time.
Your pipeline should run your existing test suites. This includes executing your unit tests, integration tests, and any other automated tests you built in the previous projects.

This step brings consistency to your deployment process - every build follows the exact same steps, eliminating "works on my machine". You'll catch bugs, integration issues, and regressions early in the process, before they ever reach your customers. Automated validation gives you the confidence to deploy frequently and your build artifacts serve as a historical record of exactly what was deployed and when.

2. Security and Dependency Scanning
Wouldn't it be embarrassing if you accidentally leaked your API keys, passwords, or introduced a backdoor through a critical vulnerability in one of your dependencies, ending up as the proud top story on TechCrunch?

Security and dependency scanning step is where you proactively hunt for vulnerabilities, exposed secrets, and risky dependencies before they make it into production. This isn't about achieving perfect security (spoiler: that doesn't exist), but about understanding your risk landscape and making informed decisions. When a security scanner flags 47 potential issues, you need to know which 3 are actually critical and which 44 are false positives or acceptable risks for your context.

Static App Security Testing (SAST)
Static Code Analysis - examines your source code for security vulnerabilities without executing it. Looks for common patterns like SQL injection risks, cross-site scripting vulnerabilities, and insecure data handling.
Vulnerability Classification - categorizes findings by severity, type, and confidence level. Not every "high severity" issue is actually critical for your specific application - understanding these classifications helps you prioritize what needs immediate attention.
Security Gate Integration - defines automated rules for what constitutes acceptable security posture. Your pipeline should know when to stop deployment based on security findings and when to proceed with acceptable risks.
Report Generation - produces actionable security reports that developers can understand and act upon.
Secrets and Dependencies
Pattern Recognition - scans code for API keys, tokens, passwords, and other sensitive credentials that shouldn't be in source control.
Git History Analysis - examines your entire repository history for secrets that might have been committed and later removed.
Package Analysis - examines your project's dependencies for known security vulnerabilities.
Security scanning acts as your proactive defense system, catching vulnerabilities before malicious actors have a chance to exploit them. Rather than hoping for the best, you'll have a clear understanding of your security posture and can quantify the actual risks your platform faces. Most importantly, addressing security issues early in the development cycle costs significantly less than dealing with breaches, compliance violations, or emergency patches in production.

3. Database migration
As your platform evolves, so does your database schema. New features need new tables, performance improvements require index changes, and bug fixes sometimes mean altering existing data structures.

Migration Script Detection - automatically identifies new migration files and determines the correct execution order. Your pipeline should understand versioning schemes and dependencies between migrations - you can't add a foreign key before creating the table it references.
Migration Validation - verifies migration scripts before execution through syntax checking and dry-run capabilities by catching obvious errors like invalid SQL, missing tables, or data type conflicts.
Backup Creation - creates automatic backups before applying migrations. If your new migration corrupts data or breaks functionality, you need a way to restore to the previous working state quickly.
Migration Execution - applies database changes in a controlled manner with proper transaction handling and error recovery. Failed migrations should leave your database in a consistent state, not half-updated and broken.
Rollback Capability - preserves database backups and provides automated mechanisms to revert changes when deployments fail. This includes both structural rollbacks (dropping tables, removing columns) and data rollbacks (restoring deleted records, reverting updates) while maintaining referential integrity and preventing orphaned records.
Automated database migration ensures all your environments maintain identical schemas. By eliminating manual schema changes, you remove the human error factor that can lead to inconsistent database states or broken deployments. Every change is tracked with a clear history of what was modified and when, giving you complete visibility into your database evolution. When things go wrong - and they sometimes will - you have reliable rollback capabilities to quickly restore your database to a previous working state.

4. Core delivery
Final step - getting your tested, secure and database-ready code live.

Deployment
Simple Deployment - transfer your application artifacts to the target environment and make them active. Take service down, deploy new version, bring service back up.
Environment Variable Injection - securely provides configuration without hardcoding values in source code. All database URLs, API keys and settings must be injected in this phase.
Script Execution - automate the deployment process through reliable, repeatable scripts.
Service Restart Automation - restart application services in the correct order to pick up new code and configuration.
Basic Validation - verify the deployment was successful and the application is functioning correctly.
Service Health: all required services are running and responsive
Database Connectivity: application can read/write to database
External Integrations: payment processors, email services
Critical User Flows: login, product search, add to cart, checkout process
Rollback
Version Artifact Storage - maintain deployable versions of your application for quick recovery when needed.
Rollback Trigger Mechanism - provide fast, reliable methods to initiate rollback when problems are detected.
Database Rollback Strategy - handle database changes during application rollback while preserving data integrity.
Validation - verify that rollback was successful and the application is functioning correctly at the previous version.
Automated deployment ensures the same process runs every single time, no more forgetting to restart the service. You'll deliver faster, resolve issues more quickly leaving the checklist to the pipeline. Automated validation gives you confidence that your deployment actually works before real customers interact with it.

Important Consideration ❗
As mentioned earlier, CI/CD pipelines vary significantly in complexity and domain-specific implementations. The framework outlined above represents core steps that establish a foundation for the pipeline — this is not the only correct approach, but rather one proven methodology.

Each step offers opportunities for deep technical exploration and sophisticated solutions, but time constraints may limit how far you can pursue these optimizations. Focus on understanding these fundamental steps and creating solutions that function reliably and fulfill their intended purposes. You're welcome to adapt the steps to better align with your specific solution, but the final implementation must satisfy the review requirements.

Useful links 🔗
Twelve-Factor App: build-release-run
CI/CD for E-commerce
Database Schema Changes in CI/CD
Extra Requirements 📚
Docker Integration
If your e-commerce platform was containerized in the previous project, you can extend your CI/CD pipeline to use Docker for automated builds and deployments.

The CI/CD pipeline should be able to build the project using Docker and run automated tests within the container.
The project must include a Dockerfile or script that supports this workflow, ensuring a consistent environment and reproducible builds.
What you'll learn 🧠
Build automated deployment pipelines
Implement continuous integration practices
Configure database migration automation
Integrate security scanning and vulnerability assessment
Design deployment strategies and rollback mechanisms
Deliverables and Review Requirements 📁
All source code and configuration files
A README file with:
Project overview
Setup and installation instructions
Usage guide
Any additional features or bonus functionality implemented
During the review, be prepared to demonstrate your pipelines functionality:

Start from stable version
Simulate 2 separate failures

Failing test in Testing stage
Security failure (vulnerabilities in main code/hardcoded secrets)
Demonstrate complete happy path resulting in successful deployment

Fix introduced issues
Make a change in database (new column/index/table)
Demonstrate rollback to initial stable version

observability
Production is a black box unless you instrument it. You can't fix what you can't see, and you can't optimize what you can't measure.

During development, you have full visibility - debuggers, stack traces, console logs - ability to pause and inspect. Once you've slapped a "done" sticker on it and sent it off to a remote machine which handles thousands or millions of requests, seeing inside becomes much more difficult.

Things break, observability won't prevent that but it'll determine whether you recover in minutes or hours:

Facebook pushed a config change that broke BGP and their observability tools. Engineers had to physically access data centers to resolve the issue. Impact: 6 hours outage, $60-100M revenue lost.
Knight Capital deployed legacy code that triggered erratic trades. Monitoring showed anomalies but couldn't correlate them to the deployment. Impact: 45 minutes, $440M loss.
Amazon's Prime Day infrastructure buckled under load. Their granular metrics allowed rapid isolation of failing components. Impact: under 1 hour, estimated $72-99M lost.
The situation 👀
To understand how your system behaves in production, you need to look at three pillars of observability:

Metrics - numerical measurements over time
Logs - timestamped records of discrete events
Traces - request paths through distributed systems
Combining them, you shift from reactive to proactive. Instead of guessing what broke, you query your data. Instead of waiting for reports, you monitor dashboards.

In commercial applications, "is it working?" isn't the same as "is it succeeding?". A system can be perfectly healthy while the business bleeds - users abandon carts, conversion rates drop, high value customers churn. Your observability setup should surface both technical health and business intelligence in the same dashboards, from the same pipeline.

Functional requirements 📋
Your observability system must provide monitoring across four domains, each with specific metrics and dashboards. The goal is to create a system that gives you visibility into your platform's health, performance, and business metrics.

Stack
Observability systems have three core concerns:

Collection - how metrics and logs leave your application. This might be through instrumentation libraries your code calls directly (like OpenTelemetry or Prometheus client libraries), agents that scrape exposed endpoints, or log shippers like Fluentd or Fluent Bit that parse and forward application output.
Storage - where your data lives. Time-series databases like Prometheus are optimized for metrics (timestamped numerical data). Log aggregation systems like Loki handle unstructured text with minimal resource overhead. Elasticsearch offers more powerful search capabilities but requires more setup and resources.
Visualization & Alerting - how you interact with the data. Grafana connects to various storage backends and provides dashboarding, querying, and alerting in one tool. It pairs particularly well with Prometheus and Loki for a lightweight, well-documented stack.
When evaluating tools, consider:

Does it integrate easily with your existing tech stack?
Can you instrument your application without major refactoring?
Is setup complexity appropriate for a learning project?
You don't need enterprise-grade observability. A simple stack that you understand deeply is more valuable than a complex one you've only configured superficially. Focus on understanding how data flows from your application to your dashboards.

Dashboards
Create four dashboards with the most important metrics for each category. Each dashboard must include at least 2 metrics/graphics that provide an overview of the domain's health and KPIs.

Treat the below outlined metrics as inspiration, your platform may surface different insights worth tracking.

Business Intelligence Dashboard
Revenue and conversion performance — the financial health of the platform:

Total Revenue - track daily, weekly, or monthly revenue
Average Order Value (AOV) - monitor the mean purchase amount per completed order
Cart Abandonment Analysis - track orders that have not been completed in a predefined amount of time or that have been abandoned by non-registered users
Revenue by Product Category - analyze which categories drive the most revenue and identify underperforming areas
User Registration Trends - track new user registrations over time
Product & Customer Dashboard
Product performance and customer behavior patterns:

Top Performing Products - track most sold items either by quantity or revenue
Average Category Ratings - monitor the average ratings for categories
Orders by Customer Type - number of orders by registered and unregistered customers
Technical Performance Dashboard
System health, latency, and reliability:

API Response Times - track average response times for key endpoints (search, cart, checkout, authentication)
HTTP Error Rates - monitor the frequency of 4xx and 5xx responses to identify problematic areas
Request Volume - track the number of requests per endpoint to understand usage patterns and capacity planning needs
Query Performance - monitor execution times for critical database operations like product search and order creation
Payment Failure Analysis - track failed payment attempts by reason (insufficient funds, invalid details, gateway errors) to identify checkout issues and payment gateway reliability
Security Dashboard
Authentication anomalies and potential threat indicators:

Failed Authentication Attempts - monitor unsuccessful login attempts over time
JWT Token Refresh Frequency - track token refresh patterns and failure rates to identify potential security issues
Account Password Reset Events - monitor the frequency of password resets
Rate Limiting Events - track requests that triggered rate limiting
Data Correlation
Single metrics alone are often insufficient. You must define at least 2 correlated metrics that connect signals to reveal information you cannot see from a single metric alone. For example:

Compare average order value between guest and registered users to identify differences in purchasing behavior
Correlate product ratings with revenue to determine whether higher ratings drive sales
Compare total revenue with the revenue of the top X% of customers to assess whether the business should focus on serving high-value customers
Alerting System
Proactive alerting ensures you're notified of critical or potentially critical issues as soon as possible. You will need to create at least 2 alerts that notify you in case of specific events that require immediate attention. The exact alerts and what channel the alerts will be sent to (e.g. e-mail, Discord, Slack) are up to you.

System Availability - the system (or parts of it) is down or unreachable
Authentication Failures - more than X failed login attempts in Y minutes
API Performance - API response times exceed a preset threshold
Database Connectivity - database connections fail
When teams receive too many notifications, they are likely to develop alert fatigue. When designing your alerts, make sure to incorporate reasonable measures to avoid it.

Data Generation
To demonstrate your observability system live, you'll need data that populates your dashboards and triggers your alerts.

Two components are required:

Seed Data — baseline database records (users, products, orders, reviews) that provide historical data for business and product metrics. This can be a SQL script, migration, or programmatic seeder.

Traffic Simulation — live requests that generate technical and security metrics. You could extend the load testing scripts from earlier development by including failed logins, invalid payments, rate limit triggers or alternatively, a simple script that hits your API endpoints with varied request patterns will suffice.

Consider which metrics need historical data versus live traffic when planning your approach.

Important Considerations ❗
Not every metric needs an alert — dashboards and alerts serve different purposes
Document what "normal" looks like before you need to identify "abnormal"
High-cardinality labels (e.g., user IDs, session tokens) can bloat storage and slow queries
Test that your alerts actually fire; dead alerts are worse than no alerts
Useful links 🔗
Distributed Systems Observability
E-commerce Analytics Best Practices
Grafana Dashboard Design
Prometheus Monitoring
ELK Stack for Log Analysis
What you'll learn 🧠
Designing and implementing monitoring and observability systems
Creating monitoring dashboards for different business and technical domains
Building alerting systems
Deliverables and Review Requirements 📁
All source code and configuration files for your observability system
A README file with:
Project overview
Setup and installation instructions
Overview of dashboards and collected metrics
Alert configuration
Data generation script documentation and usage
Any additional features or bonus functionality implemented
During the review, be prepared to:

Demonstrate all four dashboards with live data
Show alerting functionality by triggering various alert conditions
Explain your metric selection and dashboard design choices
Demonstrate correlation analysis between different metrics
Demonstrate your knowledge regarding monitoring, observability and alerting