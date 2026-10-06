import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";

const STORAGE_KEY_PREFS = "digitalLibrary.readerSettings";
const PROGRESS_KEY = "digitalLibrary.readerProgress";

let state = {
    pdfId: null,
    isPrivate: false,
    prefs: {
        theme: "light",
        font: "sans",
        sizeOffset: 0,
        spacing: "normal",
        width: "normal"
    },
    blocks: []
};

function el(id) { return document.getElementById(id); }

function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(state.prefs)); } catch(e){}
}

function loadPrefs() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFS);
        if(stored) state.prefs = { ...state.prefs, ...JSON.parse(stored) };
    } catch(e){}
}

function saveProgress() {
    try {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (window.scrollY / total) : 0;
        const key = `${PROGRESS_KEY}_${state.isPrivate ? 'priv' : 'pub'}_${state.pdfId}`;
        localStorage.setItem(key, String(pct));
    } catch(e){}
}

function loadProgress() {
    try {
        const key = `${PROGRESS_KEY}_${state.isPrivate ? 'priv' : 'pub'}_${state.pdfId}`;
        const val = localStorage.getItem(key);
        if (val) {
            const pct = parseFloat(val);
            if (pct > 0) {
                const total = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: total * pct, behavior: 'auto' });
            }
        }
    } catch(e){}
}

function applyPrefs() {
    const b = document.body;
    b.classList.remove('reader-theme-light', 'reader-theme-dark', 'reader-theme-sepia');
    b.classList.add(`reader-theme-${state.prefs.theme}`);

    b.classList.remove('reader-font-sans', 'reader-font-serif', 'reader-font-system');
    b.classList.add(`reader-font-${state.prefs.font}`);

    b.classList.remove('reader-spacing-compact', 'reader-spacing-normal', 'reader-spacing-relaxed');
    b.classList.add(`reader-spacing-${state.prefs.spacing}`);

    b.classList.remove('reader-width-narrow', 'reader-width-normal', 'reader-width-wide');
    b.classList.add(`reader-width-${state.prefs.width}`);
    
    // Size offset (18px base)
    const newSize = 18 + (state.prefs.sizeOffset * 2);
    document.documentElement.style.setProperty('--reader-font-size', `${newSize}px`);

    // Update UI toggles
    document.querySelectorAll('.theme-option-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.theme === state.prefs.theme));
    document.querySelectorAll('.font-option-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.font === state.prefs.font));
    document.querySelectorAll('.spacing-option-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.spacing === state.prefs.spacing));
    document.querySelectorAll('.width-option-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.width === state.prefs.width));
}

function bindEvents() {
    el('btn-toggle-settings').addEventListener('click', () => {
        el('reader-overlay').hidden = false;
        el('reader-settings-drawer').hidden = false;
        el('reader-contents-drawer').hidden = true;
    });

    el('btn-toggle-contents').addEventListener('click', () => {
        el('reader-overlay').hidden = false;
        el('reader-contents-drawer').hidden = false;
        el('reader-settings-drawer').hidden = true;
    });

    el('btn-close-settings').addEventListener('click', closeDrawers);
    el('btn-close-contents').addEventListener('click', closeDrawers);
    el('reader-overlay').addEventListener('click', closeDrawers);

    function closeDrawers() {
        el('reader-overlay').hidden = true;
        el('reader-settings-drawer').hidden = true;
        el('reader-contents-drawer').hidden = true;
    }

    document.querySelectorAll('.theme-option-btn').forEach(b => {
        b.addEventListener('click', () => { state.prefs.theme = b.dataset.theme; savePrefs(); applyPrefs(); });
    });
    document.querySelectorAll('.font-option-btn').forEach(b => {
        b.addEventListener('click', () => { state.prefs.font = b.dataset.font; savePrefs(); applyPrefs(); });
    });
    document.querySelectorAll('.spacing-option-btn').forEach(b => {
        b.addEventListener('click', () => { state.prefs.spacing = b.dataset.spacing; savePrefs(); applyPrefs(); });
    });
    document.querySelectorAll('.width-option-btn').forEach(b => {
        b.addEventListener('click', () => { state.prefs.width = b.dataset.width; savePrefs(); applyPrefs(); });
    });

    el('btn-text-decrease').addEventListener('click', () => {
        if(state.prefs.sizeOffset > -2) { state.prefs.sizeOffset--; savePrefs(); applyPrefs(); }
    });
    el('btn-text-increase').addEventListener('click', () => {
        if(state.prefs.sizeOffset < 5) { state.prefs.sizeOffset++; savePrefs(); applyPrefs(); }
    });
    el('btn-text-reset').addEventListener('click', () => {
        state.prefs.sizeOffset = 0; savePrefs(); applyPrefs();
    });

    el('btn-reset-settings').addEventListener('click', () => {
        state.prefs = { theme: 'light', font: 'sans', sizeOffset: 0, spacing: 'normal', width: 'normal' };
        savePrefs(); applyPrefs();
    });

    el('btn-close-lightbox').addEventListener('click', () => el('image-lightbox').hidden = true);
    el('image-lightbox').addEventListener('click', (e) => {
        if(e.target === el('image-lightbox')) el('image-lightbox').hidden = true;
    });

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        updateProgress();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(saveProgress, 300);
    }, {passive: true});
}

function updateProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    const clamped = Math.min(100, Math.max(0, pct));
    el('reader-progress-bar').style.width = `${clamped}%`;
    el('reader-progress-text').textContent = `${Math.round(clamped)}%`;
}

function getImageUrl(imageName) {
    if (state.isPrivate) {
        return `${API_BASE_URL}/private-library/images/${imageName}`;
    }
    return `${API_BASE_URL}/books/images/${imageName}`;
}

function renderContent() {
    const container = el('reader-content');
    const toc = el('reader-toc');
    container.innerHTML = '';
    toc.innerHTML = '';
    
    let headingCount = 0;

    state.blocks.forEach((block, index) => {
        if (block.type === 'system') {
            const p = document.createElement('p');
            p.className = 'system-msg';
            p.textContent = block.text;
            container.appendChild(p);
        } else if (block.type === 'heading') {
            const h = document.createElement('h2');
            h.id = `heading-${index}`;
            h.textContent = block.text;
            container.appendChild(h);

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#heading-${index}`;
            a.textContent = block.text;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                el('reader-overlay').hidden = true;
                el('reader-contents-drawer').hidden = true;
                h.scrollIntoView({ behavior: 'smooth' });
            });
            li.appendChild(a);
            toc.appendChild(li);
            headingCount++;
        } else if (block.type === 'paragraph') {
            const p = document.createElement('p');
            p.textContent = block.text;
            container.appendChild(p);
        } else if (block.type === 'image') {
            const img = document.createElement('img');
            img.src = getImageUrl(block.src);
            img.loading = 'lazy';
            img.alt = 'Document image';
            img.addEventListener('click', () => {
                el('lightbox-img').src = img.src;
                el('image-lightbox').hidden = false;
            });
            container.appendChild(img);
        }
    });

    if (headingCount === 0) {
        toc.innerHTML = '<li><span style="color:var(--reader-text-muted)">No chapters detected.</span></li>';
    }
}

function showError(msg) {
    el('reader-loading').hidden = true;
    const err = el('reader-error');
    err.textContent = msg;
    err.hidden = false;
}

export async function init() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId');
    const privatePdfId = params.get('privatePdfId');
    
    loadPrefs();
    applyPrefs();
    bindEvents();

    let docUrl = '';
    
    if (privatePdfId) {
        state.isPrivate = true;
        state.pdfId = privatePdfId;
        docUrl = `/private-library/${privatePdfId}/document`;
        el('reader-back-link').href = 'private-library.html';
    } else if (bookId) {
        state.isPrivate = false;
        state.pdfId = bookId;
        docUrl = `/books/${bookId}/document`;
        el('reader-back-link').href = `book.html?id=${bookId}`;
    } else {
        return showError("No document ID provided.");
    }

    try {
        const response = await api.get(docUrl);
        if (response.data && response.data.content) {
            state.blocks = response.data.content;
            renderContent();
            
            el('reader-loading').hidden = true;
            el('reader-content').hidden = false;
            
            // Set Title
            if (state.isPrivate) {
                api.get(`/private-library/${privatePdfId}`).then(res => {
                    if(res.data && res.data.privateFile) {
                        el('reader-book-title').textContent = res.data.privateFile.title;
                        document.title = `${res.data.privateFile.title} | Reader`;
                    }
                }).catch(()=>{});
            } else {
                api.get(`/books/${bookId}`).then(res => {
                    if(res.data && res.data.book) {
                        el('reader-book-title').textContent = res.data.book.title;
                        document.title = `${res.data.book.title} | Reader`;
                    }
                }).catch(()=>{});
            }

            // Restore scroll
            setTimeout(loadProgress, 100);
        } else {
            throw new Error("Invalid document content.");
        }
    } catch(err) {
        if(err.status === 401 || err.status === 403) {
            showError("You don't have permission to view this document.");
        } else if (err.status === 404) {
            showError("Document is still processing or missing. Wait a moment and refresh.");
        } else {
            showError("Failed to load document.");
        }
    }
}
