import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SERVER_FILE = fileURLToPath(new URL('../server.js', import.meta.url));

// server.js is CommonJS inside a "type": "module" package and listens on a fixed
// port, so start it as CommonJS on an ephemeral port to read its startup banner.
const BOOT = `
const fs = require('fs');
const net = require('net');
const path = require('path');
const Module = require('module');
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (port, ...rest) { return listen.call(this, 0, ...rest); };
const file = process.argv[1];
const m = new Module(file);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(fs.readFileSync(file, 'utf8'), file);
`;

function readBanner() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', BOOT, SERVER_FILE]);
    let out = '';
    const finish = (err) => {
      child.kill();
      if (err) reject(err);
      else resolve(out);
    };
    const timer = setTimeout(() => finish(new Error(`no banner within 5s:\n${out}`)), 5000);
    child.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.includes('/api/flaky') || out.includes('/api/protected')) {
        clearTimeout(timer);
        setTimeout(() => finish(), 100);
      }
    });
    child.stderr.on('data', (chunk) => { out += chunk; });
    child.on('error', finish);
  });
}

test('R3: startup banner lists GET /api/health among the routes', async () => {
  const banner = await readBanner();
  assert.match(banner, /API server running/);
  assert.match(banner, /^\s*- GET\s+\/api\/health\s*$/m);
});
