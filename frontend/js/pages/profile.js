import { auth } from "../auth.js";

function addDefinitionItem(
    list,
    label,
    value
) {

    const term =
        document.createElement("dt");

    term.textContent =
        label;

    const description =
        document.createElement("dd");

    description.textContent =
        value || "—";

    list.append(
        term,
        description
    );
}

export function init() {

    const container =
        document.querySelector(
            "#profile-content"
        );

    const user =
        auth.getUser();

    if (!container) {
        return;
    }

    if (!user) {

        container.textContent =
            "Your account information is unavailable.";

        return;
    }

    const list =
        document.createElement("dl");

    list.className =
        "definition-list";

    /*
     * Support common backend naming
     * conventions for the name field.
     */
    const name =
        user.name ||
        user.fullName ||
        user.full_name ||
        user.username ||
        "—";

    const email =
        user.email ||
        "—";

    addDefinitionItem(
        list,
        "Name",
        String(name)
    );

    addDefinitionItem(
        list,
        "Email",
        String(email)
    );

    addDefinitionItem(
        list,
        "Access",
        user.role === "ADMIN"
            ? "Administrator"
            : "User"
    );

    container.replaceChildren(
        list
    );
}