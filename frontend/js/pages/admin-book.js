import { auth } from "../auth.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

function element(id) {
    return document.getElementById(id);
}

let bookId;
let allAuthors = [];
let allCategories = [];
let bookAuthors = [];
let bookCategories = [];
let chapters = [];

export async function init() {
    if (!auth.isAdmin()) {
        element("book-title-header").textContent = "Administrator access is required.";
        element("book-status").hidden = true;
        return;
    }

    const params = new URLSearchParams(window.location.search);
    bookId = params.get("id");

    if (!bookId) {
        element("book-title-header").textContent = "Invalid Book ID.";
        element("book-status").hidden = true;
        return;
    }

    element("admin-book-content").hidden = false;

    bindTabs();
    bindModals();
    bindForms();

    await Promise.all([
        loadBookDetails(),
        loadAllAuthors(),
        loadAllCategories(),
        loadBookAuthors(),
        loadBookCategories(),
        loadChapters()
    ]);
}

function bindTabs() {
    const buttons = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            button.classList.add("active");
            element(`tab-${button.dataset.tab}`).classList.add("active");
        });
    });
}

function bindModals() {
    const chapterModal = element("chapter-modal");
    element("btn-create-chapter").addEventListener("click", () => {
        element("chapter-form").reset();
        element("chapter-id").value = "";
        element("chapter-modal-title").textContent = "Create Chapter";
        chapterModal.showModal();
    });
    element("btn-cancel-chapter").addEventListener("click", () => chapterModal.close());
    
    element("chapter-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveChapter();
    });

    element("btn-save-order").addEventListener("click", async () => {
        await saveChapterOrder();
    });
}

function bindForms() {
    element("add-author-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const select = element("author-select");
        const authorId = select.value;
        if (!authorId) return;

        try {
            await api.post(`/books/${bookId}/authors`, { authorId: Number(authorId) });
            ui.showToast("Author added", "success");
            select.value = "";
            await loadBookAuthors();
        } catch (err) {
            ui.showToast(err.message || "Failed to add author", "error");
        }
    });

    element("add-category-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const select = element("category-select");
        const categoryId = select.value;
        if (!categoryId) return;

        try {
            await api.post(`/books/${bookId}/categories`, { categoryId: Number(categoryId) });
            ui.showToast("Category added", "success");
            select.value = "";
            await loadBookCategories();
        } catch (err) {
            ui.showToast(err.message || "Failed to add category", "error");
        }
    });
}

// --- Data Loading ---

async function loadBookDetails() {
    try {
        const res = await api.get(`/books/${bookId}`);
        const book = res.data.book;
        element("book-title-header").textContent = book.title;
        element("book-status").textContent = `Status: ${book.status}`;
    } catch (err) {
        element("book-title-header").textContent = "Failed to load book.";
    }
}

async function loadAllAuthors() {
    try {
        const res = await api.get("/authors");
        allAuthors = res.data.authors || [];
        updateAuthorSelect();
    } catch (err) {
        console.error(err);
    }
}

async function loadAllCategories() {
    try {
        const res = await api.get("/categories");
        allCategories = res.data.categories || [];
        updateCategorySelect();
    } catch (err) {
        console.error(err);
    }
}

async function loadBookAuthors() {
    try {
        const res = await api.get(`/books/${bookId}/authors`);
        bookAuthors = res.data.authors || [];
        renderBookAuthors();
        updateAuthorSelect();
    } catch (err) {
        if (err.status !== 404) console.error(err);
        bookAuthors = [];
        renderBookAuthors();
    }
}

async function loadBookCategories() {
    try {
        const res = await api.get(`/books/${bookId}/categories`);
        bookCategories = res.data.categories || [];
        renderBookCategories();
        updateCategorySelect();
    } catch (err) {
        if (err.status !== 404) console.error(err);
        bookCategories = [];
        renderBookCategories();
    }
}

async function loadChapters() {
    try {
        const res = await api.get(`/books/${bookId}/chapters`);
        chapters = res.data.chapters || [];
        renderChapters();
    } catch (err) {
        if (err.status !== 404) console.error(err);
        chapters = [];
        renderChapters();
    }
}

// --- Rendering ---

function updateAuthorSelect() {
    const select = element("author-select");
    const currentIds = bookAuthors.map(a => a.author_id);
    
    select.innerHTML = '<option value="">Select an author to add...</option>';
    allAuthors.filter(a => a.status === 'ACTIVE' && !currentIds.includes(a.author_id)).forEach(author => {
        const opt = document.createElement('option');
        opt.value = author.author_id;
        opt.textContent = author.name;
        select.append(opt);
    });
}

function updateCategorySelect() {
    const select = element("category-select");
    const currentIds = bookCategories.map(c => c.category_id);
    
    select.innerHTML = '<option value="">Select a category to add...</option>';
    allCategories.filter(c => c.status === 'ACTIVE' && !currentIds.includes(c.category_id)).forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.category_id;
        opt.textContent = cat.name;
        select.append(opt);
    });
}

function renderBookAuthors() {
    const container = element("current-authors");
    if (!bookAuthors.length) {
        container.innerHTML = "<p class='muted'>No authors assigned.</p>";
        return;
    }
    
    container.innerHTML = "";
    bookAuthors.forEach(author => {
        const chip = document.createElement("span");
        chip.className = "detail-chip";
        chip.style.display = "inline-flex";
        chip.style.alignItems = "center";
        chip.style.gap = "0.5rem";
        
        const name = document.createElement("span");
        name.textContent = author.name;
        
        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.style.border = "none";
        btn.style.background = "transparent";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        
        btn.onclick = async () => {
            try {
                await api.delete(`/books/${bookId}/authors/${author.author_id}`);
                ui.showToast("Author removed", "success");
                await loadBookAuthors();
            } catch(e) {
                ui.showToast("Failed to remove author", "error");
            }
        };
        
        chip.append(name, btn);
        container.append(chip);
    });
}

function renderBookCategories() {
    const container = element("current-categories");
    if (!bookCategories.length) {
        container.innerHTML = "<p class='muted'>No categories assigned.</p>";
        return;
    }
    
    container.innerHTML = "";
    bookCategories.forEach(cat => {
        const chip = document.createElement("span");
        chip.className = "detail-chip";
        chip.style.display = "inline-flex";
        chip.style.alignItems = "center";
        chip.style.gap = "0.5rem";
        
        const name = document.createElement("span");
        name.textContent = cat.name;
        
        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.style.border = "none";
        btn.style.background = "transparent";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        
        btn.onclick = async () => {
            try {
                await api.delete(`/books/${bookId}/categories/${cat.category_id}`);
                ui.showToast("Category removed", "success");
                await loadBookCategories();
            } catch(e) {
                ui.showToast("Failed to remove category", "error");
            }
        };
        
        chip.append(name, btn);
        container.append(chip);
    });
}

function renderChapters() {
    const list = element("chapters-list");
    const saveBtn = element("btn-save-order");
    
    if (!chapters.length) {
        list.innerHTML = "<li class='muted'>No chapters found.</li>";
        saveBtn.hidden = true;
        return;
    }
    
    list.innerHTML = "";
    chapters.sort((a,b) => a.chapter_number - b.chapter_number).forEach(chap => {
        const li = document.createElement("li");
        li.className = "chapter-item";
        
        // Use a data attribute to store id for ordering
        li.dataset.id = chap.chapter_id;
        
        const statusBadge = `<span class="badge badge-${chap.status.toLowerCase()}">${chap.status}</span>`;
        
        li.innerHTML = `
            <div class="chapter-info">
                <strong>Chapter ${chap.chapter_number}</strong>: ${chap.title} 
                ${statusBadge}
            </div>
            <div class="chapter-actions">
                <button class="button button-secondary" onclick="window.moveChapterUp(this)">↑</button>
                <button class="button button-secondary" onclick="window.moveChapterDown(this)">↓</button>
                <button class="button button-secondary" onclick="window.editChapter(${chap.chapter_id})">Edit</button>
                ${chap.status === 'DRAFT' || chap.status === 'ARCHIVED' ? `<button class="button button-primary" onclick="window.publishChapter(${chap.chapter_id})">Publish</button>` : ''}
                ${chap.status === 'PUBLISHED' ? `<button class="button button-secondary" onclick="window.archiveChapter(${chap.chapter_id})">Archive</button>` : ''}
            </div>
        `;
        
        list.append(li);
    });
    
    saveBtn.hidden = chapters.length < 2;
}

// --- Chapter Actions ---

async function saveChapter() {
    const id = element("chapter-id").value;
    const title = element("chapter-title").value;
    const number = element("chapter-number").value;
    const content = element("chapter-content").value;

    try {
        if (id) {
            await api.put(`/chapters/${id}`, { title, chapterNumber: Number(number), content });
            ui.showToast("Chapter updated successfully", "success");
        } else {
            await api.post(`/books/${bookId}/chapters`, { title, chapterNumber: Number(number), content });
            ui.showToast("Chapter created successfully", "success");
        }
        element("chapter-modal").close();
        await loadChapters();
    } catch (err) {
        ui.showToast(err.message || "Failed to save chapter", "error");
    }
}

window.editChapter = async (id) => {
    try {
        const res = await api.get(`/chapters/${id}`);
        const chap = res.data.chapter;
        element("chapter-id").value = chap.chapter_id;
        element("chapter-title").value = chap.title;
        element("chapter-number").value = chap.chapter_number;
        element("chapter-content").value = chap.content;
        element("chapter-modal-title").textContent = "Edit Chapter";
        element("chapter-modal").showModal();
    } catch(err) {
        ui.showToast("Failed to load chapter content", "error");
    }
};

window.publishChapter = async (id) => {
    try {
        await api.patch(`/chapters/${id}/publish`);
        ui.showToast("Chapter published", "success");
        await loadChapters();
    } catch (err) {
        ui.showToast(err.message || "Failed to publish", "error");
    }
};

window.archiveChapter = async (id) => {
    if (!confirm("Are you sure you want to archive this chapter?")) return;
    try {
        await api.patch(`/chapters/${id}/archive`);
        ui.showToast("Chapter archived", "success");
        await loadChapters();
    } catch (err) {
        ui.showToast(err.message || "Failed to archive", "error");
    }
};

window.moveChapterUp = (btn) => {
    const li = btn.closest('li');
    if (li.previousElementSibling) {
        li.parentNode.insertBefore(li, li.previousElementSibling);
    }
};

window.moveChapterDown = (btn) => {
    const li = btn.closest('li');
    if (li.nextElementSibling) {
        li.parentNode.insertBefore(li.nextElementSibling, li);
    }
};

async function saveChapterOrder() {
    const list = element("chapters-list");
    const items = list.querySelectorAll("li.chapter-item");
    const chapterIds = Array.from(items).map(li => Number(li.dataset.id));
    
    try {
        await api.patch(`/books/${bookId}/chapters/reorder`, { chapter_ids: chapterIds });
        ui.showToast("Chapter order saved", "success");
        await loadChapters();
    } catch(err) {
        ui.showToast(err.message || "Failed to save chapter order", "error");
    }
}
