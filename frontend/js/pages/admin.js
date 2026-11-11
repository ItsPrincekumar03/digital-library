import { auth } from "../auth.js";
import { api } from "../api.js";
import { ui } from "../ui.js";
import { loadCoverIntoElements } from "../coverLoader.js";
import {
    normalizeSortValue,
    populateCategoryOptions,
    populateSortOptions,
} from "../bookFilters.js";

const ADMIN_PAGE_SIZE = 20;

let books = [];
let authors = [];
let categories = [];

let savedBookIds = new Set();
let bookMeta = { page: 1, limit: ADMIN_PAGE_SIZE, totalItems: 0, totalPages: 1 };
let bookFilterState = {
    page: 1,
    search: "",
    category: "",
    sort: "created_at:DESC",
    status: "",
};
let booksRequestNumber = 0;
let editingBookId = null;
let editingAuthorId = null;
let editingCategoryId = null;

function element(id) {
    return document.getElementById(id);
}

/* =========================================================
   GENERIC HELPERS
========================================================= */

function getId(item, snakeCaseKey) {
    if (!item || typeof item !== "object") {
        return null;
    }

    return item[snakeCaseKey] ?? item.id ?? null;
}

function getBookId(book) {
    return getId(book, "book_id");
}

function getAuthorId(author) {
    return getId(author, "author_id");
}

function getCategoryId(category) {
    return getId(category, "category_id");
}

function normalizeArray(response, key) {
    const values = response?.data?.[key];

    return Array.isArray(values)
        ? values
        : [];
}

function normalizeResource(response, key) {
    return response?.data?.[key] ?? null;
}

function getBookPublicationDate(book) {
    return (
        book?.publication_date ??
        book?.publicationDate ??
        null
    );
}

function getBookCoverPath(book) {
    return (
        book?.cover_path ??
        book?.coverPath ??
        ""
    );
}

function getBookTitle(book) {
    return typeof book?.title === "string" &&
        book.title.trim()
        ? book.title
        : "Untitled book";
}

function getStatus(value, fallback = "DRAFT") {
    if (typeof value === "string" && value.trim()) {
        return value.trim().toUpperCase();
    }

    return fallback;
}

function getMetadataStatus(item) {
    if (
        item &&
        typeof item.is_archived === "boolean" &&
        item.is_archived
    ) {
        return "ARCHIVED";
    }

    return getStatus(
        item?.status,
        "ACTIVE"
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString();
}

function friendlyError(error) {
    if (!error) {
        return "The request could not be completed. Please try again.";
    }

    if (typeof error.status !== "number") {
        return error.message ||
            "The request could not be completed. Please try again.";
    }

    if (error.status === 400) {
        return "Some information is invalid. Please check the form.";
    }

    if (error.status === 401) {
        return "Your session has expired. Please log in again.";
    }

    if (error.status === 403) {
        return "You do not have permission to perform this action.";
    }

    if (error.status === 404) {
        return "The requested content could not be found.";
    }

    if (error.status === 409) {
        return "That item already exists.";
    }

    if (error.status === 429) {
        return "Too many requests. Please wait and try again.";
    }

    if (error.status >= 500) {
        return "The server is temporarily unavailable.";
    }

    return error.message ||
        "The request could not be completed.";
}

function showToast(message, type = "info") {
    ui.showToast(message, type);
}

function showSectionMessage(id, message) {
    const node = element(id);

    if (!node) {
        return;
    }

    node.textContent = message;
    node.hidden = !message;
}

function clearSectionMessage(id) {
    showSectionMessage(id, "");
}

function createButton(
    label,
    className,
    handler,
    disabled = false
) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.disabled = disabled;

    button.addEventListener(
        "click",
        handler
    );

    return button;
}

function createStatusBadge(status) {
    const badge =
        document.createElement("span");

    const normalizedStatus =
        String(status || "DRAFT")
            .toLowerCase();

    badge.className =
        `admin-status admin-status-${normalizedStatus}`;

    badge.textContent =
        String(status || "DRAFT");

    return badge;
}

/* =========================================================
   TABS
========================================================= */

function bindTabs() {
    const tabs =
        document.querySelectorAll(".admin-tab");

    const contents =
        document.querySelectorAll(".tab-content");

    function activateTab(tabName) {
        tabs.forEach((tab) => {
            const active =
                tab.dataset.tab === tabName;

            tab.classList.toggle(
                "is-active",
                active
            );

            tab.setAttribute(
                "aria-selected",
                active ? "true" : "false"
            );
        });

        contents.forEach((content) => {
            const active =
                content.id === `tab-${tabName}`;

            content.classList.toggle(
                "is-active",
                active
            );

            content.hidden = !active;
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener(
            "click",
            async () => {
                const tabName =
                    tab.dataset.tab;

                if (!tabName) {
                    return;
                }

                activateTab(tabName);

                if (tabName === "books") {
                    await loadBooks();
                }

                if (tabName === "authors") {
                    await loadAuthors();
                }

                if (tabName === "categories") {
                    await loadCategories();
                }
            }
        );
    });

    // Always start with Books visible.
    activateTab("books");
}

/* =========================================================
   BOOK MANAGEMENT
========================================================= */

async function loadSavedBookIds() {
    try {
        const res = await api.get("/private-library/saved");
        const list = res?.data?.savedBooks;
        savedBookIds = new Set(Array.isArray(list) ? list.map((b) => Number(b.book_id)) : []);
    } catch (_) {
        savedBookIds = new Set();
    }
}

function hasActiveBookFilters() {
    return Boolean(
        bookFilterState.search ||
        bookFilterState.category ||
        bookFilterState.status
    );
}

function countActiveBookFilters() {
    let count = 0;
    if (bookFilterState.search) count += 1;
    if (bookFilterState.category) count += 1;
    if (bookFilterState.status) count += 1;
    if (bookFilterState.sort && bookFilterState.sort !== "created_at:DESC") count += 1;
    return count;
}

function resetAdminBookFilters() {
    bookFilterState = {
        page: 1,
        search: "",
        category: "",
        sort: "created_at:DESC",
        status: "",
    };
    syncAdminFilterControls();
    loadBooks();
}

function syncAdminFilterControls() {
    const searchInput = element("admin-book-search");
    if (searchInput) {
        searchInput.value = bookFilterState.search;
    }
    const categorySelect = element("admin-category-filter");
    if (categorySelect) {
        categorySelect.value = bookFilterState.category;
    }
    const sortSelect = element("admin-sort-filter");
    if (sortSelect) {
        sortSelect.value = bookFilterState.sort;
    }
    const statusSelect = element("admin-status-filter");
    if (statusSelect) {
        statusSelect.value = bookFilterState.status;
    }

    const pills = document.querySelectorAll("#admin-status-pills .admin-status-pill");
    pills.forEach((pill) => {
        const isMatch = (pill.dataset.status || "") === bookFilterState.status;
        pill.classList.toggle("is-active", isMatch);
        pill.setAttribute("aria-pressed", isMatch ? "true" : "false");
    });

    const activeCount = countActiveBookFilters();
    const resetBtn = element("admin-reset-filters");
    if (resetBtn) {
        resetBtn.disabled = activeCount === 0;
    }

    const badgeEl = element("admin-filter-badge");
    if (badgeEl) {
        badgeEl.textContent = String(activeCount);
        badgeEl.hidden = activeCount === 0;
    }

    renderActiveFilterChips();
}

function renderActiveFilterChips() {
    const container = element("admin-active-filters");
    if (!container) {
        return;
    }
    container.replaceChildren();

    const chips = [];
    if (bookFilterState.search) {
        chips.push({
            label: `Search: "${bookFilterState.search}"`,
            clear: () => { bookFilterState.search = ""; bookFilterState.page = 1; },
        });
    }
    if (bookFilterState.category) {
        const matchedCat = categories.find((c) => String(getCategoryId(c)) === String(bookFilterState.category));
        chips.push({
            label: `Category: ${matchedCat?.name || bookFilterState.category}`,
            clear: () => { bookFilterState.category = ""; bookFilterState.page = 1; },
        });
    }
    if (bookFilterState.status) {
        const pretty = bookFilterState.status.charAt(0) + bookFilterState.status.slice(1).toLowerCase();
        chips.push({
            label: `Status: ${pretty}`,
            clear: () => { bookFilterState.status = ""; bookFilterState.page = 1; },
        });
    }

    if (!chips.length) {
        container.hidden = true;
        return;
    }

    container.hidden = false;
    for (const chip of chips) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "admin-filter-chip";
        btn.setAttribute("aria-label", `Remove ${chip.label}`);
        btn.textContent = `${chip.label} \u00D7`;
        btn.addEventListener("click", () => {
            chip.clear();
            syncAdminFilterControls();
            loadBooks();
        });
        container.append(btn);
    }
}

async function loadBooks() {
    const thisRequest = ++booksRequestNumber;
    clearSectionMessage("books-message");
    syncAdminFilterControls();

    const tableWrap = element("books-table-body")?.closest(".admin-table-wrap");
    if (tableWrap) {
        tableWrap.classList.add("is-loading");
        tableWrap.setAttribute("aria-busy", "true");
    }

    try {
        const [sort, order] = bookFilterState.sort.split(":");
        const params = new URLSearchParams({
            page: String(bookFilterState.page),
            limit: String(ADMIN_PAGE_SIZE),
            sort: sort || "created_at",
            order: order || "DESC",
        });

        if (bookFilterState.search) {
            params.set("search", bookFilterState.search);
        }
        if (bookFilterState.category) {
            params.set("category", bookFilterState.category);
        }
        if (bookFilterState.status) {
            params.set("status", bookFilterState.status);
        }

        const [response] = await Promise.all([
            api.get(`/books/manage?${params.toString()}`),
            loadSavedBookIds(),
        ]);

        if (thisRequest !== booksRequestNumber) {
            return;
        }

        books = normalizeArray(response, "books");
        const meta = response?.data?.meta;
        bookMeta = meta && typeof meta === "object"
            ? meta
            : { page: 1, limit: ADMIN_PAGE_SIZE, totalItems: books.length, totalPages: 1 };

        renderBooks();
    } catch (error) {
        if (thisRequest !== booksRequestNumber) {
            return;
        }

        books = [];
        bookMeta = { page: 1, limit: ADMIN_PAGE_SIZE, totalItems: 0, totalPages: 1 };

        renderBooks();

        showSectionMessage(
            "books-message",
            friendlyError(error)
        );
    } finally {
        if (thisRequest === booksRequestNumber && tableWrap) {
            tableWrap.classList.remove("is-loading");
            tableWrap.setAttribute("aria-busy", "false");
        }
    }
}

function renderBooks() {
    const body =
        element("books-table-body");

    const empty =
        element("books-empty");

    const table =
        body?.closest("table");

    if (!body || !empty || !table) {
        return;
    }

    body.replaceChildren();

    const tableWrap =
        table.parentElement;

    const summaryEl = element("admin-books-summary");
    const total = Number.isFinite(Number(bookMeta?.totalItems))
        ? Number(bookMeta.totalItems)
        : books.length;
    if (summaryEl) {
        summaryEl.textContent = hasActiveBookFilters()
            ? `${total} matching book${total === 1 ? "" : "s"}`
            : `${total} manageable book${total === 1 ? "" : "s"}`;
    }

    const paginationEl = element("admin-books-pagination");
    const totalPages = Math.max(1, Number.parseInt(bookMeta?.totalPages, 10) || 1);
    const currentPage = Math.min(bookFilterState.page, totalPages);
    if (paginationEl) {
        paginationEl.hidden = totalPages <= 1;
        const prevBtn = element("admin-books-prev");
        const nextBtn = element("admin-books-next");
        const indicator = element("admin-books-page-indicator");
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (indicator) indicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    const emptyTitleEl = element("books-empty-title");
    const emptyMsgEl = element("books-empty-message");
    const emptyCreateBtn = element("create-book-empty-button");
    const emptyResetBtn = element("admin-empty-reset-button");

    if (!books.length) {
        tableWrap.hidden = true;
        empty.hidden = false;
        if (hasActiveBookFilters()) {
            if (emptyTitleEl) emptyTitleEl.textContent = "No matching books found";
            if (emptyMsgEl) emptyMsgEl.textContent = "No manageable books match your active search or filters.";
            if (emptyCreateBtn) emptyCreateBtn.hidden = true;
            if (emptyResetBtn) emptyResetBtn.hidden = false;
        } else {
            if (emptyTitleEl) emptyTitleEl.textContent = "No books found";
            if (emptyMsgEl) emptyMsgEl.textContent = "Create a book to begin building the public library.";
            if (emptyCreateBtn) emptyCreateBtn.hidden = false;
            if (emptyResetBtn) emptyResetBtn.hidden = true;
        }
        return;
    }

    tableWrap.hidden = false;
    empty.hidden = true;

    books.forEach((book) => {
        const row =
            document.createElement("tr");

        const titleCell = document.createElement("td");
        const titleRow = document.createElement("div");
        titleRow.className = "admin-book-title-cell";
        const thumbWrap = document.createElement("span");
        thumbWrap.className = "admin-book-thumb-wrap";
        const thumbImg = document.createElement("img");
        thumbImg.className = "admin-book-thumb";
        thumbImg.hidden = true;
        const thumbPlaceholder = document.createElement("span");
        thumbPlaceholder.className = "admin-book-thumb-placeholder";
        thumbPlaceholder.textContent = "\u2014";
        thumbWrap.append(thumbImg, thumbPlaceholder);

        const titleBody = document.createElement("div");
        titleBody.className = "admin-book-title-body";
        const titleTextSpan = document.createElement("span");
        titleTextSpan.textContent = getBookTitle(book);
        titleBody.append(titleTextSpan);

        const bookAuthors = Array.isArray(book.authors) ? book.authors : [];
        const bookCategories = Array.isArray(book.categories) ? book.categories : [];
        if (bookAuthors.length || bookCategories.length || book.file_format) {
            const metaRow = document.createElement("div");
            metaRow.className = "admin-book-title-meta";
            for (const author of bookAuthors.slice(0, 2)) {
                if (author?.name) {
                    const badge = document.createElement("span");
                    badge.className = "admin-book-badge";
                    badge.textContent = author.name;
                    metaRow.append(badge);
                }
            }
            for (const category of bookCategories.slice(0, 2)) {
                if (category?.name) {
                    const badge = document.createElement("button");
                    badge.type = "button";
                    badge.className = "admin-book-badge admin-book-badge-category admin-book-badge-interactive";
                    badge.textContent = category.name;
                    badge.title = `Filter by category: ${category.name}`;
                    badge.addEventListener("click", () => {
                        bookFilterState.category = String(category.category_id);
                        bookFilterState.page = 1;
                        syncAdminFilterControls();
                        loadBooks();
                    });
                    metaRow.append(badge);
                }
            }
            if (book.file_format) {
                const fmtBadge = document.createElement("span");
                fmtBadge.className = "admin-book-badge admin-book-badge-format";
                fmtBadge.textContent = String(book.file_format).toUpperCase();
                metaRow.append(fmtBadge);
            }
            titleBody.append(metaRow);
        }

        titleRow.append(thumbWrap, titleBody);
        titleCell.append(titleRow);
        const rowBookId = getBookId(book);
        loadCoverIntoElements(thumbImg, thumbPlaceholder, {
            coverPath: getBookCoverPath(book),
            fallbackApiPath: rowBookId ? `/books/${encodeURIComponent(String(rowBookId))}/cover` : "",
            altText: `Cover for ${getBookTitle(book)}`,
        });

        const status =
            getStatus(
                book.status,
                "DRAFT"
            );

        const statusCell =
            document.createElement("td");
        statusCell.dataset.label = "Status";

        statusCell.append(
            createStatusBadge(status)
        );

        const dateCell =
            document.createElement("td");
        dateCell.dataset.label = "Published";

        dateCell.textContent =
            formatDate(
                getBookPublicationDate(book)
            );

        const actionsCell =
            document.createElement("td");

        actionsCell.className =
            "admin-actions-cell";

        const actionGroup =
            document.createElement("div");

        actionGroup.className =
            "admin-action-group";

        const bookId =
            getBookId(book);

        actionGroup.append(
            createButton(
                "Edit",
                "button button-secondary button-small",
                () => openEditBookModal(book)
            ),
            createButton(
                "Manage content",
                "button button-primary button-small",
                () => openManageBook(bookId)
            )
        );

        if (status === "PUBLISHED") {
            actionGroup.append(
                createButton(
                    "View book",
                    "button button-secondary button-small",
                    () => window.location.assign(`book.html?id=${encodeURIComponent(String(bookId))}`)
                )
            );
        }

        if (
            status === "DRAFT" ||
            status === "ARCHIVED"
        ) {
            actionGroup.append(
                createButton(
                    "Publish",
                    "button button-success button-small",
                    () => publishBook(bookId)
                )
            );
        }

        if (status === "PUBLISHED") {
            actionGroup.append(
                createButton(
                    "Archive",
                    "button button-warning button-small",
                    () => archiveBook(bookId)
                )
            );

            const idNum = Number(bookId);
            const isSaved = savedBookIds.has(idNum);
            const savePersonalBtn = document.createElement("button");
            savePersonalBtn.type = "button";
            savePersonalBtn.className = isSaved ? "button button-saved button-small" : "button button-secondary button-small";
            savePersonalBtn.textContent = isSaved ? "Saved to My Library" : "Save to My Library";
            savePersonalBtn.disabled = isSaved;

            const removePersonalBtn = document.createElement("button");
            removePersonalBtn.type = "button";
            removePersonalBtn.className = "button button-danger button-small";
            removePersonalBtn.textContent = "Remove from My Library";
            removePersonalBtn.hidden = !isSaved;

            savePersonalBtn.addEventListener("click", async () => {
                if (savedBookIds.has(idNum) || savePersonalBtn.disabled) return;
                savePersonalBtn.disabled = true;
                savePersonalBtn.textContent = "Saving?";
                try {
                    await api.post(`/private-library/saved/${encodeURIComponent(String(idNum))}`, {});
                    savedBookIds.add(idNum);
                    savePersonalBtn.textContent = "Saved to My Library";
                    savePersonalBtn.className = "button button-saved button-small";
                    savePersonalBtn.disabled = true;
                    removePersonalBtn.hidden = false;
                    showToast(`Saved "${getBookTitle(book)}" to your personal library.`, "success");
                } catch (err) {
                    savePersonalBtn.textContent = "Save to My Library";
                    savePersonalBtn.disabled = false;
                    showToast(friendlyError(err), "error");
                }
            });

            removePersonalBtn.addEventListener("click", async () => {
                if (!savedBookIds.has(idNum) || removePersonalBtn.disabled) return;
                const ok = window.confirm(`Remove "${getBookTitle(book)}" from your personal library? The book remains published in the public catalog.`);
                if (!ok) return;
                removePersonalBtn.disabled = true;
                removePersonalBtn.textContent = "Removing?";
                try {
                    await api.delete(`/private-library/saved/${encodeURIComponent(String(idNum))}`);
                    savedBookIds.delete(idNum);
                    savePersonalBtn.textContent = "Save to My Library";
                    savePersonalBtn.className = "button button-secondary button-small";
                    savePersonalBtn.disabled = false;
                    removePersonalBtn.hidden = true;
                    showToast(`Removed "${getBookTitle(book)}" from your personal library.`, "info");
                } catch (err) {
                    showToast(friendlyError(err), "error");
                } finally {
                    removePersonalBtn.textContent = "Remove from My Library";
                    removePersonalBtn.disabled = false;
                }
            });

            actionGroup.append(savePersonalBtn, removePersonalBtn);
        }

        actionsCell.append(
            actionGroup
        );

        row.append(
            titleCell,
            statusCell,
            dateCell,
            actionsCell
        );

        body.append(row);
    });
}

function openCreateBookModal() {
    editingBookId = null;

    const form =
        element("book-form");

    form.reset();

    element("book-id").value = "";

    element("book-dialog-title").textContent =
        "Create book";

    element("book-dialog").showModal();

    element("book-title").focus();
}

function openEditBookModal(book) {
    editingBookId =
        getBookId(book);

    const publicationDate =
        getBookPublicationDate(book);

    element("book-dialog-title").textContent =
        "Edit book details";

    element("book-id").value =
        String(editingBookId ?? "");

    element("book-title").value =
        getBookTitle(book);

    element("book-description").value =
        typeof book?.description === "string"
            ? book.description
            : "";

    element("book-cover-path").value =
        getBookCoverPath(book) || (editingBookId ? `/api/books/${editingBookId}/cover` : "");

    element("book-publication-date").value =
        publicationDate
            ? String(publicationDate).slice(0, 10)
            : "";

    element("book-dialog").showModal();

    element("book-title").focus();
}

function closeBookModal() {
    const dialog =
        element("book-dialog");

    if (dialog?.open) {
        dialog.close();
    }

    editingBookId = null;

    element("book-form")?.reset();
}

async function saveBook(event) {
    event.preventDefault();

    const title =
        element("book-title")
            .value
            .trim();

    const description =
        element("book-description")
            .value
            .trim();

    const coverPath =
        element("book-cover-path")
            .value
            .trim();

    const publicationDate =
        element("book-publication-date")
            .value || null;

    if (!title) {
        showToast(
            "Book title is required.",
            "error"
        );

        element("book-title").focus();

        return;
    }

    const payload = {
        title,
        description,
        coverPath,
        publicationDate
    };

    const submitButton =
        element("book-form")
            .querySelector(
                'button[type="submit"]'
            );

    submitButton.disabled = true;

    try {
        if (editingBookId) {
            await api.put(
                `/books/${encodeURIComponent(
                    String(editingBookId)
                )}`,
                payload
            );

            showToast(
                "Book updated successfully.",
                "success"
            );
        } else {
            await api.post(
                "/books",
                payload
            );

            showToast(
                "Book created successfully.",
                "success"
            );
        }

        closeBookModal();

        await loadBooks();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        submitButton.disabled = false;
    }
}

async function publishBook(bookId) {
    if (!bookId) {
        showToast(
            "Invalid book ID.",
            "error"
        );

        return;
    }

    try {
        await api.patch(
            `/books/${encodeURIComponent(
                String(bookId)
            )}/publish`
        );

        showToast(
            "Book published successfully.",
            "success"
        );

        await loadBooks();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

async function archiveBook(bookId) {
    if (!bookId) {
        showToast(
            "Invalid book ID.",
            "error"
        );

        return;
    }

    const confirmed =
        window.confirm(
            "Archive this book?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await api.patch(
            `/books/${encodeURIComponent(
                String(bookId)
            )}/archive`
        );

        showToast(
            "Book archived successfully.",
            "success"
        );

        await loadBooks();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

function openManageBook(bookId) {
    const numericId =
        Number(bookId);

    if (
        !Number.isSafeInteger(numericId) ||
        numericId < 1
    ) {
        showToast(
            "Invalid book ID.",
            "error"
        );

        return;
    }

    const url =
        new URL(
            "admin-book.html",
            window.location.href
        );

    url.searchParams.set(
        "id",
        String(numericId)
    );

    window.location.assign(
        url.href
    );
}

/* =========================================================
   AUTHOR MANAGEMENT
========================================================= */

async function loadAuthors() {
    clearSectionMessage(
        "authors-message"
    );

    try {
        const response =
            await api.get("/authors");

        authors =
            normalizeArray(
                response,
                "authors"
            );

        renderAuthors();
    } catch (error) {
        authors = [];

        renderAuthors();

        showSectionMessage(
            "authors-message",
            friendlyError(error)
        );
    }
}

function renderAuthors() {
    const body =
        element("authors-table-body");

    const empty =
        element("authors-empty");

    const table =
        body?.closest("table");

    if (!body || !empty || !table) {
        return;
    }

    body.replaceChildren();

    const tableWrap =
        table.parentElement;

    if (!authors.length) {
        tableWrap.hidden = true;
        empty.hidden = false;
        return;
    }

    tableWrap.hidden = false;
    empty.hidden = true;

    authors.forEach((author) => {
        const row =
            document.createElement("tr");

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            typeof author?.name === "string"
                ? author.name
                : "Unnamed author";

        const status =
            getMetadataStatus(author);

        const statusCell =
            document.createElement("td");

        statusCell.append(
            createStatusBadge(status)
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.className =
            "admin-actions-cell";

        const actionGroup =
            document.createElement("div");

        actionGroup.className =
            "admin-action-group";

        actionGroup.append(
            createButton(
                "Edit",
                "button button-secondary button-small",
                () => openEditAuthorModal(author)
            )
        );

        if (status === "ACTIVE") {
            actionGroup.append(
                createButton(
                    "Archive",
                    "button button-warning button-small",
                    () => archiveAuthor(
                        getAuthorId(author)
                    )
                )
            );
        }

        actionsCell.append(
            actionGroup
        );

        row.append(
            nameCell,
            statusCell,
            actionsCell
        );

        body.append(row);
    });
}

function openCreateAuthorModal() {
    editingAuthorId = null;

    element("author-form").reset();

    element("author-id").value = "";

    element("author-dialog-title").textContent =
        "Create author";

    element("author-dialog").showModal();

    element("author-name").focus();
}

function openEditAuthorModal(author) {
    editingAuthorId =
        getAuthorId(author);

    element("author-dialog-title").textContent =
        "Edit author";

    element("author-id").value =
        String(editingAuthorId ?? "");

    element("author-name").value =
        typeof author?.name === "string"
            ? author.name
            : "";

    element("author-biography").value =
        typeof author?.biography === "string"
            ? author.biography
            : "";

    element("author-dialog").showModal();

    element("author-name").focus();
}

function closeAuthorModal() {
    const dialog =
        element("author-dialog");

    if (dialog?.open) {
        dialog.close();
    }

    editingAuthorId = null;

    element("author-form")?.reset();
}

async function saveAuthor(event) {
    event.preventDefault();

    const name =
        element("author-name")
            .value
            .trim();

    const biography =
        element("author-biography")
            .value
            .trim();

    if (!name) {
        showToast(
            "Author name is required.",
            "error"
        );

        element("author-name").focus();

        return;
    }

    const payload = {
        name,
        biography
    };

    const submitButton =
        element("author-form")
            .querySelector(
                'button[type="submit"]'
            );

    submitButton.disabled = true;

    try {
        if (editingAuthorId) {
            await api.put(
                `/authors/${encodeURIComponent(
                    String(editingAuthorId)
                )}`,
                payload
            );

            showToast(
                "Author updated successfully.",
                "success"
            );
        } else {
            await api.post(
                "/authors",
                payload
            );

            showToast(
                "Author created successfully.",
                "success"
            );
        }

        closeAuthorModal();

        await loadAuthors();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        submitButton.disabled = false;
    }
}

async function archiveAuthor(authorId) {
    if (!authorId) {
        showToast(
            "Invalid author ID.",
            "error"
        );

        return;
    }

    if (!window.confirm(
        "Archive this author?"
    )) {
        return;
    }

    try {
        await api.patch(
            `/authors/${encodeURIComponent(
                String(authorId)
            )}/archive`
        );

        showToast(
            "Author archived successfully.",
            "success"
        );

        await loadAuthors();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

/* =========================================================
   CATEGORY MANAGEMENT
========================================================= */

async function loadCategories() {
    clearSectionMessage(
        "categories-message"
    );

    try {
        const response =
            await api.get("/categories");

        categories =
            normalizeArray(
                response,
                "categories"
            );

        bookFilterState.category = populateCategoryOptions(
            element("admin-category-filter"),
            categories,
            bookFilterState.category
        );

        renderCategories();
    } catch (error) {
        categories = [];

        renderCategories();

        showSectionMessage(
            "categories-message",
            friendlyError(error)
        );
    }
}

function renderCategories() {
    const body =
        element("categories-table-body");

    const empty =
        element("categories-empty");

    const table =
        body?.closest("table");

    if (!body || !empty || !table) {
        return;
    }

    body.replaceChildren();

    const tableWrap =
        table.parentElement;

    if (!categories.length) {
        tableWrap.hidden = true;
        empty.hidden = false;
        return;
    }

    tableWrap.hidden = false;
    empty.hidden = true;

    categories.forEach((category) => {
        const row =
            document.createElement("tr");

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            typeof category?.name === "string"
                ? category.name
                : "Unnamed category";

        const status =
            getMetadataStatus(category);

        const statusCell =
            document.createElement("td");

        statusCell.append(
            createStatusBadge(status)
        );

        const actionsCell =
            document.createElement("td");

        actionsCell.className =
            "admin-actions-cell";

        const actionGroup =
            document.createElement("div");

        actionGroup.className =
            "admin-action-group";

        actionGroup.append(
            createButton(
                "Edit",
                "button button-secondary button-small",
                () => openEditCategoryModal(category)
            )
        );

        if (status === "ACTIVE") {
            actionGroup.append(
                createButton(
                    "Archive",
                    "button button-warning button-small",
                    () => archiveCategory(
                        getCategoryId(category)
                    )
                )
            );
        }

        actionsCell.append(
            actionGroup
        );

        row.append(
            nameCell,
            statusCell,
            actionsCell
        );

        body.append(row);
    });
}

function openCreateCategoryModal() {
    editingCategoryId = null;

    element("category-form").reset();

    element("category-id").value = "";

    element("category-dialog-title").textContent =
        "Create category";

    element("category-dialog").showModal();

    element("category-name").focus();
}

function openEditCategoryModal(category) {
    editingCategoryId =
        getCategoryId(category);

    element("category-dialog-title").textContent =
        "Edit category";

    element("category-id").value =
        String(editingCategoryId ?? "");

    element("category-name").value =
        typeof category?.name === "string"
            ? category.name
            : "";

    element("category-description").value =
        typeof category?.description === "string"
            ? category.description
            : "";

    element("category-dialog").showModal();

    element("category-name").focus();
}

function closeCategoryModal() {
    const dialog =
        element("category-dialog");

    if (dialog?.open) {
        dialog.close();
    }

    editingCategoryId = null;

    element("category-form")?.reset();
}

async function saveCategory(event) {
    event.preventDefault();

    const name =
        element("category-name")
            .value
            .trim();

    const description =
        element("category-description")
            .value
            .trim();

    if (!name) {
        showToast(
            "Category name is required.",
            "error"
        );

        element("category-name").focus();

        return;
    }

    const payload = {
        name,
        description
    };

    const submitButton =
        element("category-form")
            .querySelector(
                'button[type="submit"]'
            );

    submitButton.disabled = true;

    try {
        if (editingCategoryId) {
            await api.put(
                `/categories/${encodeURIComponent(
                    String(editingCategoryId)
                )}`,
                payload
            );

            showToast(
                "Category updated successfully.",
                "success"
            );
        } else {
            await api.post(
                "/categories",
                payload
            );

            showToast(
                "Category created successfully.",
                "success"
            );
        }

        closeCategoryModal();

        await loadCategories();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        submitButton.disabled = false;
    }
}

async function archiveCategory(categoryId) {
    if (!categoryId) {
        showToast(
            "Invalid category ID.",
            "error"
        );

        return;
    }

    if (!window.confirm(
        "Archive this category?"
    )) {
        return;
    }

    try {
        await api.patch(
            `/categories/${encodeURIComponent(
                String(categoryId)
            )}/archive`
        );

        showToast(
            "Category archived successfully.",
            "success"
        );

        await loadCategories();
    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

function bindAdminBookFilters() {
    let searchDebounceTimer = null;

    element("admin-filter-toggle")?.addEventListener("click", () => {
        const panel = element("admin-book-controls");
        const toggleBtn = element("admin-filter-toggle");
        if (!panel || !toggleBtn) return;
        const willOpen = !panel.classList.contains("is-open");
        panel.classList.toggle("is-open", willOpen);
        toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    document.querySelectorAll("#admin-status-pills .admin-status-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
            bookFilterState.status = pill.dataset.status || "";
            bookFilterState.page = 1;
            syncAdminFilterControls();
            loadBooks();
        });
    });

    element("admin-book-search-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = null;
        }
        bookFilterState.search = (element("admin-book-search")?.value || "").trim().slice(0, 200);
        bookFilterState.page = 1;
        loadBooks();
    });

    element("admin-book-search")?.addEventListener("input", () => {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        searchDebounceTimer = setTimeout(() => {
            const nextSearch = (element("admin-book-search")?.value || "").trim().slice(0, 200);
            if (nextSearch !== bookFilterState.search) {
                bookFilterState.search = nextSearch;
                bookFilterState.page = 1;
                loadBooks();
            }
        }, 250);
    });

    element("admin-category-filter")?.addEventListener("change", () => {
        bookFilterState.category = element("admin-category-filter")?.value || "";
        bookFilterState.page = 1;
        loadBooks();
    });

    element("admin-sort-filter")?.addEventListener("change", () => {
        const raw = element("admin-sort-filter")?.value || "created_at:DESC";
        const [sort, order] = raw.split(":");
        bookFilterState.sort = normalizeSortValue(sort, order);
        bookFilterState.page = 1;
        loadBooks();
    });

    element("admin-status-filter")?.addEventListener("change", () => {
        bookFilterState.status = element("admin-status-filter")?.value || "";
        bookFilterState.page = 1;
        loadBooks();
    });

    element("admin-reset-filters")?.addEventListener("click", resetAdminBookFilters);
    element("admin-empty-reset-button")?.addEventListener("click", resetAdminBookFilters);

    element("admin-books-prev")?.addEventListener("click", () => {
        if (bookFilterState.page > 1) {
            bookFilterState.page -= 1;
            loadBooks();
        }
    });

    element("admin-books-next")?.addEventListener("click", () => {
        const totalPages = Math.max(1, Number.parseInt(bookMeta?.totalPages, 10) || 1);
        if (bookFilterState.page < totalPages) {
            bookFilterState.page += 1;
            loadBooks();
        }
    });
}

/* =========================================================
   MODAL BINDING
========================================================= */

function bindModalControls() {
    /* -------------------------
       BOOK
    ------------------------- */

    element("create-book-button")
        .addEventListener(
            "click",
            openCreateBookModal
        );

    element("create-book-empty-button")
        .addEventListener(
            "click",
            openCreateBookModal
        );

    element("book-form")
        .addEventListener(
            "submit",
            saveBook
        );

    element("book-cancel")
        .addEventListener(
            "click",
            closeBookModal
        );

    element("book-dialog-close")
        .addEventListener(
            "click",
            closeBookModal
        );

    element("book-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeBookModal();
            }
        );

    /* -------------------------
       AUTHOR
    ------------------------- */

    element("create-author-button")
        .addEventListener(
            "click",
            openCreateAuthorModal
        );

    element("create-author-empty-button")
        .addEventListener(
            "click",
            openCreateAuthorModal
        );

    element("author-form")
        .addEventListener(
            "submit",
            saveAuthor
        );

    element("author-cancel")
        .addEventListener(
            "click",
            closeAuthorModal
        );

    element("author-dialog-close")
        .addEventListener(
            "click",
            closeAuthorModal
        );

    element("author-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeAuthorModal();
            }
        );

    /* -------------------------
       CATEGORY
    ------------------------- */

    element("create-category-button")
        .addEventListener(
            "click",
            openCreateCategoryModal
        );

    element("create-category-empty-button")
        .addEventListener(
            "click",
            openCreateCategoryModal
        );

    element("category-form")
        .addEventListener(
            "submit",
            saveCategory
        );

    element("category-cancel")
        .addEventListener(
            "click",
            closeCategoryModal
        );

    element("category-dialog-close")
        .addEventListener(
            "click",
            closeCategoryModal
        );

    element("category-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeCategoryModal();
            }
        );
}

/* =========================================================
   INITIALIZATION
========================================================= */

export async function init() {
    if (!auth.isAuthenticated()) {
        window.location.assign(
            "login.html"
        );

        return;
    }

    if (!auth.isAdmin()) {
        window.location.assign(
            "profile.html"
        );

        return;
    }

    populateSortOptions(element("admin-sort-filter"), bookFilterState.sort);
    bindAdminBookFilters();
    bindTabs();
    bindModalControls();

    await loadCategories();
    await Promise.all([
        loadBooks(),
        loadAuthors(),
    ]);
}