const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_FILE = path.join(__dirname, '..', 'system', 'web-panel.json');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kaneki';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const digest = crypto.pbkdf2Sync(String(password), salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${digest}`;
}

function verifyPassword(password, encoded) {
  if (typeof encoded !== 'string' || !encoded.startsWith('pbkdf2$')) return false;
  const [, iterationsStr, salt, digest] = encoded.split('$');
  const iterations = Number(iterationsStr);
  if (!iterations || !salt || !digest) return false;
  const testDigest = crypto.pbkdf2Sync(String(password), salt, iterations, 64, 'sha512').toString('hex');
  const a = Buffer.from(digest, 'hex');
  const b = Buffer.from(testDigest, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createDefaultStore() {
  return {
    users: [
      {
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        role: 'admin',
        premiumUntil: null,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
    ],
    settings: {
      accessMode: 'private',
      announcement: 'Welcome to the Centipede web panel.',
      botName: 'Centipede',
      ownerName: 'Kaneki',
      bio: 'Managed from the web panel.',
      features: {
        autoread: false,
        autolike: false,
        autobio: false,
      },
    },
    commands: [],
    audit: [],
  };
}

function normalizeStore(store) {
  const shaped = store && typeof store === 'object' ? store : {};
  shaped.users = Array.isArray(shaped.users) ? shaped.users : [];
  shaped.settings = shaped.settings && typeof shaped.settings === 'object' ? shaped.settings : {};
  shaped.commands = Array.isArray(shaped.commands) ? shaped.commands : [];
  shaped.audit = Array.isArray(shaped.audit) ? shaped.audit : [];

  if (!shaped.users.some((user) => user.role === 'admin')) {
    const defaults = createDefaultStore();
    const existing = shaped.users.find((user) => user.username === DEFAULT_ADMIN_USERNAME);
    if (!existing) {
      shaped.users.unshift(defaults.users[0]);
    } else {
      existing.role = 'admin';
      existing.passwordHash = existing.passwordHash || defaults.users[0].passwordHash;
      existing.premiumUntil = existing.premiumUntil || null;
    }
  }

  shaped.settings.accessMode = shaped.settings.accessMode === 'public' ? 'public' : 'private';
  if (typeof shaped.settings.announcement !== 'string') {
    shaped.settings.announcement = 'Welcome to the Centipede web panel.';
  }
  if (typeof shaped.settings.botName !== 'string') shaped.settings.botName = 'Centipede';
  if (typeof shaped.settings.ownerName !== 'string') shaped.settings.ownerName = 'Kaneki';
  if (typeof shaped.settings.bio !== 'string') shaped.settings.bio = 'Managed from the web panel.';
  if (!shaped.settings.features || typeof shaped.settings.features !== 'object') shaped.settings.features = {};
  shaped.settings.features.autoread = !!shaped.settings.features.autoread;
  shaped.settings.features.autolike = !!shaped.settings.features.autolike;
  shaped.settings.features.autobio = !!shaped.settings.features.autobio;

  return shaped;
}

function loadStore() {
  if (!fs.existsSync(STORE_FILE)) {
    const defaults = createDefaultStore();
    ensureDir(STORE_FILE);
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    const shaped = normalizeStore(parsed);
    saveStore(shaped);
    return shaped;
  } catch {
    const defaults = createDefaultStore();
    saveStore(defaults);
    return defaults;
  }
}

function saveStore(store) {
  ensureDir(STORE_FILE);
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function addAudit(type, details = {}) {
  const store = loadStore();
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    createdAt: nowIso(),
    ...details,
  };
  store.audit.unshift(entry);
  store.audit = store.audit.slice(0, 300);
  saveStore(store);
  return entry;
}

function getUser(username) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  return store.users.find((user) => user.username === normalized) || null;
}

function listUsers() {
  return loadStore().users.slice().sort((a, b) => a.username.localeCompare(b.username));
}

function createUser({ username, password, role = 'user', createdBy = DEFAULT_ADMIN_USERNAME, premiumUntil = null }) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);

  if (!isValidUsername(normalized)) {
    throw new Error('Username must be 3-32 characters and can only include letters, numbers, dot, underscore, and hyphen.');
  }

  if (store.users.some((user) => user.username === normalized)) {
    throw new Error('That username already exists.');
  }

  const safeRole = role === 'admin' ? 'admin' : 'user';
  const user = {
    username: normalized,
    passwordHash: hashPassword(password),
    role: safeRole,
    premiumUntil: premiumUntil || null,
    createdAt: nowIso(),
    createdBy: sanitizeUsername(createdBy) || DEFAULT_ADMIN_USERNAME,
  };

  store.users.push(user);
  saveStore(store);
  addAudit('user_created', { username: user.username, createdBy: user.createdBy, role: user.role });
  return user;
}

function updatePassword(username, password) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const user = store.users.find((entry) => entry.username === normalized);
  if (!user) throw new Error('User not found.');
  user.passwordHash = hashPassword(password);
  saveStore(store);
  addAudit('password_reset', { username: normalized });
  return user;
}

function updateUser(username, patch) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const user = store.users.find((entry) => entry.username === normalized);
  if (!user) throw new Error('User not found.');

  if (patch.role) user.role = patch.role === 'admin' ? 'admin' : 'user';
  if (Object.prototype.hasOwnProperty.call(patch, 'premiumUntil')) user.premiumUntil = patch.premiumUntil || null;
  if (patch.password) user.passwordHash = hashPassword(patch.password);

  saveStore(store);
  addAudit('user_updated', { username: normalized, patch: Object.keys(patch) });
  return user;
}

function deleteUser(username) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const target = store.users.find((user) => user.username === normalized);
  if (!target) throw new Error('User not found.');
  if (target.role === 'admin') throw new Error('Admin accounts cannot be deleted.');
  store.users = store.users.filter((user) => user.username !== normalized);
  saveStore(store);
  addAudit('user_deleted', { username: normalized });
}

function authenticate(username, password) {
  const user = getUser(username);
  if (!user) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}

function isPremium(user) {
  if (!user) return false;
  if (!user.premiumUntil) return false;
  return Date.now() < new Date(user.premiumUntil).getTime();
}

function setPremium(username, days) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const user = store.users.find((entry) => entry.username === normalized);
  if (!user) throw new Error('User not found.');
  const expiresAt = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
  user.premiumUntil = expiresAt;
  saveStore(store);
  addAudit('premium_granted', { username: normalized, premiumUntil: expiresAt });
  return expiresAt;
}

function clearPremium(username) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const user = store.users.find((entry) => entry.username === normalized);
  if (!user) throw new Error('User not found.');
  user.premiumUntil = null;
  saveStore(store);
  addAudit('premium_revoked', { username: normalized });
}

function setRole(username, role) {
  const store = loadStore();
  const normalized = sanitizeUsername(username);
  const user = store.users.find((entry) => entry.username === normalized);
  if (!user) throw new Error('User not found.');

  const nextRole = role === 'admin' ? 'admin' : 'user';
  if (user.role === 'admin' && nextRole !== 'admin') {
    const adminCount = store.users.filter((entry) => entry.role === 'admin').length;
    if (adminCount <= 1) throw new Error('At least one admin must remain.');
  }

  user.role = nextRole;
  saveStore(store);
  addAudit('role_changed', { username: normalized, role: nextRole });
  return user;
}

function setAccessMode(mode) {
  const store = loadStore();
  store.settings.accessMode = mode === 'public' ? 'public' : 'private';
  saveStore(store);
  addAudit('access_mode_changed', { mode: store.settings.accessMode });
  return store.settings.accessMode;
}

function setAnnouncement(text) {
  const store = loadStore();
  store.settings.announcement = String(text || '').trim();
  saveStore(store);
  addAudit('announcement_updated');
  return store.settings.announcement;
}

function setBotName(name) {
  const store = loadStore();
  store.settings.botName = String(name || '').trim();
  saveStore(store);
  addAudit('bot_name_changed', { botName: store.settings.botName });
  return store.settings.botName;
}

function setOwnerName(name) {
  const store = loadStore();
  store.settings.ownerName = String(name || '').trim();
  saveStore(store);
  addAudit('owner_name_changed', { ownerName: store.settings.ownerName });
  return store.settings.ownerName;
}

function setBio(text) {
  const store = loadStore();
  store.settings.bio = String(text || '').trim();
  saveStore(store);
  addAudit('bio_changed');
  return store.settings.bio;
}

function setFeature(name, enabled) {
  const store = loadStore();
  if (!store.settings.features || typeof store.settings.features !== 'object') store.settings.features = {};
  store.settings.features[name] = !!enabled;
  saveStore(store);
  addAudit('feature_toggled', { feature: name, enabled: !!enabled });
  return store.settings.features[name];
}

function getSettings() {
  return loadStore().settings;
}

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    username: sanitizeUsername(username),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

const sessions = new Map();

function getSession(token) {
  if (!token || !sessions.has(token)) return null;
  const session = sessions.get(token);
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  const user = getUser(session.username);
  if (!user) {
    sessions.delete(token);
    return null;
  }
  return { token, user };
}

function destroySession(token) {
  sessions.delete(token);
}

function addCommand(command) {
  const store = loadStore();
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    status: 'queued',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...command,
  };
  store.commands.unshift(entry);
  store.commands = store.commands.slice(0, 300);
  saveStore(store);
  addAudit('command_queued', { commandId: entry.id, username: entry.username, name: entry.name, status: entry.status });
  return entry;
}

function updateCommand(commandId, patch) {
  const store = loadStore();
  const entry = store.commands.find((item) => item.id === commandId);
  if (!entry) throw new Error('Command not found.');
  Object.assign(entry, patch, { updatedAt: nowIso() });
  saveStore(store);
  return entry;
}

function getCommand(commandId) {
  return loadStore().commands.find((entry) => entry.id === commandId) || null;
}

function listCommands(limit = 50) {
  return loadStore().commands.slice(0, limit);
}

function listPendingCommands() {
  return loadStore().commands.filter((entry) => entry.status === 'pending');
}

function listAudit(limit = 50) {
  return loadStore().audit.slice(0, limit);
}

module.exports = {
  addAudit,
  addCommand,
  authenticate,
  clearPremium,
  createSession,
  createUser,
  destroySession,
  deleteUser,
  getCommand,
  getSession,
  getSettings,
  getUser,
  hashPassword,
  isPremium,
  isValidUsername,
  listAudit,
  listCommands,
  listPendingCommands,
  listUsers,
  loadStore,
  sanitizeUsername,
  saveStore,
  setBio,
  setAccessMode,
  setAnnouncement,
  setBotName,
  setFeature,
  setOwnerName,
  setPremium,
  setRole,
  updateCommand,
  updatePassword,
  updateUser,
  verifyPassword,
};
