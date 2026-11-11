import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";
import { loadCoverIntoElements } from "../coverLoader.js";
import { ui } from "../ui.js";

const FORMAT_CONFIG = {
    PDF: {
        label: "PDF",
        extension: ".pdf",
        accept: ".pdf,application/pdf",
        mimeTypes: ["application/pdf", "application/x-pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        infoText: "Supported upload format: PDF only (.pdf). Max file size: 10 MB. Supports both Original PDF view and PDF-derived EPUB-style reflowable reading.",
        inputLabel: "PDF file",
        submitText: "Upload PDF",
    }
};

const currentFormat = "PDF";

function element(id) {
    return document.getElementById(id);
}

function showMessage(node, message, type = "") {
    if (!node) {
        return;
    }
    node.textContent = message;
    node.hidden = !message;

    node.classList.toggle("error-message", type === "error");
    node.classList.toggle("success-message", type === "success");
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "Your private library could not be loaded. Check your connection and try again.";
    }

    if (
        error.status === 400 &&
        typeof error.message === "string" &&
        error.message.trim() &&
        error.message !== "Request failed (400)."
    ) {
        return error.message;
    }

    if (error.status === 401) {
        return "Please log in to access your private library.";
    }

    if (error.status === 404) {
        return "The requested book could not be found.";
    }

    if (error.status === 429) {
        return "Too many requests. Wait a moment, then try again.";
    }

    if (error.status >= 500) {
        return "The private library server is temporarily unavailable. Please try again later.";
    }

    return error.message || "The private library request could not be completed.";
}

function formatSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) {
        return "Size unavailable";
    }

    if (size < 1024) {
        return `${size} bytes`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
    if (!value) {
        return "Upload date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString();
}

async function validateUploadFile(file) {
    if (!file) {
        return { valid: false, message: "Please select a PDF file to upload." };
    }

    const config = FORMAT_CONFIG.PDF;

    if (file.size === 0) {
        return { valid: false, message: "The selected file is empty." };
    }

    if (file.size > config.maxSizeBytes) {
        const maxMb = Math.round(config.maxSizeBytes / (1024 * 1024));
        return {
            valid: false,
            message: `The selected file exceeds the maximum permitted size of ${maxMb} MB.`
        };
    }

    const fileName = (file.name || "").toLowerCase();
    if (!fileName.endsWith(config.extension)) {
        return {
            valid: false,
            message: "Only PDF files (.pdf) are allowed."
        };
    }

    if (file.type) {
        const mime = file.type.toLowerCase();
        if (!config.mimeTypes.includes(mime) && mime !== "application/octet-stream" && mime !== "") {
            return {
                valid: false,
                message: `Unsupported file type ("${file.type}"). Only PDF files (.pdf) are allowed.`
            };
        }
    }

    try {
        const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
        const sig = String.fromCharCode(...headerBytes);
        if (sig !== "%PDF-") {
            return {
                valid: false,
                message: "The selected file is not a valid PDF document."
            };
        }
    } catch (_) {
        // Server performs full signature validation as well.
    }

    return { valid: true };
}

function setFormat() {
    const fileInput = element("private-file") || element("private-pdf");
    if (fileInput) {
        fileInput.accept = FORMAT_CONFIG.PDF.accept;
    }
}

function openPrivatePdf(privateFileId) {
    const url = new URL(
        `/api/private-library/${encodeURIComponent(String(privateFileId))}/file`,
        API_BASE_URL
    );

    window.open(url.href, "_blank", "noopener");
}

async function deletePrivatePdf(privateFileId, title, button) {
    const confirmed = window.confirm(
        `Delete "${title}" from your private library?`
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;

    try {
        await api.delete(
            `/private-library/${encodeURIComponent(String(privateFileId))}`
        );

        showMessage(
            element("upload-message"),
            "Book deleted successfully.",
            "success"
        );

        await loadPrivateFiles();
    } catch (error) {
        button.disabled = false;

        showMessage(
            element("private-error"),
            friendlyError(error),
            "error"
        );
    }
}

function openInReader(privateFileId, mode = "reflow") {
    const readerUrl = new URL("read.html", window.location.href);
    readerUrl.searchParams.set("privateId", String(privateFileId));
    readerUrl.searchParams.set("mode", mode);
    window.location.assign(readerUrl.href);
}

function createPrivateFileCard(privateFile) {
    const card = document.createElement("article");
    card.className = "private-file-card";

    const titleText =
        typeof privateFile.title === "string" && privateFile.title.trim()
            ? privateFile.title
            : "Untitled book";

    const format = typeof privateFile.file_format === "string" && privateFile.file_format.trim()
        ? privateFile.file_format.toUpperCase()
        : (privateFile.original_file_name?.toLowerCase().endsWith(".epub") ? "EPUB" : "PDF");

    const coverWrap = document.createElement("div");
    coverWrap.className = "private-file-cover-wrap";
    const coverImg = document.createElement("img");
    coverImg.className = "private-file-cover";
    coverImg.hidden = true;
    const coverPlaceholder = document.createElement("div");
    coverPlaceholder.className = "cover-placeholder";
    coverPlaceholder.textContent = format;
    coverWrap.append(coverImg, coverPlaceholder);

    loadCoverIntoElements(coverImg, coverPlaceholder, {
        coverPath: privateFile.cover_url || "",
        fallbackApiPath: `/private-library/${encodeURIComponent(String(privateFile.private_file_id))}/cover`,
        altText: `Cover for ${titleText}`,
    });

    const content = document.createElement("div");

    const badgeRow = document.createElement("div");
    badgeRow.className = "collection-badge-row";
    const uploadedBadge = document.createElement("span");
    uploadedBadge.className = "collection-badge collection-badge-uploaded";
    uploadedBadge.textContent = "Uploaded File";
    const formatBadge = document.createElement("span");
    formatBadge.className = "collection-badge collection-badge-format";
    formatBadge.textContent = format;
    badgeRow.append(uploadedBadge, formatBadge);
    content.append(badgeRow);

    const title = document.createElement("h3");
    title.textContent = titleText;

    const meta = document.createElement("p");
    meta.className = "private-file-meta";

    const fileName = document.createElement("span");
    fileName.textContent =
        typeof privateFile.original_file_name === "string"
            ? privateFile.original_file_name
            : "Book file";

    const formatSpan = document.createElement("span");
    formatSpan.textContent = format;

    const size = document.createElement("span");
    size.textContent = formatSize(privateFile.file_size);

    const date = document.createElement("span");
    date.textContent = `Uploaded ${formatDate(privateFile.created_at)}`;

    meta.append(fileName, formatSpan, size, date);
    content.append(title, meta);

    if (
        typeof privateFile.description === "string" &&
        privateFile.description.trim()
    ) {
        const description = document.createElement("p");
        description.className = "private-file-description";
        description.textContent = privateFile.description;
        content.append(description);
    }

    const actions = document.createElement("div");
    actions.className = "private-file-actions";

    if (format === "PDF") {
        const originalBtn = document.createElement("button");
        originalBtn.type = "button";
        originalBtn.className = "button button-primary";
        originalBtn.textContent = "Original PDF";
        originalBtn.addEventListener("click", () => {
            openInReader(privateFile.private_file_id, "pdf");
        });
        actions.append(originalBtn);

        const readBtn = document.createElement("button");
        readBtn.type = "button";
        readBtn.className = "button button-secondary";
        readBtn.textContent = "Read (EPUB-style)";
        readBtn.addEventListener("click", () => {
            openInReader(privateFile.private_file_id, "reflow");
        });
        actions.append(readBtn);
    } else {
        const readBtn = document.createElement("button");
        readBtn.type = "button";
        readBtn.className = "button button-primary";
        readBtn.textContent = "Read";
        readBtn.addEventListener("click", () => {
            openInReader(privateFile.private_file_id, "reflow");
        });
        actions.append(readBtn);

        const openRawBtn = document.createElement("button");
        openRawBtn.type = "button";
        openRawBtn.className = "button button-secondary";
        openRawBtn.textContent = "Download";
        openRawBtn.addEventListener("click", () => {
            openPrivatePdf(privateFile.private_file_id);
        });
        actions.append(openRawBtn);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "button button-secondary";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
        deletePrivatePdf(
            privateFile.private_file_id,
            title.textContent,
            deleteButton
        );
    });

    actions.append(deleteButton);
    card.append(coverWrap, content, actions);

    return card;
}

function createSavedBookCard(savedBook) {
    const card = document.createElement("article");
    card.className = "private-file-card";

    const coverWrap = document.createElement("div");
    coverWrap.className = "private-file-cover-wrap";
    const coverImg = document.createElement("img");
    coverImg.className = "private-file-cover";
    coverImg.hidden = true;
    const coverPlaceholder = document.createElement("div");
    coverPlaceholder.className = "cover-placeholder";
    coverPlaceholder.textContent = "Saved";
    const titleText = typeof savedBook.title === "string" && savedBook.title.trim() ? savedBook.title : "Untitled book";
    loadCoverIntoElements(coverImg, coverPlaceholder, {
        coverPath: savedBook.cover_path,
        fallbackApiPath: `/books/${encodeURIComponent(String(savedBook.book_id))}/cover`,
        altText: `Cover of ${titleText}`,
    });
    coverWrap.append(coverImg, coverPlaceholder);

    const content = document.createElement("div");
    content.className = "private-file-content";

    const badgeRow = document.createElement("div");
    badgeRow.className = "collection-badge-row";
    const savedBadge = document.createElement("span");
    savedBadge.className = "collection-badge collection-badge-saved";
    savedBadge.textContent = "Saved Public Book";
    badgeRow.append(savedBadge);
    if (savedBook.file_format) {
        const fmtBadge = document.createElement("span");
        fmtBadge.className = "collection-badge collection-badge-format";
        fmtBadge.textContent = String(savedBook.file_format).toUpperCase();
        badgeRow.append(fmtBadge);
    }
    content.append(badgeRow);

    const title = document.createElement("h3");
    title.textContent = titleText;
    content.append(title);

    const authors = Array.isArray(savedBook.authors) ? savedBook.authors.map((a) => a.name).filter(Boolean) : [];
    const categories = Array.isArray(savedBook.categories) ? savedBook.categories.map((c) => c.name).filter(Boolean) : [];
    if (authors.length || categories.length) {
        const rel = document.createElement("p");
        rel.className = "saved-book-relations";
        const parts = [];
        if (authors.length) parts.push(`By ${authors.join(", ")}`);
        if (categories.length) parts.push(categories.join(", "));
        rel.textContent = parts.join(" | ");
        content.append(rel);
    }

    const description = document.createElement("p");
    description.className = "private-file-description";
    description.textContent = typeof savedBook.description === "string" && savedBook.description.trim()
        ? savedBook.description
        : "Saved from the public catalog.";
    content.append(description);

    const meta = document.createElement("p");
    meta.className = "private-file-meta";
    const savedDate = formatDate(savedBook.saved_at);
    meta.textContent = savedDate ? `Saved on ${savedDate}` : "Saved to your private library";
    content.append(meta);

    const actions = document.createElement("div");
    actions.className = "private-file-actions";
    const encodedId = encodeURIComponent(String(savedBook.book_id));
    const isPdf = String(savedBook.file_format || "").toUpperCase() === "PDF" && savedBook.has_original_file;

    if (isPdf) {
        const pdfLink = document.createElement("a");
        pdfLink.className = "button button-primary";
        pdfLink.href = `read.html?id=${encodedId}&mode=pdf`;
        pdfLink.textContent = "Original PDF";
        actions.append(pdfLink);
        const reflowLink = document.createElement("a");
        reflowLink.className = "button button-secondary";
        reflowLink.href = `read.html?id=${encodedId}&mode=reflow`;
        reflowLink.textContent = "Read (EPUB-style)";
        actions.append(reflowLink);
    } else {
        const readLink = document.createElement("a");
        readLink.className = "button button-primary";
        readLink.href = `read.html?id=${encodedId}`;
        readLink.textContent = "Read";
        actions.append(readLink);
    }

    const detailsLink = document.createElement("a");
    detailsLink.className = "button button-secondary";
    detailsLink.href = `book.html?id=${encodedId}`;
    detailsLink.textContent = "Details";
    actions.append(detailsLink);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button button-danger";
    removeBtn.textContent = "Remove from My Library";
    removeBtn.addEventListener("click", async () => {
        const ok = window.confirm(`Remove "${titleText}" from your private library? The original book in the public library will not be deleted.`);
        if (!ok) return;
        removeBtn.disabled = true;
        const savedMsgBox = element("saved-books-message");
        showMessage(savedMsgBox, "");
        try {
            await api.delete(`/private-library/saved/${encodedId}`);
            ui.showToast(`Removed "${titleText}" from your private library.`, "info");
            showMessage(savedMsgBox, `"${titleText}" was removed from your private library.`, "success");
            await loadPrivateFiles();
        } catch (err) {
            const msg = friendlyError(err);
            showMessage(savedMsgBox, msg, "error");
            ui.showToast(msg, "error");
            removeBtn.disabled = false;
        }
    });
    actions.append(removeBtn);

    card.append(coverWrap, content, actions);
    return card;
}

function renderSavedBooks(savedBooks) {
    const list = element("saved-books-list");
    const empty = element("saved-books-empty");
    const summary = element("saved-results-summary");
    if (!list || !empty || !summary) return;
    list.replaceChildren();
    if (!savedBooks.length) {
        empty.hidden = false;
        summary.textContent = "0 saved books";
        return;
    }
    empty.hidden = true;
    summary.textContent = `${savedBooks.length} saved book${savedBooks.length === 1 ? "" : "s"}`;
    for (const savedBook of savedBooks) {
        list.append(createSavedBookCard(savedBook));
    }
}

function renderPrivateFiles(privateFiles) {
    const list = element("private-file-list");
    const empty = element("private-empty");
    const summary = element("private-results-summary");

    list.replaceChildren();

    if (!privateFiles.length) {
        empty.hidden = false;
        summary.textContent = "0 books";
        return;
    }

    empty.hidden = true;
    summary.textContent =
        `${privateFiles.length} book${privateFiles.length === 1 ? "" : "s"}`;

    for (const privateFile of privateFiles) {
        list.append(createPrivateFileCard(privateFile));
    }
}

async function loadPrivateFiles() {
    const loading = element("private-loading");
    const errorBox = element("private-error");
    const list = element("private-file-list");

    loading.hidden = false;
    errorBox.hidden = true;
    list.setAttribute("aria-busy", "true");

    try {
        const response = await api.get("/private-library");
        const privateFiles = response?.data?.privateFiles;

        if (!Array.isArray(privateFiles)) {
            throw new Error("The private library response did not contain a book list.");
        }

        const savedBooks = Array.isArray(response?.data?.savedBooks) ? response.data.savedBooks : [];
        renderSavedBooks(savedBooks);
        renderPrivateFiles(privateFiles);
    } catch (error) {
        list.replaceChildren();
        element("private-empty").hidden = true;
        element("private-results-summary").textContent = "";
        showMessage(errorBox, friendlyError(error), "error");
    } finally {
        loading.hidden = true;
        list.setAttribute("aria-busy", "false");
    }
}

function bindUploadForm() {
    const form = element("private-upload-form");
    const uploadButton = element("upload-button");
    const message = element("upload-message");
    const fileInput = element("private-file") || element("private-pdf");
    if (fileInput) {
        fileInput.accept = FORMAT_CONFIG.PDF.accept;
        fileInput.addEventListener("change", async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                return;
            }
            const validation = await validateUploadFile(file);
            if (!validation.valid) {
                showMessage(message, validation.message, "error");
                fileInput.value = "";
            } else {
                showMessage(message, "");
            }
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const input = element("private-file") || element("private-pdf");
        const file = input?.files && input.files[0];

        const validation = await validateUploadFile(file);
        if (!validation.valid) {
            showMessage(message, validation.message, "error");
            return;
        }

        const titleInput = element("private-title");
        const descInput = element("private-description");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", currentFormat);

        if (titleInput && titleInput.value.trim()) {
            formData.append("title", titleInput.value.trim());
        }
        if (descInput && descInput.value.trim()) {
            formData.append("description", descInput.value.trim());
        }

        uploadButton.disabled = true;
        showMessage(message, `Uploading ${currentFormat}...`);

        try {
            await api.post("/private-library/upload", formData);

            form.reset();
            setFormat(currentFormat);
            showMessage(message, `${currentFormat} uploaded successfully.`, "success");
            await loadPrivateFiles();
        } catch (error) {
            showMessage(message, friendlyError(error), "error");
        } finally {
            uploadButton.disabled = false;
        }
    });
}

export async function init() {
    setFormat("PDF");
    bindUploadForm();
    await loadPrivateFiles();
}
