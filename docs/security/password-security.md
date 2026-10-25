# Password Security

## 1. Purpose

This document defines password security requirements for the Digital Library application.

The application uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL in a monolithic architecture.

Password security protects user accounts against credential theft, unauthorized access, and common password-related attacks.

**Implementation status:** This document describes security requirements and verification criteria. The actual hashing algorithm, configuration, password rules, authentication flow, and recovery mechanisms must be verified against the current backend implementation.

## 2. Scope

This document covers:

- Password creation and validation.
- Password hashing and verification.
- Password storage.
- Login security.
- Password changes and recovery, where implemented.
- Protection against brute-force attacks.
- Credential logging and disclosure.
- Password-related errors.
- Testing and maintenance.

## 3. Core Principles

The application should follow these principles:

1. Never store plaintext passwords.
2. Use a dedicated password-hashing algorithm.
3. Never encrypt passwords reversibly when password hashing is appropriate.
4. Verify passwords using the selected hashing library.
5. Never return password hashes through ordinary API responses.
6. Never log passwords or password hashes.
7. Validate password input on the backend.
8. Protect authentication endpoints against automated abuse.
9. Require appropriate authorization for password changes.
10. Respond safely to password-related failures.

## 4. Password Hashing

Passwords must be hashed before being stored in MySQL.

Suitable password-hashing options include bcrypt, Argon2id, or another appropriately selected password-hashing algorithm.

The project has previously discussed bcrypt, but the algorithm currently used must be verified against the source code and dependencies.

### Requirements

- Use a maintained password-hashing library.
- Use an appropriate work factor or cost configuration.
- Generate a unique salt using the library's supported mechanism.
- Use the library's password-verification function.
- Never implement a custom hashing algorithm.
- Never store plaintext passwords.
- Avoid logging passwords during registration or login.
- Review the hashing configuration as computing capabilities change.

Do not assume a particular bcrypt cost factor or library version without checking the implementation.

## 5. Password Storage

The database should store the password hash rather than the original password.

Requirements:

- Restrict access to password-hash fields.
- Never include password hashes in public API responses.
- Avoid returning complete database records directly from controllers.
- Exclude password hashes from unnecessary logs and debugging output.
- Use appropriate database permissions.
- Protect database backups containing account information.
- Avoid copying production account data into development environments unnecessarily.

The exact password column name and length must match the current MySQL schema and hashing-library requirements.

## 6. Password Creation and Validation

Password rules should balance security, usability, and the application's approved requirements.

Recommended considerations include:

- Enforce a reasonable minimum length.
- Support long passphrases.
- Reject missing or invalid password values.
- Avoid silently truncating passwords.
- Apply a sensible maximum input length to prevent excessive resource consumption.
- Avoid arbitrary composition rules that require predictable patterns.
- Consider blocking commonly used or compromised passwords where practical.
- Never rely solely on frontend validation.

The exact minimum and maximum lengths must be selected deliberately and documented in the actual implementation.

If the chosen hashing library has input-length restrictions, handle them explicitly rather than silently truncating user input.

## 7. Registration Security

If registration is implemented, the backend should:

1. Validate all required fields.
2. Validate the password against the approved policy.
3. Check account uniqueness where applicable.
4. Hash the password before database insertion.
5. Assign the approved default role.
6. Prevent users from assigning themselves administrator privileges.
7. Return only safe account fields.
8. Handle duplicate-account errors consistently.

Registration must not store the submitted password in plaintext or expose the generated hash in the response.

## 8. Login Security

Login should verify the submitted password against the stored password hash.

Recommended behavior:

- Validate the request structure.
- Retrieve the account through the appropriate repository layer.
- Verify the password using the hashing library.
- Apply account-status rules where implemented.
- Create authentication state only after successful verification.
- Apply rate limiting or other abuse controls.
- Return safe error messages.
- Avoid exposing stack traces or database details.

Where practical, use a generic login failure message to reduce account enumeration.

Never compare a submitted password directly with a stored hash as if the hash were plaintext.

## 9. Password Changes

If password changes are supported, the backend should:

- Require the appropriate authenticated state.
- Verify the current password when required by the approved workflow.
- Validate the new password.
- Hash the new password before storing it.
- Prevent unauthorized changes to another user's credentials.
- Avoid logging the submitted password.
- Return a safe response.
- Define whether existing sessions or tokens should be invalidated.

The actual endpoint, request fields, and session-invalidation behavior must be verified against the current implementation.

## 10. Password Reset and Recovery

Password-reset functionality should be documented as implemented only if the current application provides it.

If introduced, a secure reset workflow should:

- Use unpredictable, time-limited reset tokens.
- Associate each token with the intended account.
- Store reset tokens securely, preferably as hashes where appropriate.
- Prevent reuse of completed reset tokens.
- Invalidate reset tokens after successful use or expiry.
- Avoid revealing unnecessary account-existence information.
- Apply rate limits.
- Never send passwords in email or API responses.
- Consider invalidating existing sessions after a successful reset.

Do not claim that email-based recovery is available unless the required service and backend workflow have been implemented and tested.

## 11. Brute-Force Protection

Repeated login attempts may allow attackers to guess passwords.

Recommended controls include:

- Rate limiting login requests.
- Applying request-size limits.
- Monitoring repeated authentication failures.
- Returning safe error messages.
- Avoiding permanent account lockout policies that attackers could abuse.
- Reviewing suspicious authentication activity.
- Applying appropriate controls to password-reset endpoints if they exist.

Rate limits should be configured according to the application's usage and deployment environment.

See `rate-limiting.md` for additional requirements.

## 12. Password and Authentication Tokens

Passwords and authentication tokens are different types of secrets.

A password should be stored using a password-hashing algorithm. Authentication tokens must be protected according to their design, expiry, storage, and revocation requirements.

Requirements:

- Never use a password as a token-signing secret.
- Never include passwords in URLs.
- Never log full authentication tokens.
- Avoid exposing tokens through frontend debugging output.
- Protect session or token configuration.
- Define the impact of password changes on existing authentication state.

The project's actual authentication mechanism must be verified before documenting token behavior as implemented.

## 13. Transport Security

Passwords must be transmitted over HTTPS in production.

Requirements:

- Use HTTPS for production authentication endpoints.
- Avoid submitting credentials through query parameters.
- Avoid placing credentials in URL paths.
- Do not expose credentials through frontend error messages.
- Avoid logging request bodies containing passwords.
- Review reverse-proxy and deployment configuration where applicable.

Local development may use HTTP on localhost, but production credentials must not be transmitted over untrusted plaintext connections.

## 14. Logging and Error Handling

Password-related logs must not contain:

- Plaintext passwords.
- Password hashes.
- Password-reset tokens.
- Authentication tokens.
- Session secrets.
- Database credentials.

Errors should communicate the failure safely without exposing internal implementation details.

Examples of safe error categories include:

- Invalid request.
- Invalid credentials.
- Password does not satisfy the configured policy.
- Password change not permitted.
- Unexpected server error.

The exact response format must match the established API conventions.

## 15. Password Policy Changes

If the password policy or hashing configuration changes:

- Review compatibility with existing password hashes.
- Consider rehashing passwords after successful authentication when supported by the chosen library.
- Avoid forcing unnecessary password resets without a security reason.
- Document any new requirements.
- Test existing account login behavior.
- Plan recovery for accounts that cannot authenticate after the change.

Never change password-hashing configuration in production without understanding its impact on existing accounts.

## 16. Testing Requirements

Test the password-security behavior that exists in the application.

Recommended scenarios:

1. Register using a valid password.
2. Verify that the database stores a hash rather than plaintext.
3. Log in using the correct password.
4. Reject an incorrect password.
5. Reject a missing password.
6. Validate the configured password-length limits.
7. Confirm passwords are not returned in API responses.
8. Confirm passwords and hashes are not written to logs.
9. Verify duplicate-account handling where applicable.
10. Attempt unauthorized password changes.
11. Test password-reset token expiry and reuse, if implemented.
12. Verify login rate limiting.
13. Confirm password changes follow the documented session-invalidation policy.
14. Verify that existing accounts remain compatible with the configured hashing algorithm.

Use a dedicated test environment and test accounts. Never expose real user passwords during testing.

Do not mark tests as passed until they have actually been executed.

## 17. Manual Verification with PowerShell

The following example inspects the dependency manifest without displaying credentials.

```powershell
$packagePath = ".\backend\package.json"

if (!(Test-Path -LiteralPath $packagePath)) {
    throw "Backend package.json not found. Check the current project structure."
}

$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

$dependencies = @()

if ($package.dependencies) {
    $dependencies += $package.dependencies.PSObject.Properties
}

if ($package.devDependencies) {
    $dependencies += $package.devDependencies.PSObject.Properties
}

$dependencies |
    Where-Object {
        $_.Name -match 'bcrypt|argon2'
    } |
    Select-Object Name, Value
```

This checks whether a potentially relevant dependency is declared. It does not prove that the application uses it correctly or that password hashes are stored securely.

Verify the actual registration and login implementation separately.

## 18. Implementation Verification Checklist

- [ ] Actual password-hashing algorithm identified.
- [ ] Hashing library and configuration verified.
- [ ] Passwords are never stored in plaintext.
- [ ] Password hashes are excluded from API responses.
- [ ] Password hashes are excluded from logs.
- [ ] Password validation rules are documented.
- [ ] Registration security is verified, if implemented.
- [ ] Login verification is tested.
- [ ] Password changes are protected, if implemented.
- [ ] Password recovery is documented accurately, if implemented.
- [ ] Authentication endpoints have appropriate abuse controls.
- [ ] Production transport uses HTTPS.
- [ ] Session or token invalidation behavior is documented.
- [ ] Relevant tests have been executed.

## 19. Related Documentation

- `authentication.md`
- `authorization.md`
- `rate-limiting.md`
- `environment.md`
- `error-handling.md`
- `validation.md`
- `../api/auth.md`
- `../api/users.md`
- `../05-security/authentication-authorization.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 20. Maintenance

Update this document whenever password hashing, validation rules, authentication workflows, recovery mechanisms, or credential-handling practices change.

Keep the documented policy aligned with the actual implementation, approved requirements, and executed test evidence.
