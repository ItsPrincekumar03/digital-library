import re

def fix_auth(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("const { requireAuth } = require('../middleware/auth.middleware');", "const requireAuth = require('../middleware/auth.middleware');")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_auth('backend/src/routes/book.routes.js')
fix_auth('backend/src/routes/private-library.routes.js')
print("Fixed auth imports")
