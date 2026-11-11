import { api, ApiError } from "../api.js";
import { API_BASE_URL } from "../config.js";
import { auth } from "../auth.js";
import { initSettings, extractChapters } from "./read-settings.js?v=14.4.1";
import { initChapters } from "./read-chapters.js?v=14.4.1";
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

function buildAuthHeaders() {
    const token = api.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function imageUrl(bookId, fileName, isPrivate = false) {
    const base = isPrivate ? "private-library" : "books";
    return (
        `${API_BASE_URL}/${base}/${encodeURIComponent(String(bookId))}` +
        `/images/${encodeURIComponent(fileName)}`
    );
}

async function fetchImageBlob(url, signal) {
    const response = await fetch(url, { credentials: "include", headers: buildAuthHeaders(), signal });

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

function buildFigure(entry, pageNumber, bookId, fileName, observe, isPrivate = false) {
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
                imageUrl(bookId, fileName, isPrivate),
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

function renderPage(section, page, imagesForPage, bookId, observe, isPrivate = false) {
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
                observe,
                isPrivate
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

function renderDocument(bookId, processedDocument, { isPrivate = false, hasOriginalPdf = false, onSwitchToPdf = null } = {}) {
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

    notice.replaceChildren();
    if (!hasText) {
        const msg = document.createElement("p");
        msg.textContent = hasOriginalPdf
            ? "Reflowable (EPUB-style) text is unavailable because this PDF appears to contain scanned or image-only pages without a selectable text layer (OCR is not available)."
            : "Readable text is unavailable for this document. The pages below show any available scanned images.";
        notice.append(msg);
        if (hasOriginalPdf && typeof onSwitchToPdf === "function") {
            const switchRow = document.createElement("div");
            switchRow.className = "read-notice-action";
            const switchBtn = document.createElement("button");
            switchBtn.type = "button";
            switchBtn.className = "button button-primary button-small";
            switchBtn.textContent = "Open Original PDF mode";
            switchBtn.addEventListener("click", onSwitchToPdf);
            switchRow.append(switchBtn);
            notice.append(switchRow);
        }
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
                observe,
                isPrivate
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

async function fetchOriginalPdfBytes(id, isPrivate) {
    const base = isPrivate ? "private-library" : "books";
    const url = `${API_BASE_URL}/${base}/${encodeURIComponent(String(id))}/file`;
    const response = await fetch(url, { credentials: "include", headers: buildAuthHeaders() });
    if (!response.ok) {
        throw new Error(`Could not load original PDF (${response.status}).`);
    }
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/pdf")) {
        throw new Error("The requested file is not a valid PDF document.");
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

let pdfjsBundlePromise = null;
async function loadPdfjsBundle() {
    if (!pdfjsBundlePromise) {
        pdfjsBundlePromise = (async () => {
            const pdfjsLib = await import("../../vendor/pdfjs/build/pdf.min.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                "../../vendor/pdfjs/build/pdf.worker.min.mjs",
                import.meta.url
            ).href;
            globalThis.pdfjsLib = pdfjsLib;
            const pdfjsViewer = await import("../../vendor/pdfjs/web/pdf_viewer.mjs");
            return { pdfjsLib, pdfjsViewer };
        })();
    }
    return pdfjsBundlePromise;
}

function setEpubChromeHidden(isHidden) {
    const epubIds = [
        "read-content",
        "read-notice",
        "read-storage-notice",
        "read-topbar",
        "read-settings-panel",
        "read-chapters-panel",
        "read-focus-exit",
    ];
    for (const elId of epubIds) {
        const node = element(elId);
        if (node && isHidden) {
            node.hidden = true;
        }
    }
    const actionsBar = document.querySelector(".read-actions");
    if (actionsBar) {
        actionsBar.hidden = isHidden;
    }
    const progressWrap = document.querySelector(".read-progress");
    if (progressWrap) {
        progressWrap.hidden = isHidden;
    }
}

async function initReader() {
    const params = new URLSearchParams(window.location.search);
    const rawPrivateId = params.get("privateId");
    const rawPublicId = params.get("id");
    const isPrivate = Boolean(rawPrivateId);
    const rawId = isPrivate ? rawPrivateId : rawPublicId;
    const id = Number(rawId);
    const modeParam = params.get("mode");
    const requestedMode = modeParam === "reflow" ? "reflow" : modeParam === "pdf" ? "pdf" : "auto";

    if (!rawId || !Number.isSafeInteger(id) || id < 1) {
        showError("A valid book ID was not provided.");
        return;
    }

    if (!auth.isAuthenticated()) {
        showError("Please log in to read books in the library.");
        return;
    }

    element("read-back").href = isPrivate
        ? "private-library.html"
        : `book.html?id=${encodeURIComponent(String(id))}`;

    let bookTitle = "Untitled book";
    let bookMeta = null;
    const apiPrefix = isPrivate ? "private-library" : "books";

    try {
        const metaResponse = await api.get(`/${apiPrefix}/${encodeURIComponent(String(id))}`);
        bookMeta = isPrivate ? metaResponse?.data?.privateFile : metaResponse?.data?.book;
        if (bookMeta && typeof bookMeta.title === "string" && bookMeta.title.trim()) {
            bookTitle = bookMeta.title;
        }
    } catch (metaError) {
        if (metaError instanceof ApiError && (metaError.status === 401 || metaError.status === 403 || metaError.status === 404)) {
            showError(friendlyError(metaError));
            return;
        }
    }

    let processedDocument = null;
    let documentError = null;
    try {
        const documentResponse = await api.get(
            `/${apiPrefix}/${encodeURIComponent(String(id))}/document`
        );
        processedDocument = documentResponse?.data?.document || null;
    } catch (docErr) {
        documentError = docErr;
    }

    const rawFileName = String(bookMeta?.pdf_original_name || bookMeta?.original_file_name || "").toLowerCase();
    const fileFormat = String(
        processedDocument?.fileFormat ||
        bookMeta?.file_format ||
        (rawFileName.endsWith(".epub") ? "EPUB" : (rawFileName.endsWith(".pdf") ? "PDF" : ""))
    ).toUpperCase();

    const hasOriginalPdf =
        fileFormat === "PDF" &&
        Boolean(processedDocument?.hasOriginalFile || bookMeta?.pdf_original_name || bookMeta?.original_file_name || bookMeta?.has_original_file || isPrivate);

    const hasReadablePages = Boolean(
        processedDocument &&
        Array.isArray(processedDocument.pages) &&
        processedDocument.pages.length > 0 &&
        (
            fileFormat === "EPUB" ||
            processedDocument.source === "chapters" ||
            processedDocument.hasText === true ||
            (Number(processedDocument.textChars) || 0) > 0
        )
    );

    if (!hasOriginalPdf && !processedDocument) {
        if (documentError instanceof ApiError) {
            showError(friendlyError(documentError));
        } else {
            showError("The reading content did not load correctly. Please try again.");
        }
        return;
    }

    window.document.title = `${bookTitle} | Digital Library`;
    element("read-title").textContent = bookTitle;
    element("read-loading").hidden = true;
    element("read-article").hidden = false;

    let pdfDocument = null;
    let pdfLoadingTask = null;
    let pdfViewerInstance = null;
    let pdfLinkService = null;
    let pdfLoaded = false;
    let activeMode = "reflow";
    let reflowInitialized = false;
    let savedThemeAttr = null;
    let currentPdfPage = 1;
    let currentPdfZoom = 100;
    let totalPdfPages = Number(processedDocument?.pageCount) > 0 ? Number(processedDocument.pageCount) : null;

    const modeSwitch = element("read-mode-switch");
    const btnReflow = element("read-mode-reflow");
    const btnPdf = element("read-mode-pdf");
    const contentEl = element("read-content");
    const pdfViewerEl = element("read-pdf-viewer");
    const pdfStageEl = element("read-pdf-stage");
    const pdfPagesEl = element("read-pdf-pages");
    const pdfFullscreenBtn = element("read-pdf-fullscreen");
    const pdfFullscreenLabel = pdfFullscreenBtn?.querySelector(".read-pdf-fullscreen-label") || null;
    const pdfEnterIcon = pdfFullscreenBtn?.querySelector(".icon-enter-fullscreen") || null;
    const pdfExitIcon = pdfFullscreenBtn?.querySelector(".icon-exit-fullscreen") || null;
    const pdfErrorEl = element("read-pdf-error");
    const pdfStatusEl = element("read-pdf-status");
    const pdfPrevBtn = element("read-pdf-prev");
    const pdfNextBtn = element("read-pdf-next");
    const pdfPageInput = element("read-pdf-page");
    const pdfPageTotal = element("read-pdf-page-total");
    const pdfZoomOutBtn = element("read-pdf-zoom-out");
    const pdfZoomInBtn = element("read-pdf-zoom-in");
    const pdfZoomResetBtn = element("read-pdf-zoom-reset");
    const pdfZoomValue = element("read-pdf-zoom-value");
    let isFallbackFullscreen = false;

    const syncPdfPageTotalUi = () => {
        if (pdfPageTotal && totalPdfPages) {
            pdfPageTotal.textContent = `/ ${totalPdfPages}`;
        }
        if (pdfPageInput && totalPdfPages) {
            pdfPageInput.max = String(totalPdfPages);
        }
    };
    syncPdfPageTotalUi();

    const syncPdfControls = () => {
        if (pdfPageInput) {
            pdfPageInput.value = String(currentPdfPage);
        }
        if (pdfPrevBtn) {
            pdfPrevBtn.disabled = currentPdfPage <= 1;
        }
        if (pdfNextBtn) {
            pdfNextBtn.disabled = Boolean(totalPdfPages && currentPdfPage >= totalPdfPages);
        }
        if (pdfZoomValue) {
            pdfZoomValue.textContent = `${currentPdfZoom}%`;
        }
        if (pdfZoomOutBtn) {
            pdfZoomOutBtn.disabled = currentPdfZoom <= 50;
        }
        if (pdfZoomInBtn) {
            pdfZoomInBtn.disabled = currentPdfZoom >= 200;
        }
    };

    const getFullscreenElement = () =>
        window.document.fullscreenElement ||
        window.document.webkitFullscreenElement ||
        null;

    const isPdfFullscreenActive = () =>
        Boolean(pdfViewerEl && (getFullscreenElement() === pdfViewerEl || isFallbackFullscreen));

    const refreshPdfLayoutPreservingState = (preservedPage = currentPdfPage, preservedZoom = currentPdfZoom) => {
        if (!pdfViewerInstance) {
            return;
        }
        window.requestAnimationFrame(() => {
            if (!pdfViewerInstance) return;
            pdfViewerInstance.currentScale = preservedZoom / 100;
            if (Number.isSafeInteger(preservedPage) && preservedPage >= 1 && preservedPage <= (totalPdfPages || preservedPage)) {
                if (pdfViewerInstance.currentPageNumber !== preservedPage) {
                    pdfViewerInstance.currentPageNumber = preservedPage;
                }
            }
            pdfViewerInstance.update();
            syncPdfControls();
        });
    };

    const syncPdfFullscreenUi = () => {
        const active = isPdfFullscreenActive();
        const preservedPage = currentPdfPage;
        const preservedZoom = currentPdfZoom;
        if (pdfViewerEl) {
            pdfViewerEl.classList.toggle("is-fullscreen", active);
            pdfViewerEl.classList.toggle("is-fallback-fullscreen", isFallbackFullscreen && active);
            pdfViewerEl.dataset.fullscreen = active ? "true" : "false";
        }
        if (isFallbackFullscreen && active) {
            document.body.dataset.pdfFallbackFullscreen = "true";
        } else {
            delete document.body.dataset.pdfFallbackFullscreen;
        }
        if (pdfFullscreenBtn) {
            const label = active ? "Exit Full Screen" : "Enter Full Screen";
            pdfFullscreenBtn.title = label;
            pdfFullscreenBtn.setAttribute("aria-label", label);
            pdfFullscreenBtn.setAttribute("aria-pressed", active ? "true" : "false");
        }
        if (pdfFullscreenLabel) {
            pdfFullscreenLabel.textContent = active ? "Exit Full Screen" : "Full Screen";
        }
        if (pdfEnterIcon) {
            pdfEnterIcon.hidden = active;
        }
        if (pdfExitIcon) {
            pdfExitIcon.hidden = !active;
        }
        refreshPdfLayoutPreservingState(preservedPage, preservedZoom);
    };

    const enterPdfFullscreen = async () => {
        if (!pdfViewerEl || activeMode !== "pdf") {
            return;
        }
        const preservedPage = currentPdfPage;
        const preservedZoom = currentPdfZoom;
        const requestFs = pdfViewerEl.requestFullscreen || pdfViewerEl.webkitRequestFullscreen;
        if (typeof requestFs === "function") {
            try {
                await requestFs.call(pdfViewerEl);
                isFallbackFullscreen = false;
                currentPdfPage = preservedPage;
                currentPdfZoom = preservedZoom;
                syncPdfFullscreenUi();
                return;
            } catch (_) {
                // Fall back to in-page full-viewport mode when browser Fullscreen API is blocked.
            }
        }
        isFallbackFullscreen = true;
        currentPdfPage = preservedPage;
        currentPdfZoom = preservedZoom;
        syncPdfFullscreenUi();
    };

    const exitPdfFullscreen = async () => {
        const preservedPage = currentPdfPage;
        const preservedZoom = currentPdfZoom;
        const fsElement = getFullscreenElement();
        if (fsElement && fsElement === pdfViewerEl) {
            const exitFs = window.document.exitFullscreen || window.document.webkitExitFullscreen;
            if (typeof exitFs === "function") {
                try {
                    await exitFs.call(window.document);
                } catch (_) {}
            }
        }
        isFallbackFullscreen = false;
        currentPdfPage = preservedPage;
        currentPdfZoom = preservedZoom;
        syncPdfFullscreenUi();
    };

    const applyPdfZoomToViewer = () => {
        if (pdfViewerInstance) {
            const preservedPage = currentPdfPage;
            pdfViewerInstance.currentScale = currentPdfZoom / 100;
            if (pdfViewerInstance.currentPageNumber !== preservedPage) {
                pdfViewerInstance.currentPageNumber = preservedPage;
            }
        }
    };

    const applyPdfPageToViewer = () => {
        if (pdfViewerInstance && pdfDocument) {
            const maxPage = pdfDocument.numPages || totalPdfPages || currentPdfPage;
            currentPdfPage = Math.min(Math.max(1, currentPdfPage), maxPage);
            pdfViewerInstance.currentPageNumber = currentPdfPage;
        }
    };

    const ensureReflowInitialized = () => {
        if (reflowInitialized || !processedDocument) return;
        reflowInitialized = true;

        renderDocument(id, processedDocument, {
            isPrivate,
            hasOriginalPdf,
            onSwitchToPdf: hasOriginalPdf ? () => applyReadingMode("pdf") : null,
        });

        const pageCount = Array.isArray(processedDocument.pages)
            ? processedDocument.pages.length
            : 0;
        const chapterData = extractChapters(processedDocument);
        const chapters = chapterData.entries;

        try {
            initSettings({
                content: contentEl,
                expectedPages: pageCount
            })
                .then(() => {
                    initChapters({
                        content: contentEl,
                        chapters,
                        pageCount
                    });
                    initTts({ content: contentEl });
                })
                .catch((error) => {
                    console.warn("Chapter drawer unavailable:", error);
                });
        } catch (error) {
            console.warn("Reader settings unavailable:", error);
        }
    };

    const applyReadingMode = async (nextMode) => {
        if (nextMode === "pdf" && !hasOriginalPdf) {
            nextMode = "reflow";
        }
        if (nextMode === "reflow" && hasOriginalPdf && !hasReadablePages) {
            nextMode = "pdf";
        }

        activeMode = nextMode;
        document.body.dataset.readerMode = activeMode;

        const isPdfMode = activeMode === "pdf";
        btnReflow?.classList.toggle("is-active", !isPdfMode);
        btnReflow?.setAttribute("aria-pressed", !isPdfMode ? "true" : "false");
        btnPdf?.classList.toggle("is-active", isPdfMode);
        btnPdf?.setAttribute("aria-pressed", isPdfMode ? "true" : "false");

        if (isPdfMode) {
            const actionsBar = document.querySelector(".read-actions");
            if (actionsBar?.dataset.audioMode === "playback") {
                element("read-audio-stop")?.click();
            }
            if (document.body.dataset.readTheme) {
                savedThemeAttr = document.body.dataset.readTheme;
                delete document.body.dataset.readTheme;
            }
            delete document.body.dataset.readFocus;
            setEpubChromeHidden(true);
            pdfViewerEl.hidden = false;
            syncPdfControls();
            syncPdfFullscreenUi();

            if (!pdfLoaded) {
                pdfErrorEl.hidden = true;
                pdfStatusEl.textContent = "Loading original PDF\u2026";
                try {
                    const [pdfBytes, { pdfjsLib, pdfjsViewer }] = await Promise.all([
                        fetchOriginalPdfBytes(id, isPrivate),
                        loadPdfjsBundle(),
                    ]);
                    const eventBus = new pdfjsViewer.EventBus();
                    pdfLinkService = new pdfjsViewer.PDFLinkService({ eventBus });
                    pdfViewerInstance = new pdfjsViewer.PDFViewer({
                        container: pdfStageEl,
                        viewer: pdfPagesEl,
                        eventBus,
                        linkService: pdfLinkService,
                    });
                    pdfLinkService.setViewer(pdfViewerInstance);

                    eventBus.on("pagesinit", () => {
                        if (!pdfViewerInstance) return;
                        pdfViewerInstance.currentScale = currentPdfZoom / 100;
                        applyPdfPageToViewer();
                        syncPdfControls();
                    });

                    eventBus.on("pagechanging", (evt) => {
                        if (Number.isSafeInteger(evt?.pageNumber) && evt.pageNumber >= 1) {
                            currentPdfPage = evt.pageNumber;
                            syncPdfControls();
                        }
                    });

                    const vendorBase = new URL("../../vendor/pdfjs/", import.meta.url).href;
                    pdfLoadingTask = pdfjsLib.getDocument({
                        data: pdfBytes,
                        cMapUrl: `${vendorBase}cmaps/`,
                        cMapPacked: true,
                        standardFontDataUrl: `${vendorBase}standard_fonts/`,
                        iccUrl: `${vendorBase}iccs/`,
                        wasmUrl: `${vendorBase}wasm/`,
                        useWorkerFetch: false,
                        isEvalSupported: false,
                    });
                    pdfDocument = await pdfLoadingTask.promise;
                    totalPdfPages = pdfDocument.numPages;
                    syncPdfPageTotalUi();
                    pdfViewerInstance.setDocument(pdfDocument);
                    pdfLinkService.setDocument(pdfDocument, null);
                    pdfLoaded = true;
                    pdfStatusEl.textContent = "Original PDF";
                    syncPdfControls();
                } catch (pdfErr) {
                    pdfStatusEl.textContent = "Original PDF unavailable";
                    pdfErrorEl.textContent = pdfErr?.message || "Could not load original PDF.";
                    pdfErrorEl.hidden = false;
                }
            }
        } else {
            if (isPdfFullscreenActive()) {
                await exitPdfFullscreen();
            }
            pdfViewerEl.hidden = true;
            if (savedThemeAttr && !document.body.dataset.readTheme) {
                document.body.dataset.readTheme = savedThemeAttr;
            }
            setEpubChromeHidden(false);
            contentEl.hidden = false;
            element("read-topbar").hidden = false;
            ensureReflowInitialized();
        }

        try {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("mode", activeMode);
            window.history.replaceState(null, "", nextUrl.href);
        } catch (_) {}
    };

    pdfPrevBtn?.addEventListener("click", () => {
        if (currentPdfPage > 1) {
            currentPdfPage -= 1;
            applyPdfPageToViewer();
            syncPdfControls();
        }
    });

    pdfNextBtn?.addEventListener("click", () => {
        if (!totalPdfPages || currentPdfPage < totalPdfPages) {
            currentPdfPage += 1;
            applyPdfPageToViewer();
            syncPdfControls();
        }
    });

    pdfPageInput?.addEventListener("change", () => {
        let target = Number.parseInt(pdfPageInput.value, 10);
        if (!Number.isFinite(target) || target < 1) target = 1;
        if (totalPdfPages && target > totalPdfPages) target = totalPdfPages;
        currentPdfPage = target;
        applyPdfPageToViewer();
        syncPdfControls();
    });

    pdfZoomOutBtn?.addEventListener("click", () => {
        currentPdfZoom = Math.max(50, currentPdfZoom - 25);
        applyPdfZoomToViewer();
        syncPdfControls();
    });

    pdfZoomInBtn?.addEventListener("click", () => {
        currentPdfZoom = Math.min(200, currentPdfZoom + 25);
        applyPdfZoomToViewer();
        syncPdfControls();
    });

    pdfZoomResetBtn?.addEventListener("click", () => {
        currentPdfZoom = 100;
        applyPdfZoomToViewer();
        syncPdfControls();
    });

    window.addEventListener("resize", () => {
        if (activeMode === "pdf" && pdfViewerInstance) {
            pdfViewerInstance.update();
        }
    });

    pdfFullscreenBtn?.addEventListener("click", () => {
        if (isPdfFullscreenActive()) {
            exitPdfFullscreen();
        } else {
            enterPdfFullscreen();
        }
    });

    window.document.addEventListener("fullscreenchange", () => {
        if (!getFullscreenElement()) {
            isFallbackFullscreen = false;
        }
        syncPdfFullscreenUi();
    });

    window.document.addEventListener("webkitfullscreenchange", () => {
        if (!getFullscreenElement()) {
            isFallbackFullscreen = false;
        }
        syncPdfFullscreenUi();
    });

    window.document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isFallbackFullscreen) {
            exitPdfFullscreen();
        }
    });

    if (hasOriginalPdf && hasReadablePages && modeSwitch && btnReflow && btnPdf) {
        modeSwitch.hidden = false;
        btnReflow.hidden = false;
        btnPdf.hidden = false;
        btnReflow.addEventListener("click", () => applyReadingMode("reflow"));
        btnPdf.addEventListener("click", () => applyReadingMode("pdf"));
    } else if (modeSwitch) {
        modeSwitch.hidden = true;
    }

    window.addEventListener("pagehide", () => {
        if (pdfLoadingTask) {
            try { pdfLoadingTask.destroy(); } catch (_) {}
            pdfLoadingTask = null;
        }
        if (pdfDocument) {
            try { pdfDocument.destroy(); } catch (_) {}
            pdfDocument = null;
        }
    });

    const shouldOpenPdf = hasOriginalPdf && (requestedMode !== "reflow" || !hasReadablePages);
    if (shouldOpenPdf) {
        await applyReadingMode("pdf");
    } else {
        await applyReadingMode("reflow");
    }
}

export async function init() {
    await initReader();
}
