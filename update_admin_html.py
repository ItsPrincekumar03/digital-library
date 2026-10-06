import re
with open('frontend/admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Import PDF button next to New book
content = content.replace(
    '<button id="create-book-button" class="button button-primary" type="button">\n                        + New book\n                    </button>',
    '<button id="import-pdf-button" class="button button-secondary" type="button" style="margin-right:0.5rem;">Import PDF</button>\n                    <button id="create-book-button" class="button button-primary" type="button">\n                        + New book\n                    </button>'
)

pdf_modal = """
    <!-- IMPORT PDF MODAL -->
    <dialog id="import-pdf-dialog" class="admin-dialog" aria-labelledby="import-pdf-dialog-title">
        <form id="import-pdf-form" method="dialog" class="admin-dialog-shell" enctype="multipart/form-data">
            <header class="admin-dialog-header">
                <div>
                    <p class="eyebrow">PDF Import</p>
                    <h2 id="import-pdf-dialog-title">Import PDF to Library</h2>
                </div>
                <button type="button" class="admin-dialog-close" aria-label="Cancel and close dialog" onclick="document.getElementById('import-pdf-dialog').close()">
                    ✕
                </button>
            </header>

            <div class="admin-dialog-body">
                <div id="import-pdf-message" class="form-message" role="alert" hidden></div>

                <div class="form-group">
                    <label for="import-pdf-title" class="form-label">Book Title</label>
                    <input type="text" id="import-pdf-title" name="title" class="form-control" required autocomplete="off" maxlength="255">
                </div>

                <div class="form-group">
                    <label for="import-pdf-author" class="form-label">Author ID (Optional)</label>
                    <input type="number" id="import-pdf-author" name="authorId" class="form-control" min="1">
                </div>

                <div class="form-group">
                    <label for="import-pdf-category" class="form-label">Category ID (Optional)</label>
                    <input type="number" id="import-pdf-category" name="categoryId" class="form-control" min="1">
                </div>

                <div class="form-group">
                    <label for="import-pdf-desc" class="form-label">Description (Optional)</label>
                    <textarea id="import-pdf-desc" name="description" class="form-control" rows="4"></textarea>
                </div>

                <div class="form-group">
                    <label for="import-pdf-file" class="form-label">PDF File</label>
                    <input type="file" id="import-pdf-file" name="pdf" class="form-control" accept=".pdf" required>
                    <p class="form-hint">Max size: 10 MB. Only .pdf files are allowed.</p>
                </div>
            </div>

            <footer class="admin-dialog-footer">
                <button type="button" class="button button-secondary" onclick="document.getElementById('import-pdf-dialog').close()">
                    Cancel
                </button>
                <button id="import-pdf-submit" type="submit" class="button button-primary">
                    Import PDF
                </button>
            </footer>
        </form>
    </dialog>
"""

content = content.replace('<!-- BOOK MODAL -->', pdf_modal + '\n    <!-- BOOK MODAL -->')

with open('frontend/admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("admin.html updated")
