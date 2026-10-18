// Module 14.1 — browser text-to-speech inside the EXISTING bottom bar (.read-actions).
// The bar is never resized: buttons are swapped with `hidden`. Sentence highlighting uses the
// CSS Custom Highlight API (no DOM changes); older browsers highlight the current block.

const PREFS_KEY = "dl.reader.audio.v1"; // separate key: read-settings.js rewrites/clears its own
const RATE = { min: 0.5, max: 4, def: 1 };
const PITCH = { min: 0, max: 2, def: 1 };
const MAX_UNIT = 300;
const EDGE = 24;
const USER_SCROLL_HOLD_MS = 4000;
const SPEAK_DELAY_MS = 60;
const HIGHLIGHT_NAME = "tts-sentence";
const BLOCK_SELECTOR = ".read-h2, .read-h3, .read-paragraph, .read-list-item, .read-caption, .read-toc";
const LABELS = { ready: "Ready", playing: "Playing", paused: "Paused", stopped: "Stopped", finished: "Finished", error: "Speech error" };
const SPEAKABLE = /[\p{L}\p{N}]/u;
const WS = /\s/;

// Chrome silently stalls on long utterances; this watchdog detects it.
const WATCHDOG_INTERVAL_MS = 5000;
const WATCHDOG_STALL_MS = 10000;

let started = false;

/* ---------------- Preferences ---------------- */

function clampNum(value, range) {
    return typeof value === "number" && Number.isFinite(value) && value >= range.min && value <= range.max
        ? value
        : range.def;
}

function loadPrefs() {
    const prefs = { voiceURI: "", rate: RATE.def, pitch: PITCH.def };

    try {
        const parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) || "null");

        if (parsed && typeof parsed === "object") {
            prefs.voiceURI = typeof parsed.voiceURI === "string" ? parsed.voiceURI : "";
            prefs.rate = clampNum(parsed.rate, RATE);
            prefs.pitch = clampNum(parsed.pitch, PITCH);
        }
    } catch {
        // Blocked or corrupt storage: defaults apply.
    }

    return prefs;
}

function savePrefs(prefs) {
    try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // Preferences are optional.
    }
}

/* ---------------- Sentence model ---------------- */

function findCut(text, from) {
    const limit = from + MAX_UNIT;

    for (let i = limit - 1; i > from + MAX_UNIT / 2; i--) {
        if (",;:".includes(text[i]) && WS.test(text[i + 1] || " ")) {
            return i + 1;
        }
    }

    for (let i = limit; i > from; i--) {
        if (WS.test(text[i] || " ")) {
            return i;
        }
    }

    return limit;
}

// Adds [start, end) spans; over-long sentences are split so one utterance stays short.
function pushSpan(out, text, start, end) {
    let s = start;
    let e = end;

    while (s < e && WS.test(text[s])) s++;
    while (e > s && WS.test(text[e - 1])) e--;

    while (e - s > MAX_UNIT) {
        const cut = findCut(text, s);
        let pieceEnd = cut;

        while (pieceEnd > s && WS.test(text[pieceEnd - 1])) pieceEnd--;

        if (pieceEnd > s) {
            out.push([s, pieceEnd]);
        }

        s = cut;

        while (s < e && WS.test(text[s])) s++;
    }

    if (e > s) {
        out.push([s, e]);
    }
}

// Common abbreviations that should not end a sentence on their own.
// Conservative, short list only — anything not here still splits as before.
const ABBREVIATIONS = new Set([
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "capt", "gen", "col",
    "lt", "cmdr", "rev", "hon", "no", "vol", "fig", "approx", "etc", "vs", "al"
]);

function wordBefore(text, index) {
    const match = /([A-Za-z]+)$/.exec(text.slice(0, index));
    return match ? match[1].toLowerCase() : "";
}

function sentenceSpans(text) {
    const out = [];
    const end = /[.!?…]+["'"')\]]*(?=\s|$)/g;
    let last = 0;
    let match;

    while ((match = end.exec(text)) !== null) {
        const stop = match.index + match[0].length;

        // A lone period right after a known abbreviation is usually not a
        // sentence end (e.g. "Dr. Smith"); keep accumulating instead.
        if (match[0] === "." && ABBREVIATIONS.has(wordBefore(text, match.index))) {
            continue;
        }

        pushSpan(out, text, last, stop);
        last = stop;
    }

    pushSpan(out, text, last, text.length);
    return out;
}

function textNodes(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
        nodes.push(node);
    }

    return nodes;
}

function makeRange(block, start, end) {
    const range = document.createRange();
    let offset = 0;
    let begun = false;

    for (const node of textNodes(block)) {
        const length = node.data.length;

        if (!begun && start < offset + length) {
            range.setStart(node, start - offset);
            begun = true;
        }

        if (begun && end <= offset + length) {
            range.setEnd(node, end - offset);
            return range;
        }

        offset += length;
    }

    return null;
}

function buildModel(content) {
    const blocks = [...content.querySelectorAll(BLOCK_SELECTOR)];
    const units = [];
    const firstUnit = [];

    blocks.forEach((block, blockIndex) => {
        firstUnit[blockIndex] = units.length;

        const text = textNodes(block).map((node) => node.data).join("");

        for (const [start, end] of sentenceSpans(text)) {
            const spoken = text.slice(start, end).replace(/\s+/g, " ");

            if (SPEAKABLE.test(spoken)) {
                units.push({ block, blockIndex, start, end, text: spoken });
            }
        }
    });

    firstUnit[blocks.length] = units.length;

    return { blocks, units, firstUnit };
}

function isVisible(node) {
    if (!node) {
        return false;
    }

    const rect = node.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== "hidden";
}

function pageOf(block) {
    const label = block.closest(".read-page")?.getAttribute("aria-label") || "";
    const match = /^Page (\d+)$/.exec(label);
    return match ? Number(match[1]) : null;
}

/* ---------------- Public entry ---------------- */

export function initTts({ content } = {}) {
    if (started) {
        return;
    }

    started = true;

    try {
        setup(content);
    } catch (error) {
        console.warn("Audio reader unavailable:", error);
    }
}

function setup(content) {
    const byId = (id) => document.getElementById(id);
    const actions = document.querySelector(".read-actions");
    const els = {
        open: byId("read-audio-open"),
        chapters: byId("read-chapters-trigger"),
        settings: byId("read-settings-trigger"),
        focus: byId("read-focus-toggle"),
        prev: byId("read-audio-prev"),
        play: byId("read-audio-play"),
        next: byId("read-audio-next"),
        stop: byId("read-audio-stop"),
        voice: byId("read-audio-voice"),
        speed: byId("read-audio-speed"),
        speedValue: byId("read-audio-speed-value"),
        pitch: byId("read-audio-pitch"),
        pitchValue: byId("read-audio-pitch-value"),
        note: byId("read-audio-note"),
        live: byId("read-audio-live")
    };

    if (!content || !actions || Object.values(els).some((node) => !node)) {
        return;
    }

    const chaptersPanel = byId("read-chapters-panel");
    const settingsPanel = byId("read-settings-panel");
    const body = document.body;
    const normalButtons = [els.open, els.chapters, els.settings, els.focus];
    const playbackButtons = [els.prev, els.play, els.next, els.stop];

    const supported = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
    const synth = supported ? window.speechSynthesis : null;
    const prefs = loadPrefs();

    const cleanups = [];
    const listen = (target, type, handler, options) => {
        target.addEventListener(type, handler, options);
        cleanups.push(() => target.removeEventListener(type, handler, options));
    };

    let mode = "normal";
    let state = "ready";
    let session = 0;
    let model = null;
    let dirty = false;
    let pos = -1; // selected / spoken sentence, -1 = none
    let utterance = null;
    let speakTimer = 0;
    let voices = [];
    let forceDefault = false;
    let userScrollUntil = 0;
    let watchdogTimer = 0;
    let lastSpeechEventTime = 0;

    /* ---- Highlight ---- */

    const highlight =
        typeof window.Highlight === "function" && window.CSS && CSS.highlights ? new window.Highlight() : null;
    let fallbackBlock = null;

    if (highlight) {
        CSS.highlights.set(HIGHLIGHT_NAME, highlight);
    }

    function clearMark() {
        if (highlight) {
            highlight.clear();
        }

        if (fallbackBlock) {
            fallbackBlock.removeAttribute("data-tts-active");
            fallbackBlock = null;
        }
    }

    function mark(unit) {
        clearMark();

        if (highlight) {
            const range = makeRange(unit.block, unit.start, unit.end);

            if (range) {
                highlight.add(range);
                return range;
            }
        }

        unit.block.setAttribute("data-tts-active", "true");
        fallbackBlock = unit.block;
        return null;
    }

    /* ---- Scrolling: bounds come from the real bar, which is never modified ---- */

    function bounds() {
        let top = 0;

        for (const node of [byId("site-header"), byId("read-topbar")]) {
            if (isVisible(node)) {
                top = Math.max(top, node.getBoundingClientRect().bottom);
            }
        }

        let bottom = window.innerHeight;

        if (isVisible(actions)) {
            bottom = Math.min(bottom, actions.getBoundingClientRect().top);
        }

        return { top, bottom };
    }

    function reducedMotion() {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function reveal(range, unit, force) {
        if (!force && Date.now() < userScrollUntil) {
            return;
        }

        const rect = range ? range.getBoundingClientRect() : unit.block.getBoundingClientRect();

        if (!rect || (rect.width === 0 && rect.height === 0)) {
            return;
        }

        const { top, bottom } = bounds();
        const minTop = top + EDGE;
        const maxBottom = bottom - EDGE;
        const available = maxBottom - minTop;

        if (available < 40 || (rect.top >= minTop && rect.bottom <= maxBottom)) {
            return;
        }

        const target =
            rect.height > available * 0.8
                ? window.scrollY + rect.top - minTop
                : window.scrollY + rect.top - (minTop + (available - rect.height) / 3);

        window.scrollTo({ top: Math.max(0, target), behavior: reducedMotion() ? "auto" : "smooth" });
    }

    // Manual scrolling pauses automatic scrolling briefly so it never fights the reader.
    const noteUserScroll = () => {
        userScrollUntil = Date.now() + USER_SCROLL_HOLD_MS;
    };

    listen(window, "wheel", noteUserScroll, { passive: true });
    listen(window, "touchmove", noteUserScroll, { passive: true });
    listen(window, "keydown", (event) => {
        if (
            ["PageUp", "PageDown", "Home", "End"].includes(event.key) &&
            !(event.target.closest && event.target.closest("input, select, textarea, button"))
        ) {
            noteUserScroll();
        }
    });

    /* ---- Watchdog: Chrome stalls on long utterances ---- */

    function stopWatchdog() {
        if (watchdogTimer) {
            clearInterval(watchdogTimer);
            watchdogTimer = 0;
        }
    }

    function startWatchdog(id) {
        stopWatchdog();
        lastSpeechEventTime = Date.now();

        watchdogTimer = setInterval(() => {
            if (id !== session || state !== "playing") {
                stopWatchdog();
                return;
            }

            // Check if the synth says it's speaking but we haven't received
            // any events in a long time — this is Chrome's stall bug.
            if (synth && synth.speaking && !synth.paused) {
                const elapsed = Date.now() - lastSpeechEventTime;

                if (elapsed > WATCHDOG_STALL_MS) {
                    // Stall detected: cancel and restart from the same sentence.
                    console.warn("TTS watchdog: speech engine stalled, restarting sentence", pos);

                    invalidate();
                    const newId = session;

                    setState("playing");
                    focusUnit(false);
                    schedule(newId);
                }
            }
        }, WATCHDOG_INTERVAL_MS);
    }

    /* ---- UI state ---- */

    function announce(text) {
        els.live.textContent = text;
    }

    function emit() {
        const unit = pos >= 0 && model ? model.units[pos] : null;

        document.dispatchEvent(
            new CustomEvent("reader:tts-position", {
                detail: {
                    state,
                    sentence: unit ? pos + 1 : null,
                    total: model ? model.units.length : 0,
                    paragraph: unit ? unit.blockIndex + 1 : null,
                    page: unit ? pageOf(unit.block) : null
                }
            })
        );
    }

    function render() {
        const label =
            state === "playing"
                ? "Pause"
                : state === "paused"
                  ? "Resume"
                  : state === "finished"
                    ? "Replay"
                    : state === "error"
                      ? "Retry from this sentence"
                      : "Play";

        els.play.dataset.mode = state === "playing" ? "pause" : "play";
        els.play.dataset.state = state;
        els.play.setAttribute("aria-label", label);
        els.play.title = label;

        // Update prev/next disabled state at boundaries.
        if (model) {
            els.prev.disabled = pos <= 0;
            els.next.disabled = pos >= model.units.length - 1;
        }
    }

    function setState(next, message) {
        state = next;
        render();
        announce(message || LABELS[next]);
        emit();
    }

    function notice(message) {
        render();
        announce(message);
    }

    function isActive() {
        return state === "playing" || state === "paused";
    }

    /* ---- Model access ---- */

    function ensureModel() {
        if (model && (!dirty || isActive())) {
            return model;
        }

        if (pos >= 0) {
            clearMark();
            pos = -1;
        }

        model = buildModel(content);
        dirty = false;
        return model;
    }

    function findVisibleStart() {
        const { blocks, units, firstUnit } = model;
        const { top } = bounds();
        let lo = 0;
        let hi = blocks.length;

        while (lo < hi) {
            const mid = (lo + hi) >> 1;

            if (blocks[mid].getBoundingClientRect().bottom > top) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }

        if (lo >= blocks.length || firstUnit[lo] >= units.length) {
            return units.length - 1;
        }

        let i = firstUnit[lo];

        while (i + 1 < units.length && units[i].blockIndex === lo && units[i + 1].blockIndex === lo) {
            const range = makeRange(units[i].block, units[i].start, units[i].end);

            if (!range || range.getBoundingClientRect().bottom > top) {
                break;
            }

            i++;
        }

        return i;
    }

    /* ---- Engine ---- */

    // Properly resets the speech synthesis engine.
    // Chrome requires resume() before cancel() when paused, otherwise
    // the engine stays stuck and silently drops subsequent speak() calls.
    function resetSynth() {
        if (!synth) {
            return;
        }

        try {
            // CRITICAL: resume first if paused, then cancel.
            // Chrome's Web Speech API ignores cancel() while paused.
            if (synth.paused) {
                synth.resume();
            }

            synth.cancel();
        } catch {
            // Ignore engine errors during cleanup.
        }
    }

    // Invalidates the current session: late callbacks see a stale id and exit.
    function invalidate() {
        session++;
        clearTimeout(speakTimer);
        speakTimer = 0;
        stopWatchdog();

        if (utterance) {
            utterance.onend = null;
            utterance.onerror = null;
            utterance = null;
        }

        resetSynth();
    }

    function resolveVoice() {
        if (forceDefault || !prefs.voiceURI) {
            return null;
        }

        return voices.find((voice) => voice.voiceURI === prefs.voiceURI) || null;
    }

    function focusUnit(force) {
        const unit = model && model.units[pos];

        if (!unit) {
            return;
        }

        const range = mark(unit);
        reveal(range, unit, force);
        emit();
    }

    function fail(id, code) {
        if (id !== session) {
            return;
        }

        invalidate();
        // The sentence stays selected and highlighted, so Retry resumes from it.
        setState("error", `Speech error${code ? ` (${code})` : ""}. Press Retry to continue from this sentence.`);
    }

    function finish(id) {
        if (id !== session) {
            return;
        }

        invalidate();
        clearMark();
        pos = -1;
        setState("finished", "Finished. Press Play to replay.");
    }

    function speak(id) {
        if (id !== session || !model) {
            return;
        }

        if (pos >= model.units.length) {
            finish(id);
            return;
        }

        const unit = model.units[pos];
        const next = new SpeechSynthesisUtterance(unit.text);
        const voice = resolveVoice();

        if (voice) {
            next.voice = voice;
            next.lang = voice.lang;
        } else {
            next.lang = content.lang || "en";
        }

        // Read at creation time, so changes apply from the next sentence.
        next.rate = prefs.rate;
        next.pitch = prefs.pitch;

        next.onstart = () => {
            lastSpeechEventTime = Date.now();
        };

        next.onboundary = () => {
            lastSpeechEventTime = Date.now();
        };

        next.onend = () => {
            if (id !== session || next !== utterance) {
                return;
            }

            lastSpeechEventTime = Date.now();
            utterance = null;
            pos++;

            // Highlight the next sentence, then speak it after the delay.
            if (pos < model.units.length) {
                focusUnit(false);
            }

            speak(id);
        };

        next.onerror = (event) => {
            if (id !== session || next !== utterance) {
                return;
            }

            const code = event && event.error;

            // Cancel/interrupt come from our own stop or a replaced session.
            if (code === "canceled" || code === "interrupted") {
                return;
            }

            // An unavailable voice falls back to the default once, on the same sentence.
            if ((code === "voice-unavailable" || code === "language-unavailable") && !forceDefault) {
                forceDefault = true;
                utterance = null;
                speak(id);
                return;
            }

            fail(id, code);
        };

        utterance = next;
        focusUnit(false);

        try {
            synth.speak(next);
            startWatchdog(id);
        } catch {
            fail(id, "speak-failed");
        }
    }

    // A short delay after cancel() avoids engines that drop an immediate speak().
    function schedule(id) {
        clearTimeout(speakTimer);
        speakTimer = setTimeout(() => {
            speakTimer = 0;
            speak(id);
        }, SPEAK_DELAY_MS);
    }

    function start() {
        ensureModel();

        if (!model.units.length) {
            setState("ready", "No readable text to play.");
            return;
        }

        invalidate();

        const id = session;

        if (pos < 0 || pos >= model.units.length) {
            pos = findVisibleStart();
        }

        setState("playing");
        focusUnit(true);
        schedule(id);
    }

    function play() {
        if (!supported || state === "playing") {
            return;
        }

        if (state === "paused" && utterance) {
            try {
                synth.resume();
                setState("playing");
                startWatchdog(session);
            } catch {
                fail(session, "resume-failed");
            }

            return;
        }

        // Stopped, finished, error, or paused after navigation: fresh session.
        start();
    }

    function pause() {
        if (!supported || state !== "playing") {
            return;
        }

        stopWatchdog();

        try {
            synth.pause();
            setState("paused");
        } catch {
            fail(session, "pause-failed");
        }
    }

    function halt(message) {
        invalidate();
        clearMark();
        pos = -1;
        setState("stopped", message);
    }

    // Previous/next sentence. With nothing selected, the first press selects the
    // sentence at the top of the visible text.
    function navigate(delta) {
        if (!supported) {
            return;
        }

        ensureModel();

        const total = model.units.length;

        if (!total) {
            notice("No readable text to play.");
            return;
        }

        const target = pos < 0 ? findVisibleStart() : pos + delta;

        if (target < 0) {
            notice("Start of readable text.");
            return;
        }

        if (target >= total) {
            notice("End of readable text.");
            return;
        }

        const wasPlaying = state === "playing";
        const wasPaused = state === "paused";

        invalidate();

        const id = session;

        pos = target;

        if (wasPlaying) {
            setState("playing");
            focusUnit(true);
            schedule(id);
        } else if (wasPaused) {
            // Stays paused; pressing Play starts from the newly selected sentence.
            // Use setState so render() + emit() fire and the button updates.
            setState("paused", `Sentence ${pos + 1} of ${total} selected. Paused.`);
            focusUnit(true);
        } else {
            // Not yet playing: show selection, ready to start.
            setState("ready", `Sentence ${pos + 1} of ${total} selected. Press Play to start here.`);
            focusUnit(true);
        }
    }

    /* ---- Bar modes: the bar itself never changes, only which buttons are shown ---- */

    function setMode(next) {
        mode = next;

        const playback = next === "playback";

        normalButtons.forEach((button) => {
            button.hidden = playback;
        });
        playbackButtons.forEach((button) => {
            button.hidden = !playback;
        });

        actions.dataset.audioMode = next;
        body.dataset.audioMode = next;
    }

    function closePanels() {
        if (settingsPanel && !settingsPanel.hidden) {
            els.settings.click();
        }

        if (chaptersPanel && !chaptersPanel.hidden) {
            els.chapters.click();
        }
    }

    function enterPlayback() {
        if (!supported || mode === "playback") {
            return;
        }

        ensureModel();

        if (!model.units.length) {
            announce("No readable text to play.");
            return;
        }

        closePanels();
        setMode("playback");
        els.play.focus();
        start();
    }

    function exitPlayback(returnFocus) {
        halt();
        setMode("normal");

        if (returnFocus) {
            els.open.focus();
        }
    }

    /* ---- Voices ---- */

    function populateVoices() {
        if (!synth) {
            return;
        }

        voices = synth.getVoices();
        forceDefault = false;

        const sorted = [...voices].sort(
            (a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)
        );

        els.voice.replaceChildren();

        const fallback = document.createElement("option");
        fallback.value = "";
        fallback.textContent = voices.length ? "Browser default" : "Browser default (no other voices found)";
        els.voice.append(fallback);

        for (const voice of sorted) {
            const option = document.createElement("option");
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            els.voice.append(option);
        }

        // A saved voice that is missing right now falls back to the default
        // without being erased, in case it returns.
        els.voice.value = voices.some((voice) => voice.voiceURI === prefs.voiceURI) ? prefs.voiceURI : "";
    }

    /* ---- Wiring ---- */

    els.speed.min = String(RATE.min);
    els.speed.max = String(RATE.max);
    els.speed.step = "0.25";
    els.speed.value = String(prefs.rate);
    els.speedValue.textContent = `${prefs.rate}×`;

    els.pitch.min = String(PITCH.min);
    els.pitch.max = String(PITCH.max);
    els.pitch.step = "0.1";
    els.pitch.value = String(prefs.pitch);
    els.pitchValue.textContent = String(Number(prefs.pitch.toFixed(1)));

    els.open.addEventListener("click", enterPlayback);
    els.play.addEventListener("click", () => (state === "playing" ? pause() : play()));
    els.prev.addEventListener("click", () => navigate(-1));
    els.next.addEventListener("click", () => navigate(1));
    els.stop.addEventListener("click", () => exitPlayback(true));

    function applyAudioPrefChange() {
        if (state === "playing" && synth) {
            synth.cancel();
            schedule(session);
        }
    }

    els.voice.addEventListener("focus", populateVoices);
    els.voice.addEventListener("pointerdown", populateVoices);

    els.voice.addEventListener("change", () => {
        prefs.voiceURI = els.voice.value;
        forceDefault = false;
        savePrefs(prefs);
        applyAudioPrefChange();
    });

    els.speed.addEventListener("input", () => {
        prefs.rate = clampNum(Number(els.speed.value), RATE);
        els.speedValue.textContent = `${prefs.rate}×`;
        savePrefs(prefs);
    });
    els.speed.addEventListener("change", applyAudioPrefChange);

    els.pitch.addEventListener("input", () => {
        prefs.pitch = clampNum(Number(els.pitch.value), PITCH);
        els.pitchValue.textContent = String(Number(prefs.pitch.toFixed(1)));
        savePrefs(prefs);
    });
    els.pitch.addEventListener("change", applyAudioPrefChange);

    // Any chapter navigation ends the speech session and clears the highlight.
    if (chaptersPanel) {
        listen(chaptersPanel, "click", (event) => {
            if (
                mode === "playback" &&
                event.target.closest(".read-chapters-item, #read-chapters-prev, #read-chapters-next")
            ) {
                exitPlayback(false);
            }
        });
    }

    // Content changes: removed nodes end the session; added nodes only mark the model stale.
    const contentWatcher = new MutationObserver((records) => {
        let removed = false;

        for (const record of records) {
            if (record.removedNodes.length) removed = true;
            if (record.addedNodes.length) dirty = true;
        }

        if (removed) {
            if (mode === "playback") {
                exitPlayback(false);
                announce("Reader content changed. Playback stopped.");
            }

            model = null;
            dirty = false;
        }
    });
    contentWatcher.observe(content, { childList: true });
    cleanups.push(() => contentWatcher.disconnect());

    if (synth) {
        synth.onvoiceschanged = populateVoices;
        listen(synth, "voiceschanged", populateVoices);
        populateVoices();

        if (!voices.length) {
            setTimeout(populateVoices, 500);
            setTimeout(populateVoices, 1500);
        }
    } else {
        els.open.disabled = true;
        els.open.title = "Speech is not available in this browser.";
        els.voice.disabled = true;
        els.speed.disabled = true;
        els.pitch.disabled = true;
        els.note.textContent = "Speech is not available in this browser.";
    }

    listen(window, "pagehide", () => {
        invalidate();
        clearMark();

        if (highlight) {
            CSS.highlights.delete(HIGHLIGHT_NAME);
        }

        cleanups.forEach((undo) => undo());
    });

    setMode("normal");
    render();
}
