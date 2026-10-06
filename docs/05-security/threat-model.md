# DIGITAL LIBRARY
# THREAT MODEL

**Project:** Digital Library  
**Project Type:** BTech Final Year Project  
**Release:** V1  
**Document Version:** 1.0  
**Status:** Active

---

# 1. Purpose

This document identifies the major security threats that may affect the
Digital Library application and defines appropriate mitigations.

The threat model focuses on protecting:

- user accounts
- administrator accounts
- authentication
- authorization
- books
- chapters
- unpublished content
- database
- uploaded files
- reader content
- translated content
- external services
- application secrets
- infrastructure

The actual implementation and current security controls in the
repository are the source of truth.

---

# 2. Threat Modeling Objectives

The objectives are to:

1. Identify important assets.
2. Identify possible attackers.
3. Identify trust boundaries.
4. Identify attack surfaces.
5. Identify major threats.
6. Assess threat severity.
7. Define mitigations.
8. Define security tests.
9. Track unresolved security risks.

---

# 3. System Overview

The Digital Library architecture is:

```text
User Browser
     |
     | HTTPS / HTTP
     |
     v
Frontend
     |
     | REST API
     |
     v
Node.js + Express
     |
     +--> Authentication
     |
     +--> Authorization
     |
     +--> Business Logic
     |
     +--> Validation
     |
     +--> File Handling
     |
     +--> External Services
     |
     v
Repository Layer
     |
     v
MySQL