# Digital Library — Navigation Flow

## 1. Purpose

This document defines the navigation structure and major user flows of the Digital Library web application.

It describes how users move between:

- Public pages
- Authentication pages
- Library pages
- Categories
- Search
- Books
- Chapters
- Online Reader
- Reader customization
- Reading progress
- Auto-scroll
- TTS / audio
- Translation
- User settings
- Administrative pages

The navigation flow is a design reference. Actual frontend routes, links, and page transitions must always be verified against the current frontend implementation.

---

# 2. Navigation Principles

The navigation system should:

1. Keep major features easy to find.
2. Use consistent navigation patterns.
3. Respect authentication state.
4. Respect user roles and permissions.
5. Provide clear paths back to previous contexts.
6. Avoid unnecessary navigation steps.
7. Remain usable on desktop, tablet, and mobile devices.
8. Preserve reader context where practical.
9. Never rely on navigation visibility as the only access-control mechanism.
10. Avoid exposing protected content through direct navigation.

---

# 3. High-Level Navigation Model

The overall navigation structure is:

```text
Home
├── Login
├── Registration
└── Library
      ├── Categories
      ├── Search
      ├── Book Details
      │      └── Chapter List
      │             └── Reader
      │                    ├── Reader Settings
      │                    ├── Reading Progress
      │                    ├── Auto-Scroll
      │                    ├── TTS
      │                    └── Translation
      │
      └── User Settings

Admin Dashboard
├── Categories
├── Books
│   └── Chapters
├── Publication
├── Visibility
└── Upload