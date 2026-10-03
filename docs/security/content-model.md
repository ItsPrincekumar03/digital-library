# Content Model (Module 8.5)

## Rule
**The public library is controlled by ADMIN.** Normal users can only read published content.
Private user PDFs are a separate future feature (Module 12) and do not use the `books` table.

## Who can do what

| Action | ADMIN | USER |
|---|---|---|
| Create / edit book (`POST`, `PUT /api/books`) | yes | 403 |
| Publish book (`PATCH /api/books/:id/publish`, or `PUT` with `status`) | yes | 403 |
| Archive book (`PATCH /api/books/:id/archive`) | yes | 403 |
| Add / remove book authors and categories | yes | 403 |
| Create / edit / publish / archive / reorder chapters | yes | 403 |
| Read books, chapters, book authors/categories | everything | published only |

## Visibility (read rules for a normal USER)
- `GET /api/books` (plain and paginated) returns only books with status `PUBLISHED`. `totalItems` counts only those books.
- `GET /api/books/:id` for a non-published book returns **404** (not 403), so the existence of a draft is not revealed.
- `GET /api/books/:bookId/chapters` and `GET /api/chapters/:id` work only when the parent book is `PUBLISHED`, and only `PUBLISHED` chapters are returned. A draft chapter inside a published book is hidden.
- `GET /api/books/:bookId/authors` and `/categories` follow the same rule as the book.
- ADMIN is not filtered and can read every book and chapter, whatever its status.

## Book lifecycle
Active lifecycle: `DRAFT -> PUBLISHED -> ARCHIVED`. New books start as `DRAFT`.

### Compatibility decision: legacy statuses
The `books.status` ENUM still contains `PENDING_REVIEW`, `APPROVED` and `REJECTED`. They were NOT removed, because:
- changing an ENUM needs a migration and could break existing data, and
- they are harmless now: the API never writes them (the validator only accepts DRAFT, PUBLISHED, ARCHIVED), and any book that still has one of these values is hidden from normal users because it is not `PUBLISHED`.

An ADMIN can still read such rows and edit their metadata; the legacy status stays unchanged unless the admin sets a valid one.

## books.owner_id
- Column kept, still `NOT NULL` with its foreign key. No data was changed.
- New books store the creating admin's id. It is **not used for authorization any more**.
- Old rows may point to normal users who created books under the old model. Those users lose edit rights; the rows are untouched.
- Decision for later: owner_id may be renamed or dropped in a future cleanup migration. Not done in Module 8.5 to avoid a database redesign.

## Legacy submission workflow (documented, not removed)
Inspected and found **unused by any code**:
- table `book_submissions` (only the seed file inserts one row)
- `audit_logs.action` values `BOOK_APPROVED`, `BOOK_REJECTED` (nothing writes audit logs yet)
- seed roles `AUTHOR` and `READER` (registration assigns `USER`; no code checks these roles)

No route, controller or service depends on them. They are left in place, because removing them is a destructive schema change that is not needed for this module. Treat them as **legacy/obsolete**. They are candidates for a dedicated cleanup migration.

## Database changes in Module 8.5
None. No migration was added, and the schema-drift issue between `schema.sql` and migrations 016/017 is unchanged (not made worse).