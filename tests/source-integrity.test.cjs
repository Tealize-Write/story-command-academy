const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('website sources and checks contain no unresolved merge markers', () => {
  const root = path.resolve(__dirname, '..');
  const extensions = new Set(['.html', '.js', '.cjs', '.css', '.json', '.yml', '.yaml']);
  const files = fs.readdirSync(root).filter(name => extensions.has(path.extname(name)));
  function collect(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const name = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(name);
      else if (extensions.has(path.extname(name))) files.push(name);
    }
  }
  for (const directory of ['js', 'css', 'scripts', 'tests', '.github']) collect(directory);
  const conflicts = [];
  for (const file of files) {
    fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).forEach((line, index) => {
      if (/^(?:<{7}(?:\s|$)|={7}\s*$|>{7}(?:\s|$)|\|{7}(?:\s|$))/.test(line)) {
        conflicts.push(`${file}:${index + 1}`);
      }
    });
  }
  assert.deepEqual(conflicts, [], `Unresolved merge markers: ${conflicts.join(', ')}`);
});
