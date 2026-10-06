import { api } from "../api.js";
import { API_BASE_URL } from "../config.js";

const STORAGE_KEY_PREFS = "digitalLibrary.pdfReaderSettings";

let state = {
    pdfId: null,
    isPrivate: false,
    pdfDoc: null,
    pagesCount: 0,
    pageContainers: [],
    renderedPages: new Set(),
    zoomLevel: 1.0,
    prefs: {
        theme: "light",
        spacing: "normal",
        width: "normal"
    },
    renderTaskQueue: []
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

function applyPrefs() {
    document.body.classList.remove('reader-theme-light', 'reader-theme-dark', 'reader-theme-sepia');
    document.body.classList.add(`reader-theme-${state.prefs.theme}`);

    const content = el('reader-content');
    if(content) {
        content.classList.remove('reader-width-narrow', 'reader-width-normal', 'reader-width-wide');
        content.classList.add(`reader-width-${state.prefs.width}`);

        content.classList.remove('reader-spacing-compact', 'reader-spacing-normal', 'reader-spacing-relaxed');
        content.classList.add(`reader-spacing-${state.prefs.spacing}`);
    }

    document.querySelectorAll('.theme-option-btn').forEach(b => b.classList.toggle('is-active', b.dataset.theme === state.prefs.theme));
    document.querySelectorAll('.segment-btn[data-spacing]').forEach(b => b.classList.toggle('is-active', b.dataset.spacing === state.prefs.spacing));
    document.querySelectorAll('.segment-btn[data-width]').forEach(b => b.classList.toggle('is-active', b.dataset.width === state.prefs.width));
}

function updateZoomDisplay() {
    el('zoom-level-display').textContent = `${Math.round(state.zoomLevel * 100)}%`;
}

function bindEvents() {
    el('btn-toggle-settings').addEventListener('click', () => {
        el('reader-overlay').hidden = false;
        el('reader-settings-drawer').hidden = false;
    });

    el('btn-close-settings').addEventListener('click', () => {
        el('reader-overlay').hidden = true;
        el('reader-settings-drawer').hidden = true;
    });
    el('reader-overlay').addEventListener('click', () => {
        el('reader-overlay').hidden = true;
        el('reader-settings-drawer').hidden = true;
    });

    document.querySelectorAll('.theme-option-btn').forEach(b => {
        b.addEventListener('click', () => { state.prefs.theme = b.dataset.theme; savePrefs(); applyPrefs(); });
    });
    document.querySelectorAll('.segment-btn[data-spacing]').forEach(b => {
        b.addEventListener('click', () => { state.prefs.spacing = b.dataset.spacing; savePrefs(); applyPrefs(); });
    });
    document.querySelectorAll('.segment-btn[data-width]').forEach(b => {
        b.addEventListener('click', () => { state.prefs.width = b.dataset.width; savePrefs(); applyPrefs(); });
    });

    el('btn-reset-settings').addEventListener('click', () => {
        state.prefs = { theme: 'light', spacing: 'normal', width: 'normal' };
        savePrefs(); applyPrefs();
        state.zoomLevel = 1.0; updateZoomDisplay();
        reRenderAllVisible();
    });

    el('btn-zoom-in').addEventListener('click', () => {
        if (state.zoomLevel < 2.5) { state.zoomLevel += 0.25; updateZoomDisplay(); reRenderAllVisible(); }
    });
    el('btn-zoom-out').addEventListener('click', () => {
        if (state.zoomLevel > 0.5) { state.zoomLevel -= 0.25; updateZoomDisplay(); reRenderAllVisible(); }
    });

    window.addEventListener('scroll', updateProgress, {passive: true});
}

function updateProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    el('reader-progress-bar').style.width = `${pct}%`;
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const pageNum = Number(entry.target.dataset.pageNumber);
            renderPage(pageNum);
        }
    });
}, { rootMargin: '500px 0px' });

function setupViewer() {
    const viewer = el('pdf-viewer');
    viewer.innerHTML = '';
    state.pageContainers = [];
    state.renderedPages.clear();

    for(let i=1; i<=state.pagesCount; i++) {
        const container = document.createElement('div');
        container.className = 'pdf-page-container';
        container.dataset.pageNumber = i;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'pdf-page-placeholder';
        placeholder.textContent = `Loading page ${i}...`;
        
        container.appendChild(placeholder);
        viewer.appendChild(container);
        state.pageContainers.push(container);
        
        observer.observe(container);
    }
}

async function renderPage(pageNum) {
    if (state.renderedPages.has(pageNum)) return;
    
    const container = state.pageContainers[pageNum - 1];
    if(!container) return;

    try {
        const page = await state.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.zoomLevel * 1.5 }); // Base scale + user zoom

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        const ctx = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%'; 
        
        const renderContext = { canvasContext: ctx, viewport: viewport };
        await page.render(renderContext).promise;

        container.innerHTML = '';
        container.appendChild(canvas);
        state.renderedPages.add(pageNum);
    } catch (e) {
        console.error('Page render error:', e);
    }
}

function reRenderAllVisible() {
    state.renderedPages.clear();
    state.pageContainers.forEach(container => {
        if(container.firstChild && container.firstChild.tagName === 'CANVAS') {
            container.innerHTML = `<div class="pdf-page-placeholder">Reloading...</div>`;
        }
    });
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
    updateZoomDisplay();

    let pdfUrl = '';
    
    if (privatePdfId) {
        state.isPrivate = true;
        state.pdfId = privatePdfId;
        pdfUrl = `${API_BASE_URL}/private-library/${privatePdfId}/file`;
        el('reader-back-link').href = 'private-library.html';
    } else if (bookId) {
        state.isPrivate = false;
        state.pdfId = bookId;
        pdfUrl = `${API_BASE_URL}/books/${bookId}/pdf`;
        el('reader-back-link').href = `book.html?id=${bookId}`;
    } else {
        return showError("No PDF ID provided.");
    }

    try {
        const loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            withCredentials: true
        });

        state.pdfDoc = await loadingTask.promise;
        state.pagesCount = state.pdfDoc.numPages;
        
        el('reader-page-indicator').textContent = `${state.pagesCount} Pages`;
        el('reader-loading').hidden = true;
        el('reader-content').hidden = false;

        if (!state.isPrivate) {
            api.get(`/books/${bookId}`).then(res => {
                if(res.data && res.data.book) {
                    el('reader-book-title').textContent = res.data.book.title;
                    document.title = `${res.data.book.title} | PDF Reader`;
                }
            }).catch(()=>{});
        } else {
            api.get(`/private-library/${privatePdfId}`).then(res => {
                if(res.data && res.data.privateFile) {
                    el('reader-book-title').textContent = res.data.privateFile.title;
                    document.title = `${res.data.privateFile.title} | Private PDF`;
                }
            }).catch(()=>{});
        }

        setupViewer();
    } catch(err) {
        if(err.status === 401 || err.status === 403) {
            showError("You don't have permission to view this PDF.");
        } else {
            showError("Failed to load PDF. It might be corrupted or missing.");
        }
    }
}
