# Entity Relationship Diagram — Darkloom

**Created:** 2026-02-18 (DB-001)  
**Source:** `apps/backend/src/auth/schema.ts`, `apps/backend/src/catalog/schema.ts`  
**Database:** PostgreSQL via Drizzle ORM

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
        boolean isPrimary
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
| **Catalog** | `category` | Product categories (hierarchical via parentCategoryId) |
| | `product` | Products with price, stock, brand |
| | `product_image` | Product images (one primary per product) |

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

---

## 4. Future Tables (Planned, Not Yet Implemented)

Per project-overview and master-task-board:

| Table | Purpose |
|-------|---------|
| `cart` | Shopping cart (guest or user) |
| `cart_item` | Items in cart |
| `order` | Placed orders |
| `order_item` | Line items per order |
| `address` | Shipping/billing addresses |
| `payment` | Payment records |
| `review` | Product reviews |
| `review_helpful_vote` | Helpful voting on reviews |

---

## 5. Diagram Reference

- **PK** = Primary key  
- **UK** = Unique key  
- **FK** = Foreign key  
- `||--o{` = one-to-many  
- `||--o|` = one-to-one (optional)

---

*End of ERD document*
