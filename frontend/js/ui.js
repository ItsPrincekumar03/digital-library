let toastRegion;

function getToastRegion() {
    if (toastRegion?.isConnected) {
        return toastRegion;
    }

    toastRegion =
        document.createElement("div");

    toastRegion.className =
        "toast-region";

    toastRegion.setAttribute(
        "aria-live",
        "polite"
    );

    toastRegion.setAttribute(
        "aria-atomic",
        "false"
    );

    document.body.append(toastRegion);

    return toastRegion;
}

export const ui = {

    showToast(
        message,
        type = "info",
        duration = 4000
    ) {
        if (!message) {
            return;
        }

        const toast =
            document.createElement("div");

        toast.className =
            `toast toast-${type}`;

        toast.setAttribute(
            "role",
            type === "error"
                ? "alert"
                : "status"
        );

        toast.textContent =
            String(message);

        const region =
            getToastRegion();

        region.append(toast);

        window.setTimeout(() => {
            toast.remove();
        }, duration);
    },

    setButtonLoading(
        button,
        loading,
        loadingText = "Please wait…"
    ) {
        if (!button) {
            return;
        }

        if (loading) {
            button.dataset.originalText =
                button.textContent;

            button.textContent =
                loadingText;

            button.disabled = true;

            button.setAttribute(
                "aria-busy",
                "true"
            );

            return;
        }

        button.textContent =
            button.dataset.originalText ||
            button.textContent;

        delete button.dataset.originalText;

        button.disabled = false;

        button.removeAttribute(
            "aria-busy"
        );
    },

    showFormError(
        element,
        message
    ) {
        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.hidden =
            !message;
    },

    clearFormError(element) {
        this.showFormError(
            element,
            ""
        );
    }

};