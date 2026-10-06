import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";
import { auth } from "../auth.js";

function element(id) {
    return document.getElementById(id);
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "The book could not be loaded. Check your connection and try again.";
    }

    if (error.status === 401) {
        return "Please log in to view books in the library.";
    }

    if (error.status === 403) {
        return "Your account does not have access to this book.";
    }

    if (error.status === 404) {
        return "This book is unavailable. It may not be published or may no longer exist.";
    }

    if (error.status === 429) {
        return "Too many requests. Wait a moment, then try again.";
    }

    if (error.status >= 500) {
        return "The library server is temporarily unavailable. Please try again later.";
    }

    return "The book request could not be completed. Please try again.";
}

function setCover(coverPath, title) {
    const image = element("book-cover");
    const placeholder = element("book-cover-placeholder");

    if (typeof coverPath !== "string" || !coverPath.trim()) {
        image.hidden = true;
        placeholder.hidden = false;
        return;
    }

    try {
        const origin = new URL(API_BASE_URL).origin;
        const normalizedPath = coverPath.startsWith("/")
            ? coverPath
            : `/${coverPath}`;
        const url = new URL(normalizedPath, origin);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("Unsupported image URL protocol.");
        }

        image.src = url.href;
        image.alt = title ? `Cover for ${title}` : "Book cover";
        image.hidden = false;
        placeholder.hidden = true;

        image.addEventListener("error", () => {
            image.hidden = true;
            placeholder.hidden = false;
        }, { once: true });
    } catch {
        image.hidden = true;
        placeholder.hidden = false;
    }
}

function appendChips(container, items, labelProperty) {
    container.replaceChildren();

    const validItems = Array.isArray(items)
        ? items.filter((item) =>
            item &&
            typeof item[labelProperty] === "string" &&
            item[labelProperty].trim()
        )
        : [];

    for (const item of validItems) {
        const chip = document.createElement("span");
        chip.className = "detail-chip";
        chip.textContent = item[labelProperty];
        container.append(chip);
    }

    return validItems.length;
}

function renderChapters(chapters, bookId) {
    const list = element("book-chapters");
    list.replaceChildren();

    const validChapters = Array.isArray(chapters)
        ? chapters.filter((chapter) => chapter && typeof chapter === "object")
        : [];

    validChapters.sort((left, right) => {
        const leftNumber = Number(left.chapter_number);
        const rightNumber = Number(right.chapter_number);

        if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
            return leftNumber - rightNumber;
        }

        return 0;
    });

    for (const chapter of validChapters) {
        const item = document.createElement("li");
        const title = typeof chapter.title === "string" && chapter.title.trim()
            ? chapter.title
            : "Untitled chapter";
        const number = Number(chapter.chapter_number);

        const chapterText = Number.isFinite(number)
            ? Chapter : 
            : title;

        if (bookId && chapter.chapter_id) {
            const link = document.createElement("a");
            link.href = 
eader.html?bookId=&chapterId=;
            link.textContent = chapterText;
            link.className = "chapter-link";
            item.append(link);
        } else {
            item.textContent = chapterText;
        }

        list.append(item);
    }

    element("chapters-empty").hidden = validChapters.length > 0;
    list.hidden = validChapters.length === 0;

    const bookActions = element("book-actions");
    const readBtn = element("btn-read-book");
    if (bookActions && readBtn) {
        if (validChapters.length > 0 && bookId) {
            readBtn.href = 
eader.html?bookId=;
            bookActions.hidden = false;
        } else {
            bookActions.hidden = true;
        }
    }
}

function renderBook(book, authors, categories, chapters) {
    const title = typeof book.title === "string" && book.title.trim()
        ? book.title
        : "Untitled book";

    document.title = `${title} | Digital Library`;
    element("book-title").textContent = title;

    const description = element("book-description");
    if (typeof book.description === "string" && book.description.trim()) {
        description.textContent = book.description;
        description.hidden = false;
    } else {
        description.hidden = true;
    }

    const publication = element("book-publication");
    if (book.publication_date) {
        const parsedDate = new Date(book.publication_date);
        publication.textContent = Number.isNaN(parsedDate.getTime())
            ? `Publication date: ${String(book.publication_date)}`
            : `Publication date: ${parsedDate.toLocaleDateString()}`;
        publication.hidden = false;
    } else {
        publication.hidden = true;
    }

    setCover(book.cover_path, title);

    const authorCount = appendChips(element("book-authors"), authors, "name");
    element("authors-empty").hidden = authorCount > 0;

    const categoryCount = appendChips(element("book-categories"), categories, "name");
    element("categories-empty").hidden = categoryCount > 0;

    renderChapters(chapters, book.book_id);

    element("book-loading").hidden = true;
    element("book-detail").hidden = false;
}

async function initBook() {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("id");
    const id = Number(rawId);

    if (!rawId || !Number.isSafeInteger(id) || id < 1) {
        element("book-loading").hidden = true;
        element("book-error").textContent = "A valid book ID was not provided.";
        element("book-error").hidden = false;
        return;
    }

    if (!auth.isAuthenticated()) {
        element("book-loading").hidden = true;
        element("book-error").textContent = "Please log in to view books in the library.";
        element("book-error").hidden = false;
        return;
    }

    try {
        const encodedId = encodeURIComponent(String(id));
        const [bookResponse, authorResponse, categoryResponse, chapterResponse] =
            await Promise.all([
                api.get(`/books/${encodedId}`),
                api.get(`/books/${encodedId}/authors`),
                api.get(`/books/${encodedId}/categories`),
                api.get(`/books/${encodedId}/chapters`)
            ]);

        const book = bookResponse?.data?.book;
        if (!book || typeof book !== "object") {
            throw new Error("The book response did not contain a book.");
        }

        renderBook(
            book,
            authorResponse?.data?.authors,
            categoryResponse?.data?.categories,
            chapterResponse?.data?.chapters
        );
    } catch (error) {
        element("book-loading").hidden = true;
        element("book-detail").hidden = true;
        element("book-error").textContent = friendlyError(error);
        element("book-error").hidden = false;
    }
}

export async function init() {
    await initBook();
}