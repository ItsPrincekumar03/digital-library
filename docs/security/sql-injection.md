# SQL Injection Prevention

## Parameterized queries
Every database query in the project uses mysql2's parameterized query syntax (question mark placeholders with a values array), never string concatenation of user input into SQL. This is true across every repository file: user, author, category, book, bookRelations, and chapter.

Example pattern used throughout:
pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])

## The one exception, and why it is still safe
book.repository.js and chapter.repository.js interpolate a sort column and sort direction directly into the SQL string for ORDER BY, because column names cannot be passed as query parameters in MySQL. This is safe because the values are never taken directly from the request: pagination.js validates the requested sort column against a fixed allow-list (for example created_at, title, status, publication_date for books) and falls back to a safe default if the value does not match. The direction is restricted to exactly ASC or DESC. No other user-controlled string is ever concatenated into a query.

## Testing performed
Manual testing included submitting classic SQL injection strings (for example ' OR '1'='1 and similar) into text fields such as title, name, email, and description. In every case the value was treated as literal string data (either stored as-is or rejected by validation), because the parameterized query layer escapes it automatically. No query behavior changed based on the content of these strings.
