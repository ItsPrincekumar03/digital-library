# Digital Library — Rollback Plan

## 1. Document Purpose

This document defines the rollback procedure for the Digital Library V1 application.

Rollback is the controlled process of returning the application to a previously known stable state when a deployment, database change, configuration change, or release causes a serious problem.

This document covers:

- Application rollback.
- Git rollback.
- Backend rollback.
- Frontend rollback.
- Database rollback.
- Configuration rollback.
- File/storage considerations.
- Security-related rollback.
- Verification after rollback.
- Incident documentation.
- Post-rollback corrective actions.

Rollback should be used only when the current release cannot be safely corrected through a normal fix or when service/data/security risk requires immediate restoration of the previous stable state.

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