import { readFile, writeFile } from 'node:fs/promises';

// Vite can preserve the host's HTML line endings. Keep Windows verification
// builds byte-identical to CI, without touching immutable version archives.
const file = new URL('../dist/index.html', import.meta.url);
const original = await readFile(file, 'utf8');
const normalized = original.replaceAll('\r', '');
if (original !== normalized) await writeFile(file, normalized);
