import { api } from "../api.js";
import { loadCoverIntoElements } from "../coverLoader.js";
import { auth } from "../auth.js";
import { ui } from "../ui.js";

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

    const code = error.details?.code;
    const message = error.message;

    if (code === "BOOK_NOT_FOUND" || message === "This book does not exist." || message === "Book not found.") {
        return "This book does not exist.";
    }

    if (code === "BOOK_NOT_PUBLISHED" || message === "This book is not published.") {
        return "This book is not published.";
    }

    if (code === "NO_READABLE_CONTENT" || message === "This book has no readable content yet.") {
        return "This book has no readable content yet.";
    }

    if (code === "CONTENT_FILE_MISSING" || message === "The book content file is missing.") {
        return "The book content file is missing.";
    }

    if (code === "CONTENT_PROCESSING_FAILED" || message === "Content-processing failed for this book.") {
        return "Content-processing failed for this book.";
    }

    if (error.status === 404) {
        if (typeof message === "string" && message.trim() && !message.startsWith("Request failed")) {
            return message;
        }
        return "This book does not exist.";
    }

    if (error.status === 429) {
        return "Too many requests. Wait a moment, then try again.";
    }

    if (error.status >= 500) {
        return "The library server is temporarily unavailable. Please try again later.";
    }

    return "The book request could not be completed. Please try again.";
}

function setCover(book, title) {
    const image = element("book-cover");
    const placeholder = element("book-cover-placeholder");
    const bookId = Number(book?.book_id);
    const fallbackApiPath = Number.isSafeInteger(bookId) && bookId >= 1
        ? `/books/${encodeURIComponent(String(bookId))}/cover`
        : "";
    loadCoverIntoElements(image, placeholder, {
        coverPath: book?.cover_path || "",
        fallbackApiPath,
        altText: title ? `Cover for ${title}` : "Book cover",
    });
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

function renderChapters(chapters) {
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

        item.textContent = Number.isFinite(number)
            ? `Chapter ${number}: ${title}`
            : title;
        list.append(item);
    }

    element("chapters-empty").hidden = validChapters.length > 0;
    list.hidden = validChapters.length === 0;
}

function setSaveFeedback(message, type = "") {
    const box = element("book-save-feedback");
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
    box.classList.toggle("success-message", type === "success");
    box.classList.toggle("error-message", type === "error");
}

function renderBook(book, authors, categories, chapters, isSaved = false) {
    const title = typeof book.title === "string" && book.title.trim()
        ? book.title
        : "Untitled book";

    document.title = `${title} | Digital Library`;
    element("book-title").textContent = title;

    const readLink = element("book-read");
    const actionsContainer = element("book-actions") || readLink?.parentElement;
    if (readLink && Number.isSafeInteger(Number(book.book_id)) && Number(book.book_id) >= 1) {
        const bookIdNum = Number(book.book_id);
        const encodedBookId = encodeURIComponent(String(bookIdNum));
        const isPdfBook = Boolean(book.pdf_original_name) && String(book.file_format || "PDF").toUpperCase() !== "EPUB";
        const existingReflowLink = element("book-read-reflow");
        if (isPdfBook) {
            readLink.href = `read.html?id=${encodedBookId}&mode=pdf`;
            readLink.textContent = "Read Original PDF";
            const reflowLink = existingReflowLink || document.createElement("a");
            reflowLink.id = "book-read-reflow";
            reflowLink.className = "button button-secondary";
            reflowLink.href = `read.html?id=${encodedBookId}&mode=reflow`;
            reflowLink.textContent = "Read (EPUB-style)";
            if (!existingReflowLink && actionsContainer) {
                actionsContainer.append(reflowLink);
            }
        } else {
            readLink.href = `read.html?id=${encodedBookId}`;
            readLink.textContent = "Read this book";
            if (existingReflowLink) existingReflowLink.remove();
        }
        if (actionsContainer) {
            const existingSaveBtn = element("book-save-toggle");
            const saveBtn = existingSaveBtn || document.createElement("button");
            saveBtn.id = "book-save-toggle";
            saveBtn.type = "button";

            const existingRemoveBtn = element("book-remove-saved");
            const removeBtn = existingRemoveBtn || document.createElement("button");
            removeBtn.id = "book-remove-saved";
            removeBtn.type = "button";
            removeBtn.className = "button button-danger";
            removeBtn.textContent = "Remove from My Library";

            let savedState = Boolean(isSaved);
            const syncBtns = () => {
                if (savedState) {
                    saveBtn.textContent = "Saved to My Library";
                    saveBtn.className = "button button-saved";
                    saveBtn.disabled = true;
                    saveBtn.setAttribute("aria-pressed", "true");
                    removeBtn.hidden = false;
                    removeBtn.disabled = false;
                } else {
                    saveBtn.textContent = "Save to My Library";
                    saveBtn.className = "button button-secondary";
                    saveBtn.disabled = false;
                    saveBtn.setAttribute("aria-pressed", "false");
                    removeBtn.hidden = true;
                    removeBtn.disabled = false;
                }
            };
            syncBtns();
            if (!existingSaveBtn) {
                saveBtn.addEventListener("click", async () => {
                    if (savedState || saveBtn.disabled) return;
                    saveBtn.disabled = true;
                    saveBtn.textContent = "Saving?";
                    try {
                        await api.post(`/private-library/saved/${encodedBookId}`, {});
                        savedState = true;
                        setSaveFeedback("Saved to your private library.", "success");
                        ui.showToast(`Saved "${title}" to your private library.`, "success");
                    } catch (err) {
                        const msg = err?.message || "Could not save to your private library.";
                        setSaveFeedback(msg, "error");
                        ui.showToast(msg, "error");
                    } finally {
                        syncBtns();
                    }
                });
                removeBtn.addEventListener("click", async () => {
                    if (!savedState || removeBtn.disabled) return;
                    const ok = window.confirm(`Remove "${title}" from your personal library? The original book in the public library will not be deleted.`);
                    if (!ok) return;
                    removeBtn.disabled = true;
                    removeBtn.textContent = "Removing?";
                    try {
                        await api.delete(`/private-library/saved/${encodedBookId}`);
                        savedState = false;
                        setSaveFeedback("Removed from your private library.", "success");
                        ui.showToast(`Removed "${title}" from your private library.`, "info");
                    } catch (err) {
                        const msg = err?.message || "Could not remove from your private library.";
                        setSaveFeedback(msg, "error");
                        ui.showToast(msg, "error");
                    } finally {
                        removeBtn.textContent = "Remove from My Library";
                        syncBtns();
                    }
                });
                actionsContainer.append(saveBtn, removeBtn);
            }
        }
    }

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

    setCover(book, title);

    const authorCount = appendChips(element("book-authors"), authors, "name");
    element("authors-empty").hidden = authorCount > 0;

    const categoryCount = appendChips(element("book-categories"), categories, "name");
    element("categories-empty").hidden = categoryCount > 0;

    renderChapters(chapters);

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
        const [bookResponse, authorResponse, categoryResponse, chapterResponse, savedResponse] =
            await Promise.all([
                api.get(`/books/${encodedId}`),
                api.get(`/books/${encodedId}/authors`),
                api.get(`/books/${encodedId}/categories`),
                api.get(`/books/${encodedId}/chapters`),
                api.get("/private-library/saved").catch(() => null),
            ]);
        const savedList = savedResponse?.data?.savedBooks;
        const isSaved = Array.isArray(savedList) && savedList.some((item) => Number(item.book_id) === id);

        const book = bookResponse?.data?.book;
        if (!book || typeof book !== "object") {
            throw new Error("The book response did not contain a book.");
        }

        renderBook(
            book,
            authorResponse?.data?.authors,
            categoryResponse?.data?.categories,
            chapterResponse?.data?.chapters,
            isSaved
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