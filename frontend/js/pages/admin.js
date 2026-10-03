import { auth } from "../auth.js";

export function init() {

    const container =
        document.querySelector(
            "#admin-content"
        );

    if (!container) {
        return;
    }

    if (!auth.isAdmin()) {

        container.textContent =
            "Administrator access is required.";

        return;
    }

    const message =
        document.createElement("p");

    message.className =
        "success-message form-message";

    message.textContent =
        "Administrator access verified.";

    const note =
        document.createElement("p");

    note.className =
        "muted";

    note.textContent =
        "This foundation intentionally does not add book-management operations. " +
        "Those must use the existing backend APIs and preserve the public-library permissions.";

    container.replaceChildren(
        message,
        note
    );
}