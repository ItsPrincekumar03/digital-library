# Authorization and Ownership

## Roles
Two roles exist: USER and ADMIN. Role is stored on the user record and included in the JWT payload, but authorization checks always re-fetch the current role from the database via auth.middleware.js rather than trusting the token payload alone, so a role change takes effect immediately.

## Role-based access
- Middleware: role.middleware.js, function requireRole.
- Admin-only endpoints: create/update/archive authors, create/update/archive categories, publish/archive chapters, approve/reject/publish/archive books.
- A USER account calling an admin-only endpoint receives 403 Forbidden.

## Ownership protection
- Books and chapters belong to the user who created them (owner_id / via the parent book).
- Services such as book.service.js and chapter.service.js check requestingUser.user_id against the resource owner before allowing updates. Admins bypass the ownership check; regular users do not.
- A USER attempting to modify another user's book or its chapters receives 403 with the message You cannot modify another user's book.

## Preventing ID manipulation
- Profile routes (GET/PUT /api/users/profile, PUT /api/users/change-password) take no id parameter at all. Every operation acts on req.user.user_id, which comes from the verified JWT, never from the request body or URL. This makes it structurally impossible for a user to target another account's profile.
- Book and chapter routes accept an id in the URL, but every service function independently verifies ownership against req.user before performing the update. Supplying a different id only changes which resource is looked up, not who is allowed to modify it.

## Restricted status transitions
- A regular user may only set a book's status to DRAFT or PENDING_REVIEW.
- Only an ADMIN may set APPROVED, REJECTED, PUBLISHED, or ARCHIVED.
- This is enforced in book.service.js, not just in the frontend, so the restriction holds even if a client sends a raw API request.

## Role and account status
- There is no API endpoint that allows a user to change their own role_id or is_active status. These fields are excluded from the profile update logic entirely.
