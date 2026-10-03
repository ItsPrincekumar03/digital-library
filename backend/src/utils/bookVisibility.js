// Central place for the public-library visibility rule (Module 8.5).
//
// PUBLIC LIBRARY RULE:
//   - ADMIN can see every book and every chapter (management access).
//   - Everyone else (normal USER) can only see books whose status is
//     PUBLISHED, and only chapters whose status is PUBLISHED.
//
// Hidden content is reported as "not found" (404), not "forbidden" (403),
// so a user cannot even tell that a draft/archived book exists.

const PUBLIC_BOOK_STATUS = 'PUBLISHED';
const PUBLIC_CHAPTER_STATUS = 'PUBLISHED';

function isAdmin(user) {
    return !!user && user.role_name === 'ADMIN';
}

function isBookPubliclyReadable(book) {
    return !!book && book.status === PUBLIC_BOOK_STATUS;
}

function isChapterPubliclyReadable(chapter) {
    return !!chapter && chapter.status === PUBLIC_CHAPTER_STATUS;
}

module.exports = {
    PUBLIC_BOOK_STATUS,
    PUBLIC_CHAPTER_STATUS,
    isAdmin,
    isBookPubliclyReadable,
    isChapterPubliclyReadable,
};