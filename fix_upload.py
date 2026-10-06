import re
with open('backend/src/middleware/upload.middleware.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'message: \\PDF file size must be \\ bytes or less.\\',
    'message: PDF file size must be  bytes or less.'
)

with open('backend/src/middleware/upload.middleware.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied to upload.middleware.js")
