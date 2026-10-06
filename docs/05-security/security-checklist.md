# Digital Library — Security Checklist

## 1. Purpose

This document provides a practical security checklist for the Digital Library project.

The checklist is intended to support:

- Secure development
- Code review
- API testing
- Database review
- Frontend security review
- Authentication verification
- Authorization verification
- File-upload review
- Reader security review
- Deployment preparation
- V1 release approval

The checklist should be used throughout development and during final release verification.

A checked item must be supported by appropriate evidence. The existence of security-related code alone does not prove that the security requirement has been satisfied.

---

# 2. Security Status Definitions

| Status | Meaning |
|---|---|
| PASS | Requirement has been verified successfully |
| FAIL | Security requirement is not satisfied |
| PARTIAL | Some protection exists but additional work is required |
| NOT RUN | Planned check has not yet been executed |
| BLOCKED | Verification cannot proceed because of an unresolved dependency |
| NOT APPLICABLE | Requirement does not apply to the current implementation |

Do not mark a security check as `PASS` without evidence.

---

# 3. Security Verification Principle

The security verification process is:

```text
Security Requirement
        ↓
Threat
        ↓
Security Control
        ↓
Implementation
        ↓
Security Test
        ↓
Evidence
        ↓
Result