import { api } from "../api.js";
import { loadCoverIntoElements } from "../coverLoader.js";
import { auth } from "../auth.js";
import { ui } from "../ui.js";
import {
    fetchAllCategories,
    normalizeSortValue,
    populateCategoryOptions,
    populateSortOptions,
} from "../bookFilters.js";

const PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 200;

function element(id) {
    return document.getElementById(id);
}

function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const pageValue = Number.parseInt(
        params.get("page") || "1",
        10
    );

    const page =
        Number.isInteger(pageValue) && pageValue > 0
            ? pageValue
            : 1;

    return {
        page,
        search: (params.get("search") || "")
            .slice(0, MAX_SEARCH_LENGTH),

        category: params.get("category") || "",

        sort: normalizeSortValue(params.get("sort"), params.get("order"))
    };
}

let state = readStateFromUrl();
let currentBooks = [];
let availableCategories = [];
let requestNumber = 0;
let savedBookIds = new Set();

function updateUrl() {
    const params = new URLSearchParams();

    params.set("page", String(state.page));

    if (state.search) {
        params.set("search", state.search);
    }

    if (state.category) {
        params.set("category", state.category);
    }

    const [sort, order] = state.sort.split(":");

    if (sort !== "created_at" || order !== "DESC") {
        params.set("sort", sort);
        params.set("order", order);
    }

    const query = params.toString();

    const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(
        null,
        "",
        nextUrl
    );
}

function showMessage(node, message) {
    node.textContent = message;
    node.hidden = !message;
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "The library could not be loaded. Check your connection and try again.";
    }

    if (error.status === 401) {
        return "Please log in to browse the library.";
    }

    if (error.status === 403) {
        return "Your account does not have access to this library.";
    }

    if (error.status === 404) {
        return "The requested library information could not be found.";
    }

    if (error.status === 429) {
        return "Too many requests. Wait a moment, then try again.";
    }

    if (error.status >= 500) {
        return "The library server is temporarily unavailable. Please try again later.";
    }

    return "The library request could not be completed. Please try again.";
}

function setCoverImage(image, placeholder, book, altText) {
    const bookId = book?.book_id;
    const fallbackApiPath = Number.isSafeInteger(Number(bookId)) && Number(bookId) >= 1
        ? `/books/${encodeURIComponent(String(bookId))}/cover`
        : "";
    loadCoverIntoElements(image, placeholder, {
        coverPath: book?.cover_path || "",
        fallbackApiPath,
        altText: altText || "Book cover",
    });
}

function openBook(bookId) {
    const numericBookId = Number(bookId);

    if (
        !Number.isSafeInteger(numericBookId) ||
        numericBookId < 1
    ) {
        showMessage(
            element("library-error"),
            "This book does not have a valid ID."
        );

        return;
    }

    /*
     * Build the exact book URL.
     *
     * Using window.location.assign() here avoids relying on any
     * clean-URL/static-server behavior that may alter a normal
     * anchor navigation.
     */
    const bookUrl =
        new URL(
            "book.html",
            window.location.href
        );

    bookUrl.searchParams.set(
        "id",
        String(numericBookId)
    );

    window.location.assign(
        bookUrl.href
    );
}

function formatDate(value) {
    if (!value) {
        return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }
    return parsed.toLocaleDateString();
}

function buildRelationBadges(book) {
    const wrap = document.createElement("div");
    wrap.className = "book-card-badges";
    const authors = Array.isArray(book.authors) ? book.authors : [];
    const categories = Array.isArray(book.categories) ? book.categories : [];
    for (const author of authors.slice(0, 2)) {
        if (author?.name) {
            const badge = document.createElement("span");
            badge.className = "book-meta-badge";
            badge.textContent = author.name;
            wrap.append(badge);
        }
    }
    for (const category of categories.slice(0, 2)) {
        if (category?.name) {
            const badge = document.createElement("span");
            badge.className = "book-meta-badge";
            badge.textContent = category.name;
            wrap.append(badge);
        }
    }
    if (book.file_format) {
        const fmt = document.createElement("span");
        fmt.className = "book-meta-badge book-meta-badge-format";
        fmt.textContent = String(book.file_format).toUpperCase();
        wrap.append(fmt);
    }
    return wrap;
}

async function loadSavedBookIds() {
    if (!auth.isAuthenticated()) {
        savedBookIds = new Set();
        return;
    }
    try {
        const res = await api.get("/private-library/saved");
        const list = res?.data?.savedBooks;
        savedBookIds = new Set(Array.isArray(list) ? list.map((b) => Number(b.book_id)) : []);
    } catch (_) {
        savedBookIds = new Set();
    }
}

function syncSaveControls(saveButton, removeButton, bookId, bookTitle) {
    const isSaved = savedBookIds.has(Number(bookId));
    if (isSaved) {
        saveButton.textContent = "Saved to My Library";
        saveButton.className = "button button-saved";
        saveButton.disabled = true;
        saveButton.setAttribute("aria-pressed", "true");
        saveButton.setAttribute("aria-label", `${bookTitle} is saved to My Library`);
        removeButton.hidden = false;
        removeButton.disabled = false;
    } else {
        saveButton.textContent = "Save to My Library";
        saveButton.className = "button button-secondary";
        saveButton.disabled = false;
        saveButton.setAttribute("aria-pressed", "false");
        saveButton.setAttribute("aria-label", `Save ${bookTitle} to My Library`);
        removeButton.hidden = true;
        removeButton.disabled = false;
    }
}

function createBookCard(book) {
    const card = document.createElement("article");
    card.className = "book-card";

    const coverWrap = document.createElement("div");
    coverWrap.className = "book-card-cover-wrap";

    const cover = document.createElement("img");
    cover.className = "book-card-cover";
    cover.hidden = true;

    const placeholder = document.createElement("div");
    placeholder.className = "cover-placeholder";
    placeholder.textContent = "No cover";

    const fallbackApiPath = Number.isSafeInteger(Number(book.book_id)) && Number(book.book_id) >= 1
        ? `/books/${encodeURIComponent(String(book.book_id))}/cover`
        : "";

    const bookTitle = typeof book.title === "string" && book.title.trim() ? book.title : "Untitled book";
    loadCoverIntoElements(cover, placeholder, {
        coverPath: book.cover_path,
        fallbackApiPath,
        altText: `Cover of ${bookTitle}`,
    });

    coverWrap.append(cover, placeholder);

    const content = document.createElement("div");
    content.className = "book-card-content";

    const title = document.createElement("h3");
    title.textContent = bookTitle;

    const badges = buildRelationBadges(book);

    const description = document.createElement("p");
    description.className = "book-card-description";
    description.textContent = typeof book.description === "string" && book.description.trim()
        ? book.description
        : "No description available.";

    const meta = document.createElement("p");
    meta.className = "book-card-meta";
    const formattedDate = formatDate(book.publication_date);
    if (formattedDate) {
        meta.textContent = `Published ${formattedDate}`;
    } else {
        meta.textContent = "Publication date unavailable";
    }

    const actions = document.createElement("div");
    actions.className = "book-card-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "button button-primary";
    viewButton.textContent = "View book";
    viewButton.setAttribute("aria-label", `View book: ${bookTitle}`);
    viewButton.addEventListener("click", () => {
        openBook(book.book_id);
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button button-danger";
    removeButton.textContent = "Remove from My Library";
    removeButton.setAttribute("aria-label", `Remove ${bookTitle} from My Library`);

    syncSaveControls(saveButton, removeButton, book.book_id, bookTitle);

    saveButton.addEventListener("click", async () => {
        const idNum = Number(book.book_id);
        if (savedBookIds.has(idNum) || saveButton.disabled) return;
        saveButton.disabled = true;
        saveButton.textContent = "Saving?";
        try {
            await api.post(`/private-library/saved/${encodeURIComponent(String(idNum))}`, {});
            savedBookIds.add(idNum);
            ui.showToast(`Saved "${bookTitle}" to your private library.`, "success");
        } catch (err) {
            ui.showToast(err?.message || "Could not save book to your private library.", "error");
        } finally {
            syncSaveControls(saveButton, removeButton, idNum, bookTitle);
        }
    });

    removeButton.addEventListener("click", async () => {
        const idNum = Number(book.book_id);
        if (!savedBookIds.has(idNum) || removeButton.disabled) return;
        const ok = window.confirm(`Remove "${bookTitle}" from your personal library? The original book will remain in the public library.`);
        if (!ok) return;
        removeButton.disabled = true;
        removeButton.textContent = "Removing?";
        try {
            await api.delete(`/private-library/saved/${encodeURIComponent(String(idNum))}`);
            savedBookIds.delete(idNum);
            ui.showToast(`Removed "${bookTitle}" from your private library.`, "info");
        } catch (err) {
            ui.showToast(err?.message || "Could not remove book from your private library.", "error");
        } finally {
            removeButton.textContent = "Remove from My Library";
            syncSaveControls(saveButton, removeButton, idNum, bookTitle);
        }
    });

    actions.append(viewButton, saveButton, removeButton);
    content.append(title, badges, description, meta, actions);
    card.append(coverWrap, content);
    return card;
}

function renderBooks(
    books,
    meta
) {
    const grid =
        element("book-grid");

    grid.replaceChildren();

    const searchedBooks = books;

    const summary =
        element("results-summary");

    const total = Number.isFinite(Number(meta?.totalItems))
        ? Number(meta.totalItems)
        : searchedBooks.length;

    if (
        state.search ||
        state.category
    ) {
        summary.textContent =
            `${total} matching book${total === 1 ? "" : "s"}`;
    } else {
        summary.textContent =
            `${total} published book${total === 1 ? "" : "s"
            } in the catalog`;
    }

    for (const book of searchedBooks) {
        grid.append(
            createBookCard(book)
        );
    }

    const empty =
        element("library-empty");

    const emptyMessage =
        element("library-empty-message");

    if (searchedBooks.length === 0) {
        if (
            state.search &&
            state.category
        ) {
            emptyMessage.textContent =
                "No books on this page match that search and category.";
        } else if (state.search) {
            emptyMessage.textContent =
                "No books on this page match that search.";
        } else if (state.category) {
            emptyMessage.textContent =
                "No books on this page are in the selected category.";
        } else {
            emptyMessage.textContent =
                "There are no published books on this page.";
        }

        empty.hidden = false;
    } else {
        empty.hidden = true;
    }

    const totalPages =
        Math.max(
            1,
            Number.parseInt(
                meta?.totalPages,
                10
            ) || 1
        );

    const page =
        Math.min(
            state.page,
            totalPages
        );

    element("pagination").hidden =
        totalPages <= 1;

    element("previous-page").disabled =
        page <= 1;

    element("next-page").disabled =
        page >= totalPages;

    element("page-indicator").textContent =
        `Page ${page} of ${totalPages}`;
}

async function loadCategories() {
    const categories = await fetchAllCategories();
    availableCategories = categories;
    state.category = populateCategoryOptions(
        element("category-filter"),
        categories,
        state.category
    );
}

async function loadBooks() {
    const thisRequest =
        ++requestNumber;

    const loading =
        element("library-loading");

    const errorBox =
        element("library-error");

    const grid =
        element("book-grid");

    loading.hidden =
        false;

    errorBox.hidden =
        true;

    element(
        "library-empty"
    ).hidden = true;

    grid.setAttribute(
        "aria-busy",
        "true"
    );

    try {
        const [
            sort,
            order
        ] = state.sort.split(":");

        const params =
            new URLSearchParams({
                page: String(
                    state.page
                ),
                limit: String(
                    PAGE_SIZE
                ),
                sort,
                order
            });

        if (state.search) {
            params.set("search", state.search);
        }

        if (state.category) {
            params.set("category", state.category);
        }

        const response =
            await api.get(
                `/books?${params.toString()}`
            );

        const books =
            response?.data?.books;

        const meta =
            response?.data?.meta;

        if (
            !Array.isArray(books) ||
            !meta ||
            typeof meta !== "object"
        ) {
            throw new Error(
                "The book response did not match the current API format."
            );
        }

        if (
            thisRequest !==
            requestNumber
        ) {
            return;
        }

        currentBooks =
            books;

        renderBooks(
            currentBooks,
            meta
        );
    } catch (error) {
        if (
            thisRequest !==
            requestNumber
        ) {
            return;
        }

        grid.replaceChildren();

        showMessage(
            errorBox,
            friendlyError(error)
        );

        element(
            "library-empty"
        ).hidden = true;

        element(
            "pagination"
        ).hidden = true;
    } finally {
        if (
            thisRequest ===
            requestNumber
        ) {
            loading.hidden =
                true;

            grid.setAttribute(
                "aria-busy",
                "false"
            );
        }
    }
}

function applyControlsToState() {
    state.search =
        element(
            "library-search"
        ).value
            .trim()
            .slice(
                0,
                MAX_SEARCH_LENGTH
            );

    state.category =
        element(
            "category-filter"
        ).value;

    state.sort =
        element(
            "sort-filter"
        ).value;

    state.page =
        1;

    updateUrl();
    loadBooks();
}

function bindEvents() {
    element(
        "library-search-form"
    ).addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            applyControlsToState();
        }
    );

    element(
        "clear-search"
    ).addEventListener(
        "click",
        () => {
            element(
                "library-search"
            ).value = "";

            state.search =
                "";

            state.page =
                1;

            updateUrl();
            loadBooks();

            element(
                "library-search"
            ).focus();
        }
    );

    element(
        "category-filter"
    ).addEventListener(
        "change",
        () => {
            state.category =
                element(
                    "category-filter"
                ).value;

            state.page =
                1;

            updateUrl();
            loadBooks();
        }
    );

    element(
        "sort-filter"
    ).addEventListener(
        "change",
        () => {
            state.sort =
                element(
                    "sort-filter"
                ).value;

            state.page =
                1;

            updateUrl();
            loadBooks();
        }
    );

    element(
        "previous-page"
    ).addEventListener(
        "click",
        () => {
            if (
                state.page > 1
            ) {
                state.page -= 1;

                updateUrl();
                loadBooks();
            }
        }
    );

    element(
        "next-page"
    ).addEventListener(
        "click",
        () => {
            state.page += 1;

            updateUrl();
            loadBooks();
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            state =
                readStateFromUrl();

            element(
                "library-search"
            ).value =
                state.search;

            element(
                "sort-filter"
            ).value =
                state.sort;

            element(
                "category-filter"
            ).value =
                state.category;

            loadBooks();
        }
    );
}

export async function init() {
    bindEvents();

    element(
        "library-search"
    ).value =
        state.search;

    populateSortOptions(
        element("sort-filter"),
        state.sort
    );

    if (
        !auth.isAuthenticated()
    ) {
        element(
            "library-loading"
        ).hidden = true;

        element(
            "library-empty"
        ).hidden = true;

        element(
            "pagination"
        ).hidden = true;

        showMessage(
            element(
                "library-error"
            ),
            "Please log in to browse the library. Book discovery requires an authenticated account."
        );

        return;
    }

    try {
        await Promise.all([loadCategories(), loadSavedBookIds()]);

        element(
            "category-filter"
        ).value =
            state.category;

        updateUrl();

        await loadBooks();
    } catch (error) {
        element(
            "library-loading"
        ).hidden = true;

        showMessage(
            element(
                "library-error"
            ),
            friendlyError(error)
        );
    }
}