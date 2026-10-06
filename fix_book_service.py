import re

with open('backend/src/services/book.service.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const { BOOK_SORT_COLUMNS, PUBLIC_BOOK_STATUS } = require('../config/constants');", "const PUBLIC_BOOK_STATUS = 'PUBLISHED';\nconst BOOK_SORT_COLUMNS = ['created_at', 'title', 'publication_date', 'updated_at'];")

with open('backend/src/services/book.service.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed book.service.js")
