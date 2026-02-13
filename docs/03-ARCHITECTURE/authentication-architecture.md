
# Authentication Architecture

Authentication uses better-auth.

Token lifecycle:
Access tokens are short‑lived and stored in memory.
Refresh tokens are long‑lived and rotated on each use.

Security features:
- Token revocation
- 2FA verification
- OAuth login
- CAPTCHA validation
- Secure password reset flows

Auth guards protect all sensitive routes.
