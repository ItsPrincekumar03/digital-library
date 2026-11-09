import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";

const FORMAT_CONFIG = {
    PDF: {
        label: "PDF",
        extension: ".pdf",
        accept: "application/pdf,.pdf",
        mimeTypes: ["application/pdf", "application/x-pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        infoText: "PDF: Standard Portable Document Format (.pdf). Max file size: 10 MB.",
        inputLabel: "PDF file",
        submitText: "Upload PDF",
    },
    EPUB: {
        label: "EPUB",
        extension: ".epub",
        accept: "application/epub+zip,.epub",
        mimeTypes: ["application/epub+zip"],
        maxSizeBytes: 10 * 1024 * 1024,
        infoText: "EPUB: Electronic publication format (.epub). Max file size: 10 MB.",
        inputLabel: "EPUB file",
        submitText: "Upload EPUB",
    }
};

let currentFormat = "PDF";

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

function validateUploadFile(file, format) {
    if (!file) {
        return { valid: false, message: "Please select a file to upload." };
    }

    const config = FORMAT_CONFIG[format];
    if (!config) {
        return { valid: false, message: "Invalid format selected." };
    }

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
            message: `The selected file does not match the chosen format. Please select a valid ${config.label} file (${config.extension}).`
        };
    }

    if (file.type && config.mimeTypes.length > 0) {
        const mime = file.type.toLowerCase();
        if (!config.mimeTypes.includes(mime) && mime !== "application/octet-stream" && mime !== "") {
            return {
                valid: false,
                message: `The file MIME type ("${file.type}") does not match the chosen format ${config.label}.`
            };
        }
    }

    return { valid: true };
}

function setFormat(newFormat) {
    if (!FORMAT_CONFIG[newFormat]) {
        return;
    }
    currentFormat = newFormat;
    const config = FORMAT_CONFIG[newFormat];

    const pdfBtn = element("private-format-pdf");
    const epubBtn = element("private-format-epub");
    const infoNode = element("private-format-info");
    const labelNode = element("private-file-label");
    const fileInput = element("private-file") || element("private-pdf");
    const uploadBtn = element("upload-button");
    const messageNode = element("upload-message");

    if (pdfBtn && epubBtn) {
        const isPdf = newFormat === "PDF";
        pdfBtn.classList.toggle("is-active", isPdf);
        pdfBtn.setAttribute("aria-checked", isPdf ? "true" : "false");
        epubBtn.classList.toggle("is-active", !isPdf);
        epubBtn.setAttribute("aria-checked", !isPdf ? "true" : "false");
    }

    if (infoNode) {
        infoNode.innerHTML = `<strong>${config.label}:</strong> ${config.infoText.replace(config.label + ": ", "")}`;
    }

    if (labelNode) {
        labelNode.innerHTML = `${config.inputLabel} <span aria-hidden="true">*</span>`;
    }

    if (uploadBtn) {
        uploadBtn.textContent = config.submitText;
    }

    if (fileInput) {
        fileInput.accept = config.accept;

        if (fileInput.files && fileInput.files[0]) {
            const fileName = (fileInput.files[0].name || "").toLowerCase();
            if (!fileName.endsWith(config.extension)) {
                fileInput.value = "";
                if (messageNode) {
                    showMessage(messageNode, `Previous file cleared because it was not a valid ${config.label} file.`, "info");
                }
            }
        }
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

function createPrivateFileCard(privateFile) {
    const card = document.createElement("article");
    card.className = "private-file-card";

    const content = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent =
        typeof privateFile.title === "string" && privateFile.title.trim()
            ? privateFile.title
            : "Untitled book";

    const meta = document.createElement("p");
    meta.className = "private-file-meta";

    const fileName = document.createElement("span");
    fileName.textContent =
        typeof privateFile.original_file_name === "string"
            ? privateFile.original_file_name
            : "Book file";

    const formatSpan = document.createElement("span");
    const format = typeof privateFile.file_format === "string" && privateFile.file_format.trim()
        ? privateFile.file_format.toUpperCase()
        : (privateFile.original_file_name?.toLowerCase().endsWith(".epub") ? "EPUB" : "PDF");
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

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "button button-primary";
    openButton.textContent = "Open";
    openButton.addEventListener("click", () => {
        openPrivatePdf(privateFile.private_file_id);
    });

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

    actions.append(openButton, deleteButton);
    card.append(content, actions);

    return card;
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
    const pdfBtn = element("private-format-pdf");
    const epubBtn = element("private-format-epub");

    if (pdfBtn) {
        pdfBtn.addEventListener("click", () => setFormat("PDF"));
        pdfBtn.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                epubBtn?.focus();
                setFormat("EPUB");
            }
        });
    }

    if (epubBtn) {
        epubBtn.addEventListener("click", () => setFormat("EPUB"));
        epubBtn.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                pdfBtn?.focus();
                setFormat("PDF");
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                return;
            }
            const validation = validateUploadFile(file, currentFormat);
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

        const validation = validateUploadFile(file, currentFormat);
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
