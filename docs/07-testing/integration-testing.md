# Digital Library — Integration Testing

## 1. Document Purpose

This document defines the integration-testing approach for the Digital Library V1 project.

Integration testing verifies that independently developed parts of the application work correctly when connected together.

The main integration boundaries in this project are:

```text
Frontend
   ↓
HTTP API
   ↓
Express Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
MySQL