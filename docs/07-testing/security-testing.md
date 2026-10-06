# Digital Library — Security Testing

## 1. Document Purpose

This document defines the security-testing plan for the Digital Library V1 project.

The purpose is to verify that the application protects:

- User accounts.
- Authentication credentials.
- Authorization boundaries.
- Books and chapters.
- User-specific data.
- Database operations.
- Uploaded files where applicable.
- Reader content.
- Translation output.
- TTS-related content.
- Application secrets.
- Internal application information.

Security testing must be performed against the actual current implementation.

This document must not be treated as evidence that a vulnerability has already been tested or eliminated.

---

# 2. Project Information

**Project Name:** Digital Library

**Project Type:** BTech Final Year Project

**Target Version:** V1

**Frontend:**
- HTML
- CSS
- Vanilla JavaScript

**Backend:**
- Node.js
- Express.js

**Database:**
- MySQL

**Architecture:**
- Monolithic

**Repository:**
```text
https://github.com/ItsPrincekumar03/digital-library.git