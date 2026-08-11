const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'app');
const RECORDINGS_DIR = path.join(__dirname, 'scripts', 'manual test schemes');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
};

function collectRequestBody(req, callback) {
  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  req.on('end', () => callback(rawBody));
}

function sendJsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function handleSessionRecord(req, res) {
  collectRequestBody(req, (body) => {
    try {
      const data = JSON.parse(body);
      const name = data.name || 'session';
      const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      ensureDirectoryExists(RECORDINGS_DIR);

      const targetPath = path.join(RECORDINGS_DIR, `${safeName}.json`);
      fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8', (err) => {
        if (err) {
          console.error('Error saving session record:', err);
          sendJsonResponse(res, 500, { error: 'Failed to save session record.' });
          return;
        }

        console.log(`Saved session record: ${targetPath}`);
        sendJsonResponse(res, 200, { success: true, path: targetPath });
      });
    } catch (err) {
      sendJsonResponse(res, 400, { error: 'Invalid JSON payload.' });
    }
  });
}

function handleFrustrationPrediction(req, res) {
  collectRequestBody(req, (body) => {
    try {
      const features = JSON.parse(body);
      let score = 0;

      const submitClicks = features.obs_submit_clicks || 0;
      const ssoClicks = features.obs_sso_clicks || 0;
      const reversals = features.obs_jitter_reversals || 0;
      const rapidBursts = features.obs_rapid_click_bursts || 0;
      const cancelClicks = features.obs_cancel_clicks || 0;
      const failedAttempts = features.failed_attempts || 0;

      if (submitClicks >= 5) score += 0.55;
      else if (submitClicks >= 3) score += 0.25;

      if (ssoClicks >= 3) score += 0.55;
      else if (ssoClicks >= 1) score += 0.15;

      if (reversals >= 5) score += 0.55;
      else if (reversals >= 3) score += 0.20;

      if (rapidBursts >= 1) score += 0.25;
      if (cancelClicks >= 3) score += 0.50;
      if (failedAttempts >= 3) score += 0.55;

      const probability = Math.min(1.0, score);
      const isFrustrated = probability >= 0.5;

      sendJsonResponse(res, 200, {
        isFrustrated,
        probability: parseFloat(probability.toFixed(3)),
        confidence: probability > 0.75 ? 'HIGH' : probability >= 0.5 ? 'MEDIUM' : 'LOW',
      });
    } catch (err) {
      sendJsonResponse(res, 400, { error: 'Invalid frustration request payload.' });
    }
  });
}

function serveStaticFile(req, res) {
  const requestPath = req.url.split('?')[0];
  const resolvedFile = path.join(PUBLIC_DIR, requestPath === '/' ? 'index.html' : requestPath);

  if (!resolvedFile.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const extension = path.extname(resolvedFile);
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  fs.readFile(resolvedFile, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/record') {
    handleSessionRecord(req, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/predict_frustration') {
    handleFrustrationPrediction(req, res);
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
