# Master Task Board

## 1. Purpose of This Document

This document is the **single source of truth** for tracking all work required to complete the `tshirtshop` project.

It is used by:

* Developers
* AI coding agents
* Reviewers

It maps **requirements → implementation tasks → completion status**.

---

# 2. Task Status Legend

Each task must have one of the following statuses:

| Status      | Meaning                                  |
| ----------- | ---------------------------------------- |
| NOT STARTED | Work has not begun                       |
| IN PROGRESS | Currently being implemented              |
| BLOCKED     | Waiting on dependencies                  |
| REVIEW      | Implementation complete, awaiting review |
| DONE        | Completed and verified                   |

---

# 3. Project 1 — Foundation Tasks

---

## 3.1 Infrastructure Setup

| ID      | Task                       | Status      |
| ------- | -------------------------- | ----------- |
| FND-001 | Setup monorepo structure   | DONE        |
| FND-002 | Configure NestJS backend   | DONE        |
| FND-003 | Configure Next.js frontend | DONE        |
| FND-004 | Setup PostgreSQL database  | DONE        |
| FND-005 | Configure Drizzle ORM      | DONE        |
| FND-006 | Setup Docker environment   | NOT STARTED |

---

## 3.2 Authentication System

| ID       | Task                                  | Status      |
| -------- | ------------------------------------- | ----------- |
| AUTH-001 | Integrate better-auth                 | DONE        |
| AUTH-002 | Implement email/password registration | DONE        |
| AUTH-003 | Implement login functionality         | DONE        |
| AUTH-004 | Configure JWT token system            | DONE        |
| AUTH-005 | Implement refresh token rotation      | DONE        |
| AUTH-006 | Implement token revocation            | DONE        |
| AUTH-007 | Add OAuth login support               | NOT STARTED |
| AUTH-008 | Integrate CAPTCHA                     | NOT STARTED |
| AUTH-009 | Implement password reset flow         | DONE        |
| AUTH-010 | Implement 2FA support                | DONE        |

---

## 3.3 Database Design

| ID     | Task                        | Status      |
| ------ | --------------------------- | ----------- |
| DB-001 | Create ERD documentation    | NOT STARTED |
| DB-002 | Define users schema         | DONE        |
| DB-003 | Define products schema      | DONE        |
| DB-004 | Define categories schema    | DONE        |
| DB-005 | Define brands schema        | NOT STARTED |
| DB-006 | Define images schema        | DONE        |
| DB-007 | Add indexes and constraints | NOT STARTED |

---

## 3.4 Product Catalog

| ID      | Task                           | Status      |
| ------- | ------------------------------ | ----------- |
| CAT-001 | Implement product CRUD API     | DONE        |
| CAT-002 | Implement category browsing    | DONE        |
| CAT-003 | Implement search functionality | NOT STARTED |
| CAT-004 | Implement faceted filtering    | NOT STARTED |
| CAT-005 | Implement sorting options      | NOT STARTED |
| CAT-006 | Implement search suggestions   | NOT STARTED |

---

## 3.5 Testing (Foundation)

| ID       | Task                   | Status      |
| -------- | ---------------------- | ----------- |
| TEST-001 | JWT unit tests         | NOT STARTED |
| TEST-002 | Input validation tests | NOT STARTED |
| TEST-003 | Product model tests    | NOT STARTED |
| TEST-004 | API integration tests  | NOT STARTED |

---

# 4. Project 2 — Commerce Tasks

---

## 4.1 Shopping Cart

| ID       | Task                           | Status      |
| -------- | ------------------------------ | ----------- |
| CART-001 | Implement cart database schema | NOT STARTED |
| CART-002 | Add item to cart API           | NOT STARTED |
| CART-003 | Remove item API                | NOT STARTED |
| CART-004 | Update quantity API            | NOT STARTED |
| CART-005 | Implement guest cart logic     | NOT STARTED |
| CART-006 | Implement persistent user cart | NOT STARTED |

---

## 4.2 Checkout Process

| ID      | Task                          | Status      |
| ------- | ----------------------------- | ----------- |
| CHK-001 | Implement checkout API        | NOT STARTED |
| CHK-002 | Implement address validation  | NOT STARTED |
| CHK-003 | Implement order summary logic | NOT STARTED |
| CHK-004 | Implement order confirmation  | NOT STARTED |

---

## 4.3 Payment Integration

| ID      | Task                              | Status      |
| ------- | --------------------------------- | ----------- |
| PAY-001 | Integrate Stripe/PayPal sandbox   | NOT STARTED |
| PAY-002 | Implement payment validation flow | NOT STARTED |
| PAY-003 | Handle payment failures           | NOT STARTED |
| PAY-004 | Implement payment status tracking | NOT STARTED |

---

## 4.4 Order Management

| ID      | Task                              | Status      |
| ------- | --------------------------------- | ----------- |
| ORD-001 | Implement order schema            | NOT STARTED |
| ORD-002 | Implement order creation API      | NOT STARTED |
| ORD-003 | Implement order status lifecycle  | NOT STARTED |
| ORD-004 | Implement order cancellation flow | NOT STARTED |
| ORD-005 | Implement refund workflow         | NOT STARTED |

---

# 5. Project 3 — Experience Tasks

---

## 5.1 Frontend Pages

| ID     | Task                           | Status      |
| ------ | ------------------------------ | ----------- |
| UI-001 | Implement home page            | DONE        |
| UI-002 | Implement product listing page | DONE        |
| UI-003 | Implement product detail page  | DONE        |
| UI-004 | Implement cart page            | NOT STARTED |
| UI-005 | Implement checkout page        | NOT STARTED |
| UI-006 | Implement user account page    | NOT STARTED |
| UI-007 | Implement admin dashboard      | NOT STARTED |

---

## 5.2 Reviews System

| ID      | Task                         | Status      |
| ------- | ---------------------------- | ----------- |
| REV-001 | Implement review schema      | NOT STARTED |
| REV-002 | Implement review API         | NOT STARTED |
| REV-003 | Implement rating aggregation | NOT STARTED |
| REV-004 | Implement helpful voting     | NOT STARTED |

---

## 5.3 Admin Features

| ID      | Task                            | Status      |
| ------- | ------------------------------- | ----------- |
| ADM-001 | Implement RBAC system           | NOT STARTED |
| ADM-002 | Implement product admin tools   | NOT STARTED |
| ADM-003 | Implement order management UI   | NOT STARTED |
| ADM-004 | Implement user management tools | NOT STARTED |

---

## 5.4 Security & Performance

| ID       | Task                        | Status      |
| -------- | --------------------------- | ----------- |
| SEC-001  | Implement TLS configuration | NOT STARTED |
| SEC-002  | Implement rate limiting     | NOT STARTED |
| SEC-003  | Implement input validation  | NOT STARTED |
| PERF-001 | Implement caching strategy  | NOT STARTED |
| PERF-002 | Conduct load testing        | NOT STARTED |

---

# 6. Task Management Rules

All tasks must:

* Map directly to project requirements
* Be assigned an ID
* Have clear completion criteria
* Include testing requirements

No feature may be implemented without an existing task entry.