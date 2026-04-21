from pathlib import Path
root = Path(__file__).resolve().parent / 'front' / 'sgpdc-app'
modified=[]
for path in list(root.rglob('*.tsx')) + list(root.rglob('*.ts')):
    text = path.read_text(encoding='utf-8')
    new = text.replace('apiFetch(/api', 'apiFetch(`/api')
    if new != text:
        path.write_text(new, encoding='utf-8')
        modified.append(str(path.relative_to(root)))
print('Modified files:', modified)
