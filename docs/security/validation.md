# Input Validation

All validation happens on the backend using express-validator, regardless of any future frontend validation.

## Approach
Each resource has its own validator file under backend/src/validators/. Every route applies its rule chain followed by a shared handleValidation middleware that returns a consistent 400 response:
success: false, message: Validation failed, errors: an array of field and message pairs.

## What is validated
- Required fields (title, name, email, password, and so on) reject empty or missing values.
- String length limits: title 255, author name 150, category name 100, bio 2000, description 5000 (books) or 500 (categories), cover path 500, chapter content 100000 characters.
- Email format via isEmail, plus normalizeEmail to prevent case/formatting based duplicate accounts.
- Password length is bounded both above and below: minimum 8, maximum 72 characters. The upper bound exists because bcrypt only considers the first 72 bytes of input; anything beyond that is silently ignored, which could create a false sense of a stronger password.
- Numeric route parameters (id, bookId, authorId, categoryId, chapterId) are checked with isInt({ min: 1 }) so non-numeric or negative values are rejected before reaching the database.
- Enumerated values: book status and chapter status are checked against fixed allow-lists (VALID_STATUSES) rather than accepted as free text.
- Array bounds: the chapter reorder endpoint requires a non-empty array capped at 500 items, and each item's chapterId and chapterNumber are validated as positive integers.

## Query parameters
- Pagination parameters (page, limit) are parsed and clamped in pagination.js: invalid or missing values fall back to safe defaults (page 1, limit 20), and limit is capped at 100 regardless of what is requested.
- Sort parameters are validated against an explicit allow-list of column names per resource (for example, only created_at, title, status, publication_date are accepted for books), so a client cannot inject an arbitrary column name into the ORDER BY clause.
