# Digital Library — Coding Standards

## 1. Purpose

This document defines the coding standards and development conventions for the Digital Library project.

The purpose is to ensure that the source code remains:

- Readable
- Consistent
- Maintainable
- Secure
- Testable
- Modular
- Easy to review

These standards apply to developers and AI coding assistants working on the project.

The existing repository remains the primary source of truth for established coding conventions. When this document and the current implementation differ, the difference should be reviewed rather than silently forcing a rewrite.

---

# 2. Core Coding Principles

The project follows these principles:

1. Prefer simple solutions over unnecessary complexity.
2. Preserve the existing architecture.
3. Separate responsibilities between layers.
4. Write readable and maintainable code.
5. Validate untrusted input.
6. Protect authentication and authorization.
7. Use safe database access.
8. Render untrusted content safely.
9. Avoid unnecessary duplication.
10. Make changes small and reviewable.
11. Test meaningful changes.
12. Do not rewrite working modules without a valid reason.
13. Keep documentation synchronized with significant implementation changes.
14. Never commit secrets.

---

# 3. Approved Technology Stack

The standard V1 implementation stack is:

```text
Frontend:
HTML
CSS
Vanilla JavaScript

Backend:
Node.js
Express.js

Database:
MySQL