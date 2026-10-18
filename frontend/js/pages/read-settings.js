// Module 13.6 — reader typography, layout, theme and preference controls.
//
// Design constraints:
//   * Every change is a CSS custom property or a class on the reader shell.
//     Nothing here rebuilds the DOM, re-fetches data, or touches the
//     rendering pipeline in read.js.
//   * Reading position is anchored by section index plus a height fraction,
//     so font and spacing changes cannot lose the reader's place.
//   * Preferences live only in localStorage and are never sent to the server.

const STORAGE_KEY = "dl.reader.prefs.v1";
const WRITE_DEBOUNCE_MS = 300;
const GATE_TIMEOUT_MS = 5000;

const FONT_STACKS = {
    serif: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
    sans: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    dyslexia: '"Comic Sans MS", "Trebuchet MS", sans-serif'
};

// Dyslexia-friendly text gets a wider floor on letter spacing so the stack
// choice alone produces a measurable difference.
const DYSLEXIA_MIN_LETTER_SPACING = 0.03;

// Field schema. Each entry owns its own validation and its own fallback, so a
// single bad value never discards the rest of the stored preferences.
const SCHEMA = {
    fontFamily: { def: "serif", list: ["serif", "sans", "dyslexia"] },
    fontSize: { def: 17, min: 14, max: 26, step: 1 },
    lineHeight: { def: 1.75, min: 1.3, max: 2.2, step: 0.05 },
    paragraphGap: { def: 0.95, min: 0, max: 2, step: 0.1 },
    width: { def: 120, min: 28, max: 120, step: 1 },
    sideMargin: { def: 2.25, min: 0, max: 6, step: 0.25 },
    blockPadding: { def: 2, min: 0, max: 4, step: 0.5 },
    letterSpacing: { def: 0, min: -0.01, max: 0.08, step: 0.01 },
    theme: { def: "light", list: ["light", "dark", "sepia", "warmCream", "softGreen", "nightAmoled", "eyeComfort"] },
    warmth: { def: 35, min: 0, max: 100, step: 1 },
    alignment: { def: "left", list: ["left", "justify"] }
};

// Presets set typography and layout only. Theme, alignment and font family are
// deliberately left alone so choosing a preset never costs the reader a
// deliberate choice.
const PRESETS = {
    comfortable: {
        label: "Comfortable",
        values: {
            fontSize: 17,
            lineHeight: 1.75,
            paragraphGap: 0.95,
            width: 120,
            sideMargin: 2.25,
            blockPadding: 2,
            letterSpacing: 0
        }
    },
    compact: {
        label: "Compact",
        values: {
            fontSize: 15,
            lineHeight: 1.45,
            paragraphGap: 0.5,
            width: 96,
            sideMargin: 1.5,
            blockPadding: 1.5,
            letterSpacing: 0
        }
    },
    largePrint: {
        label: "Large print",
        values: {
            fontSize: 22,
            lineHeight: 1.95,
            paragraphGap: 1.3,
            width: 110,
            sideMargin: 2.25,
            blockPadding: 2.5,
            letterSpacing: 0.01
        }
    },
    distractionFree: {
        label: "Distraction-free",
        values: {
            fontSize: 18,
            lineHeight: 1.85,
            paragraphGap: 0.8,
            width: 115,
            sideMargin: 3,
            blockPadding: 2.5,
            letterSpacing: 0.02
        }
    }
};

const PRESET_FIELDS = Object.keys(PRESETS.comfortable.values);

const ANCHOR_PROBE = 120; // px below the viewport top used to pick the anchor.

/* ------------------------------------------------------------------ *
 * Chapter index
 * ------------------------------------------------------------------ */

/**
 * Extract chapter entries from the processed document.
 * Returns an object with:
 *   - entries: array of { title, page, level } where level is 1 for heading, 2 for subheading
 *   - stats: { totalHeadings, totalSubheadings, droppedNumeric, droppedShort, droppedOther, kept }
 *   - droppedItems: array of { text, page, reason } for first 20 dropped items
 * Filters out numeric-only headings and those shorter than 3 characters after trimming.
 */
export function extractChapters(processedDocument) {
    const pages = Array.isArray(processedDocument?.pages) ? processedDocument.pages : [];
    const entries = [];
    const droppedItems = [];
    let totalHeadings = 0;
    let totalSubheadings = 0;
    let droppedNumeric = 0;
    let droppedShort = 0;
    let droppedOther = 0;

    for (const page of pages) {
        const pageNumber = Number(page.pageNumber);
        if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) continue;

        const blocks = Array.isArray(page.blocks) ? page.blocks : [];
        for (const block of blocks) {
            if (!block || typeof block.kind !== "string" || typeof block.text !== "string") {
                droppedOther++;
                continue;
            }

            const kind = block.kind;
            if (kind !== "heading" && kind !== "subheading") {
                droppedOther++;
                continue;
            }

            if (kind === "heading") totalHeadings++;
            else totalSubheadings++;

            const text = block.text.trim();
            if (text.length < 3) {
                droppedShort++;
                if (droppedItems.length < 20) {
                    droppedItems.push({ text: block.text.trim(), page: pageNumber, reason: "too-short" });
                }
                continue;
            }
            if (/^\d+$/.test(text)) {
                droppedNumeric++;
                if (droppedItems.length < 20) {
                    droppedItems.push({ text: block.text.trim(), page: pageNumber, reason: "numeric-only" });
                }
                continue;
            }

            entries.push({
                title: text,
                page: pageNumber,
                level: block.kind === "heading" ? 1 : 2
            });
        }
    }

    const kept = entries.length;
    const totalBeforeFilter = totalHeadings + totalSubheadings;
    const droppedTotal = droppedNumeric + droppedShort + droppedOther;

    return {
        entries,
        stats: {
            totalHeadings,
            totalSubheadings,
            droppedNumeric,
            droppedShort,
            droppedOther,
            droppedTotal,
            kept
        },
        droppedItems
    };
}

function element(id) {
    return document.getElementById(id);
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

function validateField(name, raw) {
    const rule = SCHEMA[name];

    if (!rule) {
        return null; // unknown field, dropped by the caller
    }

    if (rule.list) {
        return typeof raw === "string" && rule.list.includes(raw)
            ? raw
            : rule.def;
    }

    const value = typeof raw === "number" ? raw : Number(raw);

    if (!Number.isFinite(value)) {
        return rule.def;
    }

    if (value < rule.min || value > rule.max) {
        return rule.def;
    }

    return value;
}

function defaultSettings() {
    const result = {};

    for (const [name, rule] of Object.entries(SCHEMA)) {
        result[name] = rule.def;
    }

    return result;
}

// Returns a fully populated, fully validated settings object. Unknown keys are
// dropped rather than carried forward.
//
// Legacy compatibility: saved payloads written before the rename carry
// `readingWidth` instead of `width`. A legacy value is used only when no
// explicit `width` is present, only when it validates, and never overrides a
// valid new value. Otherwise the default (120) applies.
function sanitise(raw) {
    const result = defaultSettings();

    if (!raw || typeof raw !== "object") {
        return result;
    }

    for (const name of Object.keys(SCHEMA)) {
        if (Object.prototype.hasOwnProperty.call(raw, name)) {
            result[name] = validateField(name, raw[name]);
        }
    }

    if (
        !Object.prototype.hasOwnProperty.call(raw, "width") &&
        Object.prototype.hasOwnProperty.call(raw, "readingWidth")
    ) {
        result.width = validateField("width", raw.readingWidth);
    }

    return result;
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

function showStorageNotice() {
    // Guarded: this runs from inside catch blocks, so it must not throw.
    if (storageNotice) {
        storageNotice.hidden = false;
    }
}

function readStored() {
    let raw;

    try {
        raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
        // Storage itself is blocked (private mode, disabled storage).
        showStorageNotice();
        return null;
    }

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);

        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    } catch {
        // Fall through: the stored value is unreadable.
    }

    // Corrupt payload: remove it so the reader starts from defaults. This is
    // not a storage failure, so no "cannot be saved" notice is shown.
    clearStored();
    return null;
}

function writeStored(payload) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return true;
    } catch {
        showStorageNotice();
        return false;
    }
}

function clearStored() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch {
        showStorageNotice();
        return false;
    }
}

/* ------------------------------------------------------------------ *
 * Applying settings
 * ------------------------------------------------------------------ */

function applySettings() {
    const settings = state.settings;
    const shell = state.shell;
    const content = state.content;

    if (!shell || !content) {
        return;
    }

    const fontStack = FONT_STACKS[settings.fontFamily] || FONT_STACKS.serif;

    const letterSpacing =
        settings.fontFamily === "dyslexia"
            ? Math.max(settings.letterSpacing, DYSLEXIA_MIN_LETTER_SPACING)
            : settings.letterSpacing;

    shell.style.setProperty("--rd-font-family", fontStack);
    shell.style.setProperty("--rd-font-size", `${settings.fontSize}px`);
    shell.style.setProperty("--rd-line-height", String(settings.lineHeight));
    shell.style.setProperty("--rd-paragraph-gap", `${settings.paragraphGap}em`);
    shell.style.setProperty("--rd-reading-width", `${settings.width}rem`);
    shell.style.setProperty("--rd-side-margin", `${settings.sideMargin}rem`);
    shell.style.setProperty("--rd-block-padding", `${settings.blockPadding}rem`);
    shell.style.setProperty("--rd-letter-spacing", `${letterSpacing}em`);
    shell.style.setProperty("--rd-text-align", settings.alignment === "justify" ? "justify" : "left");
    shell.style.setProperty("--rd-hyphens", settings.alignment === "justify" ? "auto" : "normal");

    shell.dataset.readTheme = settings.theme;

    // The page background lives on <body>, an ancestor of .read-shell, so it
    // cannot inherit the shell's theme tokens. Mirror the theme name and the
    // Eye Comfort ramp onto the body so the whole reader page repaints.
    const body = document.body;

    if (body) {
        body.dataset.readTheme = settings.theme;

        if (settings.theme === "eyeComfort") {
            const rampColor = warmthRampColor(settings.warmth);

            shell.style.setProperty("--rd-bg", rampColor);
            body.style.setProperty("--rd-page-bg", rampColor);
        } else {
            shell.style.removeProperty("--rd-bg");
            body.style.removeProperty("--rd-page-bg");
        }
    } else if (settings.theme === "eyeComfort") {
        shell.style.setProperty("--rd-bg", warmthRampColor(settings.warmth));
    } else {
        shell.style.removeProperty("--rd-bg");
    }

    content.lang = "en";
}

// Eye Comfort warmth ramp: #FAF6EA (0) → #EEDCB8 (100). Text and muted stay
// fixed across the ramp so contrast cannot degrade with warmth.
// Clamps to 0–100, falls back to the default 35 on non-numeric input,
// interpolates each channel linearly, rounds to integers, and always
// returns a valid 6-digit #RRGGBB string.
function warmthRampColor(warmth) {
    const cool = [250, 246, 234];
    const warm = [238, 220, 184];

    const parsed = Number(warmth);

    if (!Number.isFinite(parsed)) {
        return warmthRampColor(SCHEMA.warmth.def);
    }

    const t = Math.min(1, Math.max(0, parsed / 100));
    const mixed = cool.map((channel, i) =>
        Math.round(channel + (warm[i] - channel) * t)
    );

    return (
        "#" +
        mixed
            .map((channel) => Math.min(255, Math.max(0, channel)).toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase()
    );
}

// The warmth slider is only meaningful for Eye Comfort, so it is revealed
// only for that theme. The stored value is never reset by a theme change.
function syncWarmthVisibility() {
    const group = element("read-warmth-group");
    const slider = element("read-warmth");

    if (group) {
        group.hidden = state.settings.theme !== "eyeComfort";
    }

    if (slider) {
        slider.disabled = state.settings.theme !== "eyeComfort";
    }
}

/* ------------------------------------------------------------------ *
 * Reading-position anchoring
 * ------------------------------------------------------------------ */

// Picks the section nearest the top of the viewport and records how far
// through its own height the viewport has scrolled. Uses rects, not scrollTop,
// because heights change when type metrics change.
function captureAnchor() {
    const content = state.content;

    if (!content) {
        return null;
    }

    const sections = content.querySelectorAll(".read-page");

    if (!sections.length) {
        return null;
    }

    for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.bottom > ANCHOR_PROBE) {
            const height = rect.height || 1;
            const fraction = Math.min(1, Math.max(0, -rect.top / height));

            return {
                section,
                page: section.getAttribute("aria-label") || "",
                fraction
            };
        }
    }

    return null;
}

function restoreAnchor(anchor) {
    if (!anchor || !anchor.section || !anchor.section.isConnected) {
        return; // anchor section vanished; leave scroll untouched
    }

    // rect.top is the section's current offset. Subtracting it removes the
    // layout shift caused by the settings change, then the recorded fraction
    // of the *new* height is added back. No probe offset here: subtracting a
    // constant would bias every restore by that many pixels.
    const rect = anchor.section.getBoundingClientRect();
    const height = rect.height || 1;
    const target = window.scrollY + rect.top + anchor.fraction * height;

    window.scrollTo(0, Math.max(0, target));
}

// Wraps a settings mutation so every path anchors and restores consistently.
function mutate(mutator) {
    const anchor = captureAnchor();

    try {
        mutator();
        applySettings();
        syncControls();
    } finally {
        requestAnimationFrame(() => {
            restoreAnchor(anchor);
            updateProgress();
        });
    }
}

/* ------------------------------------------------------------------ *
 * Persistence plumbing
 * ------------------------------------------------------------------ */

function detectPreset(settings) {
    for (const [key, preset] of Object.entries(PRESETS)) {
        const matches = PRESET_FIELDS.every(
            (field) => Number(settings[field]) === Number(preset.values[field])
        );

        if (matches) {
            return key;
        }
    }

    return "custom";
}

function persist() {
    const preset = detectPreset(state.settings);
    state.preset = preset;

    if (writeTimer) {
        clearTimeout(writeTimer);
    }

    writeTimer = setTimeout(() => {
        writeTimer = null;

        writeStored({
            version: 2,
            preset,
            focusMode: state.focusMode,
            settings: state.settings
        });
    }, WRITE_DEBOUNCE_MS);
}

function loadState() {
    const stored = readStored();
    const raw = stored && typeof stored === "object" ? stored.settings : null;

    return {
        settings: sanitise(raw),
        focusMode: stored && stored.focusMode === true
    };
}

/* ------------------------------------------------------------------ *
 * Control wiring
 * ------------------------------------------------------------------ */

// Every listener goes through here, so one failing control cannot take the
// panel down with it.
function bind(node, event, handler) {
    if (!node) {
        return;
    }

    try {
        node.addEventListener(event, handler);
    } catch (error) {
        console.warn("Reader settings: control binding failed.", error);
    }
}

function setRange(id, value) {
    const input = element(id);

    if (!input) {
        return;
    }

    input.value = String(value);
}

function formatWidthReadout(rem) {
    return `${rem} rem (${rem * 16} px)`;
}

function updateWidthReadout() {
    const readout = element("read-reading-width-value");

    if (readout) {
        readout.textContent = formatWidthReadout(state.settings.width);
    }
}

function syncControls() {
    const settings = state.settings;

    setRange("read-font-size", settings.fontSize);
    setRange("read-line-height", settings.lineHeight);
    setRange("read-paragraph-gap", settings.paragraphGap);
    setRange("read-reading-width", settings.width);
    setRange("read-side-margin", settings.sideMargin);
    setRange("read-block-padding", settings.blockPadding);
    setRange("read-letter-spacing", settings.letterSpacing);
    setRange("read-warmth", settings.warmth);
    updateWidthReadout();

    const setOutput = (id, text) => {
        const out = element(id);
        if (out) {
            out.textContent = text;
        }
    };

    setOutput("read-font-size-value", `${settings.fontSize}px`);
    setOutput("read-line-height-value", String(settings.lineHeight));
    setOutput("read-paragraph-gap-value", `${settings.paragraphGap}em`);
    setOutput("read-side-margin-value", `${settings.sideMargin}rem`);
    setOutput("read-block-padding-value", `${settings.blockPadding}rem`);
    setOutput("read-letter-spacing-value", `${settings.letterSpacing}em`);
    setOutput("read-warmth-value", `${settings.warmth}%`);

    syncWarmthVisibility();

    const family = element("read-font-family");

    if (family) {
        family.value = settings.fontFamily;
    }

    for (const option of document.querySelectorAll('input[name="read-theme"]')) {
        option.checked = option.value === settings.theme;
    }

    for (const option of document.querySelectorAll('input[name="read-alignment"]')) {
        option.checked = option.value === settings.alignment;
    }

    const preset = state.preset || detectPreset(settings);

    for (const option of document.querySelectorAll('input[name="read-preset"]')) {
        option.checked = option.value === preset;
    }
}

function announce(message) {
    const region = element("read-live");

    if (region) {
        region.textContent = message;
    }
}

/* ------------------------------------------------------------------ *
 * Panel behaviour
 * ------------------------------------------------------------------ */

function isPanelOpen() {
    return state.panel && !state.panel.hidden;
}

function openPanel() {
    const panel = state.panel;
    const trigger = state.trigger;

    if (!panel || !trigger) {
        return;
    }

    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");

    const first = panel.querySelector("select, input, button");

    if (first) {
        first.focus();
    }
}

function closePanel() {
    const panel = state.panel;
    const trigger = state.trigger;

    if (!panel || !trigger) {
        return;
    }

    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
}

function toggleFocusMode(force, options) {
    const next = typeof force === "boolean" ? force : !state.focusMode;
    const moveFocus = !(options && options.restoring);

    state.focusMode = next;

    // Entering Focus Mode closes the settings panel. Focus Mode hides the panel
    // with CSS only, so its hidden flag must also be set, or Escape would close
    // an invisible panel instead of leaving Focus Mode.
    if (next && state.panel && !state.panel.hidden) {
        state.panel.hidden = true;

        if (state.trigger) {
            state.trigger.setAttribute("aria-expanded", "false");
        }
    }

    const body = document.body;

    if (body) {
        body.dataset.readFocus = next ? "on" : "off";
    }

    const toggle = state.focusToggle;
    const exit = state.focusExit;

    if (toggle) {
        toggle.setAttribute("aria-pressed", next ? "true" : "false");
    }

    if (exit) {
        exit.hidden = !next;
        exit.setAttribute("aria-pressed", next ? "true" : "false");
    }

    // Focus moves only after a user action. Restoring Focus Mode on page load
    // must not steal focus.
    if (moveFocus) {
        if (next) {
            if (exit) {
                exit.focus();
            }
        } else if (toggle) {
            toggle.focus();
        }
    }

    announce(next ? "Focus mode on." : "Focus mode off.");
    persist();
}

/* ------------------------------------------------------------------ *
 * Progress bar
 * ------------------------------------------------------------------ */

function updateProgress() {
    const content = state.content;
    const bar = state.progressBar;

    if (!content || !bar || !state.gateOpen) {
        return;
    }

    const rect = content.getBoundingClientRect();
    const scrollable = Math.max(content.offsetHeight - window.innerHeight, 0);
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
    const percent = scrollable > 0 ? (scrolled / scrollable) * 100 : 0;

    bar.style.width = `${percent.toFixed(2)}%`;
}

let progressFrame = null;

function onScroll() {
    if (progressFrame !== null) {
        return;
    }

    progressFrame = requestAnimationFrame(() => {
        progressFrame = null;
        updateProgress();
    });
}

/* ------------------------------------------------------------------ *
 * Render gate
 * ------------------------------------------------------------------ */

function openGate() {
    if (state.gateOpen) {
        return;
    }

    state.gateOpen = true;

    if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }

    if (state.gateTimer) {
        clearTimeout(state.gateTimer);
        state.gateTimer = null;
    }

    bind(window, "scroll", onScroll);
    bind(window, "resize", onScroll);

    updateProgress();

    // Module 13.7 — release anything waiting behind the gate. The chapter
    // drawer is built from the rendered sections, so it must not be wired up
    // before they exist. Resolving here keeps that ordering in one place
    // rather than in every caller.
    releaseGate();
}

function closeGate(reason) {
    if (state.gateOpen) {
        return;
    }

    if (reason === "timeout") {
        console.warn(
            "Reader settings: render gate timed out; anchoring may use a partial document."
        );
    }

    openGate();
}

// Normal exit is the rendered-section count reaching the expected total.
// The time cap is a fallback only: on a slow device with a large DOM it can
// fire while chunks are still pending, which is why it logs rather than
// failing silently.
function watchForRenderedSections(expected) {
    const content = state.content;

    const count = () => content.querySelectorAll(".read-page").length;

    if (count() >= expected) {
        openGate();
        return;
    }

    let observer = null;

    try {
        observer = new MutationObserver(() => {
            if (count() >= expected) {
                closeGate("count");
            }
        });

        observer.observe(content, { childList: true });

        state.observer = observer;
    } catch (error) {
        console.warn("Reader settings: render observer unavailable.", error);
        openGate();
        return;
    }

    state.gateTimer = setTimeout(() => closeGate("timeout"), GATE_TIMEOUT_MS);
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

let storageNotice = null;
let writeTimer = null;

// Module 13.7 — gate waiters. initSettings returns a promise that settles
// when the render gate opens, or immediately on the paths that never reach
// the gate (no content, or a failure inside initSettings). It always
// settles, so a broken settings module cannot leave a caller hanging or
// throw inside the reader's own error handling.
let gateWaiters = [];

function releaseGate() {
    if (gateWaiters.length === 0) {
        return;
    }

    const waiting = gateWaiters;
    gateWaiters = [];

    for (const resolve of waiting) {
        resolve();
    }
}

const state = {
    shell: null,
    content: null,
    panel: null,
    trigger: null,
    focusToggle: null,
    focusExit: null,
    progressBar: null,
    observer: null,
    gateTimer: null,
    gateOpen: false,
    focusMode: false,
    preset: "comfortable",
    settings: defaultSettings()
};

export function initSettings(options) {
    // The returned promise settles when the render gate opens, so a caller can
    // defer work that reads the rendered sections. It resolves rather than
    // rejects on every failure path: a rejected promise would be caught by the
    // reader's outer handler and shown as a document error.
    return new Promise((resolve) => {
        gateWaiters.push(resolve);

        try {
            const content = options && options.content ? options.content : null;

            if (!content) {
                releaseGate();
                return;
            }

        const article = content.closest(".read-shell") || content.parentElement;
            const expected =
                options && Number.isFinite(options.expectedPages) && options.expectedPages > 0
                    ? Math.floor(options.expectedPages)
                    : 0;

            state.shell = article;
            state.content = content;
            state.panel = element("read-settings-panel");
            state.trigger = element("read-settings-trigger");
            state.focusToggle = element("read-focus-toggle");
            state.focusExit = element("read-focus-exit");
            state.progressBar = element("read-progress-bar");
            storageNotice = element("read-storage-notice");

            const loaded = loadState();

            state.settings = loaded.settings;
            state.focusMode = loaded.focusMode;
            state.preset = detectPreset(state.settings);

            applySettings();
            syncControls();

            if (loaded.focusMode) {
                toggleFocusMode(true, { restoring: true });
            }

            bindControls();
            watchForRenderedSections(expected);

            // expectedPages of 0 or a non-array page list means there is
            // nothing to wait for, so open immediately rather than idling
            // behind a gate. openGate() releases the waiters.
            if (expected === 0) {
                openGate();
            }
        } catch (error) {
            console.warn("Reader settings unavailable:", error);

            // Settle anyway, so a failed settings module still lets the
            // chapter drawer initialise rather than leaving it unwired.
            releaseGate();
        }
    });
}

function bindControls() {
    bind(state.trigger, "click", () => {
        if (isPanelOpen()) {
            closePanel();
        } else {
            openPanel();
        }
    });

    bind(element("read-settings-close"), "click", closePanel);
    bind(state.focusToggle, "click", () => {
        // Routed through mutate() so the section-and-fraction anchor keeps
        // the reading position when chrome is shown or hidden.
        mutate(() => toggleFocusMode());
    });
    bind(state.focusExit, "click", () => {
        mutate(() => toggleFocusMode(false));
    });

    bind(element("read-restore-defaults"), "click", () => {
        mutate(() => {
            state.settings = defaultSettings();
            state.preset = "comfortable";
            state.focusMode = false;

            const body = document.body;

            if (body) {
                body.dataset.readFocus = "off";
            }

            if (state.focusToggle) {
                state.focusToggle.setAttribute("aria-pressed", "false");
            }

            // Restore defaults leaves Focus Mode, so the floating exit button
            // must hide too.
            if (state.focusExit) {
                state.focusExit.hidden = true;
                state.focusExit.setAttribute("aria-pressed", "false");
            }
        });

        if (writeTimer) {
            clearTimeout(writeTimer);
            writeTimer = null;
        }

        clearStored();
        announce("All reading settings restored to defaults.");
    });

    bind(document, "keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (isPanelOpen()) {
            event.preventDefault();
            closePanel();
            return;
        }

        if (state.focusMode) {
            event.preventDefault();
            mutate(() => toggleFocusMode(false));
        }
    });

    for (const option of document.querySelectorAll('input[name="read-preset"]')) {
        bind(option, "change", () => {
            const key = option.value;
            const preset = PRESETS[key];

            if (!preset) {
                return;
            }

            mutate(() => {
                for (const field of PRESET_FIELDS) {
                    state.settings[field] = preset.values[field];
                }

                state.preset = key;
            });

            persist();
            announce(`${preset.label} preset applied.`);
        });
    }

    for (const option of document.querySelectorAll('input[name="read-theme"]')) {
        bind(option, "change", () => {
            mutate(() => {
                state.settings.theme = option.value;
            });

            persist();
            announce(`${option.value} theme applied.`);
        });
    }

    for (const option of document.querySelectorAll('input[name="read-alignment"]')) {
        bind(option, "change", () => {
            mutate(() => {
                state.settings.alignment = option.value;
            });

            persist();
            announce(`${option.value === "justify" ? "Justified" : "Left"} alignment applied.`);
        });
    }

    bind(element("read-font-family"), "change", (event) => {
        const value = event.target.value;

        mutate(() => {
            state.settings.fontFamily = validateField("fontFamily", value);
        });

        persist();
    });

    const ranges = [
        ["read-font-size", "fontSize", "px"],
        ["read-line-height", "lineHeight", ""],
        ["read-paragraph-gap", "paragraphGap", "em"],
        ["read-reading-width", "width", "rem"],
        ["read-side-margin", "sideMargin", "rem"],
        ["read-block-padding", "blockPadding", "rem"],
        ["read-letter-spacing", "letterSpacing", "em"],
        ["read-warmth", "warmth", "%"]
    ];

    for (const [id, field, unit] of ranges) {
        bind(element(id), "input", (event) => {
            const raw = Number(event.target.value);

            mutate(() => {
                state.settings[field] = validateField(field, raw);
            });

            if (field === "width") {
                updateWidthReadout();
            } else {
                const readout = element(`${id}-value`);

                if (readout) {
                    readout.textContent = `${state.settings[field]}${unit}`;
                }
            }

            state.preset = detectPreset(state.settings);

            for (const option of document.querySelectorAll('input[name="read-preset"]')) {
                option.checked = option.value === state.preset;
            }

            persist();
        });
    }

    for (const button of document.querySelectorAll("[data-width]")) {
        bind(button, "click", () => {
            const raw = Number(button.getAttribute("data-width"));

            mutate(() => {
                state.settings.width = validateField("width", raw);
            });

            setRange("read-reading-width", state.settings.width);
            updateWidthReadout();

            state.preset = detectPreset(state.settings);

            for (const option of document.querySelectorAll('input[name="read-preset"]')) {
                option.checked = option.value === state.preset;
            }

            persist();
        });
    }

    bind(element("read-reading-width"), "keydown", (event) => {
        if (event.key !== "PageUp" && event.key !== "PageDown") {
            return;
        }

        event.preventDefault();

        const delta = event.key === "PageUp" ? 8 : -8;
        const slider = element("read-reading-width");

        if (!slider) {
            return;
        }

        const raw = Number(slider.value) + delta;

        mutate(() => {
            state.settings.width = validateField("width", raw);
        });

        setRange("read-reading-width", state.settings.width);
        updateWidthReadout();

        state.preset = detectPreset(state.settings);

        for (const option of document.querySelectorAll('input[name="read-preset"]')) {
            option.checked = option.value === state.preset;
        }

        persist();
    });

    // Settings tabs (Reading / Typography / Voice)
    // Wired here so tab switching is completely self-contained within read-settings.js.
    const tabs = state.panel ? [...state.panel.querySelectorAll(".read-tab")] : [];
    const tabPanels = {
        reading: element("read-tab-reading"),
        typography: element("read-tab-typography"),
        voice: element("read-tab-voice")
    };

    function activateTab(key) {
        for (const tab of tabs) {
            tab.setAttribute("aria-selected", String(tab.dataset.tab === key));
        }

        for (const [name, panel] of Object.entries(tabPanels)) {
            if (panel) {
                panel.hidden = name !== key;
            }
        }
    }

    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        bind(tab, "click", () => activateTab(tab.dataset.tab));
        bind(tab, "keydown", (e) => {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                const next = tabs[(i + 1) % tabs.length];
                next.focus();
                activateTab(next.dataset.tab);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prev = tabs[(i - 1 + tabs.length) % tabs.length];
                prev.focus();
                activateTab(prev.dataset.tab);
            }
        });
    }

    activateTab("reading");
}