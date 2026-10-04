import { auth } from "../auth.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

function element(id) {
    return document.getElementById(id);
}

// State
let books = [];
let authors = [];
let categories = [];

export async function init() {
    const container = element("admin-content");
    const dashboard = element("admin-dashboard");
    const loading = element("admin-loading");

    if (!container) return;

    if (!auth.isAdmin()) {
        container.textContent = "Administrator access is required.";
        return;
    }

    loading.hidden = true;
    dashboard.hidden = false;

    bindTabs();
    bindModals();

    await loadBooks();
    await loadAuthors();
    await loadCategories();
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
    // Author Modal
    const authorModal = element("author-modal");
    element("btn-create-author").addEventListener("click", () => {
        element("author-form").reset();
        element("author-id").value = "";
        element("author-modal-title").textContent = "Create Author";
        authorModal.showModal();
    });
    element("btn-cancel-author").addEventListener("click", () => authorModal.close());
    element("author-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveAuthor();
    });

    // Category Modal
    const categoryModal = element("category-modal");
    element("btn-create-category").addEventListener("click", () => {
        element("category-form").reset();
        element("category-id").value = "";
        element("category-modal-title").textContent = "Create Category";
        categoryModal.showModal();
    });
    element("btn-cancel-category").addEventListener("click", () => categoryModal.close());
    element("category-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveCategory();
    });

    // Book Modal
    const bookModal = element("book-modal");
    element("btn-create-book").addEventListener("click", () => {
        element("book-form").reset();
        element("book-id").value = "";
        element("book-modal-title").textContent = "Create Book";
        bookModal.showModal();
    });
    element("btn-cancel-book").addEventListener("click", () => bookModal.close());
    element("book-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveBook();
    });
}

// --- Data Loading ---

async function loadBooks() {
    try {
        const res = await api.get("/books");
        books = res.data.books || [];
        renderBooks();
    } catch (err) {
        ui.showToast("Failed to load books", "error");
    }
}

async function loadAuthors() {
    try {
        const res = await api.get("/authors");
        authors = res.data.authors || [];
        renderAuthors();
    } catch (err) {
        ui.showToast("Failed to load authors", "error");
    }
}

async function loadCategories() {
    try {
        const res = await api.get("/categories");
        categories = res.data.categories || [];
        renderCategories();
    } catch (err) {
        ui.showToast("Failed to load categories", "error");
    }
}

// --- Rendering ---

function renderBooks() {
    const list = element("books-list");
    if (!books.length) {
        list.innerHTML = "<p class='muted'>No books found.</p>";
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    books.forEach(book => {
        const statusBadge = `<span class="badge badge-${book.status.toLowerCase()}">${book.status}</span>`;
        html += `
            <tr>
                <td>${book.title}</td>
                <td>${statusBadge}</td>
                <td>${book.publication_date ? new Date(book.publication_date).toLocaleDateString() : 'N/A'}</td>
                <td class="action-buttons">
                    <button class="button button-secondary" onclick="window.editBookDetails(${book.book_id})">Edit Details</button>
                    <button class="button button-primary" onclick="window.manageBook(${book.book_id})">Manage Content</button>
                    ${book.status === 'DRAFT' || book.status === 'ARCHIVED' ? `<button class="button button-primary" onclick="window.publishBook(${book.book_id})">Publish</button>` : ''}
                    ${book.status === 'PUBLISHED' ? `<button class="button button-secondary" onclick="window.archiveBook(${book.book_id})">Archive</button>` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    list.innerHTML = html;
}

function renderAuthors() {
    const list = element("authors-list");
    if (!authors.length) {
        list.innerHTML = "<p class='muted'>No authors found.</p>";
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    authors.forEach(author => {
        const statusBadge = `<span class="badge badge-${author.status.toLowerCase()}">${author.status}</span>`;
        html += `
            <tr>
                <td>${author.name}</td>
                <td>${statusBadge}</td>
                <td class="action-buttons">
                    <button class="button button-secondary" onclick="window.editAuthor(${author.author_id})">Edit</button>
                    ${author.status === 'ACTIVE' ? `<button class="button button-secondary" onclick="window.archiveAuthor(${author.author_id})">Archive</button>` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    list.innerHTML = html;
}

function renderCategories() {
    const list = element("categories-list");
    if (!categories.length) {
        list.innerHTML = "<p class='muted'>No categories found.</p>";
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    categories.forEach(category => {
        const statusBadge = `<span class="badge badge-${category.status.toLowerCase()}">${category.status}</span>`;
        html += `
            <tr>
                <td>${category.name}</td>
                <td>${statusBadge}</td>
                <td class="action-buttons">
                    <button class="button button-secondary" onclick="window.editCategory(${category.category_id})">Edit</button>
                    ${category.status === 'ACTIVE' ? `<button class="button button-secondary" onclick="window.archiveCategory(${category.category_id})">Archive</button>` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    list.innerHTML = html;
}

// --- Actions: Author ---
async function saveAuthor() {
    const id = element("author-id").value;
    const name = element("author-name").value;
    const bio = element("author-bio").value;

    try {
        if (id) {
            await api.put(`/authors/${id}`, { name, biography: bio });
            ui.showToast("Author updated successfully", "success");
        } else {
            await api.post("/authors", { name, biography: bio });
            ui.showToast("Author created successfully", "success");
        }
        element("author-modal").close();
        await loadAuthors();
    } catch (err) {
        ui.showToast(err.message || "Failed to save author", "error");
    }
}

window.editAuthor = (id) => {
    const author = authors.find(a => a.author_id === id);
    if (!author) return;
    element("author-id").value = author.author_id;
    element("author-name").value = author.name;
    element("author-bio").value = author.biography || "";
    element("author-modal-title").textContent = "Edit Author";
    element("author-modal").showModal();
};

window.archiveAuthor = async (id) => {
    if (!confirm("Are you sure you want to archive this author?")) return;
    try {
        await api.patch(`/authors/${id}/archive`);
        ui.showToast("Author archived", "success");
        await loadAuthors();
    } catch (err) {
        ui.showToast(err.message || "Failed to archive", "error");
    }
};

// --- Actions: Category ---
async function saveCategory() {
    const id = element("category-id").value;
    const name = element("category-name").value;
    const desc = element("category-description").value;

    try {
        if (id) {
            await api.put(`/categories/${id}`, { name, description: desc });
            ui.showToast("Category updated successfully", "success");
        } else {
            await api.post("/categories", { name, description: desc });
            ui.showToast("Category created successfully", "success");
        }
        element("category-modal").close();
        await loadCategories();
    } catch (err) {
        ui.showToast(err.message || "Failed to save category", "error");
    }
}

window.editCategory = (id) => {
    const cat = categories.find(c => c.category_id === id);
    if (!cat) return;
    element("category-id").value = cat.category_id;
    element("category-name").value = cat.name;
    element("category-description").value = cat.description || "";
    element("category-modal-title").textContent = "Edit Category";
    element("category-modal").showModal();
};

window.archiveCategory = async (id) => {
    if (!confirm("Are you sure you want to archive this category?")) return;
    try {
        await api.patch(`/categories/${id}/archive`);
        ui.showToast("Category archived", "success");
        await loadCategories();
    } catch (err) {
        ui.showToast(err.message || "Failed to archive", "error");
    }
};

// --- Actions: Book ---
async function saveBook() {
    const id = element("book-id").value;
    const title = element("book-title").value;
    const desc = element("book-description").value;
    const cover = element("book-cover").value;
    const date = element("book-date").value;

    const data = { title, description: desc, cover_path: cover };
    if (date) data.publication_date = date;

    try {
        if (id) {
            await api.put(`/books/${id}`, data);
            ui.showToast("Book updated successfully", "success");
        } else {
            await api.post("/books", data);
            ui.showToast("Book created successfully", "success");
        }
        element("book-modal").close();
        await loadBooks();
    } catch (err) {
        ui.showToast(err.message || "Failed to save book", "error");
    }
}

window.editBookDetails = (id) => {
    const book = books.find(b => b.book_id === id);
    if (!book) return;
    element("book-id").value = book.book_id;
    element("book-title").value = book.title;
    element("book-description").value = book.description || "";
    element("book-cover").value = book.cover_path || "";
    element("book-date").value = book.publication_date ? book.publication_date.split('T')[0] : "";
    element("book-modal-title").textContent = "Edit Book Details";
    element("book-modal").showModal();
};

window.publishBook = async (id) => {
    try {
        await api.patch(`/books/${id}/publish`);
        ui.showToast("Book published", "success");
        await loadBooks();
    } catch (err) {
        ui.showToast(err.message || "Failed to publish", "error");
    }
};

window.archiveBook = async (id) => {
    if (!confirm("Are you sure you want to archive this book?")) return;
    try {
        await api.patch(`/books/${id}/archive`);
        ui.showToast("Book archived", "success");
        await loadBooks();
    } catch (err) {
        ui.showToast(err.message || "Failed to archive", "error");
    }
};

window.manageBook = (id) => {
    window.location.assign(`admin-book.html?id=${id}`);
};