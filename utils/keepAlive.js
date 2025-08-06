import fetch from 'node-fetch';

const URL = 'https://podcast-script-generation.onrender.com/health';
const INTERVAL = 14 * 60 * 1000; // every 14 minutes

function startKeepAlive() {
  setInterval(async () => {
    try {
      const res = await fetch(URL);
      const data = await res.json();
      console.log(`[KeepAlive] ${new Date().toISOString()} Status: ${data.status}`);
    } catch (err) {
      console.error('[KeepAlive] Failed:', err.message);
    }
  }, INTERVAL);
}

export default startKeepAlive;
