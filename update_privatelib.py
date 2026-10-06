import re
with open('frontend/js/pages/private-library.js', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_func(m):
    return 'window.location.href = "reader.html?privatePdfId=" + encodeURIComponent(String(privateFileId));'

content = re.sub(r'window\.open\(url\.href, "_blank", "noopener"\);', replace_func, content)
content = content.replace('openButton.textContent = "Open";', 'openButton.textContent = "Read";')

with open('frontend/js/pages/private-library.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("private-library.js updated")
