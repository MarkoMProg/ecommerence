# Local HTTPS Setup Guide (Frontend + Backend)

This guide explains how to run both apps over HTTPS locally on Windows, using a trusted mkcert certificate.

## Scope

- Backend: https://localhost:3000
- Frontend: https://localhost:3001
- Frontend to backend API traffic: HTTPS only

## 1. Install prerequisites

### Node.js

Use Node 22 or newer.

### OpenSSL (optional but useful for inspection)

Install OpenSSL Light:

```powershell
winget install --id ShiningLight.OpenSSL.Light --silent --accept-package-agreements --accept-source-agreements
```

### mkcert

Install mkcert:

```powershell
winget install --id FiloSottile.mkcert --silent --accept-package-agreements --accept-source-agreements
```

Install local CA into trust stores:

```powershell
mkcert -install
```

## 2. Generate trusted localhost certificates

From apps/backend/certs, create cert and key:

```powershell
cd ecom\tshirtshop\apps\backend\certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
```

This generates:

- key.pem
- cert.pem

## 3. Backend environment

In apps/backend/.env:

- set USE_HTTPS=1
- set UI_URL=https://localhost:3001

Example:

```env
PORT=3000
UI_URL=https://localhost:3001
USE_HTTPS=1
```

## 4. Frontend environment

In apps/web/.env.local:

```env
API_URL=https://localhost:3000
NEXT_PUBLIC_API_URL=https://localhost:3000
```

## 5. Start apps

Start backend:

```powershell
cd ecom\tshirtshop\apps\backend
npm run dev
```

Start frontend:

```powershell
cd ecom\tshirtshop\apps\web
npm run dev
```

Expected URLs:

- https://localhost:3000
- https://localhost:3001

## 6. Confirm certificate SAN values (optional)

```powershell
openssl x509 -in ecom\tshirtshop\apps\backend\certs\cert.pem -noout -subject -issuer -ext subjectAltName
```

You should see SAN entries for:

- DNS: localhost
- IP: 127.0.0.1
- IP: ::1

## 7. Known issues and fixes

### A) next/image hostname not configured

Error example:

- Invalid src prop (...) hostname "localhost" is not configured under images in next.config.js

Fix:

In apps/web/next.config.js, ensure remotePatterns includes BOTH http and https for localhost and 127.0.0.1.

### B) Not secure in browser even with valid cert

Likely mixed content. Usually an image URL is still http://localhost:3000/uploads/...

Fix:

- Ensure product image URLs are served as https://localhost:3000/uploads/...
- Avoid embedding http URLs on pages served from https://localhost:3001

### C) DEPTH_ZERO_SELF_SIGNED_CERT / UNABLE_TO_VERIFY_LEAF_SIGNATURE

This happens when Node process does not trust the local CA for server-side fetch.

Fix options:

- Prefer route-level server proxy that reads mkcert root CA and uses it for backend HTTPS requests.
- Ensure server-side direct fetch paths also use trusted CA handling.

### D) Port already in use (EADDRINUSE)

If 3000 or 3001 is busy, stop previous node processes and restart.

## 8. Quick verification checklist

- Backend responds over HTTPS:

```powershell
curl.exe --ssl-no-revoke -i https://localhost:3000/api/auth/get-session
```

- Frontend loads over HTTPS:

```powershell
curl.exe --ssl-no-revoke -I https://localhost:3001/
```

- Frontend API proxy responds over HTTPS:

```powershell
curl.exe --ssl-no-revoke -i https://localhost:3001/api/auth/get-session
```

If all 3 succeed, local HTTPS is set correctly.
