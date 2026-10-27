const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('No inline JavaScript found');
for (let i = 0; i < scripts.length; i++) {
  const result = spawnSync(process.execPath, ['--check', '-'], {
    input: scripts[i][1],
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    process.stderr.write('Inline script ' + (i + 1) + ' has a syntax error:\n');
    process.stderr.write(result.stderr || result.stdout || 'Unknown syntax error');
    process.exit(result.status || 1);
  }
}
const required = [
  'id="app"', 'id="dlg"', 'function cropImage(file)',
  'function backup()', 'function restore()', 'indexedDB.open'
];
for (const fragment of required) {
  if (!html.includes(fragment)) throw new Error('Missing expected feature marker: ' + fragment);
}
console.log('Static checks passed: inline JavaScript syntax and core feature markers.');
