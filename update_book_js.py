import re
with open('frontend/js/pages/book.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_render_book = """function renderBook(book, authors, categories, chapters) {
    const title = typeof book.title === "string" && book.title.trim()
        ? book.title
        : "Untitled book";

    document.title = ${title} | Digital Library;
    element("book-title").textContent = title;

    const description = element("book-description");
    if (typeof book.description === "string" && book.description.trim()) {
        description.textContent = book.description;
        description.hidden = false;
    } else {
        description.hidden = true;
    }

    const pdfAction = element("pdf-action");
    const readBtn = element("btn-read-pdf");
    if (pdfAction && readBtn) {
        if (book.pdf_path) {
            readBtn.href = eader.html?bookId=;
            pdfAction.hidden = false;
        } else {
            pdfAction.hidden = true;
        }
    }

    const publication = element("book-publication");
    if (book.publication_date) {
        const parsedDate = new Date(book.publication_date);
        publication.textContent = Number.isNaN(parsedDate.getTime())
            ? Publication date: 
            : Publication date: ;
        publication.hidden = false;
    } else {
        publication.hidden = true;
    }

    setCover(book.cover_path, title);

    const authorCount = appendChips(element("book-authors"), authors, "name");
    element("authors-empty").hidden = authorCount > 0;

    const categoryCount = appendChips(element("book-categories"), categories, "name");
    element("categories-empty").hidden = categoryCount > 0;

    renderChapters(chapters);

    element("book-loading").hidden = true;
    element("book-detail").hidden = false;
}"""

content = re.sub(r'function renderBook\(book, authors, categories, chapters\) \{[\s\S]*?element\("book-detail"\)\.hidden = false;\n\}', new_render_book, content)

with open('frontend/js/pages/book.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("book.js updated")
