/**
 * Hybrid entry point: web panel first, Telegram admin bot as an optional companion.
 */

const { spawn } = require('child_process');
const { startServer } = require('./web/server');
const { startTelegramBot } = require('./telegram');
const { WEB_BASE_URL } = require('./token');

function openBrowser(url) {
  if (process.env.OPEN_BROWSER !== 'true') return;
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.NODE_ENV === 'production') return;
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  const child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
  child.on('error', () => {});
  child.unref();
}

async function main() {
  await startServer();
  console.log(`[web] panel ready at ${WEB_BASE_URL}`);
  openBrowser(WEB_BASE_URL);
  await startTelegramBot();
}

main().catch((err) => {
  console.error('[app] failed to start:', err);
  process.exit(1);
});
