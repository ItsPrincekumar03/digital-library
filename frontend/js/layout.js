import { auth } from "./auth.js";

function makeLink(
    label,
    href,
    className = ""
) {
    const link =
        document.createElement("a");

    link.href = href;
    link.textContent = label;

    if (className) {
        link.className = className;
    }

    return link;
}

export function renderLayout() {
    const header =
        document.querySelector("#site-header");

    const footer =
        document.querySelector("#site-footer");

    const user =
        auth.getUser();

    if (header) {
        const headerElement =
            document.createElement("header");

        headerElement.className =
            "site-header";

        const nav =
            document.createElement("nav");

        nav.className =
            "container navbar";

        nav.setAttribute(
            "aria-label",
            "Main navigation"
        );

        const brand =
            makeLink(
                "Digital Library",
                "index.html",
                "brand"
            );

        const brandMark =
            document.createElement("span");

        brandMark.className =
            "brand-mark";

        brandMark.setAttribute(
            "aria-hidden",
            "true"
        );

        brandMark.textContent = "D";
        brand.prepend(brandMark);

        const links =
            document.createElement("div");

        links.className = "nav-links";

        links.append(
            makeLink("Home", "index.html"),
            makeLink("Library", "library.html")
        );

        if (user) {
            links.append(
                makeLink("My profile", "profile.html")
            );

            if (user.role === "ADMIN") {
                links.append(
                    makeLink("Administration", "admin.html")
                );
            }

            const logoutButton =
                document.createElement("button");

            logoutButton.className =
                "button button-secondary";

            logoutButton.type = "button";
            logoutButton.dataset.action = "logout";
            logoutButton.textContent = "Log out";
            links.append(logoutButton);
        } else {
            links.append(
                makeLink("Log in", "login.html"),
                makeLink(
                    "Register",
                    "register.html",
                    "button button-primary"
                )
            );
        }

        nav.append(brand, links);
        headerElement.append(nav);
        header.replaceChildren(headerElement);

        header.addEventListener("click", async (event) => {
            const button = event.target.closest('[data-action="logout"]');

            if (!button) {
                return;
            }

            button.disabled = true;

            try {
                await auth.logout();
                window.location.assign("index.html");
            } catch {
                button.disabled = false;
            }
        });
    }

    if (footer) {
        const footerElement =
            document.createElement("footer");

        footerElement.className = "site-footer";

        const inner =
            document.createElement("div");

        inner.className =
            "container site-footer-inner";

        const copyright =
            document.createElement("span");

        copyright.textContent =
            `© ${new Date().getFullYear()} Digital Library`;

        const note =
            document.createElement("span");

        note.textContent =
            "A BTech CSE final-year project";

        inner.append(copyright, note);
        footerElement.append(inner);
        footer.replaceChildren(footerElement);
    }
}