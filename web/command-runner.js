const {
  addAudit,
  clearPremium,
  getSettings,
  getUser,
  isPremium,
  listAudit,
  listCommands,
  listUsers,
  sanitizeUsername,
  setAccessMode,
  setAnnouncement,
  setBio,
  setBotName,
  setFeature,
  setOwnerName,
  setPremium,
  setRole,
  updatePassword,
} = require('./store');

const SHOWCASE_COMMANDS = new Set([
  'bugmenu',
  'x-delay',
  'x-fc',
  'x-blank',
  'x-ios',
  'x-gc',
  'delay-gc',
  'clearbugs',
  'hijack',
]);

function normalizeCommand(input) {
  const text = String(input || '').trim();
  if (!text) return '';
  if (/^[!.,🐤🗿]/.test(text)) return text;
  return `.${text}`;
}

function stripPrefix(text) {
  return String(text || '').trim().replace(/^[!.,🐤🗿]/, '').trim();
}

function splitArgs(text) {
  const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
  return {
    name: (parts.shift() || '').toLowerCase(),
    args: parts,
  };
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const chunks = [];
  if (hours) chunks.push(`${hours}h`);
  if (minutes || hours) chunks.push(`${minutes}m`);
  chunks.push(`${seconds}s`);
  return chunks.join(' ');
}

function buildHelp() {
  return [
    'Available commands:',
    'ping - quick health check',
    'alive / runtime - show uptime',
    'help / menu - show this menu',
    'profile - show account details',
    'users - list web users',
    'premium - list premium users',
    'owners - list admin users',
    'logs - recent command logs',
    'audit - recent system actions',
    'status - show system settings',
    'public / private - switch access mode',
    'announce <text> - update the dashboard announcement',
    'grantpremium <user> <days> - grant premium time',
    'revokepremium <user> - remove premium',
    'makeadmin <user> - promote a user',
    'removeadmin <user> - demote an admin',
    'broadcast <text> - send an announcement to logs',
    'resetpass <user> <newpass> - reset a password',
    'setname <text> - rename the bot/web panel',
    'setbio <text> - update the displayed bio',
    'autobio on|off - toggle bio updates',
    'autoread on|off - toggle read status',
    'autolike on|off - toggle auto-like',
    'showcase commands are demo-only and do not send payloads',
  ].join('\n');
}

function canRunImmediately({ user, name }) {
  const safe = new Set(['ping', 'alive', 'runtime', 'help', 'menu', 'profile', 'status']);
  if (safe.has(name)) return true;
  if (name === 'users' || name === 'owners' || name === 'premium' || name === 'logs' || name === 'audit') return true;
  if (user.role === 'admin') return true;
  return false;
}

function summarizeUsers(role) {
  return listUsers()
    .filter((user) => (role ? user.role === role : true))
    .map((user) => {
      const premium = user.premiumUntil ? `, premium until ${new Date(user.premiumUntil).toLocaleString()}` : '';
      return `- ${user.username} (${user.role}${premium})`;
    })
    .join('\n') || 'No users found.';
}

function summarizeCommands(entries) {
  return entries
    .map((entry) => {
      const status = entry.status || 'unknown';
      const error = entry.error ? `, error: ${entry.error}` : '';
      return `- [${status}] ${entry.username}: ${entry.name}${error}`;
    })
    .join('\n') || 'No command history yet.';
}

function summarizeAudit(entries) {
  return entries
    .map((entry) => {
      const meta = Object.entries(entry)
        .filter(([key]) => !['id', 'type', 'createdAt'].includes(key))
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      return `- [${entry.type}] ${meta}`;
    })
    .join('\n') || 'No audit history yet.';
}

function buildContext(user, commandText) {
  const raw = String(commandText || '').trim();
  const stripped = stripPrefix(raw);
  const { name, args } = splitArgs(stripped);
  return {
    user,
    raw,
    name,
    args,
    settings: getSettings(),
    userRecord: getUser(user.username),
  };
}

function executeKnownCommand(ctx) {
  const { name, args, user, settings } = ctx;
  const featureOn = (key) => !!settings.features?.[key];

  switch (name) {
    case 'ping':
      return { output: 'Pong. The web panel is online.' };

    case 'speedtest':
    case 'speed':
      return { output: `Server is online. Uptime: ${formatDuration(process.uptime() * 1000)}.` };

    case 'alive':
    case 'runtime':
      return { output: `Server runtime: ${formatDuration(process.uptime() * 1000)}` };

    case 'help':
    case 'menu':
      return { output: buildHelp() };

    case 'profile': {
      const premium = ctx.userRecord?.premiumUntil
        ? `Premium until ${new Date(ctx.userRecord.premiumUntil).toLocaleString()}`
        : 'No premium access';
      return {
        output:
          `Username: ${user.username}\n` +
          `Role: ${user.role}\n` +
          `Access mode: ${settings.accessMode}\n` +
          `${premium}`,
      };
    }

    case 'status':
      return {
        output:
          `Access mode: ${settings.accessMode}\n` +
          `Announcement: ${settings.announcement || '(none)'}\n` +
          `Bot name: ${settings.botName}\n` +
          `Owner: ${settings.ownerName}\n` +
          `Bio: ${settings.bio}\n` +
          `Autoread: ${featureOn('autoread') ? 'on' : 'off'}\n` +
          `Autolike: ${featureOn('autolike') ? 'on' : 'off'}\n` +
          `Autobio: ${featureOn('autobio') ? 'on' : 'off'}\n` +
          `Total users: ${listUsers().length}\n` +
          `Total commands: ${listCommands(1_000).length}`,
      };

    case 'users':
      return { output: summarizeUsers() };

    case 'owners':
      return { output: summarizeUsers('admin') };

    case 'premium':
      return {
        output:
          listUsers()
            .filter((entry) => entry.premiumUntil && Date.now() < new Date(entry.premiumUntil).getTime())
            .map((entry) => `- ${entry.username} until ${new Date(entry.premiumUntil).toLocaleString()}`)
            .join('\n') || 'No premium users found.',
      };

    case 'logs':
      return { output: summarizeCommands(listCommands(25)) };

    case 'audit':
      return { output: summarizeAudit(listAudit(25)) };

    case 'public':
    case 'private':
      return { requiresApproval: true, output: `Request to set access mode to ${name}.` };

    case 'self':
      return { requiresApproval: true, output: 'Request to set access mode to private.' };

    case 'announce':
      return { requiresApproval: true, output: args.join(' ') || '(empty announcement)' };

    case 'setname':
      return { requiresApproval: true, output: args.join(' ') || '(empty bot name)' };

    case 'setbio':
      return { requiresApproval: true, output: args.join(' ') || '(empty bio)' };

    case 'autobio':
    case 'autoread':
    case 'autolike':
      return { requiresApproval: true, output: `${name} ${args.join(' ')}`.trim() };

    case 'grantpremium':
    case 'addpremium':
    case 'addprem':
      return { requiresApproval: true, output: `${args[0] || ''} ${args[1] || ''}`.trim() };

    case 'revokepremium':
    case 'delpremium':
    case 'delprem':
      return { requiresApproval: true, output: args[0] || '' };

    case 'makeadmin':
    case 'addowner':
    case 'addown':
      case 'removeadmin':
    case 'delowner':
    case 'delown':
      return { requiresApproval: true, output: args[0] || '' };

    case 'broadcast':
      return { requiresApproval: true, output: args.join(' ') || '(empty broadcast)' };

    case 'resetpass':
      return { requiresApproval: true, output: `${args[0] || ''}`.trim() };

    case 'bugmenu':
    case 'x-delay':
    case 'x-fc':
    case 'x-blank':
    case 'x-ios':
    case 'x-gc':
    case 'delay-gc':
    case 'clearbugs':
    case 'hijack':
      return {
        requiresApproval: true,
        output: `Showcase preview for ${name} (demo only, no action will be taken).`,
      };

    default:
      return { output: `Unknown command: ${name}. Try "help".` };
  }
}

function applyAction(ctx, result) {
  const { name, args, user } = ctx;

  switch (name) {
    case 'public':
      setAccessMode('public');
      return { output: 'Access mode switched to public.' };

    case 'private':
    case 'self':
      setAccessMode('private');
      return { output: 'Access mode switched to private.' };

    case 'announce':
      return { output: `Announcement updated:\n${setAnnouncement(args.join(' ')) || '(empty)'}` };

    case 'setname':
      return { output: `Bot name updated to ${setBotName(args.join(' ')) || '(empty)'}.` };

    case 'setbio':
      return { output: `Bio updated to ${setBio(args.join(' ')) || '(empty)'}.` };

    case 'autobio':
    case 'autoread':
    case 'autolike': {
      const enabled = String(args[0] || '').toLowerCase() === 'on';
      setFeature(name, enabled);
      return { output: `${name} ${enabled ? 'enabled' : 'disabled'}.` };
    }

    case 'grantpremium': {
      const target = sanitizeUsername(args[0]);
      const days = Number(args[1]);
      if (!target || !days || days < 1) throw new Error('Usage: grantpremium <username> <days>');
      const until = setPremium(target, days);
      return { output: `Premium granted to ${target} until ${new Date(until).toLocaleString()}.` };
    }

    case 'revokepremium': {
      const target = sanitizeUsername(args[0]);
      if (!target) throw new Error('Usage: revokepremium <username>');
      clearPremium(target);
      return { output: `Premium revoked for ${target}.` };
    }

    case 'makeadmin': {
      const target = sanitizeUsername(args[0]);
      if (!target) throw new Error('Usage: makeadmin <username>');
      setRole(target, 'admin');
      return { output: `${target} is now an admin.` };
    }

    case 'removeadmin': {
      const target = sanitizeUsername(args[0]);
      if (!target) throw new Error('Usage: removeadmin <username>');
      if (sanitizeUsername(user.username) === target) throw new Error('Use the admin page to change your own role.');
      setRole(target, 'user');
      return { output: `${target} is no longer an admin.` };
    }

    case 'addowner': {
      const target = sanitizeUsername(args[0]);
      if (!target) throw new Error('Usage: addowner <username>');
      setRole(target, 'admin');
      return { output: `${target} promoted to owner/admin.` };
    }

    case 'delowner': {
      const target = sanitizeUsername(args[0]);
      if (!target) throw new Error('Usage: delowner <username>');
      if (sanitizeUsername(user.username) === target) throw new Error('Use the admin page to change your own role.');
      setRole(target, 'user');
      return { output: `${target} removed from owner/admin.` };
    }

    case 'broadcast':
      setAnnouncement(args.join(' '));
      addAudit('broadcast_sent', { username: user.username, message: args.join(' ') });
      return { output: 'Broadcast published to the dashboard announcement.' };

    case 'resetpass':
      if (!args[0] || !args[1]) throw new Error('Usage: resetpass <username> <newpass>');
      updatePassword(sanitizeUsername(args[0]), args[1]);
      return { output: `Password updated for ${sanitizeUsername(args[0])}.` };

    case 'bugmenu':
    case 'x-delay':
    case 'x-fc':
    case 'x-blank':
    case 'x-ios':
    case 'x-gc':
    case 'delay-gc':
    case 'clearbugs':
    case 'hijack':
      addAudit('showcase_preview', { username: user.username, command: name });
      return { output: `Showcase ${name} preview recorded. No payload was sent.` };

    default:
      return result;
  }
}

async function runWebCommand({ username, commandText }) {
  const user = getUser(username);
  if (!user) throw new Error('User not found.');

  const normalizedCommand = normalizeCommand(commandText);
  if (!normalizedCommand) throw new Error('Please enter a command.');

  const ctx = buildContext(user, normalizedCommand);
  const result = executeKnownCommand(ctx);

  const entry = {
    username: user.username,
    role: user.role,
    name: ctx.name,
    raw: ctx.raw,
    args: ctx.args,
    status: 'executed',
    output: result.output || '',
    error: null,
    category: result.requiresApproval && user.role !== 'admin' ? 'approval_required' : 'standard',
  };

  if (result.requiresApproval && user.role !== 'admin') {
    entry.status = 'pending';
    entry.category = 'approval_required';
    entry.output = result.output || '';
    return {
      command: normalizedCommand,
      status: 'pending',
      requiresApproval: true,
      outputs: [{ kind: 'text', text: `Queued for approval: ${ctx.name}` }],
      error: null,
      commandEntry: entry,
    };
  }

  const applied = applyAction(ctx, result);
  entry.output = applied.output || result.output || '';
  const commandRecord = {
    ...entry,
    status: 'executed',
    approvedBy: user.role === 'admin' ? user.username : null,
    executedAt: new Date().toISOString(),
  };

  return {
    command: normalizedCommand,
    status: 'executed',
    requiresApproval: false,
    outputs: [{ kind: 'text', text: applied.output || result.output || 'Command complete.' }],
    error: null,
    commandEntry: commandRecord,
  };
}

function resolvePendingCommand(commandRecord, actorUsername) {
  const user = getUser(commandRecord.username);
  if (!user) throw new Error('Original user no longer exists.');
  const ctx = buildContext(user, commandRecord.raw.startsWith('.') ? commandRecord.raw : `.${commandRecord.raw}`);
  const result = executeKnownCommand(ctx);
  const applied = applyAction(ctx, result);

  return {
    status: 'executed',
    approvedBy: actorUsername,
    output: applied.output || result.output || '',
    error: null,
    executedAt: new Date().toISOString(),
  };
}

module.exports = {
  normalizeCommand,
  resolvePendingCommand,
  runWebCommand,
};
