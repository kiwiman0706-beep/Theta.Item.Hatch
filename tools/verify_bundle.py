#!/usr/bin/env python3
"""Verify the supplied handoff snapshot with the Python standard library."""
from pathlib import Path, PurePosixPath
import hashlib, json, sys

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'FILES_SHA256.json').read_text(encoding='utf-8'))
errors = []
for row in manifest['files']:
    rel = PurePosixPath(row['path'])
    if rel.is_absolute() or '..' in rel.parts:
        errors.append('Unsafe path: ' + row['path'])
        continue
    p = root.joinpath(*rel.parts)
    if not p.is_file():
        errors.append('Missing: ' + row['path'])
        continue
    if p.stat().st_size != row['size_bytes']:
        errors.append('Size mismatch: ' + row['path'])
    if hashlib.sha256(p.read_bytes()).hexdigest() != row['sha256']:
        errors.append('SHA-256 mismatch: ' + row['path'])
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print('PASS:', len(manifest['files']), 'files match the handoff snapshot.')
print('This is an integrity check, not an APK signature or functional test.')
