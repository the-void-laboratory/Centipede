const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  BOT_TOKEN,
  WEB_BASE_URL,
} = require('./token');
const {
  addCommand,
  addAudit,
  clearPremium,
  authenticate,
  createUser,
  deleteUser,
  getCommand,
  getSettings,
  listAudit,
  listCommands,
  listPendingCommands,
  listUsers,
  sanitizeUsername,
  setAccessMode,
  setAnnouncement,
  setPremium,
  setRole,
  updateCommand,
  updatePassword,
} = require('./web/store');
const { resolvePendingCommand } = require('./web/command-runner');

const ADMIN_IDS_FILE = path.join(__dirname, 'adminID.json');
const POLL_TIMEOUT_MS = 30_000;

function readAdminIds() {
  try {
    const parsed = JSON.parse(fs.readFileSync(ADMIN_IDS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAdmin(userId) {
  return readAdminIds().includes(String(userId));
}

async function api(method, params) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || `Telegram API error (${method})`);
  return data.result;
}

function helpText() {
  return [
    'Web + Telegram hybrid commands:',
    '/start - web panel link',
    '/createuser username password [user|admin] - create a web account',
    '/resetpass username newpass - reset a password',
    '/grantpremium username days - grant premium',
    '/revokepremium username - remove premium',
    '/makeadmin username - promote',
    '/removeadmin username - demote',
    '/setmode public|private - switch access mode',
    '/announce text - update dashboard banner',
    '/users - list users',
    '/pending - list queued approvals',
    '/approve id - approve a queued command',
    '/reject id - reject a queued command',
    '/commands - recent command log',
    '/audit - recent admin actions',
    '/deleteuser username - remove a non-admin user',
  ].join('\n');
}

function formatUser(entry) {
  const premium = entry.premiumUntil ? ` premium=${new Date(entry.premiumUntil).toLocaleString()}` : '';
  return `${entry.username} (${entry.role}${premium})`;
}

function formatCommand(entry) {
  return `${entry.id} | ${entry.username} | ${entry.name} | ${entry.status}`;
}

function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

async function sendLongMessage(chatId, text, opts = {}) {
  const maxLen = 3500;
  const chunks = [];
  let remaining = String(text || '');
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf('\n', maxLen);
    if (cut < maxLen / 2) cut = maxLen;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  if (remaining) chunks.push(remaining);

  for (const chunk of chunks) {
    await api('sendMessage', { chat_id: chatId, text: chunk, ...opts });
  }
}

async function handleTelegramCommand(message) {
  const chatId = message.chat.id;
  const fromId = message.from?.id;
  const text = String(message.text || '').trim();
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(' ').trim();
  const isPrivileged = isAdmin(fromId);
  const settings = getSettings();

  const reply = (msg, extra = {}) => api('sendMessage', { chat_id: chatId, text: msg, ...extra });

  switch (command.toLowerCase()) {
    case '/start':
      return reply(
        `Centipede web panel is live.\n\nOpen: ${WEB_BASE_URL}\n\n${isPrivileged ? 'You can also manage accounts from Telegram.' : 'Ask an admin to create your web account.'}`
      );

    case '/help':
      return reply(helpText());

    case '/users':
      if (!isPrivileged) return reply('Admin only.');
      return sendLongMessage(chatId, listUsers().map(formatUser).join('\n') || 'No users found.');

    case '/commands':
      if (!isPrivileged) return reply('Admin only.');
      return sendLongMessage(chatId, listCommands(20).map(formatCommand).join('\n') || 'No commands yet.');

    case '/audit':
      if (!isPrivileged) return reply('Admin only.');
      return sendLongMessage(
        chatId,
        listAudit(20)
          .map((entry) => `${entry.type} | ${entry.createdAt} | ${Object.entries(entry).filter(([key]) => !['id', 'type', 'createdAt'].includes(key)).map(([key, value]) => `${key}=${value}`).join(', ')}`)
          .join('\n') || 'No audit history yet.'
      );

    case '/pending':
      if (!isPrivileged) return reply('Admin only.');
      return sendLongMessage(chatId, listPendingCommands().map(formatCommand).join('\n') || 'No pending approvals.');

    case '/createuser': {
      if (!isPrivileged) return reply('Admin only.');
      const [username, passwordRaw, role = 'user'] = rest;
      if (!username) return reply('Usage: /createuser username [password] [user|admin]');
      const password = passwordRaw || generateTempPassword();
      createUser({ username, password, role, createdBy: String(fromId) });
      return reply(
        `Created ${sanitizeUsername(username)}.\n` +
        `Username: ${sanitizeUsername(username)}\n` +
        `Password: ${password}\n` +
        `Login: ${WEB_BASE_URL}\n\n` +
        `Use the password exactly as shown.`
      );
    }

    case '/resetpass': {
      if (!isPrivileged) return reply('Admin only.');
      const [username, newPass] = rest;
      if (!username || !newPass) return reply('Usage: /resetpass username newpass');
      updatePassword(sanitizeUsername(username), newPass);
      return reply(`Password reset for ${sanitizeUsername(username)}.`);
    }

    case '/grantpremium': {
      if (!isPrivileged) return reply('Admin only.');
      const [username, daysStr] = rest;
      const days = Number(daysStr);
      if (!username || !days || days < 1) return reply('Usage: /grantpremium username days');
      const until = setPremium(sanitizeUsername(username), days);
      return reply(`Premium granted to ${sanitizeUsername(username)} until ${new Date(until).toLocaleString()}.`);
    }

    case '/revokepremium': {
      if (!isPrivileged) return reply('Admin only.');
      const [username] = rest;
      if (!username) return reply('Usage: /revokepremium username');
      clearPremium(sanitizeUsername(username));
      return reply(`Premium revoked for ${sanitizeUsername(username)}.`);
    }

    case '/makeadmin': {
      if (!isPrivileged) return reply('Admin only.');
      const [username] = rest;
      if (!username) return reply('Usage: /makeadmin username');
      setRole(sanitizeUsername(username), 'admin');
      return reply(`${sanitizeUsername(username)} promoted to admin.`);
    }

    case '/removeadmin': {
      if (!isPrivileged) return reply('Admin only.');
      const [username] = rest;
      if (!username) return reply('Usage: /removeadmin username');
      setRole(sanitizeUsername(username), 'user');
      return reply(`${sanitizeUsername(username)} demoted to user.`);
    }

    case '/setmode': {
      if (!isPrivileged) return reply('Admin only.');
      const [mode] = rest;
      if (!mode) return reply('Usage: /setmode public|private');
      setAccessMode(mode);
      return reply(`Access mode set to ${mode === 'public' ? 'public' : 'private'}.`);
    }

    case '/announce': {
      if (!isPrivileged) return reply('Admin only.');
      if (!payload) return reply('Usage: /announce text');
      setAnnouncement(payload);
      addAudit('telegram_announcement', { username: String(fromId), message: payload });
      return reply('Announcement updated.');
    }

    case '/approve': {
      if (!isPrivileged) return reply('Admin only.');
      const [id] = rest;
      if (!id) return reply('Usage: /approve id');
      const cmd = getCommand(id);
      if (!cmd) return reply('Command not found.');
      if (cmd.status !== 'pending') return reply('Command is not pending.');
      const executed = resolvePendingCommand(cmd, String(fromId));
      updateCommand(cmd.id, { ...executed, status: 'executed' });
      return reply(`Approved ${cmd.id}.`);
    }

    case '/reject': {
      if (!isPrivileged) return reply('Admin only.');
      const [id] = rest;
      if (!id) return reply('Usage: /reject id');
      const cmd = getCommand(id);
      if (!cmd) return reply('Command not found.');
      updateCommand(cmd.id, { status: 'rejected', rejectedBy: String(fromId), error: 'Rejected via Telegram' });
      return reply(`Rejected ${cmd.id}.`);
    }

    case '/deleteuser': {
      if (!isPrivileged) return reply('Admin only.');
      const [username] = rest;
      if (!username) return reply('Usage: /deleteuser username');
      deleteUser(sanitizeUsername(username));
      return reply(`Deleted ${sanitizeUsername(username)}.`);
    }

    default:
      if (!text.startsWith('/')) return;
      return reply('Unknown command. Use /help.');
  }
}

async function startTelegramBot() {
  if (!BOT_TOKEN) {
    console.log('[tg] BOT_TOKEN not set. Telegram bot disabled.');
    return null;
  }

  let offset = 0;
  console.log('[tg] Telegram bot starting...');

  const poll = async () => {
    try {
      const updates = await api('getUpdates', { timeout: 25, offset, allowed_updates: ['message'] });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message?.text) {
          await handleTelegramCommand(update.message);
        }
      }
    } catch (err) {
      console.warn('[tg] poll error:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    setImmediate(poll);
  };

  poll();
  return true;
}

module.exports = { startTelegramBot };
