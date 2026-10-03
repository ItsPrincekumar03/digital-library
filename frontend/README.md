# Digital Library — Frontend Foundation (V1 M9)

This directory contains the Vanilla JavaScript frontend foundation for the
existing Digital Library project.

The frontend communicates with the existing Express backend over HTTP and
does not connect directly to MySQL.

## Requirements

- Existing backend running at `http://localhost:5000`
- Static frontend server running at `http://localhost:3000`
- Backend CORS and cookie configuration must allow:
  `http://localhost:3000`

Use `localhost`, not `127.0.0.1`, for the frontend address.

## Project structure

```text
frontend/
│
├── assets/
│   └── favicon.svg
│
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── ui.js
│   ├── layout.js
│   ├── router.js
│   │
│   └── pages/
│       ├── index.js
│       ├── login.js
│       ├── register.js
│       ├── profile.js
│       └── admin.js
│
├── index.html
├── login.html
├── register.html
├── profile.html
├── admin.html
├── 404.html
└── README.md