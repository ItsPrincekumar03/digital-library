import { auth } from "../auth.js";

/* ============================================================
   Module 29.5 — Profile page script
   Preserves all existing user account data and access checks.
   Enhancements:
   - Modern split identity & information card presentation.
   - Deterministic two-initial avatar using approved palette.
   - Quick action routes (Explore Library, Private Library, Return Home).
   - Copy email helper with accessible screen-reader announcement.
   - Progressive enhancement: content visible by default.
   ============================================================ */

/**
 * Checks whether user has requested reduced motion.
 */
function prefersReducedMotion() {
    return Boolean(
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/**
 * Compute deterministic 1-2 initials from available name string.
 */
function getInitials(name) {
    if (!name || typeof name !== "string") {
        return "U";
    }
    const clean = name.trim();
    if (!clean) {
        return "U";
    }
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically pick an approved avatar color variant based on string hash.
 */
function getAvatarVariant(str) {
    let hash = 0;
    const text = String(str || "user");
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 2 === 0
        ? "profile-avatar--emerald"
        : "profile-avatar--purple";
}

/**
 * Copies email address to clipboard with accessible feedback.
 */
async function copyEmail(email, feedbackEl, btnEl) {
    if (!email) {
        return;
    }

    let copied = false;
    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(email);
            copied = true;
        } catch (_) {
            copied = false;
        }
    }

    if (!copied) {
        // Fallback for non-secure or older contexts
        try {
            const temp = document.createElement("textarea");
            temp.value = email;
            temp.setAttribute("readonly", "");
            temp.style.position = "absolute";
            temp.style.left = "-9999px";
            document.body.appendChild(temp);
            temp.select();
            copied = document.execCommand("copy");
            document.body.removeChild(temp);
        } catch (_) {
            copied = false;
        }
    }

    if (feedbackEl) {
        if (copied) {
            feedbackEl.textContent = "Email address copied to clipboard.";
            if (btnEl) {
                btnEl.textContent = "Copied ✓";
            }
        } else {
            feedbackEl.textContent = "Unable to auto-copy. Please select and copy manually.";
        }
        setTimeout(() => {
            if (feedbackEl) feedbackEl.textContent = "";
            if (btnEl) btnEl.textContent = "Copy";
        }, 3000);
    }
}

/**
 * Arm progressive entrance animations if reduced motion is not requested.
 */
function armProfileEntrance() {
    if (prefersReducedMotion()) {
        return;
    }

    const animEls = document.querySelectorAll(".profile-anim");
    if (!animEls.length) {
        return;
    }

    animEls.forEach((el) => el.classList.add("has-entrance-prep"));

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            animEls.forEach((el) => el.classList.add("is-visible"));
        });
    });
}

export function init() {
    const container = document.querySelector("#profile-content");
    const user = auth.getUser();

    if (!container) {
        return;
    }

    if (!user) {
        const errorCard = document.createElement("div");
        errorCard.className = "card error-message";
        errorCard.textContent = "Your account information is unavailable.";
        container.replaceChildren(errorCard);
        return;
    }

    /*
     * Support common backend naming conventions for the name field,
     * preserving all existing field extraction contracts.
     */
    const name =
        user.name ||
        user.fullName ||
        user.full_name ||
        user.username ||
        "Library Reader";

    const email = user.email || "No email registered";
    const isAdmin = user.role === "ADMIN";
    const roleLabel = isAdmin ? "Administrator" : "Standard Reader";

    const initials = getInitials(name);
    const avatarVariant = getAvatarVariant(email || name);

    // Build the enhanced Profile component tree
    const fragment = document.createDocumentFragment();

    // 1. Identity Card
    const identityCard = document.createElement("section");
    identityCard.className = "profile-identity-card profile-anim profile-anim--delay-2";
    identityCard.setAttribute("aria-label", "Account Identity");

    const avatar = document.createElement("div");
    avatar.className = `profile-avatar ${avatarVariant}`;
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initials;

    const identityMeta = document.createElement("div");
    identityMeta.className = "profile-identity-meta";

    const userName = document.createElement("h2");
    userName.className = "profile-user-name";
    userName.textContent = name;

    const roleBadge = document.createElement("span");
    roleBadge.className = `profile-user-role-badge ${
        isAdmin ? "profile-user-role-badge--admin" : "profile-user-role-badge--user"
    }`;
    roleBadge.textContent = roleLabel;

    identityMeta.append(userName, roleBadge);
    identityCard.append(avatar, identityMeta);

    // 2. Information Cards Grid
    const infoGrid = document.createElement("div");
    infoGrid.className = "profile-grid profile-anim profile-anim--delay-3";

    // Name Card
    const nameCard = document.createElement("div");
    nameCard.className = "profile-info-card";
    const nameLabel = document.createElement("span");
    nameLabel.className = "profile-info-label";
    nameLabel.textContent = "Display Name";
    const nameValue = document.createElement("div");
    nameValue.className = "profile-info-value";
    nameValue.textContent = name;
    nameCard.append(nameLabel, nameValue);

    // Email Card with Copy button
    const emailCard = document.createElement("div");
    emailCard.className = "profile-info-card";
    const emailLabel = document.createElement("span");
    emailLabel.className = "profile-info-label";
    emailLabel.textContent = "Email Address";

    const emailValue = document.createElement("div");
    emailValue.className = "profile-info-value";

    const emailText = document.createElement("span");
    emailText.textContent = email;

    const feedbackEl = document.createElement("div");
    feedbackEl.className = "profile-feedback";
    feedbackEl.setAttribute("role", "status");
    feedbackEl.setAttribute("aria-live", "polite");

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "profile-copy-btn";
    copyBtn.setAttribute("aria-label", "Copy email address to clipboard");
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
        copyEmail(email, feedbackEl, copyBtn);
    });

    emailValue.append(emailText, copyBtn);
    emailCard.append(emailLabel, emailValue, feedbackEl);

    infoGrid.append(nameCard, emailCard);

    // 3. Quick Actions Card
    const actionsCard = document.createElement("section");
    actionsCard.className = "profile-actions-card profile-anim profile-anim--delay-3";
    actionsCard.setAttribute("aria-label", "Quick Actions");

    const actionsTitle = document.createElement("h2");
    actionsTitle.className = "profile-actions-title";
    actionsTitle.textContent = "Library Shortcuts";

    const actionsRow = document.createElement("div");
    actionsRow.className = "profile-actions-row";

    const exploreLink = document.createElement("a");
    exploreLink.href = "library.html";
    exploreLink.className = "button button-primary";
    exploreLink.textContent = "Explore Public Library";

    const privateLink = document.createElement("a");
    privateLink.href = "private-library.html";
    privateLink.className = "button button-secondary";
    privateLink.textContent = "My Private Library";

    const homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.className = "button button-secondary";
    homeLink.textContent = "Return Home";

    actionsRow.append(exploreLink, privateLink, homeLink);

    if (isAdmin) {
        const adminLink = document.createElement("a");
        adminLink.href = "admin.html";
        adminLink.className = "button button-secondary";
        adminLink.textContent = "Administration Dashboard";
        actionsRow.append(adminLink);
    }

    actionsCard.append(actionsTitle, actionsRow);

    fragment.append(identityCard, infoGrid, actionsCard);
    container.replaceChildren(fragment);

    armProfileEntrance();
}
