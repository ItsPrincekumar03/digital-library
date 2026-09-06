# Password Security

## Hashing
Passwords are hashed with bcrypt at 10 salt rounds before being stored, in both registration (auth.service.js) and password change (profile.service.js). Plaintext passwords are never written to the database.

## Never returned by the API
Every function that reads a user record for API responses (userRepository.findById) explicitly selects only safe columns: user_id, full_name, email, is_active, created_at, role_name. The password_hash column is never included in this query, so it is structurally impossible for it to leak through a JSON response, rather than relying on remembering to strip it before sending.

The one place password_hash is read at all is findByEmail (used internally during login to compare against bcrypt) and findPasswordHashById (used internally during password change). Neither function's result is ever passed directly to res.json.

## Password change requires current password
PUT /api/users/change-password requires currentPassword and verifies it with bcrypt.compare against the stored hash before allowing newPassword to be set. A wrong current password returns 401 and the password is not changed.

## Login failure messages
Login does not reveal whether the failure was due to an unknown email or an incorrect password. Both cases return the same 401 response: Invalid email or password. This prevents an attacker from using the login endpoint to enumerate which email addresses have registered accounts.

## Length bounds
Passwords must be between 8 and 72 characters, enforced by validators on both registration and password change. The upper bound reflects a real limitation of bcrypt, which only processes the first 72 bytes of input.

## Logging
Passwords, password hashes, and JWT tokens are never written to any log statement anywhere in the codebase. The shared logger only logs request method, URL, and error messages.
