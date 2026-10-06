import re
with open('frontend/book.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<p id="book-description" class="book-description" hidden></p>',
    '<p id="book-description" class="book-description" hidden></p>\n\n                <div id="pdf-action" hidden style="margin-top: 1rem;"><a id="btn-read-pdf" class="button button-primary" href="#">Read PDF</a></div>'
)

with open('frontend/book.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("book.html updated")
