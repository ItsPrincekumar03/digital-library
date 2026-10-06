import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";

function element(id) {
    return document.getElementById(id);
}

function showMessage(node, message, type = "") {
    node.textContent = message;
    node.hidden = !message;

    node.classList.toggle("error-message", type === "error");
    node.classList.toggle("success-message", type === "success");
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return "Your private library could not be loaded. Check your connection and try again.";
    }

    if (error.status === 401) {
        return "Please log in to access your private library.";
    }

    if (error.status === 404) {
        return "The requested PDF could not be found.";
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

function openPrivatePdf(privateFileId) {
    const url = new URL(
        `/api/private-library/${encodeURIComponent(String(privateFileId))}/file`,
        API_BASE_URL
    );

    window.location.href = "reader.html?privatePdfId=" + encodeURIComponent(String(privateFileId));
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
            "PDF deleted successfully.",
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
            : "Untitled PDF";

    const meta = document.createElement("p");
    meta.className = "private-file-meta";

    const fileName = document.createElement("span");
    fileName.textContent =
        typeof privateFile.original_file_name === "string"
            ? privateFile.original_file_name
            : "PDF file";

    const size = document.createElement("span");
    size.textContent = formatSize(privateFile.file_size);

    const date = document.createElement("span");
    date.textContent = `Uploaded ${formatDate(privateFile.created_at)}`;

    meta.append(fileName, size, date);

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
    openButton.textContent = "Read";
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
        summary.textContent = "0 PDFs";
        return;
    }

    empty.hidden = true;
    summary.textContent =
        `${privateFiles.length} PDF${privateFiles.length === 1 ? "" : "s"}`;

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
            throw new Error("The private library response did not contain a PDF list.");
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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fileInput = element("private-pdf");

        if (!fileInput.files || fileInput.files.length === 0) {
            showMessage(message, "Choose a PDF file to upload.", "error");
            return;
        }

        const formData = new FormData(form);

        uploadButton.disabled = true;
        showMessage(message, "Uploading PDF...");

        try {
            await api.post("/private-library/upload", formData);

            form.reset();
            showMessage(message, "PDF uploaded successfully.", "success");
            await loadPrivateFiles();
        } catch (error) {
            showMessage(message, friendlyError(error), "error");
        } finally {
            uploadButton.disabled = false;
        }
    });
}

export async function init() {
    bindUploadForm();
    await loadPrivateFiles();
}
