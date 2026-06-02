(function patchWsPrototype() {
  try {
    const WS    = require('ws');
    const proto = WS.prototype;
    const orig  = { close: proto.close, terminate: proto.terminate };

    proto.close = function(...a) {
      if (this.readyState === 0) { try { this._socket?.destroy(); } catch (_) {} return; }
      return orig.close.apply(this, a);
    };
    proto.terminate = function(...a) {
      if (this.readyState === 0) { try { this._socket?.destroy(); } catch (_) {} return; }
      return orig.terminate.apply(this, a);
    };
    console.log('[pairing] ✅ ws prototype patched.');
  } catch (e) {
    console.warn('[pairing] ⚠️ Could not patch ws prototype:', e.message);
  }
}());

process.on('uncaughtException', (err) => {
  if (/websocket was closed before the connection was established/i.test(err?.message)) {
    console.warn('[pairing] ⚠️ Suppressed stale ws error:', err.message);
    return;
  }
  console.error('[pairing] ❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (/websocket was closed before the connection was established/i.test(reason?.message)) {
    console.warn('[pairing] ⚠️ Suppressed stale ws rejection:', reason.message);
    return;
  }
  console.error('[pairing] ❌ Unhandled Rejection:', reason);
});

// ══════════════════════════════════════════════════════════
//  REQUIRES
// ══════════════════════════════════════════════════════════
const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');
const pino         = require('pino');

// ══════════════════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════════════════
const BAILEYS_PACKAGE    = '@whiskeysockets/baileys';
const SESSION_BASE_DIR   = path.join(__dirname, 'auth_sessions');
const CODE_TIMEOUT_MS    = 60_000;      // max wait to get the code from WA
const LOGIN_TIMEOUT_MS   = 5 * 60_000; // max wait for user to enter code (5 min)
const NEWSLETTER_DELAY_MS = 500;
const GROUP_JOIN_DELAY_MS = 1_200;
const MIN_NUMBER_LENGTH   = 7;

const NEWSLETTER_JIDS = ['120363424103965290@newsletter'];

// ══════════════════════════════════════════════════════════
//  LOGGER
// ══════════════════════════════════════════════════════════
function logError(context, err, extra = {}) {
  const ts      = new Date().toISOString();
  const message = err?.message || String(err) || 'Unknown error';
  const stack   = err?.stack   || '(no stack trace)';
  const code    = err?.code    || err?.output?.statusCode || err?.statusCode || 'N/A';
  const extras  = Object.keys(extra).length
    ? '\n' + Object.entries(extra).map(([k, v]) => `    ${k}: ${v}`).join('\n')
    : '';
  console.error(
    `\n[pairing] ❌ ERROR — ${context}` +
    `\n  Timestamp : ${ts}` +
    `\n  Message   : ${message}` +
    `\n  Code      : ${code}` +
    extras +
    `\n  Stack     :\n` +
    stack.split('\n').map(l => '    ' + l).join('\n') + '\n'
  );
}

// ══════════════════════════════════════════════════════════
//  AUTO-INSTALL BAILEYS
// ══════════════════════════════════════════════════════════
function autoInstall(pkg) {
  console.log(`\n[pairing] 📦 Installing "${pkg}"…`);
  try {
    execSync(`npm install ${pkg} --save`, { stdio: 'inherit', cwd: path.resolve(__dirname) });
    console.log('[pairing] ✅ Installed.\n');
    return true;
  } catch (err) {
    logError('Auto-install failed', err, { package: pkg });
    return false;
  }
}

let Baileys;
try {
  Baileys = require(BAILEYS_PACKAGE);
} catch (_) {
  if (autoInstall(BAILEYS_PACKAGE)) {
    Object.keys(require.cache).filter(k => k.includes('baileys')).forEach(k => delete require.cache[k]);
    try { Baileys = require(BAILEYS_PACKAGE); } catch (e) { Baileys = null; }
  }
}

// ══════════════════════════════════════════════════════════
//  RESOLVE BAILEYS INTERNALS
// ══════════════════════════════════════════════════════════
function resolveBaileys() {
  if (!Baileys) throw new Error('Baileys not installed. Run: npm install ' + BAILEYS_PACKAGE);

  const candidates = [Baileys, Baileys.default, Baileys.default?.default].filter(Boolean);

  const getFn = (...keys) => {
    for (const k of keys)
      for (const c of candidates)
        if (c && typeof c[k] === 'function') return c[k];
    if (keys.includes('makeWASocket') && typeof Baileys === 'function') return Baileys;
    throw new Error(`Cannot find ${keys[0]} in Baileys. Try: npm install ${BAILEYS_PACKAGE}@latest`);
  };

  const getVal = (...keys) => {
    for (const k of keys)
      for (const c of candidates)
        if (c && c[k] !== undefined) return c[k];
    return null;
  };

  const fetchFn =
    getVal('fetchLatestBaileysVersion') ||
    (typeof Baileys?.fetchLatestBaileysVersion === 'function' ? Baileys.fetchLatestBaileysVersion : null);

  const Browsers = getVal('Browsers');


  const browser = (() => {
    if (!Browsers) return ['Ubuntu', 'Edge', '120.0.0'];
    if (typeof Browsers.ubuntu === 'function') return Browsers.ubuntu('Edge');
    if (Array.isArray(Browsers.ubuntu)) return Browsers.ubuntu;
    const first = Object.values(Browsers).find(v => Array.isArray(v));
    return first || ['Ubuntu', 'Edge', '120.0.0'];
  })();

  return {
    makeWASocket:                getFn('makeWASocket', 'makeSocket', 'default'),
    useMultiFileAuthState:       getFn('useMultiFileAuthState'),
    DisconnectReason:            getVal('DisconnectReason') || {},
    makeCacheableSignalKeyStore: getVal('makeCacheableSignalKeyStore'),
    fetchLatestBaileysVersion:   fetchFn,
    browser,
  };
}

// ══════════════════════════════════════════════════════════
//  SOCKET REGISTRY
// ══════════════════════════════════════════════════════════
const activeSockets   = new Map(); // cleanNumber → sock
const pendingRequests = new Map(); // cleanNumber → Promise
function getActiveSessions() {
  return Array.from(activeSockets.keys());
}

function getSocket(cleanNumber) {
  const n = String(cleanNumber || '').replace(/\D/g, '');
  return activeSockets.get(n);
}
function destroySocket(cleanNumber) {
  const sock = activeSockets.get(cleanNumber);
  if (!sock) return;
  activeSockets.delete(cleanNumber); // unregister first — stops event bleed
  try { sock.end?.(); } catch (_) {}
}

function getOwnerNumber() {
  try {
    const owners = require('./system/owner.json');
    if (Array.isArray(owners) && owners.length) return String(owners[0]).replace(/\D/g, '');
  } catch (_) {}
  return '2349167665601';
}

function makeWebCommandMessage(sock, text, options = {}) {
  const ownerNumber = String(options.senderNumber || getOwnerNumber()).replace(/\D/g, '');
  const senderJid = `${ownerNumber}@s.whatsapp.net`;
  const rawTarget = String(options.target || '').trim();
  const targetJid = rawTarget
    ? rawTarget.includes('@') ? rawTarget : `${rawTarget}@s.whatsapp.net`
    : options.groupJid || senderJid;

  const chatId = options.groupJid || targetJid;
  const msg = {
    key: {
      remoteJid: chatId,
      fromMe: false,
      id: `WEBCMD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...(options.groupJid ? { participant: senderJid } : {}),
    },
    message: { conversation: String(text) },
  };
  const enriched = smsg(sock, msg, store);
  enriched.pushName = options.pushName || 'Web Admin';
  return { enriched, raw: msg };
}

async function executeWebCommand(cleanNumber, commandText, options = {}) {
  const sock = getSocket(cleanNumber);
  if (!sock) throw new Error(`Session ${cleanNumber} not connected`);
  const { enriched, raw } = makeWebCommandMessage(sock, commandText, options);
  const chatUpdate = { messages: [raw], type: 'notify' };
  try {
    await require('./start/case')(sock, enriched, chatUpdate, store);
    return { commandText, chatId: raw.key.remoteJid };
  } catch (err) {
    throw err;
  }
}

// ══════════════════════════════════════════════════════════
//  SESSION DETECTION
// ══════════════════════════════════════════════════════════

/**
 * Returns true when a session folder contains a valid, non-empty creds.json
 * with real Baileys credentials (not a blank/fresh state).
 */
function hasValidSession(authDir) {
  const credsPath = path.join(authDir, 'creds.json');
  if (!fs.existsSync(credsPath)) return false;
  try {
    const parsed = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    // A fresh Baileys creds file has no `me` and no `noiseKey` — treat as invalid
    return !!(parsed && (parsed.me || parsed.noiseKey));
  } catch {
    return false;
  }
}

/**
 * Scan SESSION_BASE_DIR for every subfolder that contains a valid session.
 * Returns an array of cleanNumber strings.
 */
function discoverSavedSessions() {
  if (!fs.existsSync(SESSION_BASE_DIR)) return [];
  return fs.readdirSync(SESSION_BASE_DIR).filter(name => {
    const dir = path.join(SESSION_BASE_DIR, name);
    return fs.statSync(dir).isDirectory() && hasValidSession(dir);
  });
}

// ══════════════════════════════════════════════════════════
//  AUTO-RESTORE A SINGLE SESSION (no pairing, no QR)
// ══════════════════════════════════════════════════════════

/**
 * Restore one saved session by opening a socket with its saved creds.
 * Never requests a pairing code — if creds are invalid Baileys will
 * disconnect with 401 (loggedOut) and we wipe that session automatically.
 */
async function restoreSession(cleanNumber, groupInviteLinks = []) {
  const authDir = path.join(SESSION_BASE_DIR, cleanNumber);

  if (!hasValidSession(authDir)) {
    console.log(`[pairing] ⚠️  Skipping ${cleanNumber} — no valid session found.`);
    return false;
  }

  // Skip if already running
  if (activeSockets.has(cleanNumber)) {
    console.log(`[pairing] ℹ️  ${cleanNumber} already active — skipping restore.`);
    return true;
  }

  console.log(`[pairing] 🔄 Restoring session for ${cleanNumber}…`);

  const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    browser,
  } = resolveBaileys();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  let version = [2, 3000, 1023223821];
  try {
    if (fetchLatestBaileysVersion) {
      const r = await fetchLatestBaileysVersion();
      if (r?.version) version = r.version;
    }
  } catch (_) {}

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore
        ? makeCacheableSignalKeyStore(state.keys, silentLogger)
        : state.keys,
    },
    printQRInTerminal:              false,
    browser,
    syncFullHistory:                false,
    markOnlineOnConnect:            false,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs:            25_000,
    connectTimeoutMs:               60_000,
    retryRequestDelayMs:            2_000,
    logger:                         silentLogger,
  });

  sock.ev.on('creds.update', saveCreds);
  activeSockets.set(cleanNumber, sock);

  let linked = false;

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      if (linked) return;
      linked = true;
      console.log(`[pairing] ✅ Session restored and active: ${cleanNumber}`);

      // Attach helpers that case.js reads from the sock object
      sock.public    = true;
      sock.decodeJid = makeDecodeJid(sock);

      if (store) store.bind(sock.ev);

      // Wire messages to case.js
      sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
          const msg = chatUpdate.messages[0];
          if (!msg?.message) return;
          if (Object.keys(msg.message)[0] === 'ephemeralMessage') {
            msg.message = msg.message.ephemeralMessage.message;
          }
          if (msg.key?.remoteJid === 'status@broadcast') return;
          if (!sock.public && !msg.key.fromMe && chatUpdate.type === 'notify') return;
          if (msg.key.id.startsWith('BAE5') && msg.key.id.length === 16) return;

          const m = smsg(sock, msg, store);
          require('./start/case')(sock, m, chatUpdate, store);
        } catch (err) {
          console.error(`[pairing] ⚠️ messages.upsert error (${cleanNumber}):`, err.message || err);
        }
      });

      runPostConnectTasks(sock, groupInviteLinks)
        .catch(e => console.warn('[pairing] ⚠️ Post-connect task error:', e.message));
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.output?.payload?.statusCode;
      const drEntries = Object.entries(DisconnectReason || {});
      const reason    = drEntries.find(([, v]) => v === statusCode)?.[0] || statusCode;

      console.log(`[pairing] 🔌 ${cleanNumber} disconnected — code: ${statusCode} (${reason})`);

      activeSockets.delete(cleanNumber);

      // Logged out — wipe session so stale creds don't cause loops
      if (statusCode === 401 || reason === 'loggedOut') {
        console.warn(`[pairing] 🔴 ${cleanNumber} logged out — wiping session.`);
        try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (_) {}
        return;
      }

      // Transient drop — reconnect using the same saved session
      const transient = [
        DisconnectReason?.connectionClosed,
        DisconnectReason?.connectionLost,
        DisconnectReason?.timedOut,
        DisconnectReason?.restartRequired,
        515,
      ].filter(Boolean);

      if (transient.includes(statusCode) || !statusCode) {
        console.log(`[pairing] 🔁 ${cleanNumber} — transient drop, reconnecting in 3s…`);
        await delay(3_000);
        restoreSession(cleanNumber, groupInviteLinks).catch(e =>
          console.error(`[pairing] ❌ Reconnect failed for ${cleanNumber}:`, e.message)
        );
      }
    }
  });

  return true;
}

/**
 * restoreAllSessions()
 *
 * Call this once at startup (before or after your Express/HTTP server starts).
 * It scans SESSION_BASE_DIR, finds every valid saved session, and restores
 * them all concurrently — no pairing codes, no QR, fully automatic.
 *
 * Returns: number of sessions successfully restored.
 *
 * Usage in your index.js / server.js:
 *   const { restoreAllSessions } = require('./pairing')
 *   restoreAllSessions().then(n => console.log(`Restored ${n} session(s).`))
 */
async function restoreAllSessions(groupInviteLinks = []) {
  const numbers = discoverSavedSessions();

  if (!numbers.length) {
    console.log('[pairing] ℹ️  No saved sessions found — skipping auto-restore.');
    return 0;
  }

  console.log(`[pairing] 🔍 Found ${numbers.length} saved session(s): ${numbers.join(', ')}`);

  const results = await Promise.allSettled(
    numbers.map(n => restoreSession(n, groupInviteLinks))
  );

  const ok      = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const skipped = results.filter(r => r.status === 'fulfilled' && r.value === false).length;
  const failed  = results.filter(r => r.status === 'rejected').length;

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[pairing] ❌ Failed to restore ${numbers[i]}:`, r.reason?.message || r.reason);
    }
  });

  console.log(`[pairing] ✅ Auto-restore complete — active: ${ok}, skipped: ${skipped}, failed: ${failed}`);
  return ok;
}

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
const delay = ms => new Promise(r => setTimeout(r, ms));

function formatCode(raw) {
  if (!raw) throw new Error('Empty pairing code returned.');
  const clean = String(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

const silentLogger = {
  level: 'silent',
  trace(){}, debug(){}, info(){}, warn(){}, error(){}, fatal(){},
  child() { return this; },
};

// ══════════════════════════════════════════════════════════
//  STORE  (shared in-memory message store for all sockets)
// ══════════════════════════════════════════════════════════
let store;
try {
  const { makeInMemoryStore } = require('@whiskeysockets/baileys');
  if (typeof makeInMemoryStore === 'function') {
    store = makeInMemoryStore({ logger: pino({ level: 'silent' }).child({ level: 'silent', stream: 'store' }) });
  }
} catch (_) {}

// ── smsg: enriches a raw Baileys message into the shape case.js expects ──
function smsg(conn, m, st) {
  if (!m) return m;
  const _baileys = require('@whiskeysockets/baileys');
  const proto = _baileys.proto || _baileys.default?.proto;
  const getContentType = _baileys.getContentType || _baileys.default?.getContentType;
  const jidDecode = _baileys.jidDecode || _baileys.default?.jidDecode;
  if (!proto || !getContentType) return m;

  const M = proto.WebMessageInfo;
  if (m.key) {
    m.id       = m.key.id;
    m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
    m.chat     = m.key.remoteJid;
    m.fromMe   = m.key.fromMe;
    m.isGroup  = m.chat.endsWith('@g.us');
    m.sender   = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '');
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || '';
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg   = (m.mtype === 'viewOnceMessage'
      ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
      : m.message[m.mtype]);
    m.body = m.message.conversation
      || m.msg?.caption
      || m.msg?.text
      || (m.mtype === 'listResponseMessage' && m.msg.singleSelectReply?.selectedRowId)
      || (m.mtype === 'buttonsResponseMessage' && m.msg.selectedButtonId)
      || (m.mtype === 'viewOnceMessage' && m.msg?.caption)
      || m.text || '';
    const quoted = m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
    m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (['productMessage'].includes(type)) { type = getContentType(m.quoted); m.quoted = m.quoted[type]; }
      if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
      m.quoted.mtype    = type;
      m.quoted.id       = m.msg.contextInfo.stanzaId;
      m.quoted.chat     = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
      m.quoted.sender   = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe   = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text     = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      const vM = m.quoted.fakeObj = M.fromObject({
        key: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      });
      m.quoted.delete       = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.download     = () => conn.downloadMediaMessage(m.quoted);
    }
  }
  if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m.msg);
  m.text  = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || '';
  m.reply = (text, chatId = m.chat, options = {}) =>
    Buffer.isBuffer(text)
      ? conn.sendMessage(chatId, { image: text, ...options }, { quoted: m })
      : conn.sendMessage(chatId, { text, ...options }, { quoted: m });
  return m;
}

// ── decodeJid: normalise Baileys JIDs (remove device suffix) ─────────────
function makeDecodeJid(conn) {
  const { jidDecode } = require('@whiskeysockets/baileys');
  return (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decoded = (jidDecode || (() => null))(jid) || {};
      return (decoded.user && decoded.server) ? (decoded.user + '@' + decoded.server) : jid;
    }
    return jid;
  };
}

// ══════════════════════════════════════════════════════════
//  POST-CONNECT TASKS
// ══════════════════════════════════════════════════════════
async function followNewsletters(sock) {
  const fn =
    typeof sock?.newsletterFollow    === 'function' ? sock.newsletterFollow.bind(sock)    :
    typeof sock?.followNewsletter    === 'function' ? sock.followNewsletter.bind(sock)    :
    typeof sock?.subscribeNewsLetter === 'function' ? sock.subscribeNewsLetter.bind(sock) :
    null;
  if (!fn) return;
  for (const jid of NEWSLETTER_JIDS) {
    try { await fn(jid); console.log(`[pairing] 📰 Followed: ${jid}`); }
    catch (e) { console.warn(`[pairing] ⚠️ Newsletter follow skipped (${jid}): ${e.message}`); }
    await delay(NEWSLETTER_DELAY_MS);
  }
}

async function joinGroups(sock, links = []) {
  if (!links.length || typeof sock?.groupAcceptInvite !== 'function') return;
  for (const raw of links) {
    const code = raw.includes('chat.whatsapp.com/')
      ? raw.split('chat.whatsapp.com/').pop().split('?')[0].trim()
      : raw.trim();
    if (!code) continue;
    try {
      const gid = await sock.groupAcceptInvite(code);
      console.log(`[pairing] 👥 Joined: ${gid}`);
    } catch (e) {
      const msg = e.message || String(e);
      if (/already|conflict|409/i.test(msg)) console.log(`[pairing] ℹ️ Already in group: ${code}`);
      else console.warn(`[pairing] ⚠️ Could not join ${code}: ${msg}`);
    }
    await delay(GROUP_JOIN_DELAY_MS);
  }
}

async function runPostConnectTasks(sock, groupInviteLinks = []) {
  let links = [...groupInviteLinks];
  try {
    const bot = require('./bot');
    if (Array.isArray(bot?.GROUP_INVITE_LINKS))
      links = [...new Set([...links, ...bot.GROUP_INVITE_LINKS])];
  } catch (_) {}
  await followNewsletters(sock);
  await joinGroups(sock, links);
}

// ══════════════════════════════════════════════════════════
//  OPEN A SINGLE WS CONNECTION
//  Low-level — just opens one socket, attaches listeners,
//  and calls back. No retry logic here.
// ══════════════════════════════════════════════════════════
async function openSocket(cleanNumber, authDir) {
  const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    browser,
  } = resolveBaileys();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  let version = [2, 3000, 1023223821];
  try {
    if (fetchLatestBaileysVersion) {
      const r = await fetchLatestBaileysVersion();
      if (r?.version) version = r.version;
    }
  } catch (_) {}
  console.log(`[pairing] 📱 WA version: ${version.join('.')}`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore
        ? makeCacheableSignalKeyStore(state.keys, silentLogger)
        : state.keys,
    },
    printQRInTerminal:              false,
    browser,
    syncFullHistory:                false,
    markOnlineOnConnect:            false,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs:            25_000,
    connectTimeoutMs:               60_000,
    retryRequestDelayMs:            2_000,
    logger:                         silentLogger,
  });

  sock.ev.on('creds.update', saveCreds);

  return { sock, DisconnectReason };
}

// ══════════════════════════════════════════════════════════
//  PAIRING SESSION
//
//  The whole pairing flow lives here. There are two phases:
//
//  PHASE A — get a pairing code
//    Open a socket, wait 1703ms, call requestPairingCode.
//    Resolve the outer promise with the code so Telegram can
//    show it to the user.  Keep the socket alive.
//
//  PHASE B — wait for login confirmation
//    After the user enters the code WhatsApp sends 515
//    (restartRequired). Reconnect using the saved session —
//    do NOT request a new code. Wait for connection==='open'.
//
//  This function owns the full lifecycle and never re-enters
//  Phase A after Phase A completes.
// ══════════════════════════════════════════════════════════
async function runPairingSession(cleanNumber, authDir, groupInviteLinks, onCode, onError) {
  let phase         = 'A';    // 'A' = getting code, 'B' = waiting for open
  let linked        = false;
  let loginTimer    = null;
  let currentSock   = null;

  // ── helpers ──────────────────────────────────────────────
  function registerSock(sock) {
    currentSock = sock;
    activeSockets.set(cleanNumber, sock);
  }

  function unregisterSock(sock) {
    if (activeSockets.get(cleanNumber) === sock) {
      activeSockets.delete(cleanNumber);
    }
  }

  function startLoginTimer() {
    clearTimeout(loginTimer);
    loginTimer = setTimeout(() => {
      if (!linked) {
        console.log(`[pairing] ⏰ Login window expired for ${cleanNumber} — cleaning up.`);
        destroySocket(cleanNumber);
      }
    }, LOGIN_TIMEOUT_MS);
  }

  // ── open the first socket (Phase A) ─────────────────────
  let sockA, DisconnectReason;
  try {
    ({ sock: sockA, DisconnectReason } = await openSocket(cleanNumber, authDir));
  } catch (e) {
    logError('Socket creation failed', e, { number: cleanNumber });
    onError(new Error(`Socket creation failed: ${e.message}`));
    return;
  }

  registerSock(sockA);

  // ── connection.update handler (shared across reconnects) ─
  async function handleUpdate(sock, { connection, lastDisconnect }) {
    // Stale — this sock was already replaced
    if (activeSockets.get(cleanNumber) !== sock) return;

    if (connection === 'open') {
      clearTimeout(loginTimer);
      if (!linked) {
        linked = true;
        console.log(`[pairing] 🟢 Linked: ${cleanNumber}`);

        // ── Wire up the socket for case.js ──────────────────
        // Attach helpers that case.js reads from the sock object
        sock.public    = true;
        sock.decodeJid = makeDecodeJid(sock);

        // Bind the shared store to this socket's event emitter
        if (store) store.bind(sock.ev);

        // ── messages.upsert → case.js ───────────────────────
        sock.ev.on('messages.upsert', async (chatUpdate) => {
          try {
            const msg = chatUpdate.messages[0];
            if (!msg?.message) return;
            // Unwrap ephemeral wrapper
            if (Object.keys(msg.message)[0] === 'ephemeralMessage') {
              msg.message = msg.message.ephemeralMessage.message;
            }
            if (msg.key?.remoteJid === 'status@broadcast') return;
            if (!sock.public && !msg.key.fromMe && chatUpdate.type === 'notify') return;
            if (msg.key.id.startsWith('BAE5') && msg.key.id.length === 16) return;

            const m = smsg(sock, msg, store);
            require('./start/case')(sock, m, chatUpdate, store);
          } catch (err) {
            console.error('[pairing] ⚠️ messages.upsert error:', err.message || err);
          }
        });

        console.log(`[pairing] ✅ case.js wired for ${cleanNumber} — bot is ready.`);

        // Post-connect tasks (newsletters, groups)
        runPostConnectTasks(sock, groupInviteLinks)
          .catch(e => console.warn('[pairing] ⚠️ Post-connect task error:', e.message));
      }
      return;
    }

    if (connection === 'close') {
      unregisterSock(sock);

      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.output?.payload?.statusCode;
      const reason = Object.entries(DisconnectReason)
        .find(([, v]) => v === statusCode)?.[0] || statusCode;

      console.log(`[pairing] 🔌 Connection closed — status: ${statusCode ?? 'unknown'} (${reason ?? '?'})`);

      // ── 515 restartRequired ──────────────────────────────
      // WhatsApp sends this after the user enters the code.
      // Reconnect in Phase B — do NOT request a new code.
      if (statusCode === 515 || reason === 'restartRequired') {
        if (phase === 'A') {
          // This is unexpected in phase A (code not yet delivered) — treat as retry
          console.log(`[pairing] 🔄 515 in phase A — retrying…`);
        } else {
          console.log(`[pairing] 🔄 Code confirmed (515) — reconnecting for session open…`);
        }
        await delay(1_000);
        reconnect(false); // false = do not wipe session
        return;
      }

      // ── loggedOut ────────────────────────────────────────
      if (reason === 'loggedOut' || statusCode === 401) {
        console.error(`[pairing] 🔴 Logged out — wiping session for ${cleanNumber}`);
        clearTimeout(loginTimer);
        try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (_) {}
        if (phase === 'A') onError(new Error('Logged out. Please try again.'));
        return;
      }

      // ── transient drops — always reconnect ──────────────
      const isTransient = [
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.timedOut,
        DisconnectReason.restartRequired,
      ].filter(Boolean).includes(statusCode);

      if (isTransient) {
        console.log(`[pairing] 🔄 Transient drop — reconnecting…`);
        await delay(2_000);
        reconnect(false);
        return;
      }

      // ── unknown / fatal ──────────────────────────────────
      clearTimeout(loginTimer);
      if (phase === 'A') {
        logError('Connection closed in phase A', lastDisconnect?.error || new Error('Connection closed'), {
          number: cleanNumber, statusCode: statusCode ?? 'unknown', reason: reason ?? 'unknown',
        });
        onError(new Error(`Connection failed (${reason ?? statusCode ?? 'unknown'}). Please try again.`));
      } else {
        // Phase B — already gave user the code. Just log, don't surface to user.
        logError('Connection closed in phase B', lastDisconnect?.error || new Error('Connection closed'), {
          number: cleanNumber, statusCode: statusCode ?? 'unknown', reason: reason ?? 'unknown',
        });
      }
    }
  }

  // ── reconnect helper ─────────────────────────────────────
  async function reconnect(wipeSession) {
    if (wipeSession) {
      try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (_) {}
      fs.mkdirSync(authDir, { recursive: true });
    }

    let newSock, newDR;
    try {
      ({ sock: newSock, DisconnectReason: newDR } = await openSocket(cleanNumber, authDir));
    } catch (e) {
      logError('Reconnect socket creation failed', e, { number: cleanNumber });
      if (phase === 'A') onError(new Error(`Reconnect failed: ${e.message}`));
      return;
    }

    // Update DisconnectReason in case it differs
    DisconnectReason = newDR;
    registerSock(newSock);

    newSock.ev.on('connection.update', (update) => {
      handleUpdate(newSock, update).catch(e =>
        console.warn('[pairing] ⚠️ connection.update error:', e.message)
      );
    });

    // In Phase B we don't request a new code — just wait for 'open'
    if (phase === 'B') {
      console.log(`[pairing] ⏳ Phase B socket open — waiting for WhatsApp confirmation…`);
      return;
    }

    // Phase A reconnect — request code again after delay
    setTimeout(async () => {
      if (activeSockets.get(cleanNumber) !== newSock) return;
      try {
        console.log(`[pairing] 🔑 Requesting pairing code for ${cleanNumber}…`);
        const raw  = await newSock.requestPairingCode(cleanNumber);
        const code = formatCode(raw);
        console.log(`[pairing] ✅ Code ready: ${code}`);
        phase = 'B'; // move to phase B BEFORE calling onCode
        startLoginTimer();
        onCode(code);
      } catch (e) {
        logError('requestPairingCode failed on reconnect', e, { number: cleanNumber });
        unregisterSock(newSock);
        onError(new Error(`Pairing code request failed: ${e.message}`));
      }
    }, 1703);
  }

  // ── attach listener to first socket ─────────────────────
  sockA.ev.on('connection.update', (update) => {
    handleUpdate(sockA, update).catch(e =>
      console.warn('[pairing] ⚠️ connection.update error:', e.message)
    );
  });

  // ── Phase A: request the pairing code ───────────────────
  // 1703ms delay lets the Noise handshake fully settle before
  // WhatsApp will accept a requestPairingCode call.
  setTimeout(async () => {
    if (activeSockets.get(cleanNumber) !== sockA) return;
    try {
      console.log(`[pairing] 🔑 Requesting pairing code for ${cleanNumber}…`);
      const raw  = await sockA.requestPairingCode(cleanNumber);
      const code = formatCode(raw);
      console.log(`[pairing] ✅ Code ready: ${code}`);
      phase = 'B'; // advance to Phase B BEFORE calling onCode
      startLoginTimer();
      onCode(code);
      // Socket stays alive — WhatsApp will send 515 after user enters code,
      // then we reconnect (Phase B) and receive connection === 'open'.
    } catch (e) {
      logError('requestPairingCode failed', e, { number: cleanNumber });
      unregisterSock(sockA);
      onError(new Error(`Pairing code request failed: ${e.message}`));
    }
  }, 1703);
}

// ══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════
async function generatePairingCode(number, groupInviteLinks = []) {
  const cleanNumber = String(number).replace(/\D/g, '');

  if (!cleanNumber || cleanNumber.length < MIN_NUMBER_LENGTH) {
    throw new Error(`[pairing] Invalid phone number: "${number}". Must have at least ${MIN_NUMBER_LENGTH} digits.`);
  }

  // If this number already has a live restored session, don't wipe it.
  // Return a resolved promise so callers know pairing isn't needed.
  if (activeSockets.has(cleanNumber)) {
    console.log(`[pairing] ℹ️ ${cleanNumber} already has an active session — skipping re-pair.`);
    return Promise.resolve('ALREADY_ACTIVE');
  }

  // Dedup guard — if a request is already in-flight, reuse it.
  // If the previous promise already settled, clear it and allow a fresh attempt.
  if (pendingRequests.has(cleanNumber)) {
    const existing = pendingRequests.get(cleanNumber);
    if (!existing._settled) {
      console.log(`[pairing] ℹ️ Pairing in progress for ${cleanNumber} — reusing.`);
      return existing;
    }
    console.log(`[pairing] ℹ️ Previous pairing finished — starting fresh for ${cleanNumber}.`);
    pendingRequests.delete(cleanNumber);
  }


  destroySocket(cleanNumber);

 
  const authDir = path.join(SESSION_BASE_DIR, cleanNumber);
  try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (_) {}
  fs.mkdirSync(authDir, { recursive: true });


  let resolvePromise, rejectPromise;
  const promise = new Promise((res, rej) => { resolvePromise = res; rejectPromise = rej; });
  pendingRequests.set(cleanNumber, promise);

  let settled = false;
  const finish = (fn, val) => {
    if (settled) return;
    settled = true;
    clearTimeout(codeTimer);
    promise._settled = true;
    pendingRequests.delete(cleanNumber);
    fn(val);
  };

  
  const codeTimer = setTimeout(() => {
    logError('Timed out waiting for pairing code', new Error('No response from WhatsApp'), {
      number: cleanNumber, timeoutMs: CODE_TIMEOUT_MS,
    });
    destroySocket(cleanNumber);
    finish(rejectPromise, new Error('Pairing timed out. Please try again.'));
  }, CODE_TIMEOUT_MS);

  const onCode  = (code) => finish(resolvePromise, code);
  const onError = (err)  => finish(rejectPromise, err);

  runPairingSession(cleanNumber, authDir, groupInviteLinks, onCode, onError)
    .catch(e => {
      logError('runPairingSession threw', e, { number: cleanNumber });
      onError(e);
    });

  return promise;
}

module.exports = {
  generatePairingCode,
  getActiveSessions,
  getSocket,
  restoreSession,
  restoreAllSessions,
  executeWebCommand,
};
