/**
 * Hybrid entry point: web panel first, Telegram admin bot as an optional companion.
 */

const { spawn } = require('child_process');
const { startServer } = require('./web/server');
const { startTelegramBot } = require('./telegram');
const { WEB_BASE_URL } = require('./token');

function openBrowser(url) {
  if (process.env.OPEN_BROWSER === 'false') return;
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

async function main() {
  await startServer();
  console.log(`[web] open ${WEB_BASE_URL} in your browser`);
  openBrowser(WEB_BASE_URL);
  await startTelegramBot();
}

main().catch((err) => {
  console.error('[app] failed to start:', err);
  process.exit(1);
});
