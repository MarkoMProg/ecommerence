---
name: ecom-api-standards
description: API standards for tshirtshop. Use when creating or modifying API endpoints, REST routes, or response formats.
---

# Ecom API Standards

## Conventions

- REST
- Base: `/api/v1/resource`
- Protected routes: `Authorization: Bearer <token>`

## Response Format

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## Key Endpoints

| Area | Path | Notes |
|------|------|-------|
| Auth | /api/v1/auth | register, login, me, revoke-all, sessions |
| Catalog | /api/v1/products, /api/v1/categories | List, get, create (admin), update, delete |
| Cart | /api/v1/cart | Optional auth, X-Cart-Id for guest |
| Checkout | /api/v1/checkout | summary, create, payment-url, verify-payment |
| Orders | /api/v1/orders | Bearer required |
| Reviews | /api/v1/products/:id/reviews, /api/v1/reviews | List, create, update, delete, helpful |

## Full Reference

See [docs/06-STANDARDS/api-endpoints.md](../../docs/06-STANDARDS/api-endpoints.md) and [api-guidelines.md](../../docs/06-STANDARDS/api-guidelines.md)
