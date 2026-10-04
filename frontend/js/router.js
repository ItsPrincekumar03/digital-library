import { auth } from "./auth.js";
import { ui } from "./ui.js";
import { renderLayout } from "./layout.js";

function getSafeReturnUrl() {
    const value =
        new URLSearchParams(window.location.search).get("next");

    if (!value) {
        return null;
    }

    try {
        const target =
            new URL(value, window.location.href);

        if (target.origin !== window.location.origin) {
            return null;
        }

        const allowedPages = [
            "index.html",
            "profile.html",
            "admin.html",
            "library.html",
            "book.html"
        ];

        const page =
            target.pathname.split("/").pop();

        if (!allowedPages.includes(page)) {
            return null;
        }

        return `${page}${target.search}${target.hash}`;
    } catch {
        return null;
    }
}

function defaultAuthenticatedPage() {
    return auth.isAdmin()
        ? "admin.html"
        : "profile.html";
}

async function boot() {
    let authAvailable = true;

    try {
        await auth.init();
    } catch (error) {
        authAvailable = false;

        ui.showToast(
            error.message || "Could not check your account.",
            "error",
            6000
        );
    }

    const access =
        document.body.dataset.access || "public";

    if (access === "auth" && !auth.isAuthenticated()) {
        const next =
            encodeURIComponent(
                window.location.pathname.split("/").pop()
            );

        window.location.replace(`login.html?next=${next}`);
        return;
    }

    if (access === "admin") {
        if (!authAvailable) {
            document.querySelector("#admin-content")?.replaceChildren();
            return;
        }

        if (!auth.isAuthenticated()) {
            window.location.replace("login.html?next=admin.html");
            return;
        }

        if (!auth.isAdmin()) {
            ui.showToast(
                "You do not have permission to access that page.",
                "error"
            );

            window.location.replace("profile.html");
            return;
        }
    }

    if (access === "guest" && auth.isAuthenticated()) {
        window.location.replace(defaultAuthenticatedPage());
        return;
    }

    renderLayout();

    const page = document.body.dataset.page;

    const pageModules = {
        index: "./pages/index.js",
        login: "./pages/login.js",
        register: "./pages/register.js",
        profile: "./pages/profile.js",
        admin: "./pages/admin.js",
        library: "./pages/library.js",
        book: "./pages/book.js"
    };

    if (pageModules[page]) {
        try {
            const module = await import(pageModules[page]);
            await module.init();
        } catch (error) {
            ui.showToast(
                error.message || "The page could not be loaded.",
                "error"
            );
        }
    }

    window.getSafeReturnUrl = getSafeReturnUrl;
}

boot();