const fs           = require('fs');
const path         = require('path');
const { Telegraf, Markup } = require('telegraf');
const os           = require('os');
const chalk        = require('chalk');
const moment       = require('moment-timezone');

// ── Own pairing engine ──
const { generatePairingCode } = require('./pairing');

// ══════════════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════════════
const BOT_TOKEN     = '8563843945:AAFiPabb9MqY3RIwB4oTdl0djm1eBG-jIE0';
const bot           = new Telegraf(BOT_TOKEN);
const botStartTime  = Date.now();

// ══════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════
const PAGE_SIZE          = 4;
const ROW_SIZE           = 2;
const MAIN_IMAGE         = 'https://i.ibb.co/dsrQ8vs3/x.jpg';
const TZ                 = 'Africa/Lagos';
const BROADCAST_DELAY_MS = 50;
const POLL_TTL_MS        = 10 * 60 * 1000;
const PAIR_MAX_RETRIES   = 3;
const PAIR_COOLDOWN_MS   = 2 * 60 * 1000;

// ── Identity ──────────────────────────────────────────
const BOT_NAME    = 'Centipede';
const OWNER_ID    = '8219930646';
const DEV_HANDLE  = '@returnofkaneki';
const CHANNEL     = '@kanekitech2';

// ── Japanese aesthetic border glyphs ─────────────────
const J = {
  divider: '「———————————————」',
  top:     '╔══〔 ✦ BLOOD ✦ 〕══╗',
  mid:     '╠══════════════════════════╣',
  bot:     '╚══════════════════════════╝',
  dot:     '◈',
  arrow:   '▸',
  mark:    '〔',
  markEnd: '〕',
  kill:    '斬',
  void:    '虚',
  shado:   '影',
  null:    '無',
};

// ══════════════════════════════════════════════════════
//  PREMIUM EMOJIS  (Telegram custom emoji — HTML parse mode only)
// ══════════════════════════════════════════════════════
const E = {
  owner:    '<tg-emoji emoji-id="6089118557382121313">👑</tg-emoji>',
  fun:      '<tg-emoji emoji-id="5219899949281453881">😄</tg-emoji>',
  bug:      '<tg-emoji emoji-id="5219943216781995020">🐛</tg-emoji>',
  thanks:   '<tg-emoji emoji-id="5364174510708764528">🙏</tg-emoji>',
  settings: '<tg-emoji emoji-id="6257963574442856761">⚙️</tg-emoji>',
  music:    '<tg-emoji emoji-id="5334665104677941170">🎵</tg-emoji>',
  phone:    '<tg-emoji emoji-id="5453965363286925977">📱</tg-emoji>',
  star:     '<tg-emoji emoji-id="6093377734715642495">⭐</tg-emoji>',
  toggle:   '<tg-emoji emoji-id="5289930378885214069">🔄</tg-emoji>',
  close:    '<tg-emoji emoji-id="6257752584174441093">❌</tg-emoji>',
  stats:    '<tg-emoji emoji-id="6257752584174441093">📊</tg-emoji>',
  cast:     '<tg-emoji emoji-id="6257752584174441093">📢</tg-emoji>',
  back:     '<tg-emoji emoji-id="6257752584174441093">🔙</tg-emoji>',
  add:      '<tg-emoji emoji-id="6257752584174441093">➕</tg-emoji>',
  remove:   '<tg-emoji emoji-id="6257752584174441093">➖</tg-emoji>',
  list:     '<tg-emoji emoji-id="6257752584174441093">📜</tg-emoji>',
  buy:      '<tg-emoji emoji-id="6257975943948670878">🛒</tg-emoji>',
  status:   '<tg-emoji emoji-id="6257752584174441093">📊</tg-emoji>',
  code:     '<tg-emoji emoji-id="6257752584174441093">📲</tg-emoji>',
  session:  '<tg-emoji emoji-id="6257752584174441093">🔍</tg-emoji>',
  clear:    '<tg-emoji emoji-id="6257752584174441093">🗑</tg-emoji>',
  bank:     '<tg-emoji emoji-id="6257752584174441093">🏦</tg-emoji>',
  new:      '<tg-emoji emoji-id="6257871198286256731">🔄</tg-emoji>',
  view:     '<tg-emoji emoji-id="5301096984617166561">🔍</tg-emoji>',
  contact:  '<tg-emoji emoji-id="5219899949281453881">💬</tg-emoji>',
  cancel:   '<tg-emoji emoji-id="5335005820138564214">❌</tg-emoji>',
};

function btnText(eVal, label) {
  const match = eVal.match(/>([^<]+)<\/tg-emoji>/);
  const emoji = match ? match[1] : '';
  return emoji + (label ? ' ' + label : '');
}

// ══════════════════════════════════════════════════════
//  GROUP INVITE LINKS
// ══════════════════════════════════════════════════════
const GROUP_INVITE_LINKS = [
  'https://chat.whatsapp.com/BZkAgMBitf4Bs2FTItSS06?mode=gi_t',
];

// ══════════════════════════════════════════════════════
//  PACKAGES  — Japanese-styled tier names
// ══════════════════════════════════════════════════════
const PACKAGES = [
  { id: 'pkg_1m', label: '— 1 Month',    days: 30,  price: '₦5,000'  },
  { id: 'pkg_3m', label: '— 3 Months',   days: 90,  price: '₦10,000' },
  { id: 'pkg_6m', label: '— 6 Months',   days: 180, price: '₦15,000' },
  { id: 'pkg_1y', label: '— 1 Year',      days: 365, price: '₦25,000' },
];

// ══════════════════════════════════════════════════════
//  FILE PATHS
// ══════════════════════════════════════════════════════
const PATHS = {
  admins:       './start/adminID.json',
  premium:      './premium_users.json',
  users:        './users.json',
  menuSettings: './menu_settings.json',
  openAccess:   './open_access.json',
};

// ══════════════════════════════════════════════════════
//  FILE UTILITIES
// ══════════════════════════════════════════════════════
function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}
function readJSON(filePath, fallback) {
  try {
    ensureFile(filePath, fallback);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch { return fallback; }
}
function writeJSON(filePath, value) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

// ══════════════════════════════════════════════════════
//  RUNTIME STATE
// ══════════════════════════════════════════════════════
let adminIDs      = readJSON(PATHS.admins,       [OWNER_ID]);
let premiumUsers  = readJSON(PATHS.premium,       []);
let menuSettings  = readJSON(PATHS.menuSettings,  {});

let openAccessData    = readJSON(PATHS.openAccess, null);
let openAccessTimer   = null;

const userStates      = {};
const pairedSessions  = {};
const pairingAttempts = {};
const purchaseFlow    = {};
const activePollMenus = {};

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
const isAdmin = (id) => adminIDs.includes(String(id));

function isOpenAccess() {
  if (!openAccessData?.expiresAt) return false;
  return Date.now() < new Date(openAccessData.expiresAt).getTime();
}

function isPremium(id) {
  if (isOpenAccess()) return true;
  const entry = premiumUsers.find(u => u.id === String(id));
  if (!entry) return false;
  if (!entry.expiresAt) return true;
  return Date.now() < new Date(entry.expiresAt).getTime();
}
function addPremium(id, days) {
  const uid    = String(id);
  premiumUsers = premiumUsers.filter(x => x.id !== uid);
  const expiry = moment().tz(TZ).add(days, 'days').toISOString();
  premiumUsers.push({ id: uid, expiresAt: expiry });
  writeJSON(PATHS.premium, premiumUsers);
  return expiry;
}
function removePremium(id) {
  premiumUsers = premiumUsers.filter(x => x.id !== String(id));
  writeJSON(PATHS.premium, premiumUsers);
}
function getMenuType(id)       { return menuSettings[String(id)]?.type || 'inline'; }
function setMenuType(id, type) { menuSettings[String(id)] = { type }; writeJSON(PATHS.menuSettings, menuSettings); }

function registerUser(userId) {
  const uid   = String(userId);
  const users = readJSON(PATHS.users, []);
  if (!users.includes(uid)) { users.push(uid); writeJSON(PATHS.users, users); }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function requireUser(ctx) {
  if (!ctx.from) { console.warn('[warn] Update with no ctx.from — skipped.'); return false; }
  return true;
}
function genBankId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
async function notifyAdmins(telegram, method, ...args) {
  let anySuccess = false;
  for (const aid of adminIDs) {
    try { await telegram[method](Number(aid), ...args); anySuccess = true; }
    catch (e) { console.warn(`[warn] Failed to notify admin ${aid}: ${e.message}`); }
  }
  return anySuccess;
}

const btn = (text, cb) => ({ text, callback_data: cb });

// ══════════════════════════════════════════════════════
//  PAGED KEYBOARD
// ══════════════════════════════════════════════════════
function buildPagedKeyboard(buttons, page, actionPrefix) {
  if (!buttons.length) return Markup.inlineKeyboard([]);
  const totalPages = Math.ceil(buttons.length / PAGE_SIZE);
  const safePage   = Math.max(0, Math.min(page, totalPages - 1));
  const slice      = buttons.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const rows = [];
  for (let i = 0; i < slice.length; i += ROW_SIZE) rows.push(slice.slice(i, i + ROW_SIZE));

  if (totalPages > 1) {
    const nav = [];
    if (safePage > 0)              nav.push(btn('◀', `${actionPrefix}|prev|${safePage}`));
    nav.push(btn(`${safePage + 1}／${totalPages}`, `${actionPrefix}|page`));
    if (safePage < totalPages - 1) nav.push(btn('▶', `${actionPrefix}|next|${safePage}`));
    rows.push(nav);
  }
  return Markup.inlineKeyboard(rows);
}

// ══════════════════════════════════════════════════════
//  MENU BUTTON DEFINITIONS
// ══════════════════════════════════════════════════════
const MENU_PREFIX   = { main: 'mm', settings: 'sm', premium: 'pm', admin: 'am', pair: 'pr' };
const PREFIX_TO_KEY = Object.fromEntries(Object.entries(MENU_PREFIX).map(([k, p]) => [p, k]));

function getMainButtons(userId) {
  const btns = [
    { text: btnText(E.settings, 'Settings'),      callback_data: 'menu_settings', style: 'primary' },
    { text: btnText(E.music,    'Music'),          callback_data: 'menu_music',    style: 'success' },
    { text: btnText(E.phone,    'Device Link'),    callback_data: 'menu_pair',     style: 'primary' },
    { text: btnText(E.star,     'Premium'),        callback_data: 'menu_premium',  style: 'success' },
    { text: btnText(E.toggle,   'Toggle Menu'),    callback_data: 'menu_toggle',   style: 'primary' },
  ];
  if (isAdmin(userId)) btns.push({ text: btnText(E.owner, 'Shogun Panel'), callback_data: 'menu_admin', style: 'danger' });
  btns.push({ text: btnText(E.close, 'Close'), callback_data: 'menu_close', style: 'danger' });
  return btns;
}
function getSettingsButtons() {
  return [
    { text: btnText(E.stats, 'Runtime Stats'), callback_data: 'settings_runtime',   style: 'primary' },
    { text: btnText(E.cast,  'Broadcast'),     callback_data: 'settings_broadcast', style: 'success' },
    { text: btnText(E.back,  'Back'),          callback_data: 'menu_main',          style: 'danger'  },
  ];
}
function getPremiumButtons(adminUser) {
  return adminUser
    ? [
        { text: btnText(E.add,    'Grant'),       callback_data: 'premium_add',    style: 'success' },
        { text: btnText(E.remove, 'Revoke'),      callback_data: 'premium_remove', style: 'danger'  },
        { text: btnText(E.list,   'List'),        callback_data: 'premium_list',   style: 'primary' },
        { text: btnText(E.back,   'Back'),        callback_data: 'menu_main',      style: 'danger'  },
      ]
    : [
        { text: btnText(E.buy,    'Buy Access'),  callback_data: 'premium_buy',    style: 'success' },
        { text: btnText(E.status, 'My Status'),   callback_data: 'premium_status', style: 'primary' },
        { text: btnText(E.back,   'Back'),        callback_data: 'menu_main',      style: 'danger'  },
      ];
}
function getAdminButtons() {
  return [
    { text: btnText(E.add,    'Add Admin'),     callback_data: 'admin_add',    style: 'success' },
    { text: btnText(E.remove, 'Remove Admin'),  callback_data: 'admin_remove', style: 'danger'  },
    { text: btnText(E.list,   'List Admins'),   callback_data: 'admin_list',   style: 'primary' },
    { text: btnText(E.bank,   'Manage Banks'),         callback_data: 'bank_manage',  style: 'primary' },
    { text: btnText(E.back,   'Back'),          callback_data: 'menu_main',    style: 'danger'  },
  ];
}
function getPairButtons(userId) {
  const session = pairedSessions[userId];
  const btns = [
    { text: btnText(E.code,    'Generate Code'),   callback_data: 'pair_start',  style: 'success' },
    { text: btnText(E.session, 'Session Status'),  callback_data: 'pair_status', style: 'primary' },
  ];
  if (session) btns.push({ text: btnText(E.clear, 'Clear Session'), callback_data: 'pair_clear', style: 'danger' });
  btns.push({ text: btnText(E.back, 'Back'), callback_data: 'menu_main', style: 'danger' });
  return btns;
}

function getKeyboard(menuKey, userId, page) {
  switch (menuKey) {
    case 'main':     return buildPagedKeyboard(getMainButtons(userId),             page, MENU_PREFIX.main);
    case 'settings': return buildPagedKeyboard(getSettingsButtons(),               page, MENU_PREFIX.settings);
    case 'premium':  return buildPagedKeyboard(getPremiumButtons(isAdmin(userId)), page, MENU_PREFIX.premium);
    case 'admin':    return buildPagedKeyboard(getAdminButtons(),                  page, MENU_PREFIX.admin);
    case 'pair':     return buildPagedKeyboard(getPairButtons(userId),             page, MENU_PREFIX.pair);
    default:         return Markup.inlineKeyboard([]);
  }
}

// ── Japanese-themed menu captions ─────────────────────
const MENU_CAPTIONS = {
  main:
    `${E.star} <b>〔 CENTIPEDE V4 〕</b>\n` +
    `${J.divider}\n\n` +
    `${E.owner} Select your path:`,

  settings:
    `${E.settings} <b>〔 SETINGS 〕</b>\n\n` +
    `${J.dot} Adjust your preferences below:`,

  premium:
    `${E.star} <b>〔 PREMUIM ACCESS 〕</b>\n\n` +
    `<i>Power is not given — it is earned.</i>\n\n` +
    `${J.dot} Choose your rank:`,

  admin:
    `${E.owner} <b>〔 SHOGUN PANEL 〕</b>\n\n` +
    `${J.dot} High-level controls:`,

  pair:
    `${E.phone} <b>〔 DEVICE LINK 〕</b>\n\n` +
    `${J.dot} Generate your WhatsApp pairing code:`,
};

// ══════════════════════════════════════════════════════
//  POLL MENU
// ══════════════════════════════════════════════════════
const POLL_MENU_OPTIONS = {
  main: [
    { label: `⚙️ Settings`,      action: 'menu_settings' },
    { label: `🎵 Music`,          action: 'menu_music'    },
    { label: `📱 Device Link`,    action: 'menu_pair'     },
    { label: `⭐ Premium`,        action: 'menu_premium'  },
    { label: `🔄 Toggle Menu`,    action: 'menu_toggle'   },
  ],
  pair: [
    { label: `📲 Generate Code`,  action: 'pair_start'  },
    { label: `🔍 Session Status`, action: 'pair_status' },
    { label: `🗑 Clear Session`,  action: 'pair_clear'  },
    { label: `🔙 Back`,          action: 'menu_main'   },
  ],
};

function purgeStalePollMenus() {
  const now = Date.now();
  for (const [pid, meta] of Object.entries(activePollMenus)) {
    if (now - meta.createdAt > POLL_TTL_MS) delete activePollMenus[pid];
  }
}

async function sendPollMenu(ctx, menuKey) {
  purgeStalePollMenus();
  const baseOpts = POLL_MENU_OPTIONS[menuKey];
  if (!baseOpts) {
    const keyboard = getKeyboard(menuKey, ctx.from.id, 0);
    return ctx.reply(MENU_CAPTIONS[menuKey] || `〔 ${BOT_NAME} 〕`, { parse_mode: 'HTML', ...keyboard });
  }

  const options = [...baseOpts];
  if (menuKey === 'main' && isAdmin(ctx.from.id))
    options.push({ label: '👑 Shogun Panel', action: 'menu_admin' });

  let pollMsg;
  try {
    pollMsg = await ctx.replyWithPoll(
      `⛩ CENTIPEDE V4 — (Pick an option):`,
      options.map(o => o.label),
      { is_anonymous: false, allows_multiple_answers: false }
    );
  } catch (err) {
    console.error('[poll] Send failed:', err.message);
    const keyboard = getKeyboard(menuKey, ctx.from.id, 0);
    return ctx.replyWithPhoto(MAIN_IMAGE, {
      caption: MENU_CAPTIONS[menuKey] || `〔 ${BOT_NAME} 〕`,
      parse_mode: 'HTML',
      ...keyboard,
    });
  }

  activePollMenus[pollMsg.poll.id] = {
    chatId:    ctx.chat.id,
    userId:    ctx.from.id,
    msgId:     pollMsg.message_id,
    options,
    createdAt: Date.now(),
  };
}

bot.on('poll_answer', async (ctx) => {
  const { poll_id, option_ids, user } = ctx.pollAnswer;
  const menu = activePollMenus[poll_id];
  if (!menu || menu.userId !== user.id || !option_ids.length) return;
  delete activePollMenus[poll_id];

  const chosen = menu.options[option_ids[0]];
  if (!chosen) return;

  try { await ctx.telegram.stopPoll(menu.chatId, menu.msgId); }    catch (_) {}
  try { await ctx.telegram.deleteMessage(menu.chatId, menu.msgId); } catch (_) {}

  const fakeCtx = {
    from:                   user,
    chat:                   { id: menu.chatId },
    telegram:               ctx.telegram,
    reply:                  (text, opts) => ctx.telegram.sendMessage(menu.chatId, text, opts),
    replyWithPhoto:         (photo, opts) => ctx.telegram.sendPhoto(menu.chatId, photo, opts),
    replyWithAudio:         (audio, opts) => ctx.telegram.sendAudio(menu.chatId, audio, opts),
    answerCbQuery:          () => Promise.resolve(),
    editMessageText:        () => Promise.resolve(null),
    editMessageCaption:     () => Promise.resolve(null),
    editMessageReplyMarkup: () => Promise.resolve(null),
    match: [],
  };
  await handleMenuAction(fakeCtx, chosen.action);
});

// ══════════════════════════════════════════════════════
//  MENU RENDERER
// ══════════════════════════════════════════════════════
async function showMenu(ctx, menuKey, page = 0, edit = false) {
  if (!requireUser(ctx)) return;
  const userId   = ctx.from.id;
  const menuType = getMenuType(userId);
  const keyboard = getKeyboard(menuKey, userId, page);
  const caption  = MENU_CAPTIONS[menuKey] || `〔 ${BOT_NAME} 〕`;

  if (menuType === 'poll') { await sendPollMenu(ctx, menuKey); return; }

  if (menuKey === 'main' || menuKey === 'pair') {
    if (edit) {
      const ok = await ctx.editMessageCaption(caption, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
      if (ok) return;
    }
    await ctx.replyWithPhoto(MAIN_IMAGE, { caption, parse_mode: 'HTML', ...keyboard });
    return;
  }

  if (edit) {
    const ok = await ctx.editMessageText(caption, { parse_mode: 'HTML', ...keyboard }).catch(() => null)
            || await ctx.editMessageCaption(caption, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
    if (ok) return;
  }
  await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
}

// ══════════════════════════════════════════════════════
//  PAIRING HELPERS
// ══════════════════════════════════════════════════════
function getPairingCooldown(userId) {
  const a = pairingAttempts[userId];
  if (a?.cooldownUntil && Date.now() < a.cooldownUntil)
    return Math.ceil((a.cooldownUntil - Date.now()) / 1000);
  return null;
}

function recordPairingFailure(userId) {
  if (!pairingAttempts[userId]) pairingAttempts[userId] = { retries: 0, cooldownUntil: null };
  pairingAttempts[userId].retries += 1;
  if (pairingAttempts[userId].retries >= PAIR_MAX_RETRIES) {
    pairingAttempts[userId].cooldownUntil = Date.now() + PAIR_COOLDOWN_MS;
    pairingAttempts[userId].retries = 0;
  }
}

function resetPairingAttempts(userId) { delete pairingAttempts[userId]; }

async function promptPairNumber(ctx) {
  const userId      = ctx.from.id;
  const attempt     = pairingAttempts[userId];
  const retriesLeft = attempt ? Math.max(0, PAIR_MAX_RETRIES - attempt.retries) : PAIR_MAX_RETRIES;

  userStates[userId] = 'await_pair_number';
  await ctx.reply(
    `📱 <b>〔 WhatsApp 〕</b>\n\n` +
    `Send your number in <b>international format</b>:\n` +
    `Example: <code>234xxxxxx</code>\n\n` +
    `<i>Include country code — no +, no spaces.</i>\n\n` +
    `⚠️ : <b>${retriesLeft}</b> attempt(s) remaining`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([[{ text: btnText(E.cancel, 'Cancel'), callback_data: 'pair_cancel', style: 'danger' }]]),
    }
  );
}

async function showPairStatus(ctx) {
  const userId  = ctx.from.id;
  const session = pairedSessions[userId];
  let text, keyboard;

  if (session) {
    const created = moment(session.createdAt).tz(TZ).format('DD MMM YYYY, hh:mm A');
    text =
      `${E.thanks} <b>〔 C 〕 Pairing Session</b>\n\n` +
      `${J.divider}\n\n` +
      `${E.phone}  Phone: <code>${session.number}</code>\n` +
      `${E.session} コード Code:  <code>${session.code}</code>\n` +
      `🕐: ${created}\n\n` +
      `<b>🗺 How to link:</b>\n` +
      `1️⃣ Open WhatsApp on your phone\n` +
      `2️⃣ Go to <b>Linked Devices → Link a Device</b>\n` +
      `3️⃣ Tap <b>Link with phone number instead</b>\n` +
      `4️⃣ Enter the code above`;
    keyboard = Markup.inlineKeyboard([
      [{ text: btnText(E.new, 'New Code'), callback_data: 'pair_start', style: 'success' }, { text: btnText(E.clear, ' Clear'), callback_data: 'pair_clear', style: 'danger' }],
      [{ text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }],
    ]);
  } else {
    text =
      `${E.bug} <b>〔 C 〕 Status</b>\n\n` +
      `${E.close} No active session found.\n\n` +
      `Tap <b>Generate Code</b> to begin pairing.`;
    keyboard = Markup.inlineKeyboard([
      [{ text: btnText(E.code, 'Generate Code'), callback_data: 'pair_start', style: 'success' }],
      [{ text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }],
    ]);
  }

  await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

// ══════════════════════════════════════════════════════
//  CENTRAL ACTION DISPATCHER
// ══════════════════════════════════════════════════════
async function handleMenuAction(ctx, action) {
  switch (action) {
    case 'menu_settings':  await showMenu(ctx, 'settings', 0, false); break;
    case 'menu_music':
      userStates[ctx.from.id] = 'await_song';
      await ctx.reply(`${E.music} 🎌YouTube URL — Send a song name or YouTube URL:`, { parse_mode: 'HTML' });
      break;
    case 'menu_pair':    await showMenu(ctx, 'pair', 0, false); break;
    case 'menu_premium': await showMenu(ctx, 'premium', 0, false); break;
    case 'menu_toggle':  await handleMenuToggle(ctx); break;
    case 'menu_admin':
      if (!isAdmin(ctx.from.id)) { await ctx.reply('⛔ — Shogun access only.'); break; }
      await showMenu(ctx, 'admin', 0, false);
      break;

    case 'pair_start': {
      if (!isPremium(ctx.from.id) && !isAdmin(ctx.from.id)) {
        await ctx.reply(
          `${E.bug} <b>〔 C 〕 Access Denied</b>\n\n` +
          `Premium rank required to use device pairing.\n` +
          `${E.thanks} Contact the developer to unlock access.`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [{ text: btnText(E.contact, 'Dev'), url: `https://t.me/${DEV_HANDLE.replace('@', '')}` }],
            ]),
          }
        );
        break;
      }
      const secs = getPairingCooldown(ctx.from.id);
      if (secs) { await ctx.reply(`⏳ — Cooldown active. Try again in <b>${secs}s</b>.`, { parse_mode: 'HTML' }); break; }
      await promptPairNumber(ctx);
      break;
    }
    case 'pair_status': await showPairStatus(ctx); break;
    case 'pair_clear':
      delete pairedSessions[ctx.from.id];
      delete pairingAttempts[ctx.from.id];
      await ctx.reply(`${E.clear} — Session cleared.`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[
          { text: btnText(E.code, 'New Code'), callback_data: 'pair_start', style: 'success' },
          { text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }
        ]])
      });
      break;
    case 'pair_cancel':
      delete userStates[ctx.from.id];
      await ctx.reply(`${E.cancel} — Pairing cancelled.`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[{ text: btnText(E.back, '戻る  Back'), callback_data: 'menu_pair', style: 'danger' }]])
      });
      break;
    default: break;
  }
}

async function handleMenuToggle(ctx) {
  const id      = String(ctx.from.id);
  const current = getMenuType(id);
  const newType = current === 'inline' ? 'poll' : 'inline';
  setMenuType(id, newType);
  await ctx.reply(
    `✅ メニュー切替 — Menu switched to <b>${newType === 'inline' ? '🖼 Inline (image + buttons)' : '🗳 Poll'}</b>.\nSend /start to see the new style.`,
    { parse_mode: 'HTML' }
  );
}

// ══════════════════════════════════════════════════════
//  PAGINATION
// ══════════════════════════════════════════════════════
bot.action(/^(mm|sm|pm|am|pr)\|(prev|next)\|(\d+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  const prefix  = ctx.match[1];
  const dir     = ctx.match[2];
  const newPage = dir === 'next'
    ? parseInt(ctx.match[3], 10) + 1
    : parseInt(ctx.match[3], 10) - 1;
  const menuKey = PREFIX_TO_KEY[prefix];
  if (!menuKey) return ctx.answerCbQuery();
  await showMenu(ctx, menuKey, newPage, true);
  await ctx.answerCbQuery();
});
bot.action(/^(mm|sm|pm|am|pr)\|page$/, async (ctx) => ctx.answerCbQuery());

// ══════════════════════════════════════════════════════
//  PAIRING ACTIONS
// ══════════════════════════════════════════════════════
bot.action('pair_start', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isPremium(ctx.from.id) && !isAdmin(ctx.from.id)) {
    return ctx.reply(
      `${E.bug} <b>〔 C 〕 Access Denied</b>\n\nPremium required.\n${E.thanks} Contact developer.`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[{ text: btnText(E.contact, 'Dev'), url: `https://t.me/${DEV_HANDLE.replace('@', '')}` }]]),
      }
    );
  }
  const secs = getPairingCooldown(ctx.from.id);
  if (secs) return ctx.reply(`⏳ — Cooldown active. Retry in <b>${secs}s</b>.`, { parse_mode: 'HTML' });
  await promptPairNumber(ctx);
});
bot.action('pair_status', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showPairStatus(ctx);
});
bot.action('pair_clear', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!pairedSessions[ctx.from.id]) return ctx.reply('❌ No active session to clear.');
  delete pairedSessions[ctx.from.id];
  delete pairingAttempts[ctx.from.id];
  await ctx.reply(`${E.clear} <b> — Session cleared.</b>`, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[
      { text: btnText(E.code, 'New Code'), callback_data: 'pair_start', style: 'success' },
      { text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }
    ]]),
  });
});
bot.action('pair_cancel', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  delete userStates[ctx.from.id];
  await ctx.reply(`${E.cancel} <b> — Pairing cancelled.</b>`, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[{ text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }]]),
  });
});

// ══════════════════════════════════════════════════════
//  PACKAGE SELECTION FLOW
// ══════════════════════════════════════════════════════
async function showPackages(ctx, edit = false) {
  const buttons = PACKAGES.map(p => ({ text: `${p.label}  •  ${p.price}`, callback_data: `pkg_select|${p.id}` }));
  buttons.push({ text: btnText(E.back, 'Back'), callback_data: 'menu_premium', style: 'danger' });
  const keyboard = buildPagedKeyboard(buttons, 0, 'pkg_pg');
  const text =
    `${E.star} <b>〔 天位ランク — Premium Rank 〕</b>\n\n` +
    PACKAGES.map(p => `${J.arrow} ${p.label}  ›  <b>${p.price}</b> <i>(${p.days} days)</i>`).join('\n') +
    '\n\n<i>Tap a rank to continue.</i>';
  if (edit) {
    const ok = await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null)
            || await ctx.editMessageCaption(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
    if (ok) return;
  }
  await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

bot.action(/^pkg_pg\|(prev|next)\|(\d+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  const dir     = ctx.match[1];
  const newPage = dir === 'next' ? parseInt(ctx.match[2], 10) + 1 : parseInt(ctx.match[2], 10) - 1;
  const buttons = PACKAGES.map(p => ({ text: `${p.label}  •  ${p.price}`, callback_data: `pkg_select|${p.id}` }));
  buttons.push({ text: btnText(E.back, 'Back'), callback_data: 'menu_premium', style: 'danger' });
  await ctx.editMessageReplyMarkup(buildPagedKeyboard(buttons, newPage, 'pkg_pg').reply_markup).catch(() => {});
  await ctx.answerCbQuery();
});
bot.action('pkg_pg|page', async (ctx) => ctx.answerCbQuery());

bot.action(/^pkg_select\|(.+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  const pkg = PACKAGES.find(p => p.id === ctx.match[1]);
  if (!pkg) return ctx.reply('❌ — Rank not found.');
  purchaseFlow[ctx.from.id] = { packageId: pkg.id, days: pkg.days, price: pkg.price, label: pkg.label };
  if (!banks.length)
    return ctx.reply('⚠️ No payment accounts configured. Contact admin.', { parse_mode: 'HTML' });
  await showBankSelection(ctx, pkg, 0, true);
});

async function showBankSelection(ctx, pkg, page = 0, edit = false) {
  const bankButtons = banks.map(b => ({ text: btnText(E.bank, `${b.bankName} — ${b.accountNumber}`), callback_data: `bank_pay|${b.id}` }));
  bankButtons.push({ text: btnText(E.back, 'Back to Ranks'), callback_data: 'premium_buy', style: 'danger' });
  const keyboard = buildPagedKeyboard(bankButtons, page, 'bsel_pg');
  const text =
    `${E.thanks} <b>Rank Selection:</b> ${pkg.label} — ${pkg.price}\n\n` +
    `${E.bank} <b>〔 Choose a Bank 〕</b>\n\n` +
    banks.map((b, i) =>
      `${i + 1}. <b>${esc(b.bankName)}</b>\n   Account Number: <code>${esc(b.accountNumber)}</code>\n   Name: ${esc(b.accountName)}`
    ).join('\n\n') +
    '\n\n<i>Tap a bank to see full details.</i>';
  if (edit) {
    const ok = await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null)
            || await ctx.editMessageCaption(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
    if (ok) return;
  }
  await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

bot.action(/^bsel_pg\|(prev|next)\|(\d+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  const dir     = ctx.match[1];
  const newPage = dir === 'next' ? parseInt(ctx.match[2], 10) + 1 : parseInt(ctx.match[2], 10) - 1;
  const flow    = purchaseFlow[ctx.from.id];
  const pkg     = flow ? PACKAGES.find(p => p.id === flow.packageId) : null;
  if (!pkg) { await ctx.answerCbQuery(); return showPackages(ctx, true); }
  const bankButtons = banks.map(b => ({ text: btnText(E.bank, `${b.bankName} — ${b.accountNumber}`), callback_data: `bank_pay|${b.id}` }));
  bankButtons.push({ text: btnText(E.back, 'Back to Ranks'), callback_data: 'premium_buy', style: 'danger' });
  await ctx.editMessageReplyMarkup(buildPagedKeyboard(bankButtons, newPage, 'bsel_pg').reply_markup).catch(() => {});
  await ctx.answerCbQuery();
});
bot.action('bsel_pg|page', async (ctx) => ctx.answerCbQuery());

bot.action(/^bank_pay\|(.+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  const bank = banks.find(b => b.id === ctx.match[1]);
  if (!bank) return ctx.reply('❌ Bank not found. Please try again.');
  const flow = purchaseFlow[ctx.from.id];
  const pkg  = flow ? PACKAGES.find(p => p.id === flow.packageId) : null;
  if (!pkg)  return showPackages(ctx, false);
  purchaseFlow[ctx.from.id].bankId = bank.id;
  userStates[ctx.from.id] = 'await_payment_ss';
  await ctx.reply(
    `${E.thanks} <b>〔 Payment Details 〕</b>\n\n` +
    `${J.divider}\n\n` +
    `${E.star} Rank: <b>${pkg.label}</b> — <b>${pkg.price}</b>\n\n` +
    `${E.bank} <b>Bank:</b> ${esc(bank.bankName)}\n` +
    `${E.owner} <b>Account Name:</b> ${esc(bank.accountName)}\n` +
    `${E.fun} <b>Account Number:</b> <code>${esc(bank.accountNumber)}</code>\n\n` +
    `1️⃣  Transfer <b>${pkg.price}</b> to the account above.\n` +
    `2️⃣  Take a screenshot of the receipt.\n` +
    `3️⃣  Send the screenshot in this chat.\n\n` +
    `<i>⛩ Premium activated after admin review.</i>`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [{ text: btnText(E.back, 'Back to Banks'), callback_data: `pkg_select|${pkg.id}`, style: 'danger' }],
        [{ text: btnText(E.cancel, 'Cancel'), callback_data: 'menu_premium', style: 'danger' }],
      ]),
    }
  );
});

// ══════════════════════════════════════════════════════
//  BANK MANAGEMENT
// ══════════════════════════════════════════════════════
async function showBankManagePanel(ctx, edit = false) {
  const buttons = [
    { text: btnText(E.add,    'Add Bank'),    callback_data: 'bank_add',    style: 'success' },
    { text: btnText(E.remove, 'Remove Bank'), callback_data: 'bank_remove', style: 'danger'  },
    { text: btnText(E.list,   'List Banks'),  callback_data: 'bank_list',   style: 'primary' },
    { text: btnText(E.back,   'Back'),        callback_data: 'menu_admin',  style: 'danger'  },
  ];
  const keyboard = buildPagedKeyboard(buttons, 0, 'bm_pg');
  const text = `${E.bank} <b>〔 Bank Management 〕</b>\n\nManage payment accounts shown at checkout.`;
  if (edit) {
    const ok = await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null)
            || await ctx.editMessageCaption(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
    if (ok) return;
  }
  await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

bot.action('bank_manage', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  await showBankManagePanel(ctx, true);
});
bot.action('bank_add', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_bank_add';
  await ctx.reply(
    `${E.bank} <b>〔 Add a Bank Account 〕</b>\n\n` +
    `Format: <code>BANK NAME | ACCOUNT NAME | ACCOUNT NUMBER</code>\n\nExample:\n<code>GTBank | John Doe | 0123456789</code>\n\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('bank_remove', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  if (!banks.length) return ctx.reply('📭 No banks configured yet.');
  const buttons = banks.map(b => ({ text: btnText(E.cancel, `${b.bankName} — ${b.accountNumber}`), callback_data: `bank_del|${b.id}` }));
  buttons.push({ text: btnText(E.back, 'Back'), callback_data: 'bank_manage', style: 'danger' });
  const keyboard = buildPagedKeyboard(buttons, 0, 'bdel_pg');
  const text = `${E.clear} <b>〔 Remove a Bank 〕</b>\n\nTap a bank to remove it:`;
  const ok = await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null)
          || await ctx.editMessageCaption(text, { parse_mode: 'HTML', ...keyboard }).catch(() => null);
  if (!ok) await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
});
bot.action(/^bdel_pg\|(prev|next)\|(\d+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  const dir     = ctx.match[1];
  const newPage = dir === 'next' ? parseInt(ctx.match[2], 10) + 1 : parseInt(ctx.match[2], 10) - 1;
  const buttons = banks.map(b => ({ text: btnText(E.cancel, `${b.bankName} — ${b.accountNumber}`), callback_data: `bank_del|${b.id}` }));
  buttons.push({ text: btnText(E.back, 'Back'), callback_data: 'bank_manage', style: 'danger' });
  await ctx.editMessageReplyMarkup(buildPagedKeyboard(buttons, newPage, 'bdel_pg').reply_markup).catch(() => {});
  await ctx.answerCbQuery();
});
bot.action('bdel_pg|page', async (ctx) => ctx.answerCbQuery());
bot.action(/^bank_del\|(.+)$/, async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  const bank = banks.find(b => b.id === ctx.match[1]);
  if (!bank) return ctx.reply('❌ Bank not found.');
  banks = banks.filter(b => b.id !== ctx.match[1]);
  writeJSON(PATHS.banks, banks);
  await ctx.reply(`✅ <b>Bank Account Removed:</b> ${esc(bank.bankName)} — <code>${esc(bank.accountNumber)}</code>`, { parse_mode: 'HTML' });
  await showBankManagePanel(ctx, false);
});
bot.action('bank_list', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  if (!banks.length) return ctx.reply('📭 No bank accounts configured yet.');
  const list = banks.map((b, i) =>
    `${i + 1}. <b>${esc(b.bankName)}</b>\n   👤 ${esc(b.accountName)}\n   🔢 <code>${esc(b.accountNumber)}</code>`
  ).join('\n\n');
  await ctx.reply(`${E.bank} <b>〔 Configured Banks 〕</b>\n\n${list}`, { parse_mode: 'HTML' });
});

// ══════════════════════════════════════════════════════
//  PREMIUM ACTIONS
// ══════════════════════════════════════════════════════
bot.action('premium_buy', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showPackages(ctx, true);
});
bot.action('premium_status', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  const uid    = String(ctx.from.id);
  const entry  = premiumUsers.find(u => u.id === uid);

  let statusLine;
  if (isOpenAccess()) {
    const until = moment(openAccessData.expiresAt).tz(TZ).format('DD MMM YYYY, hh:mm A');
    statusLine = `✅(🌐 Open Access until <b>${until}</b>)`;
  } else if (isPremium(uid)) {
    const expiry = entry?.expiresAt ? moment(entry.expiresAt).tz(TZ).format('DD MMM YYYY, hh:mm A') : null;
    statusLine = `✅Active${expiry ? ` — expires <b>${expiry}</b> (${TZ})` : ''}`;
  } else {
    statusLine = '❌ — Not Active';
  }

  await ctx.reply(
    `${E.star} <b>〔 Premium Status 〕</b>\n\n${J.divider}\n\nStatus: ${statusLine}`,
    { parse_mode: 'HTML' }
  );
});
bot.action('premium_add', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_premium_add';
  await ctx.reply(
    `${E.add} Add Premium  — Send: <code>USER_ID DAYS</code>\nExample: <code>123456789 30</code>\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('premium_remove', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_premium_remove';
  await ctx.reply(
    `${E.remove} Revoke Premium  — Send the user ID to revoke premium:\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('premium_list', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  if (!premiumUsers.length) return ctx.reply('📭 No premium users found.');
  const list = premiumUsers.map((u, i) => {
    const exp = u.expiresAt ? moment(u.expiresAt).tz(TZ).format('DD MMM YYYY') : 'never';
    return `${i + 1}. <code>${u.id}</code> ${isPremium(u.id) ? '✅' : '❌'} — expires ${exp}`;
  }).join('\n');
  await ctx.reply(`${E.star} <b>〔 Premium Users 〕</b>\n\n${list}`, { parse_mode: 'HTML' });
});

// ══════════════════════════════════════════════════════
//  SETTINGS ACTIONS
// ════════════════════════════════════════════════════
bot.action('settings_runtime', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  const uptime = Math.floor((Date.now() - botStartTime) / 1000);
  const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
  const users = readJSON(PATHS.users, []).length;
  const openStatus = isOpenAccess()
    ? `🌐 <b>Open Access:</b> ✅ Active until <b>${moment(openAccessData.expiresAt).tz(TZ).format('DD MMM YYYY, hh:mm A')}</b>\n`
    : `🌐 <b>Open Access:</b> ❌ Off\n`;
  await ctx.reply(
    `${E.stats} <b>〔 C 〕 Runtime Stats</b>\n\n` +
    `${J.divider}\n\n` +
    `⏱ Uptime: <b>${h}h ${m}m ${s}s</b>\n` +
    `👥 Users: <b>${users}</b>\n` +
    `👑 Admins: <b>${adminIDs.length}</b>\n` +
    `⭐ Premium: <b>${premiumUsers.length}</b>\n` +
    openStatus +
    `🏦 Banks: <b>${banks.length}</b>\n` +
    `📱 Sessions: <b>${Object.keys(pairedSessions).length}</b>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('settings_broadcast', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_broadcast_message';
  await ctx.reply(
    `${E.cast} — Send your broadcast message to all users.\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});

// ══════════════════════════════════════════════════════
//  ADMIN ACTIONS
// ════════════════════════════════════════════════════
bot.action('admin_add', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_admin_add';
  await ctx.reply(
    `${E.add} — Send the user ID to add as admin:\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('admin_remove', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  userStates[ctx.from.id] = 'await_admin_remove';
  await ctx.reply(
    `${E.remove} — Send the user ID to remove from admins:\n<i>(Send /cancel to abort)</i>`,
    { parse_mode: 'HTML' }
  );
});
bot.action('admin_list', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  const list = adminIDs.length ? adminIDs.map((id, i) => `${i + 1}. <code>${id}</code>`).join('\n') : '<i>None</i>';
  await ctx.reply(`${E.owner} <b>〔 Admins 〕</b>\n\n${list}`, { parse_mode: 'HTML' });
});

// ══════════════════════════════════════════════════════
//  MUSIC ACTION
// ══════════════════════════════════════════════════════
bot.action('menu_music', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  userStates[ctx.from.id] = 'await_song';
  await ctx.reply(
    `${E.music} 🎌\nSend a song name or YouTube URL to download:`,
    { parse_mode: 'HTML' }
  );
});

// ══════════════════════════════════════════════════════
//  NAVIGATION ACTIONS
// ══════════════════════════════════════════════════════
bot.action('menu_main', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showMenu(ctx, 'main', 0, true);
});
bot.action('menu_settings', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showMenu(ctx, 'settings', 0, true);
});
bot.action('menu_pair', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showMenu(ctx, 'pair', 0, true);
});
bot.action('menu_premium', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await showMenu(ctx, 'premium', 0, true);
});
bot.action('menu_admin', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  await showMenu(ctx, 'admin', 0, true);
});
bot.action('menu_toggle', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  await handleMenuToggle(ctx);
});
bot.action('menu_close', async (ctx) => {
  if (!requireUser(ctx)) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  const msg = ' — Menu closed. Send /start to reopen.';
  const ok  = await ctx.editMessageCaption(msg).catch(() => null)
           || await ctx.editMessageText(msg).catch(() => null);
  if (!ok) await ctx.reply(msg);
});

// ══════════════════════════════════════════════════════
//  COMMANDS
// ══════════════════════════════════════════════════════
bot.start(async (ctx) => {
  if (!requireUser(ctx)) return;
  registerUser(ctx.from.id);
  await showMenu(ctx, 'main', 0, false);
});

bot.help(async (ctx) => {
  if (!requireUser(ctx)) return;
  await ctx.reply(
    `${E.owner} <b>〔 CENTIPEDE V4 —  Help 〕</b>\n\n` +
    `${J.divider}\n\n` +
    `<code>/start</code>  — Open main menu\n` +
    `<code>/help</code>   — Show this message\n` +
    `<code>/cancel</code> — Cancel current action\n` +
    `<code>/grant USER_ID DAYS</code> — Grant premium <i>(admin)</i>\n` +
    `<code>/grant all HOURS</code> — Open access to everyone <i>(admin)</i>\n\n` +
    `${E.fun} <b>Features:</b>\n` +
    `🎵 YouTube — Music downloads\n` +
    `📱 WhatsApp — Device pairing\n` +
    `⭐  — Premium tiers\n` +
    `🏦 — Bank accounts\n` +
    `🔄  — Menu toggle\n` +
    `👑 — Admin panel\n` +
    `📢  — Broadcast\n\n` +
    `${J.divider}\n` +
    `Developer: ${DEV_HANDLE}  |  Channel: ${CHANNEL}`,
    { parse_mode: 'HTML' }
  );
});

bot.command('cancel', async (ctx) => {
  if (!requireUser(ctx)) return;
  const uid = ctx.from.id;
  if (userStates[uid]) {
    delete userStates[uid];
    delete purchaseFlow[uid];
    return ctx.reply('✅  — Action cancelled.');
  }
  await ctx.reply(' — Nothing to cancel.');
});

// ══════════════════════════════════════════════════════
//  OPEN-ACCESS HELPERS
// ══════════════════════════════════════════════════════
function clearOpenAccessTimer() {
  if (openAccessTimer) { clearTimeout(openAccessTimer); openAccessTimer = null; }
}

async function revokeOpenAccess(telegram) {
  openAccessData = null;
  writeJSON(PATHS.openAccess, null);
  clearOpenAccessTimer();
  console.log('[open-access] Period ended — reverted to premium-only.');
  const users = readJSON(PATHS.users, []);
  const msg =
    `⛩ <b>〔 解放期間終了 〕 Free Access Ended</b>\n\n` +
    `The bot has returned to <b>premium-only</b> mode.\n` +
    `To continue using premium features, purchase a rank via /start → ⭐ Premium.`;
  for (const uid of users) {
    try { await telegram.sendMessage(Number(uid), msg, { parse_mode: 'HTML' }); }
    catch (_) {}
    await sleep(BROADCAST_DELAY_MS);
  }
}

function scheduleOpenAccessRevoke(telegram, ms) {
  clearOpenAccessTimer();
  openAccessTimer = setTimeout(() => revokeOpenAccess(telegram), ms);
}

function restoreOpenAccessIfActive(telegram) {
  if (!openAccessData?.expiresAt) return;
  const remaining = new Date(openAccessData.expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    openAccessData = null;
    writeJSON(PATHS.openAccess, null);
    return;
  }
  console.log(`[open-access] Restored — ${Math.ceil(remaining / 60000)} min remaining.`);
  scheduleOpenAccessRevoke(telegram, remaining);
}

bot.command('grant', async (ctx) => {
  if (!requireUser(ctx)) return;
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ — Shogun only.');
  const parts = ctx.message.text.trim().split(/\s+/);

  if (parts[1]?.toLowerCase() === 'all') {
    if (parts.length !== 3) return ctx.reply('❌ Usage: <code>/grant all HOURS</code>\nExample: <code>/grant all 2</code>', { parse_mode: 'HTML' });
    const hours = parseFloat(parts[2]);
    if (isNaN(hours) || hours <= 0) return ctx.reply('❌ Hours must be a positive number.');

    const expiresAt = moment().tz(TZ).add(hours, 'hours').toISOString();
    openAccessData  = { expiresAt, grantedBy: String(ctx.from.id), grantedAt: new Date().toISOString() };
    writeJSON(PATHS.openAccess, openAccessData);

    const formatted = moment(expiresAt).tz(TZ).format('DD MMM YYYY, hh:mm A');
    scheduleOpenAccessRevoke(ctx.telegram, hours * 60 * 60 * 1000);

    await ctx.reply(
      `🌐 <b>〔 C 〕 Open Access Activated!</b>\n\n` +
      `All users now have premium access for <b>${hours} hour(s)</b>.\n` +
      `Expires: <b>${formatted}</b> (${TZ})\n\n` +
      `<i>⛩ Access automatically reverts to premium-only when the period ends.</i>`,
      { parse_mode: 'HTML' }
    );

    const users   = readJSON(PATHS.users, []);
    const broadcastMsg =
      `🎌 <b>〔 C！ 〕 Free Access — Limited Time!</b>\n\n` +
      `All features are now <b>free</b> for everyone for the next <b>${hours} hour(s)</b>!\n` +
      `Offer expires: <b>${formatted}</b> (${TZ})\n\n` +
      `⛩ Enjoy premium features while they last — CENTIPEDE V4 🚀`;
    let delivered = 0;
    for (const uid of users) {
      try { await bot.telegram.sendMessage(Number(uid), broadcastMsg, { parse_mode: 'HTML' }); delivered++; }
      catch (_) {}
      await sleep(BROADCAST_DELAY_MS);
    }
    await ctx.reply(`${E.cast} Announcement sent to <b>${delivered}</b> user(s).`, { parse_mode: 'HTML' });
    return;
  }

  if (parts.length !== 3) return ctx.reply('❌ Usage:\n<code>/grant USER_ID DAYS</code>\n<code>/grant all HOURS</code>', { parse_mode: 'HTML' });
  const [, uid, daysStr] = parts;
  const days = parseInt(daysStr, 10);
  if (!/^\d+$/.test(uid))      return ctx.reply('❌ Invalid user ID — numbers only.');
  if (isNaN(days) || days < 1) return ctx.reply('❌ Days must be a positive number.');
  const expiry    = addPremium(uid, days);
  const formatted = moment(expiry).tz(TZ).format('DD MMM YYYY, hh:mm A');
  await ctx.reply(
    `✅ — Premium granted to <code>${uid}</code> for <b>${days}</b> day(s).\nExpires: <b>${formatted}</b> (${TZ})`,
    { parse_mode: 'HTML' }
  );
  try {
    await bot.telegram.sendMessage(Number(uid),
      `🎌 <b>〔 天位ランク有効化！ 〕 Premium Activated!</b>\n\n` +
      `Duration: <b>${days} day(s)</b>\nExpires: <b>${formatted}</b> (${TZ})\n\n` +
      `⛩ Welcome to CENTIPEDE V4 premium`,
      { parse_mode: 'HTML' }
    );
  } catch (_) {}
});

// ══════════════════════════════════════════════════════
//  TEXT HANDLER  (State Machine)
// ══════════════════════════════════════════════════════
bot.on('text', async (ctx) => {
  if (!requireUser(ctx)) return;
  const userId = ctx.from.id;
  const state  = userStates[userId];
  if (!state) return;
  if (ctx.message.text.startsWith('/')) return;

  // ── Music ─────────────────────────────────────────────────────
  if (state === 'await_song') {
    delete userStates[userId];
    const query   = ctx.message.text.trim();
    const status  = await ctx.reply('🔍  — Searching...');
    const tmpFile = path.join(os.tmpdir(), `audio_${userId}_${Date.now()}.mp3`);
    try {
      const result = await yts(query);
      if (!result.videos.length)
        return ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null,
          '❌ — No results found. Try a different song name.'
        ).catch(() => ctx.reply('❌ No results found.'));

      const video = result.videos[0];
      await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null,
        `🎵 <b>${esc(video.title)}</b>\n⏱ ${video.timestamp}  👁 ${video.views?.toLocaleString?.() || '?'} views\n\n⬇️ ダウンロード中 — Downloading...`,
        { parse_mode: 'HTML' }
      ).catch(() => {});

      await new Promise((resolve, reject) => {
        execFile('yt-dlp', [
          '-x',
          '--audio-format', 'mp3',
          '--audio-quality', '0',
          '--no-playlist',
          '-o', tmpFile,
          video.url,
        ], { timeout: 120_000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      const rawCaption = `🎵 ${video.title}\n📎 ${video.url}`;
      const caption    = rawCaption.length > 1024 ? rawCaption.slice(0, 1021) + '…' : rawCaption;

      await ctx.replyWithAudio(
        { source: fs.createReadStream(tmpFile), filename: 'audio.mp3' },
        { title: video.title, performer: video.author?.name || 'Unknown', caption }
      );

      fs.unlink(tmpFile, () => {});
      await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});
    } catch (err) {
      console.error('[music]', err.message);
      fs.unlink(tmpFile, () => {});
      await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null,
        '❌ — Failed to download audio. The video may be unavailable or region-locked.'
      ).catch(() => ctx.reply('❌ Failed to download audio.'));
    }
  }

  // ── Pairing ───────────────────────────────────────────────────
  else if (state === 'await_pair_number') {
    if (!isPremium(userId) && !isAdmin(userId)) {
      delete userStates[userId];
      return ctx.reply(
        `🔒 <b>〔 C 〕 Access Denied</b>\n\nContact the developer to purchase access.`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [{ text: '💬   Dev', url: `https://t.me/${DEV_HANDLE.replace('@', '')}` }],
          ]),
        }
      );
    }

    const raw    = ctx.message.text.trim();
    const number = raw.replace(/\D/g, '');

    if (!number || number.length < 7 || number.length > 15) {
      userStates[userId] = 'await_pair_number';
      return ctx.reply(
        `${E.cancel} <b>無効な番号 — Invalid number.</b>\n\nSend your full phone number in international format:\nExample: <code>2348012345678</code>\n\n<i>No +, no spaces, include country code.</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard([[{ text: btnText(E.cancel, ' Cancel'), callback_data: 'pair_cancel', style: 'danger' }]]) }
      );
    }

    const cooldownSecs = getPairingCooldown(userId);
    if (cooldownSecs) {
      delete userStates[userId];
      return ctx.reply(`⏳ 待機中 — Cooldown active. Try again in <b>${cooldownSecs}s</b>.`, { parse_mode: 'HTML' });
    }

    delete userStates[userId];
    const status = await ctx.reply('⏳ 接続中 — Connecting to WhatsApp and generating code…');

    try {
      const code = await generatePairingCode(number, GROUP_INVITE_LINKS);

      pairedSessions[userId] = { number, code, createdAt: Date.now() };
      resetPairingAttempts(userId);

      await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});
      await ctx.reply(
        `${E.thanks} <b>〔 C 〕 Code Generated!</b>\n\n` +
        `${J.divider}\n\n` +
        `${E.phone}  Phone: <code>${number}</code>\n` +
        `${E.session} Code:  <code>${code}</code>\n\n` +
        `<b>🗺 How to link:</b>\n` +
        `1️⃣ Open WhatsApp on your phone\n` +
        `2️⃣ Go to <b>Linked Devices → Link a Device</b>\n` +
        `3️⃣ Tap <b>Link with phone number instead</b>\n` +
        `4️⃣ Enter the code above\n\n` +
        `<i>${E.fun} — Code expires in ~60 seconds!</i>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [{ text: btnText(E.new, 'New Code'), callback_data: 'pair_start', style: 'success' }, { text: btnText(E.view, 'View Session'), callback_data: 'pair_status', style: 'primary' }],
            [{ text: btnText(E.clear, 'Clear'), callback_data: 'pair_clear', style: 'danger' }, { text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }],
          ]),
        }
      );
    } catch (err) {
      console.error('[pairing]', err.message);
      recordPairingFailure(userId);

      const attempt    = pairingAttempts[userId];
      const onCooldown = attempt?.cooldownUntil && Date.now() < attempt.cooldownUntil;
      const retriesLeft = onCooldown ? 0 : Math.max(0, PAIR_MAX_RETRIES - (attempt?.retries || 0));

      await ctx.telegram.editMessageText(
        ctx.chat.id, status.message_id, null,
        `${E.bug} <b>〔 C 〕 Pairing Failed.</b>\n\n` +
        `Reason: <i>${esc(err.message)}</i>\n\n` +
        (onCooldown
          ? `⏳ Too many attempts. Wait ${Math.ceil((attempt.cooldownUntil - Date.now()) / 1000)}s before retrying.`
          : `⚠️ : <b>${retriesLeft}</b> attempt(s) remaining`),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(onCooldown
            ? [[{ text: btnText(E.back, 'Back'), callback_data: 'menu_pair', style: 'danger' }]]
            : [[{ text: btnText(E.toggle, 'Retry'), callback_data: 'pair_start', style: 'success' }, { text: btnText(E.cancel, 'Cancel'), callback_data: 'pair_cancel', style: 'danger' }]]
          ),
        }
      ).catch(() => ctx.reply('❌ Pairing failed. Please try again.'));
    }
  }

  // ── Broadcast ─────────────────────────────────────────────────
  else if (state === 'await_broadcast_message') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const message = ctx.message.text;
    const users   = readJSON(PATHS.users, []);
    const status  = await ctx.reply(`${E.cast}  — Broadcasting to ${users.length} user(s)…`);
    let success = 0, failed = 0;
    for (const uid of users) {
      try { await bot.telegram.sendMessage(Number(uid), message, { parse_mode: 'HTML' }); success++; }
      catch (_) { failed++; }
      await sleep(BROADCAST_DELAY_MS);
    }
    await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null,
      `✅ <b>〔 C 〕 Broadcast Complete</b>\n\n✔ Delivered: ${success}\n✘ Failed: ${failed}`,
      { parse_mode: 'HTML' }
    ).catch(() => {});
  }

  // ── Admin add ─────────────────────────────────────────────────
  else if (state === 'await_admin_add') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const newAdmin = ctx.message.text.trim();
    if (!/^\d+$/.test(newAdmin)) return ctx.reply('❌ Invalid user ID — numbers only.');
    if (adminIDs.includes(newAdmin)) return ctx.reply(`❌ <code>${newAdmin}</code> is already an admin.`, { parse_mode: 'HTML' });
    adminIDs.push(newAdmin);
    writeJSON(PATHS.admins, adminIDs);
    await ctx.reply(`✅ — <code>${newAdmin}</code> is now an admin.`, { parse_mode: 'HTML' });
  }

  // ── Admin remove ──────────────────────────────────────────────
  else if (state === 'await_admin_remove') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const remAdmin = ctx.message.text.trim();
    if (!adminIDs.includes(remAdmin)) return ctx.reply(`❌ <code>${remAdmin}</code> is not an admin.`, { parse_mode: 'HTML' });
    if (adminIDs.length === 1) return ctx.reply('⚠️ Cannot remove the last admin.');
    adminIDs = adminIDs.filter(id => id !== remAdmin);
    writeJSON(PATHS.admins, adminIDs);
    await ctx.reply(`✅ — <code>${remAdmin}</code> removed from admins.`, { parse_mode: 'HTML' });
  }

  // ── Premium add ───────────────────────────────────────────────
  else if (state === 'await_premium_add') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const parts = ctx.message.text.trim().split(/\s+/);
    if (parts.length !== 2) return ctx.reply('❌ Format: <code>USER_ID DAYS</code>', { parse_mode: 'HTML' });
    const [uid, daysStr] = parts;
    const days = parseInt(daysStr, 10);
    if (!/^\d+$/.test(uid))      return ctx.reply('❌ Invalid user ID — numbers only.');
    if (isNaN(days) || days < 1) return ctx.reply('❌ Days must be a positive number.');
    const expiry    = addPremium(uid, days);
    const formatted = moment(expiry).tz(TZ).format('DD MMM YYYY, hh:mm A');
    await ctx.reply(
      `✅ — Premium granted to <code>${uid}</code> for <b>${days}</b> day(s).\nExpires: <b>${formatted}</b> (${TZ})`,
      { parse_mode: 'HTML' }
    );
    try {
      await bot.telegram.sendMessage(Number(uid),
        `🎌 <b>〔 C！ 〕 Premium Activated!</b>\n\n` +
        `Duration: <b>${days} day(s)</b>\nExpires: <b>${formatted}</b> (${TZ})\n\n` +
        `⛩ Welcome to CENTIPEDE V4 premium`,
        { parse_mode: 'HTML' }
      );
    } catch (_) {}
  }

  // ── Premium remove ────────────────────────────────────────────
  else if (state === 'await_premium_remove') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const uid = ctx.message.text.trim();
    if (!premiumUsers.find(u => u.id === uid))
      return ctx.reply(`❌ <code>${uid}</code> has no active premium.`, { parse_mode: 'HTML' });
    removePremium(uid);
    await ctx.reply(`✅ — Premium removed from <code>${uid}</code>.`, { parse_mode: 'HTML' });
  }

  // ── Bank add ──────────────────────────────────────────────────
  else if (state === 'await_bank_add') {
    if (!isAdmin(userId)) return;
    delete userStates[userId];
    const parts = ctx.message.text.split('|').map(s => s.trim());
    if (parts.length !== 3)
      return ctx.reply('❌ Format:\n<code>BANK NAME | ACCOUNT NAME | ACCOUNT NUMBER</code>', { parse_mode: 'HTML' });
    const [bankName, accountName, accountNumber] = parts;
    if (!/^\d{6,20}$/.test(accountNumber)) return ctx.reply('❌ Account number must be 6–20 digits only.');
    const newBank = { id: genBankId(), bankName, accountName, accountNumber };
    banks.push(newBank);
    writeJSON(PATHS.banks, banks);
    await ctx.reply(
      `✅ <b>〔 口座追加完了 〕 Bank Added</b>\n\n🏦 ${esc(bankName)}\n👤 ${esc(accountName)}\n🔢 <code>${esc(accountNumber)}</code>`,
      { parse_mode: 'HTML' }
    );
    await showBankManagePanel(ctx, false);
  }
});

// ══════════════════════════════════════════════════════
//  PHOTO HANDLER  (Payment screenshots)
// ══════════════════════════════════════════════════════
bot.on('photo', async (ctx) => {
  if (!requireUser(ctx)) return;
  const userId = ctx.from.id;
  if (userStates[userId] !== 'await_payment_ss') return;
  delete userStates[userId];
  const flow = purchaseFlow[userId];
  delete purchaseFlow[userId];
  if (!adminIDs.length) return ctx.reply('❌ No admin available right now. Try again later.');
  const photo  = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const user   = ctx.from;
  const name   = esc([user.first_name, user.last_name].filter(Boolean).join(' '));
  const handle = user.username ? `@${esc(user.username)}` : 'no username';
  const pkg    = flow ? PACKAGES.find(p => p.id === flow.packageId) : null;
  const bank   = flow?.bankId ? banks.find(b => b.id === flow.bankId) : null;
  const caption =
    `💳 <b>〔 C 〕 New Payment Screenshot</b>\n\n` +
    `👤 User: <a href="tg://user?id=${userId}">${name}</a> (${handle})\n` +
    `🆔 ID: <code>${userId}</code>\n` +
    (pkg  ? `📦 Rank: <b>${pkg.label}</b> — ${pkg.price}\n` : '') +
    (bank ? `🏦 Bank: <b>${bank.bankName}</b> — <code>${bank.accountNumber}</code>\n` : '') +
    `\nTo activate:\n<code>/grant ${userId} ${pkg?.days || 'DAYS'}</code>`;
  await ctx.reply('✅ — Screenshot received! Admin will review and activate your rank shortly.');
  const sent = await notifyAdmins(ctx.telegram, 'sendPhoto', photo, { caption, parse_mode: 'HTML' });
  if (!sent) console.error('[payment] Could not deliver screenshot to any admin.');
});

// ══════════════════════════════════════════════════════
//  ERROR HANDLING
// ══════════════════════════════════════════════════════
bot.catch((err, ctx) => {
  console.error(chalk.red(`❌ Bot error [${ctx?.updateType || 'unknown'}]:`), err?.message || err);
  ctx?.reply?.('⚠️ — Something went wrong. Please try again.').catch(() => {});
});
process.on('uncaughtException',  err => console.error(chalk.red('❌ Uncaught Exception:'),  err));
process.on('unhandledRejection', err => console.error(chalk.red('❌ Unhandled Rejection:'), err));

// ══════════════════════════════════════════════════════
//  LAUNCH
// ══════════════════════════════════════════════════════
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log(chalk.bold.red('\n╔══════════════════════════════════════╗'));
  console.log(chalk.bold.red('║   ⛩   CENTIPEDE V4  |  起動完了   ⛩   ║'));
  console.log(chalk.bold.red('║    虚無を制す者が、世界を制す             ║'));
  console.log(chalk.bold.red('╚══════════════════════════════════════╝'));
  console.log(chalk.gray(`  Started: ${moment().tz(TZ).format('DD MMM YYYY HH:mm:ss')} (${TZ})`));
  console.log(chalk.gray(`  Dev: ${DEV_HANDLE}  |  Channel: ${CHANNEL}\n`));
  restoreOpenAccessIfActive(bot.telegram);
});
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Expose invite links so pairing.js can read them
module.exports = { GROUP_INVITE_LINKS };
