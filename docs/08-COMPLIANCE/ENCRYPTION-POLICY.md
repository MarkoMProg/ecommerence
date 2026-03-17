# Encryption at Rest — Policy and Implementation

**Created:** 2026-03-17  
**Purpose:** Document which sensitive data is encrypted at rest and which is stored in plaintext.

---

## 1. Overview

Sensitive PII (personally identifiable information) is encrypted before being written to the database. The platform uses **AES-256-GCM** via `common/crypto.util.ts`. Key configuration: `ENCRYPTION_KEY` (64-character hex, 32 bytes).

---

## 2. Encrypted Fields

### 2.1 Order Shipping Address (order table)

**Location:** `apps/backend/src/order/checkout.service.ts` (write), `order.service.ts` (read)

| Field | Encrypted | Notes |
|-------|-----------|-------|
| shippingFullName | ✅ | Full name |
| shippingLine1 | ✅ | Address line 1 |
| shippingLine2 | ✅ | Address line 2 (nullable) |
| shippingCity | ✅ | City |
| shippingStateOrProvince | ✅ | State/province |
| shippingPostalCode | ✅ | Postal code |
| shippingPhone | ✅ | Phone (nullable) |

**Tests:** `order/__tests__/order.encryption.spec.ts`

### 2.2 User Addresses (user_address table)

**Location:** `apps/backend/src/address/address.service.ts`

| Field | Encrypted | Notes |
|-------|-----------|-------|
| fullName | ✅ | Full name |
| line1 | ✅ | Address line 1 |
| line2 | ✅ | Address line 2 (nullable) |
| city | ✅ | City |
| stateOrRegion | ✅ | State/region |
| postalCode | ✅ | Postal code |
| country | ✅ | Country code |
| phone | ✅ | Phone (nullable) |

**Tests:** `address/__tests__/address.encryption.spec.ts`

---

## 3. Plaintext Fields (Not Encrypted)

### 3.1 Order Table

| Field | Reason |
|-------|--------|
| id | UUID, not PII |
| userId | Foreign key, not PII |
| status | Enum value |
| subtotalCents, shippingCents, totalCents | Numeric aggregates |
| stripeSessionId | Stripe opaque ID; not card data |
| paidAt, refundedAt | Timestamps |
| stripeRefundId | Stripe opaque ID |
| refundAmountCents | Audit metadata |
| createdAt, updatedAt | Timestamps |

### 3.2 Order Item Table

| Field | Reason |
|-------|--------|
| productNameAtOrder | Product name snapshot; low PII risk |
| selectedOptionAtOrder | Option name (e.g. "M"); low PII risk |
| priceCentsAtOrder, quantity | Numeric |

### 3.3 Payment Data

**Card data is never stored.** Stripe Checkout handles all payment collection. We store only:
- `stripeSessionId` — Stripe Checkout Session ID (opaque reference)
- `stripeRefundId` — Stripe Refund ID (opaque reference)

This keeps the application out of PCI scope for card storage.

---

## 4. Encryption Implementation

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **IV:** 12 bytes, random per encryption
- **Format:** `<iv>:<authTag>:<ciphertext>` (all hex)
- **Key:** `ENCRYPTION_KEY` env var, 64‑character hex string

**Utilities:** `common/crypto.util.ts` — `encrypt()`, `decrypt()`, `encryptNullable()`, `decryptNullable()`

**Tests:** `common/__tests__/crypto.util.spec.ts`

---

## 5. References

- [security-standards.md](./security-standards.md)
- [crypto.util.ts](../../ecom/tshirtshop/apps/backend/src/common/crypto.util.ts)
- [order.encryption.spec.ts](../../ecom/tshirtshop/apps/backend/src/order/__tests__/order.encryption.spec.ts)
- [address.encryption.spec.ts](../../ecom/tshirtshop/apps/backend/src/address/__tests__/address.encryption.spec.ts)

---

_End of document_
