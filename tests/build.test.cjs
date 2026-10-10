const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { generateConfig, build } = require('../scripts/build.cjs');
const url = 'https://script.google.com/macros/s/test-deployment/exec';

test('build requires a published GAS endpoint and safely encodes config values', () => {
  for (const value of ['', '__GAS_URL__', 'https://example.com/exec', 'http://script.google.com/macros/s/id/exec', 'https://script.google.com/macros/s/id/dev']) assert.throws(() => generateConfig(value));
  const config = generateConfig(url + '?source=%22&value=$literal');
  new vm.Script(config);
  assert.ok(!config.includes('__GAS_URL__'));
  assert.ok(!config.includes('__TOKEN__'));
});

test('website artifact includes pages and runtime assets while excluding development files', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-site-'));
  try {
    build(url, output);
    for (const name of ['index.html', 'about.html', 'js/analytics.js', 'js/config.js', 'img/cover.jpg']) assert.ok(fs.existsSync(path.join(output, name)));
    for (const name of ['tests', 'docs', 'artifacts', 'GAS', 'README.md', '.git', 'js/config.example.js']) assert.ok(!fs.existsSync(path.join(output, name)));
  } finally {
    assert.ok(fs.realpathSync(output).startsWith(fs.realpathSync(os.tmpdir()) + path.sep + 'academy-site-'));
    fs.rmSync(output, { recursive: true, force: true });
  }
});
