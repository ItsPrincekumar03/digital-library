# Digital Library — Regression Testing

## 1. Document Purpose

This document defines the regression-testing strategy for the Digital Library V1 project.

Regression testing ensures that changes made to one part of the application do not unintentionally break functionality that was already working.

The Digital Library is being developed incrementally through multiple modules. Therefore, regression testing is especially important when:

- Existing backend code is modified.
- Database structures are changed.
- APIs are changed.
- Frontend pages are changed.
- Authentication is changed.
- Authorization is changed.
- Reader functionality is changed.
- TTS functionality is changed.
- Translation functionality is changed.
- Security fixes are applied.

The purpose of regression testing is not to execute every test after every small code change.

Instead, the regression scope should be based on the affected functionality and its dependencies.

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