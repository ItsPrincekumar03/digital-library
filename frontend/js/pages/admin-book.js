import { auth } from "../auth.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

let bookId = null;
let book = null;
let authors = [];
let categories = [];
let chapters = [];
let editingChapterId = null;
let orderDirty = false;

function element(id) {
    return document.getElementById(id);
}

function getId(item, snakeCaseKey) {
    if (!item || typeof item !== "object") {
        return null;
    }

    return item[snakeCaseKey] ?? item.id ?? null;
}

function getAuthorId(author) {
    return getId(author, "author_id");
}

function getCategoryId(category) {
    return getId(category, "category_id");
}

function getChapterId(chapter) {
    return getId(chapter, "chapter_id");
}

function unwrapResource(response, key) {
    return response?.data?.[key] ?? null;
}

function unwrapArray(response, key) {
    const values = response?.data?.[key];

    return Array.isArray(values)
        ? values
        : [];
}

function getChapterNumber(chapter) {
    const value =
        chapter?.chapter_number ??
        chapter?.chapterNumber ??
        0;

    return Number(value);
}

function getBookPublicationDate(value) {
    return value?.publication_date ??
        value?.publicationDate ??
        null;
}

function getBookCoverPath(value) {
    return value?.cover_path ??
        value?.coverPath ??
        "";
}

function getStatus(value, fallback = "DRAFT") {
    return typeof value === "string" && value.trim()
        ? value
        : fallback;
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "The request could not be completed.";
    }

    if (error.status === 400) {
        return "Some information is invalid. Please check your input.";
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
        return "That relationship or record already exists.";
    }

    if (error.status >= 500) {
        return "The server is temporarily unavailable.";
    }

    return error.message || "The request could not be completed.";
}

function showToast(message, type = "info") {
    ui.showToast(message, type);
}

function createButton(
    label,
    className,
    handler,
    disabled = false
) {
    const button = document.createElement("button");

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

    badge.className =
        `admin-status admin-status-${status.toLowerCase()}`;

    badge.textContent = status;

    return badge;
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

function getCurrentChapterIndex(chapterId) {
    return chapters.findIndex(
        (chapter) =>
            String(getChapterId(chapter)) ===
            String(chapterId)
    );
}

/* -------------------------------------------------------
   TAB NAVIGATION
------------------------------------------------------- */

function bindTabs() {
    const tabs =
        document.querySelectorAll(".admin-tab");

    const contents =
        document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener(
            "click",
            () => {
                const name = tab.dataset.tab;

                tabs.forEach((item) => {
                    const active = item === tab;

                    item.classList.toggle(
                        "is-active",
                        active
                    );

                    item.setAttribute(
                        "aria-selected",
                        active ? "true" : "false"
                    );
                });

                contents.forEach((content) => {
                    const active =
                        content.id === `tab-${name}`;

                    content.classList.toggle(
                        "is-active",
                        active
                    );

                    content.hidden = !active;
                });
            }
        );
    });
}

/* -------------------------------------------------------
   BOOK
------------------------------------------------------- */

async function loadBook() {
    try {
        const response =
            await api.get(
                `/books/${encodeURIComponent(String(bookId))}`
            );

        book = unwrapResource(
            response,
            "book"
        );

        if (!book) {
            throw new Error(
                "Book information was not returned."
            );
        }

        renderBook();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );

        throw error;
    }
}

function renderBook() {
    const title =
        typeof book.title === "string" &&
            book.title.trim()
            ? book.title
            : "Untitled book";

    element("book-title").textContent =
        title;

    element("book-description").textContent =
        typeof book.description === "string" &&
            book.description.trim()
            ? book.description
            : "No description available.";

    const status =
        getStatus(book.status);

    element("book-status").className =
        `admin-status admin-status-${status.toLowerCase()}`;

    element("book-status").textContent =
        status;

    element("book-publication-date")
        .textContent =
        formatDate(
            getBookPublicationDate(book)
        );

    element("book-cover-path")
        .textContent =
        getBookCoverPath(book) || "—";

    document.title =
        `${title} | Administration`;
}

/* -------------------------------------------------------
   AUTHORS
------------------------------------------------------- */

async function loadBookAuthors() {
    try {
        const response =
            await api.get(
                `/books/${encodeURIComponent(String(bookId))}/authors`
            );

        authors = unwrapArray(
            response,
            "authors"
        );

        renderBookAuthors();

    } catch (error) {
        authors = [];
        renderBookAuthors();

        showToast(
            friendlyError(error),
            "error"
        );
    }
}

async function loadAuthorOptions() {
    try {
        const response =
            await api.get("/authors");

        const allAuthors =
            unwrapArray(response, "authors");

        const usedIds = new Set(
            authors
                .map(getAuthorId)
                .filter(Boolean)
                .map(String)
        );

        const select =
            element("author-select");

        select.replaceChildren();

        const placeholder =
            document.createElement("option");

        placeholder.value = "";
        placeholder.textContent =
            "Choose an author";

        select.appendChild(placeholder);

        allAuthors
            .filter((author) => {
                const status =
                    getStatus(
                        author.status,
                        "ACTIVE"
                    );

                return (
                    status !== "ARCHIVED" &&
                    !usedIds.has(
                        String(getAuthorId(author))
                    )
                );
            })
            .forEach((author) => {
                const option =
                    document.createElement("option");

                option.value =
                    String(getAuthorId(author));

                option.textContent =
                    author.name || "Unnamed author";

                select.appendChild(option);
            });

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

function renderBookAuthors() {
    const body =
        element("book-authors-table-body");

    const empty =
        element("book-authors-empty");

    if (!body || !empty) {
        return;
    }

    body.replaceChildren();

    if (!authors.length) {
        body.closest("table").parentElement.hidden = true;
        empty.hidden = false;
        return;
    }

    body.closest("table").parentElement.hidden = false;
    empty.hidden = true;

    authors.forEach((author) => {
        const row =
            document.createElement("tr");

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            author.name || "Unnamed author";

        const biographyCell =
            document.createElement("td");

        biographyCell.textContent =
            author.biography || "—";

        const actionCell =
            document.createElement("td");

        actionCell.className =
            "admin-actions-cell";

        const actions =
            document.createElement("div");

        actions.className =
            "admin-action-group";

        actions.append(
            createButton(
                "Remove",
                "button button-danger button-small",
                () => removeAuthor(
                    getAuthorId(author)
                )
            )
        );

        actionCell.append(actions);

        row.append(
            nameCell,
            biographyCell,
            actionCell
        );

        body.append(row);
    });
}

async function addAuthor() {
    const authorId =
        element("author-select").value;

    if (!authorId) {
        showToast(
            "Please choose an author.",
            "error"
        );

        return;
    }

    const button =
        element("add-author-confirm");

    button.disabled = true;

    try {
        await api.post(
            `/books/${encodeURIComponent(String(bookId))}/authors`,
            {
                authorId: Number(authorId)
            }
        );

        showToast(
            "Author added successfully.",
            "success"
        );

        closeAddAuthorDialog();

        await loadBookAuthors();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        button.disabled = false;
    }
}

async function removeAuthor(authorId) {
    if (!authorId) {
        showToast(
            "Invalid author ID.",
            "error"
        );

        return;
    }

    if (!window.confirm(
        "Remove this author from the book?"
    )) {
        return;
    }

    try {
        await api.delete(
            `/books/${encodeURIComponent(String(bookId))}/authors/${encodeURIComponent(String(authorId))}`
        );

        showToast(
            "Author removed successfully.",
            "success"
        );

        await loadBookAuthors();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

/* -------------------------------------------------------
   CATEGORIES
------------------------------------------------------- */

async function loadBookCategories() {
    try {
        const response =
            await api.get(
                `/books/${encodeURIComponent(String(bookId))}/categories`
            );

        categories = unwrapArray(
            response,
            "categories"
        );

        renderBookCategories();

    } catch (error) {
        categories = [];
        renderBookCategories();

        showToast(
            friendlyError(error),
            "error"
        );
    }
}

async function loadCategoryOptions() {
    try {
        const response =
            await api.get("/categories");

        const allCategories =
            unwrapArray(
                response,
                "categories"
            );

        const usedIds = new Set(
            categories
                .map(getCategoryId)
                .filter(Boolean)
                .map(String)
        );

        const select =
            element("category-select");

        select.replaceChildren();

        const placeholder =
            document.createElement("option");

        placeholder.value = "";
        placeholder.textContent =
            "Choose a category";

        select.appendChild(placeholder);

        allCategories
            .filter((category) => {
                const status =
                    getStatus(
                        category.status,
                        "ACTIVE"
                    );

                return (
                    status !== "ARCHIVED" &&
                    !usedIds.has(
                        String(
                            getCategoryId(category)
                        )
                    )
                );
            })
            .forEach((category) => {
                const option =
                    document.createElement("option");

                option.value =
                    String(
                        getCategoryId(category)
                    );

                option.textContent =
                    category.name ||
                    "Unnamed category";

                select.appendChild(option);
            });

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

function renderBookCategories() {
    const body =
        element("book-categories-table-body");

    const empty =
        element("book-categories-empty");

    if (!body || !empty) {
        return;
    }

    body.replaceChildren();

    if (!categories.length) {
        body.closest("table").parentElement.hidden = true;
        empty.hidden = false;
        return;
    }

    body.closest("table").parentElement.hidden = false;
    empty.hidden = true;

    categories.forEach((category) => {
        const row =
            document.createElement("tr");

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            category.name || "Unnamed category";

        const descriptionCell =
            document.createElement("td");

        descriptionCell.textContent =
            category.description || "—";

        const actionCell =
            document.createElement("td");

        actionCell.className =
            "admin-actions-cell";

        const actions =
            document.createElement("div");

        actions.className =
            "admin-action-group";

        actions.append(
            createButton(
                "Remove",
                "button button-danger button-small",
                () => removeCategory(
                    getCategoryId(category)
                )
            )
        );

        actionCell.append(actions);

        row.append(
            nameCell,
            descriptionCell,
            actionCell
        );

        body.append(row);
    });
}

async function addCategory() {
    const categoryId =
        element("category-select").value;

    if (!categoryId) {
        showToast(
            "Please choose a category.",
            "error"
        );

        return;
    }

    const button =
        element("add-category-confirm");

    button.disabled = true;

    try {
        await api.post(
            `/books/${encodeURIComponent(String(bookId))}/categories`,
            {
                categoryId: Number(categoryId)
            }
        );

        showToast(
            "Category added successfully.",
            "success"
        );

        closeAddCategoryDialog();

        await loadBookCategories();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        button.disabled = false;
    }
}

async function removeCategory(categoryId) {
    if (!categoryId) {
        showToast(
            "Invalid category ID.",
            "error"
        );

        return;
    }

    if (!window.confirm(
        "Remove this category from the book?"
    )) {
        return;
    }

    try {
        await api.delete(
            `/books/${encodeURIComponent(String(bookId))}/categories/${encodeURIComponent(String(categoryId))}`
        );

        showToast(
            "Category removed successfully.",
            "success"
        );

        await loadBookCategories();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

/* -------------------------------------------------------
   CHAPTERS
------------------------------------------------------- */

async function loadBookChapters() {
    try {
        const response =
            await api.get(
                `/books/${encodeURIComponent(String(bookId))}/chapters`
            );

        chapters = unwrapArray(
            response,
            "chapters"
        );

        chapters.sort(
            (a, b) =>
                getChapterNumber(a) -
                getChapterNumber(b)
        );

        orderDirty = false;

        renderChapters();

    } catch (error) {
        chapters = [];
        renderChapters();

        showToast(
            friendlyError(error),
            "error"
        );
    }
}

function renderChapters() {
    const body =
        element("chapters-table-body");

    const empty =
        element("chapters-empty");

    if (!body || !empty) {
        return;
    }

    body.replaceChildren();

    if (!chapters.length) {
        body.closest("table").parentElement.hidden = true;
        empty.hidden = false;

        return;
    }

    body.closest("table").parentElement.hidden = false;
    empty.hidden = true;

    chapters.forEach((chapter, index) => {
        const row =
            document.createElement("tr");

        const orderCell =
            document.createElement("td");

        orderCell.textContent =
            String(index + 1);

        const titleCell =
            document.createElement("td");

        titleCell.textContent =
            chapter.title || "Untitled chapter";

        const status =
            getStatus(
                chapter.status,
                "DRAFT"
            );

        const statusCell =
            document.createElement("td");

        statusCell.append(
            createStatusBadge(status)
        );

        const actionCell =
            document.createElement("td");

        actionCell.className =
            "admin-actions-cell";

        const actions =
            document.createElement("div");

        actions.className =
            "admin-action-group";

        actions.append(
            createButton(
                "Edit",
                "button button-secondary button-small",
                () => openEditChapter(chapter)
            )
        );

        if (status === "DRAFT") {
            actions.append(
                createButton(
                    "Publish",
                    "button button-success button-small",
                    () => publishChapter(
                        getChapterId(chapter)
                    )
                )
            );
        }

        if (status === "PUBLISHED") {
            actions.append(
                createButton(
                    "Archive",
                    "button button-warning button-small",
                    () => archiveChapter(
                        getChapterId(chapter)
                    )
                )
            );
        }

        actions.append(
            createButton(
                "↑",
                "button button-secondary button-small admin-icon-button",
                () => moveChapter(index, -1),
                index === 0
            ),
            createButton(
                "↓",
                "button button-secondary button-small admin-icon-button",
                () => moveChapter(index, 1),
                index === chapters.length - 1
            )
        );

        actionCell.append(actions);

        row.append(
            orderCell,
            titleCell,
            statusCell,
            actionCell
        );

        body.append(row);
    });
}

function moveChapter(index, direction) {
    const newIndex =
        index + direction;

    if (
        newIndex < 0 ||
        newIndex >= chapters.length
    ) {
        return;
    }

    const [chapter] =
        chapters.splice(index, 1);

    chapters.splice(
        newIndex,
        0,
        chapter
    );

    chapters.forEach(
        (item, position) => {
            item.chapter_number =
                position + 1;
        }
    );

    orderDirty = true;
    renderChapters();
}

async function saveChapterOrder() {
    if (!chapters.length) {
        showToast(
            "There are no chapters to reorder.",
            "info"
        );

        return;
    }

    const order =
        chapters.map(
            (chapter, index) => ({
                chapterId:
                    Number(getChapterId(chapter)),
                chapterNumber:
                    index + 1
            })
        );

    const button =
        element("save-chapter-order");

    button.disabled = true;

    try {
        await api.patch(
            `/books/${encodeURIComponent(String(bookId))}/chapters/reorder`,
            {
                order
            }
        );

        orderDirty = false;

        showToast(
            "Chapter order saved successfully.",
            "success"
        );

        await loadBookChapters();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        button.disabled = false;
    }
}

function openCreateChapter() {
    editingChapterId = null;

    element("chapter-dialog-title").textContent =
        "Create chapter";

    element("chapter-id").value = "";

    element("chapter-form").reset();

    const highestNumber =
        chapters.reduce(
            (max, chapter) =>
                Math.max(
                    max,
                    getChapterNumber(chapter)
                ),
            0
        );

    element("chapter-number").value =
        String(highestNumber + 1);

    element("chapter-dialog").showModal();

    element("chapter-title").focus();
}

function openEditChapter(chapter) {
    editingChapterId =
        getChapterId(chapter);

    element("chapter-dialog-title").textContent =
        "Edit chapter";

    element("chapter-id").value =
        String(editingChapterId ?? "");

    element("chapter-title").value =
        chapter.title || "";

    element("chapter-content").value =
        chapter.content || "";

    element("chapter-number").value =
        String(
            getChapterNumber(chapter) || 1
        );

    element("chapter-dialog").showModal();

    element("chapter-title").focus();
}

function closeChapterDialog() {
    const dialog =
        element("chapter-dialog");

    if (dialog.open) {
        dialog.close();
    }

    editingChapterId = null;

    element("chapter-form").reset();
}

async function saveChapter(event) {
    event.preventDefault();

    const title =
        element("chapter-title").value.trim();

    const content =
        element("chapter-content").value.trim();

    const chapterNumber =
        Number(
            element("chapter-number").value
        );

    if (!title) {
        showToast(
            "Chapter title is required.",
            "error"
        );

        element("chapter-title").focus();
        return;
    }

    if (
        !Number.isInteger(chapterNumber) ||
        chapterNumber < 1
    ) {
        showToast(
            "Chapter number must be a positive integer.",
            "error"
        );

        element("chapter-number").focus();
        return;
    }

    if (!content) {
        showToast(
            "Chapter content is required.",
            "error"
        );

        element("chapter-content").focus();
        return;
    }

    const payload = {
        chapterNumber,
        title,
        content
    };

    const button =
        element("chapter-form")
            .querySelector(
                'button[type="submit"]'
            );

    button.disabled = true;

    try {
        if (editingChapterId) {
            await api.put(
                `/chapters/${encodeURIComponent(String(editingChapterId))}`,
                payload
            );

            showToast(
                "Chapter updated successfully.",
                "success"
            );
        } else {
            await api.post(
                `/books/${encodeURIComponent(String(bookId))}/chapters`,
                payload
            );

            showToast(
                "Chapter created successfully.",
                "success"
            );
        }

        closeChapterDialog();

        await loadBookChapters();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    } finally {
        button.disabled = false;
    }
}

async function publishChapter(chapterId) {
    if (!chapterId) {
        showToast(
            "Invalid chapter ID.",
            "error"
        );

        return;
    }

    try {
        await api.patch(
            `/chapters/${encodeURIComponent(String(chapterId))}/publish`
        );

        showToast(
            "Chapter published successfully.",
            "success"
        );

        await loadBookChapters();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

async function archiveChapter(chapterId) {
    if (!chapterId) {
        showToast(
            "Invalid chapter ID.",
            "error"
        );

        return;
    }

    if (!window.confirm(
        "Archive this chapter?"
    )) {
        return;
    }

    try {
        await api.patch(
            `/chapters/${encodeURIComponent(String(chapterId))}/archive`
        );

        showToast(
            "Chapter archived successfully.",
            "success"
        );

        await loadBookChapters();

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}

/* -------------------------------------------------------
   DIALOGS
------------------------------------------------------- */

function openAddAuthorDialog() {
    loadAuthorOptions();

    element("author-select").value = "";

    element("add-author-dialog").showModal();

    element("author-select").focus();
}

function closeAddAuthorDialog() {
    const dialog =
        element("add-author-dialog");

    if (dialog.open) {
        dialog.close();
    }

    element("add-author-form").reset();
}

function openAddCategoryDialog() {
    loadCategoryOptions();

    element("category-select").value = "";

    element("add-category-dialog").showModal();

    element("category-select").focus();
}

function closeAddCategoryDialog() {
    const dialog =
        element("add-category-dialog");

    if (dialog.open) {
        dialog.close();
    }

    element("add-category-form").reset();
}

function bindDialogs() {
    element("add-author-button")
        .addEventListener(
            "click",
            openAddAuthorDialog
        );

    element("add-author-empty-button")
        .addEventListener(
            "click",
            openAddAuthorDialog
        );

    element("add-author-form")
        .addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();
                await addAuthor();
            }
        );

    element("add-author-cancel")
        .addEventListener(
            "click",
            closeAddAuthorDialog
        );

    element("add-author-close")
        .addEventListener(
            "click",
            closeAddAuthorDialog
        );

    element("add-author-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeAddAuthorDialog();
            }
        );

    element("add-category-button")
        .addEventListener(
            "click",
            openAddCategoryDialog
        );

    element("add-category-empty-button")
        .addEventListener(
            "click",
            openAddCategoryDialog
        );

    element("add-category-form")
        .addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();
                await addCategory();
            }
        );

    element("add-category-cancel")
        .addEventListener(
            "click",
            closeAddCategoryDialog
        );

    element("add-category-close")
        .addEventListener(
            "click",
            closeAddCategoryDialog
        );

    element("add-category-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeAddCategoryDialog();
            }
        );

    element("create-chapter-button")
        .addEventListener(
            "click",
            openCreateChapter
        );

    element("create-chapter-empty-button")
        .addEventListener(
            "click",
            openCreateChapter
        );

    element("chapter-form")
        .addEventListener(
            "submit",
            saveChapter
        );

    element("chapter-cancel")
        .addEventListener(
            "click",
            closeChapterDialog
        );

    element("chapter-dialog-close")
        .addEventListener(
            "click",
            closeChapterDialog
        );

    element("chapter-dialog")
        .addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();
                closeChapterDialog();
            }
        );

    element("save-chapter-order")
        .addEventListener(
            "click",
            saveChapterOrder
        );
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

export async function init() {
    if (!auth.isAuthenticated()) {
        window.location.assign("login.html");
        return;
    }

    if (!auth.isAdmin()) {
        window.location.assign("profile.html");
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const rawId =
        params.get("id");

    const numericId =
        Number(rawId);

    if (
        !rawId ||
        !Number.isSafeInteger(numericId) ||
        numericId < 1
    ) {
        showToast(
            "A valid book ID was not provided.",
            "error"
        );

        window.location.assign(
            "admin.html"
        );

        return;
    }

    bookId = numericId;

    bindTabs();
    bindDialogs();

    try {
        await Promise.all([
            loadBook(),
            loadBookAuthors(),
            loadBookCategories(),
            loadBookChapters()
        ]);

        await Promise.all([
            loadAuthorOptions(),
            loadCategoryOptions()
        ]);

    } catch (error) {
        showToast(
            friendlyError(error),
            "error"
        );
    }
}