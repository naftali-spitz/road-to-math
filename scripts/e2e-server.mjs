// Serve the real production bundle and API against an isolated, disposable test database.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
const databasePath = process.env.E2E_DATABASE_PATH;
if (databasePath !== path.resolve('test-results/e2e.sqlite')) {
  throw new Error('Browser tests may only recreate test-results/e2e.sqlite.');
}
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(databasePath + suffix, { force: true });
const backend = spawn(process.execPath, ['server/dist/index.js'], {
  env: { ...process.env, PORT: '4181', DATABASE_PATH: databasePath, NODE_ENV: 'test' }, stdio: 'inherit'
});
const root = path.resolve('client/dist');
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/')) {
    const upstream = http.request({ host: '127.0.0.1', port: 4181, path: request.url, method: request.method, headers: request.headers }, result => {
      response.writeHead(result.statusCode, result.headers); result.pipe(response);
    });
    upstream.on('error', () => { response.writeHead(503); response.end('Starting API'); });
    request.pipe(upstream); return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', mime[path.extname(filename)] ?? 'application/octet-stream');
  fs.createReadStream(filename).pipe(response);
});
server.listen(4178, '127.0.0.1');
function shutdown() { server.close(); backend.kill('SIGTERM'); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
backend.on('exit', code => { server.close(); process.exitCode = code ?? 1; });
