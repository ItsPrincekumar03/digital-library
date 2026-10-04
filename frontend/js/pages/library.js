import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";
import { auth } from "../auth.js";

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

    const allowedSorts = new Set([
        "created_at:DESC",
        "title:ASC",
        "title:DESC",
        "publication_date:DESC",
        "publication_date:ASC"
    ]);

    const requestedSort =
        `${params.get("sort") || "created_at"}:${(
            params.get("order") || "DESC"
        ).toUpperCase()}`;

    return {
        page,
        search: (params.get("search") || "")
            .slice(0, MAX_SEARCH_LENGTH),

        category: params.get("category") || "",

        sort: allowedSorts.has(requestedSort)
            ? requestedSort
            : "created_at:DESC"
    };
}

let state = readStateFromUrl();
let currentBooks = [];
let availableCategories = [];
let requestNumber = 0;

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

function setCoverImage(
    image,
    placeholder,
    coverPath,
    altText
) {
    const safePath =
        typeof coverPath === "string"
            ? coverPath.trim()
            : "";

    if (!safePath) {
        image.hidden = true;
        placeholder.hidden = false;
        return;
    }

    try {
        const origin =
            new URL(API_BASE_URL).origin;

        const normalizedPath =
            safePath.startsWith("/")
                ? safePath
                : `/${safePath}`;

        const url =
            new URL(normalizedPath, origin);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            throw new Error(
                "Unsupported image URL protocol."
            );
        }

        image.alt =
            altText || "Book cover";

        image.src = url.href;
        image.hidden = false;
        placeholder.hidden = true;

        image.addEventListener(
            "error",
            () => {
                image.hidden = true;
                placeholder.hidden = false;
            },
            { once: true }
        );
    } catch {
        image.hidden = true;
        placeholder.hidden = false;
    }
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

function createBookCard(book) {
    const card =
        document.createElement("article");

    card.className =
        "book-card";

    const coverWrap =
        document.createElement("div");

    coverWrap.className =
        "book-card-cover-wrap";

    const image =
        document.createElement("img");

    image.className =
        "book-card-cover";

    image.loading =
        "lazy";

    const placeholder =
        document.createElement("div");

    placeholder.className =
        "cover-placeholder";

    placeholder.textContent =
        "Cover unavailable";

    setCoverImage(
        image,
        placeholder,
        book.cover_path,
        "Cover for " +
        (book.title || "book")
    );

    coverWrap.append(
        image,
        placeholder
    );

    const content =
        document.createElement("div");

    content.className =
        "book-card-content";

    const title =
        document.createElement("h3");

    title.textContent =
        typeof book.title === "string" &&
            book.title
            ? book.title
            : "Untitled book";

    const description =
        document.createElement("p");

    description.className =
        "book-card-description";

    const descriptionText =
        typeof book.description === "string"
            ? book.description.trim()
            : "";

    description.textContent =
        descriptionText ||
        "No description is available.";

    const meta =
        document.createElement("p");

    meta.className =
        "book-card-meta";

    const publicationDate =
        book.publication_date;

    if (publicationDate) {
        const parsedDate =
            new Date(publicationDate);

        meta.textContent =
            Number.isNaN(
                parsedDate.getTime()
            )
                ? `Publication date: ${String(publicationDate)}`
                : `Published ${parsedDate.toLocaleDateString()}`;
    } else {
        meta.textContent =
            "Publication date not provided";
    }

    /*
     * Use a button instead of an anchor so no other navigation
     * behavior can rewrite the URL.
     */
    const viewButton =
        document.createElement("button");

    viewButton.type =
        "button";

    viewButton.className =
        "button button-primary";

    viewButton.textContent =
        "View book";

    viewButton.setAttribute(
        "aria-label",
        `View book: ${title.textContent}`
    );

    viewButton.addEventListener(
        "click",
        () => {
            openBook(book.book_id);
        }
    );

    content.append(
        title,
        description,
        meta,
        viewButton
    );

    card.append(
        coverWrap,
        content
    );

    return card;
}

function matchesSearch(book) {
    if (!state.search) {
        return true;
    }

    const query =
        state.search.toLocaleLowerCase();

    const title =
        typeof book.title === "string"
            ? book.title
            : "";

    const description =
        typeof book.description === "string"
            ? book.description
            : "";

    return `${title}\n${description}`
        .toLocaleLowerCase()
        .includes(query);
}

async function getBookCategoryIds(book) {
    const response =
        await api.get(
            `/books/${encodeURIComponent(
                String(book.book_id)
            )}/categories`
        );

    const categories =
        response?.data?.categories;

    if (!Array.isArray(categories)) {
        return [];
    }

    return categories.map(
        (category) =>
            String(category.category_id)
    );
}

async function filterByCategory(books) {
    if (!state.category) {
        return books;
    }

    const categoryMatches =
        await Promise.all(
            books.map(
                async (book) => {
                    try {
                        const ids =
                            await getBookCategoryIds(
                                book
                            );

                        return ids.includes(
                            String(state.category)
                        )
                            ? book
                            : null;
                    } catch (error) {
                        if (error.status === 404) {
                            return null;
                        }

                        throw error;
                    }
                }
            )
        );

    return categoryMatches.filter(
        Boolean
    );
}

function renderBooks(
    books,
    meta
) {
    const grid =
        element("book-grid");

    grid.replaceChildren();

    const searchedBooks =
        books.filter(
            matchesSearch
        );

    const summary =
        element("results-summary");

    if (
        state.search ||
        state.category
    ) {
        summary.textContent =
            `${searchedBooks.length} matching book${searchedBooks.length === 1
                ? ""
                : "s"
            } on this page`;
    } else {
        const total =
            Number.isFinite(
                Number(meta?.totalItems)
            )
                ? Number(meta.totalItems)
                : books.length;

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
    const response =
        await api.get(
            "/categories"
        );

    const categories =
        response?.data?.categories;

    if (!Array.isArray(categories)) {
        throw new Error(
            "The category response did not contain a category list."
        );
    }

    availableCategories =
        categories;

    const select =
        element("category-filter");

    for (
        const category of categories
    ) {
        if (
            category.category_id === undefined ||
            typeof category.name !== "string"
        ) {
            continue;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(
                category.category_id
            );

        option.textContent =
            category.name;

        select.append(
            option
        );
    }

    if (
        state.category &&
        categories.some(
            (category) =>
                String(
                    category.category_id
                ) ===
                String(
                    state.category
                )
        )
    ) {
        select.value =
            state.category;
    } else {
        state.category = "";
    }
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

        const categoryFilteredBooks =
            await filterByCategory(
                currentBooks
            );

        if (
            thisRequest !==
            requestNumber
        ) {
            return;
        }

        renderBooks(
            categoryFilteredBooks,
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

    element(
        "sort-filter"
    ).value =
        state.sort;

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
        await loadCategories();

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