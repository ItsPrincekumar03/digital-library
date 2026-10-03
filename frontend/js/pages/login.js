import { auth } from "../auth.js";
import { ui } from "../ui.js";

function getSafeNextPage() {
    const requested =
        new URLSearchParams(
            window.location.search
        ).get("next");

    const allowed = new Set([
        "index.html",
        "profile.html",
        "admin.html"
    ]);

    if (
        requested &&
        allowed.has(requested)
    ) {
        if (
            requested === "admin.html" &&
            !auth.isAdmin()
        ) {
            return "profile.html";
        }

        return requested;
    }

    return auth.isAdmin()
        ? "admin.html"
        : "profile.html";
}

export function init() {
    const form =
        document.querySelector("#login-form");

    const errorElement =
        document.querySelector("#form-error");

    const passwordInput =
        document.querySelector("#password");

    const passwordToggle =
        document.querySelector("#password-toggle");

    if (!form) {
        return;
    }

    /*
     * Show / hide password
     */
    if (
        passwordInput &&
        passwordToggle
    ) {
        passwordToggle.addEventListener(
            "click",
            () => {

                if (
                    passwordInput.type === "password"
                ) {

                    passwordInput.type = "text";

                    passwordToggle.textContent = "🙈";

                    passwordToggle.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    passwordInput.type = "password";

                    passwordToggle.textContent = "👁";

                    passwordToggle.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }
            }
        );
    }

    /*
     * Login form
     */
    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            ui.clearFormError(
                errorElement
            );

            if (!form.reportValidity()) {
                return;
            }

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            const formData =
                new FormData(form);

            const credentials = {
                email:
                    String(
                        formData.get("email") || ""
                    ).trim(),

                password:
                    String(
                        formData.get("password") || ""
                    )
            };

            ui.setButtonLoading(
                submitButton,
                true,
                "Logging in…"
            );

            try {

                const user =
                    await auth.login(
                        credentials
                    );

                if (!user) {
                    throw new Error(
                        "Login succeeded, but the account could not be verified."
                    );
                }

                window.location.assign(
                    getSafeNextPage()
                );

            } catch (error) {

                ui.showFormError(
                    errorElement,
                    error.message ||
                    "Could not log in."
                );

                ui.setButtonLoading(
                    submitButton,
                    false
                );
            }
        }
    );
}