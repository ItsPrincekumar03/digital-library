# DIGITAL LIBRARY
# DATABASE DESIGN DOCUMENT

**Project:** Digital Library  
**Project Type:** BTech Final Year Project  
**Release:** V1  
**Document Version:** 1.0  
**Status:** Active  
**Database:** MySQL 8.x

---

# 1. Purpose

This document defines the database design for the Digital Library
application.

It describes:

- database objectives
- database architecture
- entities
- relationships
- keys
- constraints
- normalization
- indexing
- integrity rules
- security considerations
- transaction requirements
- backup and recovery considerations

The actual SQL schema stored in the `database/` directory is the
implementation source of truth.

This document must be updated whenever an approved database structure
changes.

---

# 2. Database Objectives

The database shall:

1. Store application data reliably.
2. Maintain relationships between entities.
3. Prevent invalid data.
4. Support authentication and user management.
5. Support categories, books, and chapters.
6. Support publication and visibility rules.
7. Support reading-related data where implemented.
8. Support future reader/TTS/translation functionality where required.
9. Provide efficient retrieval through appropriate indexes.
10. Maintain referential integrity.
11. Support secure and parameterized database access.

---

# 3. Database Technology

The Digital Library uses:

**MySQL**

The backend communicates with MySQL.

The frontend must never connect directly to MySQL.

Conceptual flow:

```text
Browser
   ↓
Frontend
   ↓
Express API
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
MySQL