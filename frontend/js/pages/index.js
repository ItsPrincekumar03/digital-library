import { auth } from "../auth.js";

/* ============================================================
   Module 29.5 — Homepage page script
   Preserves all existing routing, auth and button logic.
   Progressive enhancement:
   - Elements are visible by default in HTML/CSS.
   - Animation prep classes (.has-entrance-prep) are added ONLY
     by this script when JavaScript is active and prefers-reduced-motion
     is not active.
   - If JS fails or IntersectionObserver is unsupported, everything
     remains naturally visible.
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
 * Trigger hero entrance animations using progressive enhancement.
 * Adds .has-entrance-prep first (which sets up initial offset),
 * then adds .is-visible on next frames to transition to natural state.
 * If reduced motion is requested, this is skipped entirely.
 */
function runHeroEntrance() {
    if (prefersReducedMotion()) {
        return;
    }

    const animEls = document.querySelectorAll(
        ".hero-29__anim, .hero-29__visual-anim"
    );
    if (!animEls.length) {
        return;
    }

    // Arm elements with animation preparation class
    animEls.forEach((el) => el.classList.add("has-entrance-prep"));

    // Two nested rAF calls ensure layout has applied initial transform before triggering transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            animEls.forEach((el) => el.classList.add("is-visible"));
        });
    });
}

/**
 * Observe feature cards and reveal them when they enter the viewport.
 * Uses progressive enhancement:
 * - If IntersectionObserver is unavailable or reduced motion is requested,
 *   cards remain in their default visible state without any hidden prep.
 * - Otherwise, .has-entrance-prep is added to observe and transition in.
 */
function observeFeatureCards() {
    if (prefersReducedMotion()) {
        return;
    }

    const cards = document.querySelectorAll(".feature-card-29");
    if (!cards.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        // Fallback: leave cards in default visible state
        return;
    }

    // Arm cards for viewport reveal
    cards.forEach((card, index) => {
        card.classList.add("has-entrance-prep");
        const baseDelay = 60;
        card.style.transitionDelay = `${index * baseDelay}ms`;
    });

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    cards.forEach((card) => observer.observe(card));
}

/**
 * Render the hero action buttons.
 *
 * Authenticated user:
 *   - "Go to my profile"  → profile.html   (primary)
 *   - "Administration"    → admin.html      (secondary, admin-only)
 *
 * Guest user:
 *   - "Explore Library"   → library.html   (primary)
 *   - "Log in"            → login.html     (secondary)
 *   - "Register"          → register.html  (secondary)
 *
 * library.html has data-access="public" so guests reach it without
 * authentication. No new API, no auth bypass.
 */
function renderActions(container) {
    container.replaceChildren();

    if (auth.isAuthenticated()) {
        const profileLink = document.createElement("a");
        profileLink.className = "button button-primary";
        profileLink.href = "profile.html";
        profileLink.textContent = "Go to my profile";
        container.append(profileLink);

        if (auth.isAdmin()) {
            const adminLink = document.createElement("a");
            adminLink.className = "button button-secondary";
            adminLink.href = "admin.html";
            adminLink.textContent = "Administration";
            container.append(adminLink);
        }

        return;
    }

    // Guest: Explore Library (primary), Log in, Register (secondary)
    const libraryLink = document.createElement("a");
    libraryLink.className = "button button-primary";
    libraryLink.href = "library.html";
    libraryLink.textContent = "Explore Library";

    const loginLink = document.createElement("a");
    loginLink.className = "button button-secondary";
    loginLink.href = "login.html";
    loginLink.textContent = "Log in";

    const registerLink = document.createElement("a");
    registerLink.className = "button button-secondary";
    registerLink.href = "register.html";
    registerLink.textContent = "Create an account";

    container.append(libraryLink, loginLink, registerLink);
}

export function init() {
    const actions = document.querySelector("#home-actions");
    if (actions) {
        renderActions(actions);
    }

    runHeroEntrance();
    observeFeatureCards();
}
