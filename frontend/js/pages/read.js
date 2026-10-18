import { api, ApiError } from "../api.js";
import { API_BASE_URL } from "../config.js";
import { auth } from "../auth.js";
import { initSettings, extractChapters } from "./read-settings.js?v=14.4.1";
import { initChapters } from "./read-chapters.js?v=13.8.9";
import { initTts } from "./read-tts.js?v=14.4.1";

// Module 13.5 — continuous HTML reader (QuickNovel-inspired basics only).
//
// Data sources (existing APIs, unchanged):
//   GET /books/:id          -> book metadata (title)
//   GET /books/:id/document -> processed document (pages, images, imageStatus)
//
// Images load through GET /books/:id/images/:imageName as authenticated
// blob fetches (the frontend and backend are cross-origin, so plain <img>
// tags would not carry the auth cookie). Object URLs keep filesystem paths
// out of the DOM entirely. All PDF text is inserted via textContent.

const IMAGE_NAME_PATTERN = /^p\d+-\d+\.png$/;
const IMAGE_TIMEOUT_MS = 30000;

function element(id) {
    return document.getElementById(id);
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "The book could not be loaded. Check your connection and try again.";
    }

    if (error.status === 401) {
        return "Please log in to read books in the library.";
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

function showError(message) {
    element("read-loading").hidden = true;
    element("read-article").hidden = true;
    element("read-error").textContent = message;
    element("read-error").hidden = false;
}

function imageFileName(entry) {
    if (!entry || typeof entry.file !== "string") {
        return null;
    }

    const base = entry.file.split("/").pop() || "";

    return IMAGE_NAME_PATTERN.test(base) ? base : null;
}

function imageUrl(bookId, fileName) {
    return (
        `${API_BASE_URL}/books/${encodeURIComponent(String(bookId))}` +
        `/images/${encodeURIComponent(fileName)}`
    );
}

async function fetchImageBlob(url, signal) {
    const response = await fetch(url, { credentials: "include", signal });

    if (!response.ok) {
        throw new Error(`Image request failed (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("image/png")) {
        throw new Error("Unexpected image content type.");
    }

    // Body download happens here, so the abort signal also cancels a stalled body.
    return response.blob();
}

function buildFigure(entry, pageNumber, bookId, fileName, observe) {
    const figure = document.createElement("figure");
    figure.className = "read-figure";

    const placeholder = document.createElement("div");
    placeholder.className = "read-figure-loading";
    placeholder.textContent = "Loading image…";
    figure.append(placeholder);

    const img = document.createElement("img");
    img.className = "read-image";
    img.alt = `Scanned image from page ${pageNumber}`;
    img.hidden = true;

    const caption = document.createElement("figcaption");
    caption.className = "read-figure-caption muted";
    caption.textContent = `Page ${pageNumber} · Image`;
    figure.append(img, caption);

    const fail = () => {
        if (figure.dataset.settled) {
            return;
        }

        figure.dataset.settled = "failed";
        placeholder.textContent = "Image unavailable.";
        placeholder.classList.add("read-figure-missing");
        img.remove();
    };

    let objectUrl = null;

    const revokeObjectUrl = () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
    };

    const load = async () => {
        if (figure.dataset.settled) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

        try {
            const blob = await fetchImageBlob(
                imageUrl(bookId, fileName),
                controller.signal
            );

            // A late response cannot restore an image that already failed.
            if (figure.dataset.settled) {
                return;
            }

            objectUrl = URL.createObjectURL(blob);

            // Listeners are attached before src is set, so neither event can be missed.
            img.addEventListener(
                "error",
                () => {
                    revokeObjectUrl();
                    fail();
                },
                { once: true }
            );

            img.addEventListener(
                "load",
                () => {
                    // Decoded from the blob, so the URL is no longer needed.
                    revokeObjectUrl();

                    if (figure.dataset.settled) {
                        return;
                    }

                    figure.dataset.settled = "loaded";
                    placeholder.remove();
                    img.hidden = false;
                },
                { once: true }
            );

            img.src = objectUrl;
        } catch {
            // Covers abort/timeout, network errors, non-OK status, bad content type,
            // and body-download failures.
            revokeObjectUrl();
            fail();
        } finally {
            clearTimeout(timer);
        }
    };

    // Lazy-fetch when the figure nears the viewport so large documents do
    // not download every image up front. Falls back to eager loading where
    // IntersectionObserver is unavailable.
    if (observe && typeof IntersectionObserver === "function") {
        observe(figure, load);
    } else {
        load();
    }

    return figure;
}

function appendBlock(section, block) {
    const kind = block && typeof block.kind === "string" ? block.kind : "paragraph";
    const text = block && typeof block.text === "string" ? block.text : "";

    if (!text.trim()) {
        return null;
    }

    // 'pagenum' blocks are layout furniture (the reader labels every page
    // itself) and are never rendered.
    if (kind === "pagenum") {
        return null;
    }

    if (kind === "heading") {
        const heading = document.createElement("h2");
        heading.className = "read-h2";
        heading.textContent = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        section.append(heading);
        return heading;
    }

    if (kind === "subheading") {
        const heading = document.createElement("h3");
        heading.className = "read-h3";
        heading.textContent = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        section.append(heading);
        return heading;
    }

    if (kind === "caption") {
        const caption = document.createElement("p");
        caption.className = "read-caption muted";
        caption.textContent = text;
        section.append(caption);
        return caption;
    }

    if (kind === "toc-entry") {
        const entry = document.createElement("p");
        entry.className = "read-toc";
        entry.textContent = text;
        section.append(entry);
        return entry;
    }

    // 'list-item' and 'paragraph' both render through this path; consecutive
    // list items are grouped into a <ul> by the caller.
    const paragraph = document.createElement(kind === "list-item" ? "li" : "p");
    paragraph.className = kind === "list-item" ? "read-list-item" : "read-paragraph";
    paragraph.textContent = text;
    section.append(paragraph);
    return paragraph;
}

function renderPage(section, page, imagesForPage, bookId, observe) {
    const pageNumber = Number(page.pageNumber);

    const head = document.createElement("div");
    head.className = "read-page-head";
    head.setAttribute("aria-hidden", "true");

    const badge = document.createElement("span");
    badge.className = "read-page-badge";
    badge.textContent = Number.isSafeInteger(pageNumber)
        ? `Page ${pageNumber}`
        : "Page";
    head.append(badge);
    section.append(head);

    // Prefer classified blocks (new extraction); fall back to plain
    // paragraphs for documents extracted before block metadata existed.
    const blocks = Array.isArray(page.blocks) && page.blocks.length > 0
        ? page.blocks
        : (Array.isArray(page.paragraphs) ? page.paragraphs : [])
            .filter((text) => typeof text === "string" && text.trim())
            .map((text) => ({ kind: "paragraph", text }));

    let openList = null;

    for (const block of blocks) {
        const kind = block && typeof block.kind === "string" ? block.kind : "paragraph";

        if (kind === "list-item") {
            if (!openList) {
                openList = document.createElement("ul");
                openList.className = "read-list";
                section.append(openList);
            }

            const item = appendBlock(section, block);

            if (item) {
                openList.append(item);
            }

            continue;
        }

        openList = null;
        appendBlock(section, block);
    }

    for (const item of imagesForPage) {
        section.append(
            buildFigure(
                item.entry,
                Number.isSafeInteger(pageNumber) ? pageNumber : "?",
                bookId,
                item.fileName,
                observe
            )
        );
    }
}

function groupImagesByPage(images) {
    // Map<pageNumber, Array<{ entry, fileName }>>
    const grouped = new Map();

    if (!Array.isArray(images)) {
        return grouped;
    }

    for (const entry of images) {
        const fileName = imageFileName(entry);

        if (!fileName) {
            continue;
        }

        const pages = Array.isArray(entry.pages) ? entry.pages : [];

        for (const raw of pages) {
            const pageNumber = Number(raw);

            if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) {
                continue;
            }

            if (!grouped.has(pageNumber)) {
                grouped.set(pageNumber, []);
            }

            grouped.get(pageNumber).push({ entry, fileName });
        }
    }

    return grouped;
}

function renderDocument(bookId, processedDocument) {
    const content = element("read-content");
    content.replaceChildren();

    const pages = Array.isArray(processedDocument.pages) ? processedDocument.pages : [];
    const imagesByPage = groupImagesByPage(processedDocument.images);

    const totalTextChars = Number(processedDocument.textChars) || 0;
    const hasText = pages.some(
        (page) =>
            page &&
            ((typeof page.text === "string" && page.text.trim()) ||
                (Array.isArray(page.paragraphs) &&
                    page.paragraphs.some(
                        (paragraph) =>
                            typeof paragraph === "string" && paragraph.trim()
                    )))
    );

    const notice = element("read-notice");

    if (!hasText) {
        notice.textContent =
            "Readable text is unavailable for this document. " +
            "The pages below show any available scanned images.";
        notice.hidden = false;
    } else {
        notice.hidden = true;
    }

    const meta = element("read-meta");
    const imageCount = Array.isArray(processedDocument.images)
        ? processedDocument.images.length
        : 0;

    meta.textContent = `${pages.length} page${pages.length === 1 ? "" : "s"}` +
        ` · ${totalTextChars.toLocaleString()} characters` +
        (imageCount > 0
            ? ` · ${imageCount} image${imageCount === 1 ? "" : "s"}`
            : "");
    meta.hidden = false;

    if (pages.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "This document has no pages to display.";
        content.append(empty);
        return;
    }

    // One shared observer for every figure on the page.
    let observer = null;
    const observe = (target, load) => {
        if (!observer && typeof IntersectionObserver === "function") {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const record of entries) {
                        if (record.isIntersecting) {
                            observer.unobserve(record.target);
                            record.target._readLoadImage?.();
                        }
                    }
                },
                { rootMargin: "600px 0px" }
            );
        }

        if (observer) {
            target._readLoadImage = load;
            observer.observe(target);
        } else {
            load();
        }
    };

    const fragment = document.createDocumentFragment();

    const render = (start) => {
        const end = Math.min(start + 100, pages.length);

        for (let index = start; index < end; index++) {
            const page = pages[index];

            if (!page || typeof page !== "object") {
                continue;
            }

            const pageNumber = Number(page.pageNumber);
            const section = document.createElement("section");
            section.className = "read-page";

            if (Number.isSafeInteger(pageNumber)) {
                section.setAttribute("aria-label", `Page ${pageNumber}`);
            }

            renderPage(
                section,
                page,
                imagesByPage.get(pageNumber) || [],
                bookId,
                observe
            );
            fragment.append(section);
        }

        content.append(fragment);

        if (end < pages.length) {
            // Yield so the loading indicator stays alive on huge documents.
            setTimeout(() => render(end), 0);
        }
    };

    render(0);
}

async function initReader() {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("id");
    const id = Number(rawId);

    if (!rawId || !Number.isSafeInteger(id) || id < 1) {
        showError("A valid book ID was not provided.");
        return;
    }

    if (!auth.isAuthenticated()) {
        showError("Please log in to read books in the library.");
        return;
    }

    element("read-back").href = `book.html?id=${encodeURIComponent(String(id))}`;

    let bookTitle = "Untitled book";

    try {
        const bookResponse = await api.get(`/books/${encodeURIComponent(String(id))}`);
        const book = bookResponse?.data?.book;

        if (
            book &&
            typeof book.title === "string" &&
            book.title.trim()
        ) {
            bookTitle = book.title;
        }
    } catch {
        // A missing title must not block reading: the document itself is
        // authoritative for content. Errors surface via the document fetch.
    }

    try {
        const documentResponse = await api.get(
            `/books/${encodeURIComponent(String(id))}/document`
        );
        const processedDocument = documentResponse?.data?.document;

        if (!processedDocument || typeof processedDocument !== "object") {
            throw new Error("The reading content did not load correctly.");
        }

        window.document.title = `${bookTitle} | Digital Library`;
        element("read-title").textContent = bookTitle;

        element("read-loading").hidden = true;
        element("read-article").hidden = false;

        renderDocument(id, processedDocument);

        // Module 13.6 — reader settings. Isolated so a settings failure can
        // never hide the document that is already rendered.
        const pageCount = Array.isArray(processedDocument.pages)
            ? processedDocument.pages.length
            : 0;

        // Extract chapter data for the chapter drawer
        const chapterData = extractChapters(processedDocument);
        const chapters = chapterData.entries;

        try {
            // The chapter drawer is built from rendered page sections, so it
            // waits for the settings render gate. initSettings resolves rather
            // than rejects on every path, so this chain always runs.
            initSettings({
                content: element("read-content"),
                expectedPages: pageCount
            })
                .then(() => {
                    initChapters({
                        content: element("read-content"),
                        chapters,
                        pageCount
                    });
                    initTts({ content: element("read-content") });
                })
                .catch((error) => {
                    console.warn("Chapter drawer unavailable:", error);
                });
        } catch (error) {
            console.warn("Reader settings unavailable:", error);
        }
    } catch (error) {
        if (error instanceof ApiError) {
            showError(friendlyError(error));
        } else {
            showError(
                "The reading content did not load correctly. Please try again."
            );
        }
    }
}

export async function init() {
    await initReader();
}
