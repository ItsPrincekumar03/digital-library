import { auth } from "../auth.js";

export function init() {

    const actions =
        document.querySelector(
            "#home-actions"
        );

    if (!actions) {
        return;
    }

    actions.replaceChildren();

    if (auth.isAuthenticated()) {

        const profileLink =
            document.createElement("a");

        profileLink.className =
            "button button-primary";

        profileLink.href =
            "profile.html";

        profileLink.textContent =
            "Go to my profile";

        actions.append(
            profileLink
        );

        if (auth.isAdmin()) {

            const adminLink =
                document.createElement("a");

            adminLink.className =
                "button button-secondary";

            adminLink.href =
                "admin.html";

            adminLink.textContent =
                "Administration";

            actions.append(
                adminLink
            );
        }

        return;
    }

    const loginLink =
        document.createElement("a");

    loginLink.className =
        "button button-primary";

    loginLink.href =
        "login.html";

    loginLink.textContent =
        "Log in";

    const registerLink =
        document.createElement("a");

    registerLink.className =
        "button button-secondary";

    registerLink.href =
        "register.html";

    registerLink.textContent =
        "Create an account";

    actions.append(
        loginLink,
        registerLink
    );
}