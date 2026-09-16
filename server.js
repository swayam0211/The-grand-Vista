const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const clients = new Set();

// Watch directory for file changes
let watchTimeout = null;
fs.watch(DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  // Ignore git or hidden files
  if (filename.includes('.git') || filename.endsWith('.tmp')) return;

  // Debounce reloads
  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(() => {
    console.log(`[Auto-Reload] File changed: ${filename}. Reloading clients...`);
    clients.forEach(client => {
      client.write('data: reload\n\n');
    });
  }, 150);
});

http.createServer((req, res) => {
  // SSE endpoint for live reload
  if (req.url === '/api/reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 1000\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  // Serve static files
  let filePath = path.join(DIR, decodeURIComponent(req.url === '/' ? '/index.html' : req.url));
  let ext = path.extname(filePath).toLowerCase();
  let contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT, () => {
  console.log(`Server running with Live Reload at http://localhost:${PORT}`);
});
