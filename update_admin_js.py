import re
with open('frontend/js/pages/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = """
/* =========================================================
   IMPORT PDF
========================================================= */
function bindImportPdf() {
    const importBtn = document.getElementById("import-pdf-button");
    const dialog = document.getElementById("import-pdf-dialog");
    const form = document.getElementById("import-pdf-form");
    const msg = document.getElementById("import-pdf-message");
    const submitBtn = document.getElementById("import-pdf-submit");

    if (importBtn) {
        importBtn.addEventListener("click", () => {
            form.reset();
            msg.hidden = true;
            dialog.showModal();
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            msg.textContent = "Uploading PDF...";
            msg.className = "form-message";
            msg.hidden = false;

            const formData = new FormData(form);

            try {
                // Remove empty relations to avoid cast errors
                if (!formData.get("authorId")) formData.delete("authorId");
                if (!formData.get("categoryId")) formData.delete("categoryId");
                
                await api.post("/books/import-pdf", formData);
                
                dialog.close();
                ui.showToast("PDF imported and book created successfully.", "success");
                loadBooks(); // refresh list
            } catch (err) {
                msg.textContent = err.message || "Failed to import PDF.";
                msg.className = "form-message error-message";
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
}
"""

content = content.replace('/* =========================================================\n   INITIALIZATION', new_logic + '\n/* =========================================================\n   INITIALIZATION')
content = content.replace('bindModalControls();', 'bindModalControls();\n    bindImportPdf();')

with open('frontend/js/pages/admin.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("admin.js updated")
