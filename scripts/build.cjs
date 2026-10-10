const fs = require('node:fs');
const path = require('node:path');

function generateConfig(url) {
  let endpoint;
  try { endpoint = new URL(url); } catch { throw new Error('GAS_URL is required and must be a valid GAS deployment URL.'); }
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint.pathname)) {
    throw new Error('GAS_URL must point to a published Google Apps Script /exec deployment.');
  }
  const template = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.example.js'), 'utf8');
  return template.replace('"__GAS_URL__"', () => JSON.stringify(endpoint.href)).replace(/^const TOKEN = "__TOKEN__";\r?\n/m, '');
}

function build(url, output = path.join(__dirname, '..', '.tmp', 'site')) {
  const config = generateConfig(url); // Validate before writing the artifact.
  fs.mkdirSync(output, { recursive: true });
  const root = path.join(__dirname, '..');
  for (const name of ['index.html', 'about.html', 'stats.html', 'result.html', 'author-quiz.html']) {
    fs.copyFileSync(path.join(root, name), path.join(output, name));
  }
  for (const name of ['css', 'img']) fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
  fs.mkdirSync(path.join(output, 'js'), { recursive: true });
  for (const name of fs.readdirSync(path.join(root, 'js'))) {
    if (!name.endsWith('.js') || ['config.js', 'config.example.js'].includes(name)) continue;
    fs.copyFileSync(path.join(root, 'js', name), path.join(output, 'js', name));
  }
  fs.writeFileSync(path.join(output, 'js', 'config.js'), config);
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  return output;
}

module.exports = { generateConfig, build };
if (require.main === module) {
  try { console.log('Website artifact:', build(process.env.GAS_URL)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
