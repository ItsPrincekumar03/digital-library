import re
with open('frontend/js/router.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"private-library.html"', '"private-library.html",\n            "reader.html"')
content = content.replace('book: "./pages/book.js"', 'book: "./pages/book.js",\n        reader: "./pages/reader.js"')

with open('frontend/js/router.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("router.js updated")
