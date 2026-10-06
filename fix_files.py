import os

repo_code = r'''const { pool } = require('../config/database');

const VALID_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'];
const WRITABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

async function create({ ownerUserId, title, description, coverPath, publicationDate, pdfPath, pdfOriginalName, pdfSize }) {
    const [result] = await pool.query(
        INSERT INTO books (owner_id, title, description, cover_path, publication_date, status, pdf_path, pdf_original_name, pdf_size)
     VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?),
        [ownerUserId, title, description || null, coverPath || null, publicationDate || null, pdfPath || null, pdfOriginalName || null, pdfSize || null]
    );
    return result.insertId;
}

async function findAll(status) {
    if (status) {
        const [rows] = await pool.query(
            'SELECT * FROM books WHERE status = ? ORDER BY created_at DESC',
            [status]
        );
        return rows;
    }
    const [rows] = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    return rows;
}

async function findById(bookId) {
    const [rows] = await pool.query('SELECT * FROM books WHERE book_id = ? LIMIT 1', [bookId]);
    return rows[0] || null;
}

async function updateFields(bookId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => ${k} = ?).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(
        UPDATE books SET , updated_at = CURRENT_TIMESTAMP WHERE book_id = ?,
        [...values, bookId]
    );
}

async function archive(bookId) {
    await pool.query("UPDATE books SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE book_id = ?", [bookId]);
}

async function setStatus(bookId, status) {
    await pool.query(
        'UPDATE books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?',
        [status, bookId]
    );
}

async function findAllPaginated({ limit, offset, sortColumn, sortDirection, status }) {
    if (status) {
        const [rows] = await pool.query(
            SELECT * FROM books WHERE status = ? ORDER BY   LIMIT ? OFFSET ?,
            [status, limit, offset]
        );
        return rows;
    }
    const [rows] = await pool.query(
        SELECT * FROM books ORDER BY   LIMIT ? OFFSET ?,
        [limit, offset]
    );
    return rows;
}

async function countAll(status) {
    if (status) {
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM books WHERE status = ?', [status]);
        return rows[0].total;
    }
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM books');
    return rows[0].total;
}

module.exports = {
    create, findAll, findById, updateFields, archive, setStatus,
    VALID_STATUSES, WRITABLE_STATUSES, findAllPaginated, countAll,
};
'''

with open('backend/src/repositories/book.repository.js', 'w', encoding='utf-8') as f:
    f.write(repo_code)

reader_js_code = r'''import { api } from "../api.js";
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
    document.body.classList.add(eader-theme-);

    const content = el('reader-content');
    if(content) {
        content.classList.remove('reader-width-narrow', 'reader-width-normal', 'reader-width-wide');
        content.classList.add(eader-width-);

        content.classList.remove('reader-spacing-compact', 'reader-spacing-normal', 'reader-spacing-relaxed');
        content.classList.add(eader-spacing-);
    }

    document.querySelectorAll('.theme-option-btn').forEach(b => b.classList.toggle('is-active', b.dataset.theme === state.prefs.theme));
    document.querySelectorAll('.segment-btn[data-spacing]').forEach(b => b.classList.toggle('is-active', b.dataset.spacing === state.prefs.spacing));
    document.querySelectorAll('.segment-btn[data-width]').forEach(b => b.classList.toggle('is-active', b.dataset.width === state.prefs.width));
}

function updateZoomDisplay() {
    el('zoom-level-display').textContent = ${Math.round(state.zoomLevel * 100)}%;
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
    el('reader-progress-bar').style.width = ${pct}%;
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
        placeholder.textContent = Loading page ...;
        
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
            container.innerHTML = <div class="pdf-page-placeholder">Reloading...</div>;
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
        pdfUrl = ${API_BASE_URL}/private-library//file;
        el('reader-back-link').href = 'private-library.html';
    } else if (bookId) {
        state.isPrivate = false;
        state.pdfId = bookId;
        pdfUrl = ${API_BASE_URL}/books//pdf;
        el('reader-back-link').href = ook.html?id=;
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
        
        el('reader-page-indicator').textContent = ${state.pagesCount} Pages;
        el('reader-loading').hidden = true;
        el('reader-content').hidden = false;

        if (!state.isPrivate) {
            api.get(/books/).then(res => {
                if(res.data && res.data.book) {
                    el('reader-book-title').textContent = res.data.book.title;
                    document.title = ${res.data.book.title} | PDF Reader;
                }
            }).catch(()=>{});
        } else {
            api.get(/private-library/).then(res => {
                if(res.data && res.data.privateFile) {
                    el('reader-book-title').textContent = res.data.privateFile.title;
                    document.title = ${res.data.privateFile.title} | Private PDF;
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
'''

with open('frontend/js/pages/reader.js', 'w', encoding='utf-8') as f:
    f.write(reader_js_code)

print("Rewritten files successfully.")
