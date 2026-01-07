# Threat Model – Chirp Web Application

## 1. System Overview

Chirp is a social media web application similar to Twitter/X.

- **Frontend:** Angular (Single Page Application)
- **Backend:** Node.js with Express
- **Database:** MongoDB
- **Authentication:** JWT-based authentication
- **Media Storage:** Cloudinary (profile pictures and post images)

Public users can access the login and registration pages. All other functionality requires a registered and authenticated user.

---

## 2. Assets

The following assets are considered security-relevant and require protection:

- User credentials (password hashes)
- JWT access tokens
- User-generated content (posts, comments, likes, bookmarks)
- Uploaded images (profile pictures, post images)
- Personal user data (minimal profile information)
- Backend secrets (JWT secret, Cloudinary API keys)

---

## 3. Actors

- **Public user:** Unauthenticated visitor
- **Authenticated user:** Registered and logged-in user
- **Malicious user:** Authenticated user attempting abuse
- **External attacker:** Unauthenticated attacker targeting the application

---

## 4. Entry Points and Attack Surface

- REST API endpoints (`/login`, `/register`, `/posts`, `/comments`, etc.)
- File upload endpoints for profile pictures and post images
- JWT authentication middleware
- Database queries executed by the backend
- Media uploads to Cloudinary

---

## 5. Threat Identification (STRIDE)

### Spoofing

**Threats:**

- Impersonation using stolen JWT access tokens
- Impersonation of users in real-time communication (Socket.IO, planned feature)

**Mitigations:**

- JWT signature verification on every protected backend route
- Authenticated user identity is derived from the verified token, not from client input

**Limitations:**

- JWTs are stored in `localStorage`, increasing the impact of potential XSS attacks

---

### Tampering

**Threats:**

- Unauthorized modification or deletion of posts and other resources (IDOR)
- Uploading malicious or unexpected file types

**Mitigations:**

- Object-level authorization checks ensure that only resource owners can update or delete content
- File uploads are restricted using a MIME type allowlist (JPG, PNG, WEBP)
- Uploaded files are assigned unique filenames to prevent overwriting existing media

---

### Repudiation

**Threats:**

- Users denying having performed actions such as creating, editing, or deleting content

**Mitigations:**

- All write operations are associated with the authenticated user ID on the backend

**Limitations:**

- No dedicated audit log or user-visible activity history is implemented

---

### Information Disclosure

**Threats:**

- Exposure of sensitive user data
- Leakage of image metadata (EXIF information)
- Unauthorized access to protected resources

**Mitigations:**

- Passwords are salted and hashed using bcrypt before storage
- Image metadata is stripped during upload to Cloudinary
- Sensitive fields (e.g., password hashes) are never returned in API responses

---

### Denial of Service

**Threats:**

- Large file uploads exhausting server resources
- Excessive API or upload requests

**Mitigations:**

- Maximum file size limits are enforced for uploaded images
- Temporary upload files are deleted after processing to prevent disk exhaustion

**Limitations:**

- Rate limiting is not yet implemented

---

### Elevation of Privilege

**Threats:**

- Users gaining unauthorized access to resources or actions

**Mitigations:**

- Authorization is enforced on the backend for all protected operations
- Client-provided user identifiers are never trusted

---

## 6. Summary and Evaluation

This threat model analyzes the Chirp application across multiple security dimensions, including authentication, authorization, file handling, and data storage.

Core threats such as **IDOR**, **malicious file uploads**, and **credential compromise** are mitigated through backend enforcement, cryptographic authentication, and controlled input validation.

Known limitations are explicitly documented and considered acceptable for the scope of this project.

---

## 7. Future Improvements

- Store JWTs in HttpOnly cookies to reduce XSS impact
- Implement refresh token rotation
- Add rate limiting for authentication and file upload endpoints
- Secure Socket.IO connections using token-based authentication
- Improve logging and auditability of security-relevant events
