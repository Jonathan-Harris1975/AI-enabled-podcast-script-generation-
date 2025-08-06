const https = require('https');
const http = require('http');

function keepAlive(url, intervalMs = 300000) { // default: 5 minutes
  if (!url) {
    console.warn('KeepAlive disabled: No URL provided.');
    return;
  }

  console.log(`KeepAlive enabled: Pinging ${url} every ${intervalMs / 1000} seconds`);

  setInterval(() => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        console.log(`[KeepAlive] Ping to ${url} -> ${res.statusCode}`);
      })
      .on('error', (err) => {
        console.error('[KeepAlive] Error pinging URL:', err.message);
      });
  }, intervalMs);
}

module.exports = keepAlive;
