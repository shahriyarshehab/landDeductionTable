/**
 * LMAP Local Development Server
 * Zero-dependency Node.js HTTP Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DEFAULT_PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 File Not Found — LMAP Local Server</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>500 Server Error: ${err.code}</h1>`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/login.html';

  let filePath = path.join(__dirname, reqUrl);
  let extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'login.html');
      contentType = 'text/html; charset=utf-8';
    }
    serveFile(res, filePath, contentType);
  });
});

function startServer(port) {
  server.listen(port, HOST, () => {
    const url = `http://localhost:${port}`;
    console.log('\n======================================================');
    console.log('🚀 LMAP লোকাল সারভার সফলভাবে চালু হয়েছে!');
    console.log('======================================================');
    console.log(`🌐 ব্রাউজারে প্রবেশ করুন: \x1b[36m${url}\x1b[0m`);
    console.log(`📂 ওয়েব সার্ভার রুট: ${__dirname}`);
    console.log('======================================================\n');
    console.log('সারভার বন্ধ করতে [Ctrl + C] চাপুন।\n');

    // Auto-open browser on Windows
    if (process.platform === 'win32') {
      exec(`start ${url}`);
    } else if (process.platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ পোর্ট ${port} ব্যাস্ত আছে। পোর্ট ${port + 1} ট্রাই করা হচ্ছে...`);
      startServer(port + 1);
    } else {
      console.error('সারভার চালুর সমস্যা:', err);
    }
  });
}

startServer(DEFAULT_PORT);
