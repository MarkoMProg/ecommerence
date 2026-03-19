# Entity Relationship Diagram — Darkloom

**Created:** 2026-02-18 (DB-001)  
**Source:** `apps/backend/src/auth/schema.ts`, `apps/backend/src/address/schema.ts`, `apps/backend/src/catalog/schema.ts`, `apps/backend/src/cart/schema.ts`, `apps/backend/src/order/schema.ts`, `apps/backend/src/review/schema.ts`  
**Database:** PostgreSQL via Drizzle ORM

This ERD includes the key components required for task.md 1/3: **Entities**, **Attributes**, **Relationships**, **Primary Keys**, **Foreign Keys**, **Cardinality**, **Modality**.

---

## 1. Current Schema (Implemented)

```mermaid
erDiagram
    user ||--o{ session : has
    user ||--o{ account : has
    user ||--o| two_factor : has
    category ||--o{ product : contains
    product ||--o{ product_image : has
    
    category ||--o{ category : "children"
    cart ||--o{ cart_item : has
    user ||--o{ cart : has
    user ||--o{ order : has
    order ||--o{ order_item : has
    product ||--o{ order_item : referenced_by
    user ||--o{ user_address : has
    product ||--o{ review : has
    user ||--o{ review : writes
    review ||--o{ review_helpful_vote : has
    
    user {
        text id PK
        text name
        text email UK
        boolean emailVerified
        text image
        boolean twoFactorEnabled
        timestamp createdAt
        timestamp updatedAt
    }
    
    session {
        text id PK
        timestamp expiresAt
        text token UK
        text userId FK
        text ipAddress
        text userAgent
        timestamp createdAt
        timestamp updatedAt
    }
    
    account {
        text id PK
        text accountId
        text providerId
        text userId FK
        text accessToken
        text refreshToken
        text password
        timestamp createdAt
        timestamp updatedAt
    }
    
    verification {
        text id PK
        text identifier
        text value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
    
    two_factor {
        text id PK
        text secret
        text backupCodes
        text userId FK
    }
    
    category {
        text id PK
        text name
        text slug UK
        text parentCategoryId FK
        timestamp createdAt
    }
    
    product {
        text id PK
        text name
        text slug UK
        text description
        integer priceCents
        integer stockQuantity
        text categoryId FK
        text brand
        text weightMetric
        text weightImperial
        text dimensionMetric
        text dimensionImperial
        timestamp createdAt
        timestamp updatedAt
    }
    
    product_image {
        text id PK
        text productId FK
        text imageUrl
        text altText
        boolean isPrimary
    }
    
    cart {
        text id PK
        text userId FK "nullable, guest when null"
        timestamp createdAt
        timestamp updatedAt
    }
    
    cart_item {
        text id PK
        text cartId FK
        text productId FK
        integer quantity
        timestamp createdAt
        timestamp updatedAt
    }
    
    order {
        text id PK
        text userId FK "nullable, guest when null"
        text status
        text shippingFullName
        text shippingLine1
        text shippingLine2
        text shippingCity
        text shippingStateOrProvince
        text shippingPostalCode
        text shippingCountry
        text shippingPhone
        integer subtotalCents
        integer shippingCents
        integer totalCents
        text stripeSessionId "PAY-004"
        timestamp paidAt "PAY-004"
        timestamp createdAt
        timestamp updatedAt
    }
    
    order_item {
        text id PK
        text orderId FK
        text productId FK
        integer quantity
        integer priceCentsAtOrder
        text productNameAtOrder
        timestamp createdAt
    }
    
    user_address {
        text id PK
        text userId FK
        text label
        text fullName
        text phone
        text line1
        text line2
        text city
        text stateOrRegion
        text postalCode
        text country
        boolean isDefaultShipping
        boolean isDefaultBilling
        timestamp createdAt
        timestamp updatedAt
    }
    
    review {
        text id PK
        text productId FK
        text userId FK
        text userName
        integer rating
        text title
        text body
        integer helpfulCount
        timestamp createdAt
        timestamp updatedAt
    }
    
    review_helpful_vote {
        text id PK
        text reviewId FK
        text userId FK
        timestamp createdAt
    }
    
    manual_refresh_token {
        text id PK
        text userId FK
        text sessionId FK
        text tokenHash UK
        timestamp expiresAt
        timestamp usedAt
        timestamp createdAt
    }
    
    rate_limit {
        text id PK
        text key UK
        integer count
        bigint lastRequest
    }
```

---

## 2. Entity Summary

| Schema | Table | Purpose |
|--------|-------|---------|
| **Auth** | `user` | User accounts (better-auth) |
| | `session` | Active sessions / JWT tokens |
| | `account` | OAuth providers, password hash |
| | `verification` | Email verification, password reset tokens |
| | `two_factor` | TOTP secrets, backup codes |
| | `manual_refresh_token` | Refresh token rotation, single-use validation |
| | `rate_limit` | Rate limiting (Better Auth) |
| **Address** | `user_address` | Saved shipping/billing addresses |
| **Catalog** | `category` | Product categories (hierarchical via parentCategoryId) |
| | `product` | Products with price, stock, brand |
| | `product_image` | Product images (one primary per product) |
| **Cart** | `cart` | Shopping cart (guest or user; userId null = guest) |
| | `cart_item` | Line items (product + quantity per cart) |
| **Order** | `order` | Placed orders (created at checkout; status: pending/paid/shipped/completed/cancelled/refunded) |
| | `order_item` | Line items with price snapshot at order time |
| **Review** | `review` | Product reviews (rating 1–5, title, body); one per user per product |
| | `review_helpful_vote` | Helpful votes on reviews |

---

## 3. Key Relationships

| From | To | Type | On Delete |
|------|----|----|-----------|
| session.userId | user.id | many-to-one | CASCADE |
| account.userId | user.id | many-to-one | CASCADE |
| two_factor.userId | user.id | many-to-one | CASCADE |
| product.categoryId | category.id | many-to-one | RESTRICT |
| product_image.productId | product.id | many-to-one | CASCADE |
| category.parentCategoryId | category.id | self-ref, optional | — |
| cart.userId | user.id | many-to-one, optional | CASCADE |
| cart_item.cartId | cart.id | many-to-one | CASCADE |
| cart_item.productId | product.id | many-to-one | CASCADE |
| order.userId | user.id | many-to-one, optional | SET NULL |
| order_item.orderId | order.id | many-to-one | CASCADE |
| order_item.productId | product.id | many-to-one | RESTRICT |
| user_address.userId | user.id | many-to-one | CASCADE |
| review.productId | product.id | many-to-one | RESTRICT |
| review.userId | user.id | many-to-one | CASCADE |
| review_helpful_vote.reviewId | review.id | many-to-one | CASCADE |
| review_helpful_vote.userId | user.id | many-to-one | CASCADE |
| manual_refresh_token.userId | user.id | many-to-one | CASCADE |
| manual_refresh_token.sessionId | session.id | many-to-one | CASCADE |

---

## 4. Cardinality

| Relationship | Cardinality | Description |
|--------------|-------------|-------------|
| user → session | 1:N | One user has many sessions |
| user → account | 1:N | One user has many OAuth accounts |
| user → two_factor | 1:0..1 | One user has zero or one 2FA record |
| user → user_address | 1:N | One user has many saved addresses |
| user → cart | 1:N | One user has many carts (typically one active) |
| user → order | 1:N | One user has many orders |
| user → review | 1:N | One user has many reviews |
| category → product | 1:N | One category contains many products |
| product → product_image | 1:N | One product has many images |
| product → order_item | 1:N | One product referenced by many order items |
| product → review | 1:N | One product has many reviews |
| cart → cart_item | 1:N | One cart has many line items |
| order → order_item | 1:N | One order has many line items |
| review → review_helpful_vote | 1:N | One review has many helpful votes |
| category → category | 1:N (self) | Hierarchical categories (parent/children) |

---

## 5. Modality

| Relationship | Modality | Notes |
|--------------|----------|-------|
| cart.userId | Optional (0..1) | Null = guest cart |
| order.userId | Optional (0..1) | Null = guest order |
| category.parentCategoryId | Optional (0..1) | Null = top-level category |
| session.userId | Mandatory (1) | Every session belongs to a user |
| cart_item.cartId, productId | Mandatory (1) | Every line item belongs to cart and product |
| order_item.orderId, productId | Mandatory (1) | Every order line belongs to order and product |

---

## 6. Future Tables (Planned, Not Yet Implemented)

Per project-overview and master-task-board:

| Table | Purpose |
|-------|---------|
| `payment` | Payment records (Stripe session/refund IDs currently on order) |

---

## 7. Review Tables (REV-001, Implemented)

| Table | Purpose |
|-------|---------|
| `review` | Product reviews (productId, userId, rating 1–5, title, body); unique (productId, userId) |
| `review_helpful_vote` | Helpful voting (reviewId, userId, helpful); unique (reviewId, userId) |

---

## 8. Diagram Reference

- **PK** = Primary key  
- **UK** = Unique key  
- **FK** = Foreign key  
- `||--o{` = one-to-many  
- `||--o|` = one-to-one (optional)

---

*End of ERD document*
