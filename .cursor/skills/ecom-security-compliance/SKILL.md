---
name: ecom-security-compliance
description: Security and compliance for tshirtshop. Use when handling encryption, auth, PII, payment data, or security-sensitive code.
---

# Ecom Security & Compliance

## CIA Triad

TLS, input validation, rate limiting, RBAC. Never store payment card data.

## Encryption at Rest

**Algorithm:** AES-256-GCM. Key: `ENCRYPTION_KEY` (64-char hex).

**Encrypted fields:**
- Order shipping: fullName, line1, line2, city, state, postalCode, phone
- User addresses: fullName, line1, line2, city, stateOrRegion, postalCode, country, phone

**Auth:** User email/name encrypted via `auth/crypto.ts` (blind index for lookups).

## Plaintext (Not Encrypted)

Order: id, userId, status, amounts, stripeSessionId, timestamps. Order items: productNameAtOrder, selectedOptionAtOrder. Card data never stored — Stripe Checkout only.

## Utilities

- `common/crypto.util.ts` — encrypt, decrypt, encryptNullable, decryptNullable
- `auth/crypto.ts` — blindIndex, blindEmail for auth lookups

## Full Reference

- [docs/08-COMPLIANCE/security-standards.md](../../docs/08-COMPLIANCE/security-standards.md)
- [docs/08-COMPLIANCE/ENCRYPTION-POLICY.md](../../docs/08-COMPLIANCE/ENCRYPTION-POLICY.md)
