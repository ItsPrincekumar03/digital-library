import re
with open('backend/src/controllers/book.controller.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'res.setHeader(\'Content-Disposition\', \\inline; filename="\\"\\);',
    'res.setHeader(\'Content-Disposition\', inline; filename="");'
)

with open('backend/src/controllers/book.controller.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied.")
