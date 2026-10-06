# Digital Library — Documentation Index

## 1. Purpose

This document provides a central index of the Digital Library project's documentation.

The purpose is to help developers, project members, reviewers, and AI coding assistants quickly locate the appropriate documentation for a specific task.

This index describes the intended documentation structure. The current Git repository remains the final authority on which files currently exist and which information is currently implemented.

---

# 2. Documentation Principles

The project documentation follows these principles:

- Documentation should describe the actual system or clearly identify planned functionality.
- Current source code takes precedence over outdated documentation.
- Major architectural decisions should be documented.
- Security-sensitive behavior should be documented.
- Testing and deployment procedures should remain reproducible.
- Academic documentation should distinguish verified functionality from planned functionality.
- AI coding assistants should read relevant documentation before modifying the project.

---

# 3. Source-of-Truth Hierarchy

When information conflicts, use the following order:

```text
1. Current Git Repository
        ↓
2. Current Source Code
        ↓
3. Current Database Schema / Migrations
        ↓
4. Executed Tests and Verification Evidence
        ↓
5. Current Project Documentation
        ↓
6. Historical Chat / Development Discussions