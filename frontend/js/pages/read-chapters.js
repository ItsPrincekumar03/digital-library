// Module 13.7: chapter drawer and navigation.
// Module 13.8 step 2: top bar and tap-to-toggle chrome.
// Binds to the ids already in read.html. Reads the page sections that are
// already rendered. Never rebuilds #read-content and never refetches.
// Must only be called after initSettings' promise resolves (render gate open).

const NEAR_TOP_PX = 120;

function byId(id) {
    return document.getElementById(id);
}

function pageFromSection(section) {
    const match = /^Page (\d+)$/.exec(section.getAttribute("aria-label") || "");
    return match ? Number(match[1]) : null;
}

// Reading-position anchor for chrome changes. Same method as the settings
// module: the first section still crossing the probe line, and how far through
// it the viewport is. Restored on the next frame so the text does not jump.
function captureReadingAnchor(content) {
    for (const section of content.querySelectorAll(".read-page")) {
        const rect = section.getBoundingClientRect();

        if (rect.bottom > NEAR_TOP_PX) {
            const height = rect.height || 1;
            return {
                section,
                fraction: Math.min(1, Math.max(0, -rect.top / height))
            };
        }
    }

    return null;
}

function restoreReadingAnchor(anchor) {
    if (!anchor || !anchor.section || !anchor.section.isConnected) {
        return;
    }

    const rect = anchor.section.getBoundingClientRect();
    const height = rect.height || 1;

    window.scrollTo(0, Math.max(0, window.scrollY + rect.top + anchor.fraction * height));
}

export function initChapters({ content, chapters, pageCount }) {
    try {
        setup(content, chapters, pageCount);
    } catch (error) {
        console.warn("Chapter drawer unavailable:", error);
    }
}

function setup(content, chapters, pageCount) {
    const trigger = byId("read-chapters-trigger");
    const drawer = byId("read-chapters-panel");
    const closeBtn = byId("read-chapters-close");
    const nav = drawer ? drawer.querySelector(".read-chapters-list") : null;
    const emptyNote = drawer ? drawer.querySelector(".read-chapters-empty") : null;
    const prevBtn = byId("read-chapters-prev");
    const nextBtn = byId("read-chapters-next");

    if (!content || !trigger || !drawer || !closeBtn || !nav) {
        return;
    }

    const settingsPanel = byId("read-settings-panel");
    const settingsTrigger = byId("read-settings-trigger");
    const focusToggle = byId("read-focus-toggle");

    const hasChapters = Array.isArray(chapters) && chapters.length > 0;
    const total = Math.max(0, Math.floor(Number(pageCount) || 0));

    // No headings: one entry per page, so navigation still works.
    const entries = hasChapters
        ? chapters
        : Array.from({ length: total }, (_, i) => ({
              title: `Page ${i + 1}`,
              page: i + 1,
              level: 0
          }));

    if (emptyNote) {
        emptyNote.hidden = hasChapters;

        // Shown above the page list when the book has no headings. The list
        // stays so Previous and Next still have entries to step through.
        emptyNote.textContent = "No chapter headings were found. Showing pages.";
    }

    // Built with textContent only. PDF text is never parsed as HTML.
    const list = document.createElement("ul");
    list.className = "read-chapters-items";

    entries.forEach((entry, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");

        button.type = "button";
        button.className = entry.level === 2 ? "read-chapters-item is-sub" : "read-chapters-item";
        button.dataset.index = String(index);
        button.textContent = hasChapters
            ? `${entry.title} · p. ${entry.page}`
            : `Page ${entry.page}`;

        item.append(button);
        list.append(item);
    });

    nav.append(list);

    let active = -1;
    let frame = 0;

    const itemButtons = () => list.querySelectorAll(".read-chapters-item");

    function setActive(index) {
        if (index === active) {
            return;
        }

        const buttons = itemButtons();

        if (buttons[active]) {
            buttons[active].removeAttribute("aria-current");
        }

        if (buttons[index]) {
            buttons[index].setAttribute("aria-current", "true");
        }

        active = index;
    }

    // The page at the top of the viewport decides the active entry.
    // Highlighting is page-granular: when several headings share a page,
    // the first of them is highlighted.
    function computeActive() {
        let topPage = null;

        for (const section of content.querySelectorAll(".read-page")) {
            if (section.getBoundingClientRect().top <= NEAR_TOP_PX) {
                topPage = pageFromSection(section) ?? topPage;
            } else {
                break;
            }
        }

        if (topPage === null) {
            return 0;
        }

        const exact = entries.findIndex((entry) => entry.page === topPage);

        if (exact !== -1) {
            return exact;
        }

        // No entry on this page: highlight the nearest preceding entry.
        let previous = 0;

        entries.forEach((entry, i) => {
            if (entry.page < topPage) {
                previous = i;
            }
        });

        return previous;
    }

    function jumpTo(index) {
        const entry = entries[index];

        if (!entry) {
            return;
        }

        const section = content.querySelector(`.read-page[aria-label="Page ${entry.page}"]`);

        if (!section) {
            return;
        }

        section.scrollIntoView({ block: "start" });
        setActive(index);
    }

    function isOpen() {
        return !drawer.hidden;
    }

    function openDrawer() {
        // One drawer at a time: close the settings panel if it is open.
        if (settingsPanel && !settingsPanel.hidden) {
            settingsPanel.hidden = true;

            if (settingsTrigger) {
                settingsTrigger.setAttribute("aria-expanded", "false");
            }
        }

        drawer.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        setActive(computeActive());
        closeBtn.focus();
    }

    function closeDrawer(returnFocus = true) {
        drawer.hidden = true;
        trigger.setAttribute("aria-expanded", "false");

        if (returnFocus) {
            trigger.focus();
        }
    }

    trigger.addEventListener("click", () => {
        if (isOpen()) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    closeBtn.addEventListener("click", () => closeDrawer());

    // The drawer stays open after a jump, so Previous and Next remain usable.
    nav.addEventListener("click", (event) => {
        const button = event.target.closest(".read-chapters-item");

        if (button) {
            jumpTo(Number(button.dataset.index));
        }
    });

    // ArrowUp and ArrowDown move focus between entries.
    nav.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
        }

        const buttons = [...itemButtons()];
        const current = buttons.indexOf(document.activeElement);

        if (current < 0) {
            return;
        }

        event.preventDefault();

        const next = event.key === "ArrowDown"
            ? Math.min(buttons.length - 1, current + 1)
            : Math.max(0, current - 1);

        buttons[next].focus();
    });

    prevBtn?.addEventListener("click", () => {
        jumpTo(Math.max(0, (active < 0 ? 0 : active) - 1));
    });

    nextBtn?.addEventListener("click", () => {
        jumpTo(Math.min(entries.length - 1, (active < 0 ? 0 : active) + 1));
    });

    // Opening the settings panel closes the drawer.
    settingsTrigger?.addEventListener("click", () => {
        if (isOpen()) {
            closeDrawer(false);
        }
    });

    // Entering Focus Mode closes the drawer, because its trigger is hidden.
    focusToggle?.addEventListener("click", () => {
        if (isOpen()) {
            closeDrawer(false);
        }
    });

    function scheduleActiveUpdate() {
        if (frame || !isOpen()) {
            return;
        }

        frame = requestAnimationFrame(() => {
            frame = 0;
            setActive(computeActive());
        });
    }

    window.addEventListener("scroll", scheduleActiveUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveUpdate);

    // Capture phase on document: runs before the settings Escape handler
    // (bubble phase, same node). While the drawer is open, Escape closes only
    // the drawer, so Focus Mode is not exited by the same keypress.
    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Escape" || !isOpen()) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            closeDrawer();
        },
        true
    );

    /* ---- Module 13.8 step 2: top bar and tap-to-toggle chrome ---- */

    const body = document.body;
    const article = content.closest(".read-shell") || content;
    const topChapter = byId("read-topbar-chapter");
    const topPage = byId("read-topbar-page");
    const siteHeader = byId("site-header");

    // The top bar sits directly below the site header, so the header's icons
    // stay visible. The height is measured, because the header wraps on phones.
    function placeTopBar() {
        const bar = byId("read-topbar");

        if (!bar) {
            return;
        }

        // The bottom edge of the sticky header is where the bar must start.
        // Read on every update, so the position is correct after layout settles.
        const bottom = siteHeader ? siteHeader.getBoundingClientRect().bottom : 0;
        bar.style.top = `${Math.max(0, Math.round(bottom))}px`;
    }

    window.addEventListener("resize", placeTopBar);
    placeTopBar();

    function chromeVisible() {
        return !body || body.dataset.readChrome !== "hidden";
    }

    // Moves focus off any control inside the chrome before it is hidden,
    // so focus is never left on an element that display:none removes.
    function setChrome(visible) {
        if (!body) {
            return;
        }

        if (!visible) {
            const active = document.activeElement;

            if (
                active &&
                active.closest(".read-actions, .read-topbar, .read-shell > .read-header, .back-link, #site-header")
            ) {
                active.blur();
            }
        }

        body.dataset.readChrome = visible ? "shown" : "hidden";

        // Measure again after the header's display changes, so the bar sits
        // directly under it when shown and does not keep a stale top value.
        placeTopBar();
    }

    // Shows or hides the chrome without moving the text under the reader.
    function setChromeAnchored(visible) {
        const anchor = captureReadingAnchor(content);

        setChrome(visible);

        requestAnimationFrame(() => restoreReadingAnchor(anchor));
    }

    function closeAllPanels() {
        if (isOpen()) {
            closeDrawer(false);
        }

        if (settingsPanel && !settingsPanel.hidden) {
            settingsPanel.hidden = true;

            if (settingsTrigger) {
                settingsTrigger.setAttribute("aria-expanded", "false");
            }
        }
    }

    // The page at the top of the viewport, or null before any section is
    // at the top. Mirrors computeActive() without touching the drawer state.
    function currentPage() {
        let page = null;

        for (const section of content.querySelectorAll(".read-page")) {
            if (section.getBoundingClientRect().top <= NEAR_TOP_PX) {
                page = pageFromSection(section) ?? page;
            } else {
                break;
            }
        }

        return page;
    }

    // Top bar: the chapter title that applies to the current page, then the
    // page number. With no headings in the book, only the page number shows.
    function updateTopBar() {
        placeTopBar();
        const page = currentPage();
        let title = "";

        if (page !== null && hasChapters) {
            let index = entries.findIndex((entry) => entry.page === page);

            if (index === -1) {
                entries.forEach((entry, i) => {
                    if (entry.page < page) {
                        index = i;
                    }
                });
            }

            title = index >= 0 ? entries[index].title : "";
        }

        if (topChapter) {
            topChapter.textContent = title;
        }

        if (topPage) {
            topPage.textContent = page !== null ? `Page ${page}` : "";
        }
    }

    let topFrame = 0;

    function scheduleTopBar() {
        if (topFrame) {
            return;
        }

        topFrame = requestAnimationFrame(() => {
            topFrame = 0;
            updateTopBar();
        });
    }

    window.addEventListener("scroll", scheduleTopBar, { passive: true });
    window.addEventListener("resize", scheduleTopBar);
    updateTopBar();

    // Tap on the reading area toggles the top bar, bottom bar and header
    // together. Taps on controls, panels, the drawer or a text selection do
    // nothing. While Focus Mode is on, taps do nothing: only its exit does.
    const CONTROL_SELECTOR =
        "button, a, input, select, textarea, label, output, .read-chapters-panel, .read-settings-panel";

    document.addEventListener("click", (event) => {
        if (body && body.dataset.readFocus === "on") {
            return;
        }

        if (event.target.closest(CONTROL_SELECTOR)) {
            return;
        }

        const selection = window.getSelection ? window.getSelection() : null;

        if (selection && selection.toString().trim() !== "") {
            return;
        }

        const panelOpen = isOpen() || (settingsPanel && !settingsPanel.hidden);

        if (panelOpen) {
            closeAllPanels();
            setChromeAnchored(false);
            return;
        }

        setChromeAnchored(!chromeVisible());
    });
}
