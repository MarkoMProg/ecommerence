# API Endpoints Reference

**Base URL:** `http://localhost:3000` (or `API_URL` from env)

All `/api/v1/*` routes return JSON. Protected routes require `Authorization: Bearer <token>`.

---

## Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Email/password registration |
| POST | `/login` | — | Email/password login |
| GET | `/me` | Bearer | Current user |
| POST | `/revoke-all` | Bearer | Revoke all sessions |
| GET | `/sessions` | Bearer | List sessions |

---

## Catalog (`/api/v1/products`, `/api/v1/categories`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/products` | — | List products (filter, sort, paginate) |
| GET | `/api/v1/products/suggestions?q=` | — | Search suggestions |
| GET | `/api/v1/products/brands` | — | Distinct brands |
| GET | `/api/v1/products/:idOrSlug` | — | Product by ID or slug |
| POST | `/api/v1/products` | Admin | Create product |
| PATCH | `/api/v1/products/:id` | Admin | Update product |
| DELETE | `/api/v1/products/:id` | Admin | Delete product |
| GET | `/api/v1/categories` | — | List categories |
| GET | `/api/v1/categories/:id` | — | Category by ID |

---

## Cart (`/api/v1/cart`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/cart` | Optional | Get cart (X-Cart-Id for guest) |
| POST | `/api/v1/cart/items` | Optional | Add item |
| PATCH | `/api/v1/cart/items/:itemId` | Optional | Update quantity |
| DELETE | `/api/v1/cart/items/:itemId` | Optional | Remove item |

---

## Checkout (`/api/v1/checkout`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/checkout/summary?coupon=` | Optional | Order summary |
| POST | `/api/v1/checkout` | Optional | Create order |
| POST | `/api/v1/checkout/:orderId/payment-url` | Optional | Get Stripe checkout URL |
| POST | `/api/v1/checkout/verify-payment` | Optional | Verify Stripe payment |

---

## Orders (`/api/v1/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/orders` | Bearer | My orders |
| GET | `/api/v1/orders/:orderId` | Bearer | Order detail |
| POST | `/api/v1/orders/:orderId/cancel` | Bearer | Cancel order |
| PATCH | `/api/v1/orders/:orderId/status` | Admin | Update status |
| POST | `/api/v1/orders/:orderId/reorder` | Bearer | Reorder |

---

## Reviews (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/products/:productId/reviews` | — | List reviews |
| POST | `/api/v1/products/:productId/reviews` | Bearer | Create review |
| PATCH | `/api/v1/reviews/:id` | Bearer | Update own review |
| DELETE | `/api/v1/reviews/:id` | Bearer | Delete own review |
| POST | `/api/v1/reviews/:id/helpful` | Bearer | Vote helpful |

---

## Addresses (`/api/v1/addresses`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/addresses` | Bearer | List addresses |
| POST | `/api/v1/addresses` | Bearer | Create address |
| PATCH | `/api/v1/addresses/:id` | Bearer | Update address |
| DELETE | `/api/v1/addresses/:id` | Bearer | Delete address |
| PATCH | `/api/v1/addresses/:id/set-default-shipping` | Bearer | Set default shipping |
| PATCH | `/api/v1/addresses/:id/set-default-billing` | Bearer | Set default billing |

---

## Billing (`/api/v1/billing`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/billing/payment-methods` | Bearer | List payment methods |
| POST | `/api/v1/billing/setup-session` | Bearer | Stripe setup session |
| DELETE | `/api/v1/billing/payment-methods/:pmId` | Bearer | Remove payment method |
| PATCH | `/api/v1/billing/payment-methods/:pmId/set-default` | Bearer | Set default |

---

## Admin (`/api/v1/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/v1/admin/orders` | Admin | All orders |
| PATCH | `/api/v1/admin/orders/:orderId/status` | Admin | Update order status |
| POST | `/api/v1/admin/orders/:orderId/refund` | Admin | Refund order |
| GET | `/api/v1/admin/reviews` | Admin | All reviews |
| DELETE | `/api/v1/admin/reviews/:reviewId` | Admin | Delete review |
| POST | `/api/v1/admin/products/bulk` | Admin | Bulk upload (CSV/JSON) |

---

## Uploads (`/api/v1/uploads`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/uploads` | Admin | Upload image (multipart) |

---

## Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | Stripe-Signature | Stripe webhook |

---

_For OpenAPI/Swagger, consider adding `@nestjs/swagger` in future._
