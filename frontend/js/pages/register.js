import { auth } from "../auth.js";
import { ui } from "../ui.js";

export function init() {

    const form =
        document.querySelector(
            "#register-form"
        );

    const errorElement =
        document.querySelector(
            "#form-error"
        );

    if (!form) {
        return;
    }

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

            const button =
                form.querySelector(
                    'button[type="submit"]'
                );

            const formData =
                new FormData(form);

            /*
             * IMPORTANT:
             *
             * The HTML input is named "name",
             * but the existing backend expects
             * "fullName".
             */
            const details = {

                fullName:
                    String(
                        formData.get("name") || ""
                    ).trim(),

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
                button,
                true,
                "Creating account…"
            );

            try {

                await auth.register(
                    details
                );

                ui.showToast(
                    "Your account was created. You can now log in.",
                    "success"
                );

                window.location.assign(
                    "login.html"
                );

            } catch (error) {

                ui.showFormError(
                    errorElement,
                    error.message ||
                    "Could not create account."
                );

                ui.setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}