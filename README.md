# Digital Library

A monolithic web application for managing a digital library.

## Backend Setup

1. Navigate to the backend folder:
   cd backend

2. Install dependencies:
   npm install

3. Copy the example env file and fill in your local MySQL credentials:
   cp .env.example .env

4. Create the MySQL database (if it doesn't exist):
   CREATE DATABASE digital_library;

### Development demo accounts

After creating the database and applying `database/schema.sql`, run from the `backend` folder:

    npm run seed:dev

This creates two local demo accounts. Use them only on your own machine.

| Role  | Login ID             | Password        |
|-------|----------------------|-----------------|
| ADMIN | demoadmin@example.com | Demoadmin@123  |
| USER  | demouser@example.com  | Demouser@123   |

The seed requires `NODE_ENV=development` in your `.env`, refuses to run in production, and never changes an existing account.

5. Start the server in development mode:
   npm run dev

6. Verify it's working:
   - http://localhost:5000/api/health         server check
   - http://localhost:5000/api/health/db      database connection check

## Features Implemented

* **Authentication:** JWT based registration, login, logout and profile check. Includes rate limiting.
* **Authorization:** Role based access control (ADMIN/USER), endpoint protection, and ownership checks.
* **Profile Management:** Users can update their profiles and change passwords.
* **Authors & Categories:** CRUD endpoints for authors and categories.
* **Books & Chapters:** CRUD endpoints for books and chapters, including chapter reordering.
* **Book Relationships:** Managing relations between books and authors/categories.

## Testing & Verification

A Postman collection `Digital Library API.postman_collection.json` is included at the root of the project to test all implemented APIs.
All APIs perform robust input validation, proper error handling, parameterization against SQL Injection, and return standardized JSON responses.

## Security Overview

* Passwords hashed using bcrypt.
* JWT for stateless session management with HttpOnly cookies.
* Prepared statements used for database queries to prevent SQL injection.
* Rate limiters implemented for authentication routes to deter brute-forcing.
* Security headers managed via `helmet`.