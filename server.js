const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'app');

const SCHEMES_DIR = path.join(__dirname, 'scripts', 'manual test schemes');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // handle recording session houni
  if (req.method === 'POST' && req.url === '/api/record') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const name = data.name || 'session';
        // Sanitize name to prevent directory traversal / invalid characters
        const sanitizedName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
        
        // Ensure directory exists
        if (!fs.existsSync(SCHEMES_DIR)) {
          fs.mkdirSync(SCHEMES_DIR, { recursive: true });
        }
        
        const targetPath = path.join(SCHEMES_DIR, `${sanitizedName}.json`);
        fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8', (err) => {
          if (err) {
            console.error('Error writing record:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write session record file' }));
          } else {
            console.log(`Saved session record: ${targetPath}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, path: targetPath }));
          }
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Handle AI Frustration Classification API
  if (req.method === 'POST' && req.url === '/api/predict_frustration') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const features = JSON.parse(body);
        let score = 0;
        
        const submitClicks = features.obs_submit_clicks || 0;
        const ssoClicks = features.obs_sso_clicks || 0;
        const reversals = features.obs_jitter_reversals || 0;
        const bursts = features.obs_rapid_click_bursts || 0;
        const cancelClicks = features.obs_cancel_clicks || 0;
        const failedAttempts = features.failed_attempts || 0;

        if (submitClicks >= 5) score += 0.55;
        else if (submitClicks >= 3) score += 0.25;

        if (ssoClicks >= 3) score += 0.55;
        else if (ssoClicks >= 1) score += 0.15;

        if (reversals >= 5) score += 0.55;
        else if (reversals >= 3) score += 0.20;

        if (bursts >= 1) score += 0.25;
        if (cancelClicks >= 3) score += 0.50;
        if (failedAttempts >= 3) score += 0.55;

        const probability = Math.min(1.0, score);
        const isFrustrated = probability >= 0.50;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          isFrustrated,
          probability: parseFloat(probability.toFixed(3)),
          confidence: probability > 0.75 ? 'HIGH' : probability >= 0.5 ? 'MEDIUM' : 'LOW'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  // Normalize path and resolve to public dir
  let safeUrl = req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, safeUrl === '/' ? 'index.html' : safeUrl);
  
  // Prevent directory traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
