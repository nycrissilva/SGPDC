from pathlib import Path

root = Path(r'c:\Users\nycri\OneDrive\Desktop\SGPDC\front\sgpdc-app')
files = list(root.rglob('*.tsx')) + list(root.rglob('*.ts'))
modified = []
for path in files:
    text = path.read_text(encoding='utf-8')
    new = text.replace('fetch(`${apiBase}', 'apiFetch(')
    new = new.replace("fetch('/api/", "apiFetch('/api/")
    new = new.replace('fetch("/api/', 'apiFetch("/api/')
    if new != text:
        path.write_text(new, encoding='utf-8')
        modified.append(str(path.relative_to(root)))
print('Modified files:', modified)
