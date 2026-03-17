# Security Standards

Security follows CIA triad principles.

**Related:** [ENCRYPTION-POLICY.md](./ENCRYPTION-POLICY.md) — which fields are encrypted at rest.

Key requirements:
- TLS encryption
- Input validation
- Rate limiting
- RBAC authorization
- No storage of payment card data
- Sensitive data (shipping/address PII) encrypted at rest — see ENCRYPTION-POLICY.md
