const express = require('express');
const path = require('path');
const {
  restoreAllSessions,
  generatePairingCode,
  getActiveSessions,
  getSocket,
  executeWebCommand,
} = require('./pairing');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const publicDir = path.join(__dirname, 'public');
const app = express();

app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/status', async (req, res) => {
  try {
    const sessions = getActiveSessions();
    res.json({ ok: true, sessions, count: sessions.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/pair', async (req, res) => {
  const { number } = req.body || {};
  if (!number) return res.status(400).json({ ok: false, error: 'Missing number' });
  try {
    const code = await generatePairingCode(number);
    res.json({ ok: true, code });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/send', async (req, res) => {
  const { session, target, message, mode } = req.body || {};
  if (!target || !message) return res.status(400).json({ ok: false, error: 'Missing target or message' });

  const sessions = getActiveSessions();
  const activeSession = session ? String(session).replace(/\D/g, '') : sessions[0];
  if (!activeSession) return res.status(400).json({ ok: false, error: 'No active WhatsApp session available' });

  const sock = getSocket(activeSession);
  if (!sock) return res.status(404).json({ ok: false, error: `Session ${activeSession} not connected` });

  const rawTarget = String(target).trim();
  let jid = rawTarget;
  if (!jid.includes('@')) {
    const digits = rawTarget.replace(/\D/g, '');
    jid = mode === 'group' ? `${digits}@g.us` : `${digits}@s.whatsapp.net`;
  }

  try {
    const result = await sock.sendMessage(jid, { text: String(message) });
    res.json({ ok: true, result, session: activeSession, jid });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/execute', async (req, res) => {
  const { session, target, action, mode, command } = req.body || {};
  if (!target && !command) return res.status(400).json({ ok: false, error: 'Missing target or command' });

  const sessions = getActiveSessions();
  const activeSession = session ? String(session).replace(/\D/g, '') : sessions[0];
  if (!activeSession) return res.status(400).json({ ok: false, error: 'No active WhatsApp session available' });

  const sock = getSocket(activeSession);
  if (!sock) return res.status(404).json({ ok: false, error: `Session ${activeSession} not connected` });

  const rawTarget = String(target || '').trim();
  const cmd = String(command || '').trim();
  const isGroup = mode === 'group';
  let commandText = cmd;
  let options = {};

  if (!commandText) {
    if (isGroup) {
      if (!rawTarget.includes('@g.us') || !rawTarget.includes('-')) {
        return res.status(400).json({ ok: false, error: 'Group target must be a group JID like 1234567890-123456@g.us' });
      }
      options.groupJid = rawTarget;
      commandText = action === 'delay' ? 'delay-gc' : 'x-gc';
    } else {
      const targetDigits = rawTarget.replace(/\D/g, '');
      if (!targetDigits) return res.status(400).json({ ok: false, error: 'Invalid target number' });
      if (action === 'delay') commandText = `x-delay ${targetDigits}`;
      else if (action === 'blank') commandText = `x-blank ${targetDigits}`;
      else if (action === 'crash') commandText = `x-fc ${targetDigits}`;
      else commandText = targetDigits;
    }
  } else if (isGroup) {
    if (!rawTarget.includes('@g.us') || !rawTarget.includes('-')) {
      return res.status(400).json({ ok: false, error: 'Group target must be a group JID like 1234567890-123456@g.us' });
    }
    options.groupJid = rawTarget;
  }

  options.target = rawTarget;

  try {
    const result = await executeWebCommand(activeSession, commandText, options);
    res.json({ ok: true, result, session: activeSession, command: commandText, target: rawTarget });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/sessions', (req, res) => {
  res.json({ ok: true, sessions: getActiveSessions() });
});

app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

restoreAllSessions()
  .then((n) => console.log(`[web] WhatsApp restore complete — ${n} session(s) active.`))
  .catch((err) => console.warn('[web] WhatsApp restore failed:', err.message));

app.listen(PORT, HOST, () => {
  console.log(`Centipede UI running at http://${HOST}:${PORT}`);
});

process.on('uncaughtException', err => {
  console.error('[process] Uncaught exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', reason => {
  console.error('[process] Unhandled rejection:', reason);
});
