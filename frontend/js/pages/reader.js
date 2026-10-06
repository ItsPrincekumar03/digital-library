import { api } from "../api.js";
import { auth } from "../auth.js";
import { ui } from "../ui.js";

function element(id) {
    return document.getElementById(id);
}

const STORAGE_KEY_PREFERENCES = "digitalLibrary.readerPreferences";
const STORAGE_KEY_PROGRESS = "digitalLibrary.readingProgress";

const DEFAULT_PREFERENCES = Object.freeze({
    theme: "light",
    fontFamily: "sans",
    fontSize: 18,
    lineHeight: "normal",
    readingWidth: "normal"
});

const ALLOWED_THEMES = new Set(["light", "dark", "sepia"]);
const ALLOWED_FONTS = new Set(["sans", "serif", "mono"]);
const ALLOWED_LINE_HEIGHTS = new Set(["compact", "normal", "relaxed"]);
const ALLOWED_WIDTHS = new Set(["narrow", "normal", "wide"]);
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

const AUTO_SCROLL_SPEEDS = {
    slow: 1,
    normal: 2,
    fast: 4
};

let state = {
    bookId: null,
    book: null,
    chapters: [],
    currentChapter: null,
    currentChapterIndex: -1,
    preferences: { ...DEFAULT_PREFERENCES },
    autoScroll: {
        active: false,
        paused: false,
        speed: "normal",
        intervalId: null
    },
    activeDrawer: null,
    pendingResumeChapterId: null
};

/* --------------------------------------------------------------------------
   Preferences Management (Persistence & Sanitization)
   -------------------------------------------------------------------------- */
function loadPreferences() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFERENCES);
        if (!raw) return { ...DEFAULT_PREFERENCES };

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PREFERENCES };

        return {
            theme: ALLOWED_THEMES.has(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
            fontFamily: ALLOWED_FONTS.has(parsed.fontFamily) ? parsed.fontFamily : DEFAULT_PREFERENCES.fontFamily,
            fontSize: Number.isInteger(parsed.fontSize) && parsed.fontSize >= MIN_FONT_SIZE && parsed.fontSize <= MAX_FONT_SIZE
                ? parsed.fontSize
                : DEFAULT_PREFERENCES.fontSize,
            lineHeight: ALLOWED_LINE_HEIGHTS.has(parsed.lineHeight) ? parsed.lineHeight : DEFAULT_PREFERENCES.lineHeight,
            readingWidth: ALLOWED_WIDTHS.has(parsed.readingWidth) ? parsed.readingWidth : DEFAULT_PREFERENCES.readingWidth
        };
    } catch {
        return { ...DEFAULT_PREFERENCES };
    }
}

function savePreferences(prefs) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(prefs));
    } catch {
        // Ignored if storage is blocked or quota exceeded
    }
}

function applyPreferences() {
    const prefs = state.preferences;
    const content = element("reader-content");

    // 1. Theme application on body
    document.body.classList.remove("reader-theme-light", "reader-theme-dark", "reader-theme-sepia");
    document.body.classList.add(`reader-theme-${prefs.theme}`);

    // Update Theme UI Buttons in Drawer
    document.querySelectorAll(".theme-option-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.theme === prefs.theme);
    });

    if (content) {
        // 2. Font Family
        content.classList.remove("reader-font-sans", "reader-font-serif", "reader-font-mono");
        content.classList.add(`reader-font-${prefs.fontFamily}`);

        // 3. Line Height
        content.classList.remove("reader-leading-compact", "reader-leading-normal", "reader-leading-relaxed");
        content.classList.add(`reader-leading-${prefs.lineHeight}`);

        // 4. Reading Width
        content.classList.remove("reader-width-narrow", "reader-width-normal", "reader-width-wide");
        content.classList.add(`reader-width-${prefs.readingWidth}`);

        // 5. Font Size
        content.style.fontSize = `${prefs.fontSize}px`;
    }

    // Update Drawer Controls
    const fontDisplay = element("font-size-display");
    if (fontDisplay) fontDisplay.textContent = `${prefs.fontSize}px`;

    const fontSelect = element("select-font-family");
    if (fontSelect) fontSelect.value = prefs.fontFamily;

    document.querySelectorAll("[data-lineheight]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.lineheight === prefs.lineHeight);
    });

    document.querySelectorAll("[data-width]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.width === prefs.readingWidth);
    });
}

function updatePreference(key, value) {
    state.preferences[key] = value;
    applyPreferences();
    savePreferences(state.preferences);
}

function resetPreferences() {
    state.preferences = { ...DEFAULT_PREFERENCES };
    applyPreferences();
    savePreferences(state.preferences);
    ui.showToast("Reader settings reset to defaults.", "info", 3000);
}

/* --------------------------------------------------------------------------
   Reading Progress & Resume Storage
   -------------------------------------------------------------------------- */
function loadAllProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function getBookProgress(bookId) {
    const all = loadAllProgress();
    return all[String(bookId)] || null;
}

function saveBookProgress(bookId, chapterId, chapterNumber, scrollPercent) {
    if (!bookId || !chapterId) return;
    try {
        const all = loadAllProgress();
        const keys = Object.keys(all);
        // Bound storage size: keep latest 25 books
        if (keys.length > 25) {
            keys.sort((a, b) => (all[a].updatedAt || 0) - (all[b].updatedAt || 0));
            while (keys.length >= 25) {
                delete all[keys.shift()];
            }
        }
        all[String(bookId)] = {
            chapterId,
            chapterNumber,
            scrollPercent: Math.round(scrollPercent),
            updatedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(all));
    } catch {
        // Ignored
    }
}

function updateReadingProgress() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    let percent = 0;
    if (totalHeight > 0) {
        percent = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
    }

    const bar = element("reader-progress-bar");
    if (bar) {
        bar.style.width = `${percent}%`;
        bar.setAttribute("aria-valuenow", Math.round(percent));
    }

    if (state.currentChapter && state.bookId) {
        saveBookProgress(
            state.bookId,
            state.currentChapter.chapter_id,
            state.currentChapter.chapter_number,
            percent
        );
    }
}

/* --------------------------------------------------------------------------
   Drawers (TOC & Settings)
   -------------------------------------------------------------------------- */
function openDrawer(type) {
    closeDrawer();
    state.activeDrawer = type;

    const overlay = element("reader-overlay");
    const drawer = element(type === "toc" ? "reader-toc-drawer" : "reader-settings-drawer");
    const toggleBtn = element(type === "toc" ? "btn-toggle-toc" : "btn-toggle-settings");

    if (overlay && drawer) {
        overlay.hidden = false;
        drawer.hidden = false;
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");

        // Focus first actionable element
        const focusTarget = drawer.querySelector("button, select, [tabindex='0']");
        if (focusTarget) focusTarget.focus();
    }
}

function closeDrawer() {
    if (!state.activeDrawer) return;

    const overlay = element("reader-overlay");
    const tocDrawer = element("reader-toc-drawer");
    const settingsDrawer = element("reader-settings-drawer");

    if (overlay) overlay.hidden = true;
    if (tocDrawer) tocDrawer.hidden = true;
    if (settingsDrawer) settingsDrawer.hidden = true;

    element("btn-toggle-toc")?.setAttribute("aria-expanded", "false");
    element("btn-toggle-settings")?.setAttribute("aria-expanded", "false");

    state.activeDrawer = null;
}

/* --------------------------------------------------------------------------
   Table of Contents List Rendering
   -------------------------------------------------------------------------- */
function renderTableOfContents() {
    const list = element("reader-toc-list");
    const emptyNotice = element("reader-toc-empty");
    if (!list) return;

    list.replaceChildren();

    if (!state.chapters.length) {
        if (emptyNotice) emptyNotice.hidden = false;
        return;
    }

    if (emptyNotice) emptyNotice.hidden = true;

    state.chapters.forEach((chapter, index) => {
        const li = document.createElement("li");
        li.className = "reader-toc-item";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reader-toc-btn";

        const isCurrent = state.currentChapter && state.currentChapter.chapter_id === chapter.chapter_id;
        if (isCurrent) {
            btn.classList.add("is-active");
            btn.setAttribute("aria-current", "page");
        }

        const numSpan = document.createElement("span");
        numSpan.className = "toc-chapter-number";
        numSpan.textContent = `Ch. ${chapter.chapter_number}`;

        const titleSpan = document.createElement("span");
        titleSpan.className = "toc-chapter-title";
        titleSpan.textContent = chapter.title || "Untitled chapter";

        btn.append(numSpan, titleSpan);

        btn.addEventListener("click", () => {
            closeDrawer();
            if (!isCurrent) {
                loadChapter(chapter.chapter_id);
            }
        });

        li.append(btn);
        list.append(li);
    });
}

/* --------------------------------------------------------------------------
   Safe Content Rendering (XSS Protection)
   -------------------------------------------------------------------------- */
function renderChapterContent(chapter) {
    const article = element("reader-content");
    const heading = element("reader-chapter-title");
    const eyebrow = element("reader-chapter-eyebrow");
    const bodyContainer = element("reader-body-paragraphs");

    if (!article || !bodyContainer) return;

    // Set page and header titles
    const chapterTitleText = typeof chapter.title === "string" && chapter.title.trim()
        ? chapter.title
        : "Untitled chapter";
    const bookTitleText = state.book?.title || "Book";
    document.title = `${chapterTitleText} — ${bookTitleText} | Digital Library`;

    if (heading) heading.textContent = chapterTitleText;
    if (eyebrow) eyebrow.textContent = `Chapter ${chapter.chapter_number}`;

    const indicator = element("reader-chapter-indicator");
    if (indicator) {
        indicator.textContent = `Chapter ${chapter.chapter_number} of ${state.chapters.length}`;
    }

    // Safely parse and format chapter content using textContent
    bodyContainer.replaceChildren();

    const rawContent = typeof chapter.content === "string" ? chapter.content.trim() : "";

    if (!rawContent) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "muted empty-state";
        emptyMsg.textContent = "This chapter has no text content available.";
        bodyContainer.append(emptyMsg);
    } else {
        // Split by double newlines or single newlines into paragraphs
        const paragraphs = rawContent.split(/\r?\n\s*\r?\n/);

        for (const paraText of paragraphs) {
            const trimmed = paraText.trim();
            if (!trimmed) continue;

            const p = document.createElement("p");
            // If the paragraph has single line breaks within it, preserve them
            const lines = trimmed.split(/\r?\n/);
            lines.forEach((line, idx) => {
                if (idx > 0) {
                    p.append(document.createElement("br"));
                }
                p.append(document.createTextNode(line));
            });
            bodyContainer.append(p);
        }
    }

    // Update Navigation buttons
    const prevBtn = element("btn-prev-chapter");
    const nextBtn = element("btn-next-chapter");

    if (prevBtn) {
        prevBtn.disabled = state.currentChapterIndex <= 0;
    }
    if (nextBtn) {
        nextBtn.disabled = state.currentChapterIndex >= state.chapters.length - 1;
    }

    renderTableOfContents();

    element("reader-loading").hidden = true;
    element("reader-error").hidden = true;
    article.hidden = false;
    element("reader-bottom-nav").hidden = false;
}

/* --------------------------------------------------------------------------
   Chapter Navigation & Loading
   -------------------------------------------------------------------------- */
async function loadChapter(chapterId, restoreScrollPercent = null) {
    stopAutoScroll();

    const targetIndex = state.chapters.findIndex((c) => c.chapter_id === Number(chapterId));
    if (targetIndex === -1) {
        showError("Chapter not found in this book.");
        return;
    }

    state.currentChapterIndex = targetIndex;

    element("reader-loading").hidden = false;
    element("reader-error").hidden = true;
    element("reader-content").hidden = true;
    element("reader-bottom-nav").hidden = true;

    try {
        const response = await api.get(`/chapters/${encodeURIComponent(String(chapterId))}`);
        const chapter = response?.data?.chapter;
        if (!chapter || typeof chapter !== "object") {
            throw new Error("Unable to retrieve chapter content.");
        }

        state.currentChapter = chapter;

        // Update URL to match current chapter without refreshing page
        const newUrl = `${window.location.pathname}?bookId=${encodeURIComponent(state.bookId)}&chapterId=${encodeURIComponent(chapterId)}`;
        window.history.replaceState(null, "", newUrl);

        renderChapterContent(chapter);

        // Scroll management
        if (restoreScrollPercent !== null && restoreScrollPercent > 0) {
            setTimeout(() => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (totalHeight > 0) {
                    const targetY = (restoreScrollPercent / 100) * totalHeight;
                    window.scrollTo({ top: targetY, behavior: "smooth" });
                }
            }, 100);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        updateReadingProgress();
    } catch (err) {
        showError(friendlyError(err));
    }
}

function friendlyError(error) {
    if (!error || typeof error.status !== "number") {
        return error?.message || "Could not load reader. Check your connection and try again.";
    }
    if (error.status === 401) {
        return "Please log in to read books in the library.";
    }
    if (error.status === 403) {
        return "You do not have permission to read this book or chapter.";
    }
    if (error.status === 404) {
        return "This book or chapter is not available. It may be unpublished or does not exist.";
    }
    if (error.status === 429) {
        return "Too many requests. Please wait a moment and try again.";
    }
    if (error.status >= 500) {
        return "The library server is temporarily unavailable. Please try again later.";
    }
    return "The requested reading operation failed. Please try again.";
}

function showError(msg) {
    element("reader-loading").hidden = true;
    element("reader-content").hidden = true;
    element("reader-bottom-nav").hidden = true;
    const err = element("reader-error");
    if (err) {
        err.textContent = msg;
        err.hidden = false;
    }
}

/* --------------------------------------------------------------------------
   Auto-Scroll Engine
   -------------------------------------------------------------------------- */
function startAutoScroll() {
    if (state.autoScroll.intervalId) clearInterval(state.autoScroll.intervalId);

    state.autoScroll.active = true;
    state.autoScroll.paused = false;

    const bar = element("reader-autoscroll-bar");
    if (bar) bar.hidden = false;

    const statusText = element("autoscroll-status-text");
    if (statusText) statusText.textContent = "Auto-scroll: Running";

    const pauseBtn = element("btn-autoscroll-pause");
    if (pauseBtn) pauseBtn.textContent = "Pause";

    const step = AUTO_SCROLL_SPEEDS[state.autoScroll.speed] || 2;

    state.autoScroll.intervalId = setInterval(() => {
        if (state.autoScroll.paused) return;

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY >= maxScroll - 2) {
            stopAutoScroll();
            ui.showToast("Reached the end of the chapter.", "info", 3000);
            return;
        }

        window.scrollBy(0, step);
    }, 25);
}

function pauseAutoScroll() {
    if (!state.autoScroll.active) return;
    state.autoScroll.paused = !state.autoScroll.paused;

    const statusText = element("autoscroll-status-text");
    const pauseBtn = element("btn-autoscroll-pause");

    if (state.autoScroll.paused) {
        if (statusText) statusText.textContent = "Auto-scroll: Paused";
        if (pauseBtn) pauseBtn.textContent = "Resume";
    } else {
        if (statusText) statusText.textContent = "Auto-scroll: Running";
        if (pauseBtn) pauseBtn.textContent = "Pause";
    }
}

function setAutoScrollSpeed(speed) {
    if (!AUTO_SCROLL_SPEEDS[speed]) return;
    state.autoScroll.speed = speed;

    document.querySelectorAll(".autoscroll-speed-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.speed === speed);
    });

    if (state.autoScroll.active && !state.autoScroll.paused) {
        startAutoScroll();
    }
}

function stopAutoScroll() {
    if (state.autoScroll.intervalId) {
        clearInterval(state.autoScroll.intervalId);
        state.autoScroll.intervalId = null;
    }
    state.autoScroll.active = false;
    state.autoScroll.paused = false;

    const bar = element("reader-autoscroll-bar");
    if (bar) bar.hidden = true;
}

/* --------------------------------------------------------------------------
   Event Listeners & Controls Binding
   -------------------------------------------------------------------------- */
function bindEventListeners() {
    // 1. Drawers Toggles & Overlay
    element("btn-toggle-toc")?.addEventListener("click", () => {
        state.activeDrawer === "toc" ? closeDrawer() : openDrawer("toc");
    });
    element("btn-close-toc")?.addEventListener("click", closeDrawer);

    element("btn-toggle-settings")?.addEventListener("click", () => {
        state.activeDrawer === "settings" ? closeDrawer() : openDrawer("settings");
    });
    element("btn-close-settings")?.addEventListener("click", closeDrawer);
    element("reader-overlay")?.addEventListener("click", closeDrawer);

    element("btn-footer-toc")?.addEventListener("click", () => openDrawer("toc"));

    // 2. Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeDrawer();
            if (state.autoScroll.active) stopAutoScroll();
            return;
        }

        // Alt + Arrow keys for chapter navigation
        if (e.altKey && e.key === "ArrowLeft") {
            element("btn-prev-chapter")?.click();
        } else if (e.altKey && e.key === "ArrowRight") {
            element("btn-next-chapter")?.click();
        }
    });

    // 3. Chapter Prev / Next
    element("btn-prev-chapter")?.addEventListener("click", () => {
        if (state.currentChapterIndex > 0) {
            const prev = state.chapters[state.currentChapterIndex - 1];
            loadChapter(prev.chapter_id);
        }
    });

    element("btn-next-chapter")?.addEventListener("click", () => {
        if (state.currentChapterIndex < state.chapters.length - 1) {
            const next = state.chapters[state.currentChapterIndex + 1];
            loadChapter(next.chapter_id);
        }
    });

    // 4. Themes
    document.querySelectorAll(".theme-option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const theme = btn.dataset.theme;
            if (ALLOWED_THEMES.has(theme)) updatePreference("theme", theme);
        });
    });

    // 5. Font Family
    element("select-font-family")?.addEventListener("change", (e) => {
        const val = e.target.value;
        if (ALLOWED_FONTS.has(val)) updatePreference("fontFamily", val);
    });

    // 6. Font Size Stepper
    element("btn-font-dec")?.addEventListener("click", () => {
        const nextSize = Math.max(MIN_FONT_SIZE, state.preferences.fontSize - FONT_SIZE_STEP);
        updatePreference("fontSize", nextSize);
    });

    element("btn-font-inc")?.addEventListener("click", () => {
        const nextSize = Math.min(MAX_FONT_SIZE, state.preferences.fontSize + FONT_SIZE_STEP);
        updatePreference("fontSize", nextSize);
    });

    // 7. Line Height
    document.querySelectorAll("[data-lineheight]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const lh = btn.dataset.lineheight;
            if (ALLOWED_LINE_HEIGHTS.has(lh)) updatePreference("lineHeight", lh);
        });
    });

    // 8. Reading Width
    document.querySelectorAll("[data-width]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const w = btn.dataset.width;
            if (ALLOWED_WIDTHS.has(w)) updatePreference("readingWidth", w);
        });
    });

    // 9. Reset Settings
    element("btn-reset-settings")?.addEventListener("click", resetPreferences);

    // 10. Auto-scroll controls
    element("btn-toggle-autoscroll")?.addEventListener("click", () => {
        if (state.autoScroll.active) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
    });

    element("btn-autoscroll-pause")?.addEventListener("click", pauseAutoScroll);
    element("btn-autoscroll-stop")?.addEventListener("click", stopAutoScroll);

    document.querySelectorAll(".autoscroll-speed-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            setAutoScrollSpeed(btn.dataset.speed);
        });
    });

    // 11. Scroll progress listener (throttled)
    let scrollTimeout = null;
    window.addEventListener("scroll", () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                scrollTimeout = null;
                updateReadingProgress();
            }, 60);
        }
    }, { passive: true });

    // 12. Resume Banner Actions
    element("btn-resume-confirm")?.addEventListener("click", () => {
        element("reader-resume-banner").hidden = true;
        if (state.pendingResumeChapterId) {
            const savedProg = getBookProgress(state.bookId);
            loadChapter(state.pendingResumeChapterId, savedProg?.scrollPercent || 0);
        }
    });

    element("btn-resume-dismiss")?.addEventListener("click", () => {
        element("reader-resume-banner").hidden = true;
    });
}

/* --------------------------------------------------------------------------
   Initialization
   -------------------------------------------------------------------------- */
export async function init() {
    const params = new URLSearchParams(window.location.search);
    const rawBookId = params.get("bookId") || params.get("id");
    const rawChapterId = params.get("chapterId");

    const bookId = Number(rawBookId);

    if (!rawBookId || !Number.isSafeInteger(bookId) || bookId < 1) {
        showError("A valid book ID was not provided in the reader URL.");
        return;
    }

    if (!auth.isAuthenticated()) {
        showError("Please log in to read books in the Digital Library.");
        return;
    }

    // Load and apply saved reader preferences
    state.preferences = loadPreferences();
    applyPreferences();
    bindEventListeners();

    // Set Back Link to Book Page
    const backLink = element("reader-back-link");
    if (backLink) {
        backLink.href = `book.html?id=${encodeURIComponent(String(bookId))}`;
    }

    try {
        // Fetch Book metadata and Chapters list in parallel
        const [bookRes, chaptersRes] = await Promise.all([
            api.get(`/books/${encodeURIComponent(String(bookId))}`),
            api.get(`/books/${encodeURIComponent(String(bookId))}/chapters`)
        ]);

        const book = bookRes?.data?.book;
        if (!book || typeof book !== "object") {
            throw new Error("The requested book could not be found.");
        }
        state.book = book;

        const bookTitleElem = element("reader-book-title");
        if (bookTitleElem) {
            bookTitleElem.textContent = book.title || "Untitled Book";
        }

        const rawChapters = chaptersRes?.data?.chapters;
        const chapters = Array.isArray(rawChapters) ? rawChapters : [];

        // Ensure sorted by chapter_number ascending
        chapters.sort((a, b) => Number(a.chapter_number) - Number(b.chapter_number));
        state.chapters = chapters;

        if (!chapters.length) {
            showError("This book does not have any published chapters to read.");
            return;
        }

        // Determine which chapter to open
        let initialChapterId = null;
        let restoreScroll = null;

        if (rawChapterId) {
            const chId = Number(rawChapterId);
            const found = chapters.find((c) => c.chapter_id === chId);
            if (found) initialChapterId = found.chapter_id;
        }

        if (!initialChapterId) {
            // Check reading progress resume
            const progress = getBookProgress(bookId);
            if (progress && progress.chapterId) {
                const resumeChapter = chapters.find((c) => c.chapter_id === progress.chapterId);
                if (resumeChapter && resumeChapter.chapter_id !== chapters[0].chapter_id) {
                    state.pendingResumeChapterId = resumeChapter.chapter_id;
                    const resumeBanner = element("reader-resume-banner");
                    const resumeText = element("reader-resume-text");
                    if (resumeBanner && resumeText) {
                        resumeText.textContent = `Resume reading from Chapter ${resumeChapter.chapter_number}: "${resumeChapter.title}"?`;
                        resumeBanner.hidden = false;
                    }
                }
            }

            // Default to first chapter
            initialChapterId = chapters[0].chapter_id;
        }

        await loadChapter(initialChapterId, restoreScroll);
    } catch (err) {
        showError(friendlyError(err));
    }
}
