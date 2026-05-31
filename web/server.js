const http = require('http');
const querystring = require('querystring');
const { URL } = require('url');
const {
  addCommand,
  authenticate,
  createSession,
  createUser,
  deleteUser,
  destroySession,
  getCommand,
  getSession,
  getSettings,
  listAudit,
  listCommands,
  listPendingCommands,
  listUsers,
  sanitizeUsername,
  setAccessMode,
  setAnnouncement,
  updateCommand,
  updatePassword,
  updateUser,
} = require('./store');
const { resolvePendingCommand, runWebCommand } = require('./command-runner');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, ...rawVal] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawVal.join('=') || '');
    return acc;
  }, {});
}

function getAuthUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = getSession(cookies.web_session);
  return session ? session.user : null;
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    ...headers,
  });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function flashMessage(urlObj) {
  return urlObj.searchParams.get('msg') || '';
}

function layout({ title, user, active, body, notice = '', admin = false }) {
  const nav = user
    ? [
        ['dashboard', '/app', 'Dashboard'],
        ['commands', '/app?view=commands', 'Commands'],
        ...(admin ? [['admin', '/admin', 'Admin']] : []),
        ['logout', '/logout', 'Logout'],
      ]
    : [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --bg2: #0f1d33;
      --panel: rgba(10, 18, 32, 0.82);
      --panel-border: rgba(148, 163, 184, 0.16);
      --text: #e5eefc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-2: #22c55e;
      --danger: #fb7185;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
      --radius: 22px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.25), transparent 30%),
        radial-gradient(circle at top right, rgba(34, 197, 94, 0.15), transparent 28%),
        linear-gradient(160deg, var(--bg), var(--bg2));
      color: var(--text);
      min-height: 100vh;
    }
    .wrap {
      width: min(1220px, calc(100% - 28px));
      margin: 0 auto;
      padding: 28px 0 42px;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 18px 22px;
      border: 1px solid var(--panel-border);
      background: rgba(6, 10, 20, 0.55);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      box-shadow: var(--shadow);
      margin-bottom: 22px;
    }
    .brand { display: flex; flex-direction: column; gap: 2px; }
    .brand strong { font-size: 1.08rem; letter-spacing: 0.04em; }
    .brand span { color: var(--muted); font-size: 0.92rem; }
    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.09);
      border: 1px solid var(--panel-border);
      color: var(--text);
      text-decoration: none;
      font-size: 0.94rem;
    }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 22px;
    }
    .nav a {
      text-decoration: none;
      color: var(--text);
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid var(--panel-border);
      background: rgba(148, 163, 184, 0.07);
    }
    .nav a.active {
      background: linear-gradient(135deg, rgba(56,189,248,0.25), rgba(34,197,94,0.16));
      border-color: rgba(56,189,248,0.35);
    }
    .hero { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 18px; margin-bottom: 18px; }
    .panel {
      border: 1px solid var(--panel-border);
      background: var(--panel);
      backdrop-filter: blur(18px);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .pad { padding: 22px; }
    h1, h2, h3 { margin: 0 0 12px; line-height: 1.1; }
    h1 { font-size: clamp(2rem, 4vw, 3.2rem); }
    h2 { font-size: 1.3rem; }
    p { color: var(--muted); line-height: 1.65; margin: 0 0 14px; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .stat, .card {
      padding: 14px;
      border-radius: 18px;
      background: rgba(148, 163, 184, 0.08);
      border: 1px solid var(--panel-border);
    }
    .stat strong, .card strong { display: block; margin-bottom: 4px; }
    .stat span, .muted { color: var(--muted); font-size: 0.9rem; }
    form { display: grid; gap: 14px; }
    label { font-size: 0.94rem; color: var(--muted); display: grid; gap: 8px; }
    input, textarea, select {
      width: 100%;
      border-radius: 16px;
      border: 1px solid rgba(148,163,184,0.22);
      background: rgba(2, 6, 23, 0.55);
      color: var(--text);
      padding: 14px 16px;
      font: inherit;
      outline: none;
    }
    textarea { min-height: 130px; resize: vertical; }
    input:focus, textarea:focus, select:focus {
      border-color: rgba(56,189,248,0.65);
      box-shadow: 0 0 0 3px rgba(56,189,248,0.14);
    }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    button, .button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      padding: 13px 18px;
      background: linear-gradient(135deg, var(--accent), #0ea5e9);
      color: #00111f;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .button.secondary {
      background: rgba(148,163,184,0.12);
      color: var(--text);
      border: 1px solid var(--panel-border);
    }
    .button.danger, button.danger {
      background: linear-gradient(135deg, #fb7185, #f43f5e);
      color: #fff;
    }
    .notice {
      padding: 14px 16px;
      border-radius: 16px;
      margin-bottom: 16px;
      border: 1px solid rgba(56, 189, 248, 0.22);
      background: rgba(56, 189, 248, 0.12);
      color: var(--text);
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 18px;
    }
    .table th, .table td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid rgba(148,163,184,0.12);
      vertical-align: top;
    }
    .table th { color: var(--muted); font-weight: 600; }
    code {
      background: rgba(148,163,184,0.13);
      padding: 2px 6px;
      border-radius: 8px;
    }
    .list { display: grid; gap: 12px; margin-top: 14px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(34,197,94,0.16);
      color: #86efac;
      font-size: 0.8rem;
      margin-left: 8px;
    }
    .badge.warn { background: rgba(56,189,248,0.16); color: #7dd3fc; }
    .badge.err { background: rgba(251,113,133,0.16); color: #fda4af; }
    .split { display: grid; gap: 18px; }
    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .footer {
      margin-top: 18px;
      color: var(--muted);
      font-size: 0.92rem;
      text-align: center;
    }
    @media (max-width: 920px) {
      .hero, .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .topbar { border-radius: 24px; flex-direction: column; align-items: flex-start; }
      .wrap { width: min(100% - 16px, 1220px); }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <strong>Centipede Web Panel</strong>
        <span>Browser-first access with user accounts, approvals, and command logs.</span>
      </div>
      ${user ? `<div class="user-pill">Signed in as <strong>${escapeHtml(user.username)}</strong></div>` : '<div class="user-pill">Access portal</div>'}
    </div>
    ${user ? `<div class="nav">${nav.map(([key, href, label]) => `<a class="${active === key ? 'active' : ''}" href="${href}">${escapeHtml(label)}</a>`).join('')}</div>` : ''}
    ${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ''}
    ${body}
    <div class="footer">Simple web-first control panel for the bot system.</div>
  </div>
</body>
</html>`;
}

function loginPage(message = '') {
  return layout({
    title: 'Centipede Login',
    body: `
      <div class="hero">
        <div class="panel pad">
          <h1>Manage everything from the web</h1>
          <p>Users sign in with the username and password you create for them. They run commands from the browser, and sensitive actions can wait for approval.</p>
          <div class="stats">
            <div class="stat"><strong>User accounts</strong><span>Admin-created access with password hashes.</span></div>
            <div class="stat"><strong>Approval queue</strong><span>Review risky commands before they run.</span></div>
            <div class="stat"><strong>Logs and audit</strong><span>See activity and system changes in one place.</span></div>
          </div>
        </div>
        <div class="panel pad">
          <h2>Sign in</h2>
          <p>Use your assigned credentials to open the dashboard.</p>
          <form method="post" action="/login">
            <label>Username
              <input name="username" autocomplete="username" required placeholder="username" />
            </label>
            <label>Password
              <input name="password" type="password" autocomplete="current-password" required placeholder="password" />
            </label>
            <div class="actions">
              <button type="submit">Enter dashboard</button>
            </div>
          </form>
        </div>
      </div>
    `,
    notice: message,
  });
}

function renderCommandCard(entry) {
  return `
    <div class="card">
      <div class="section-title">
        <strong>${escapeHtml(entry.username)} <span class="muted">(${escapeHtml(entry.role)})</span></strong>
        <span class="badge ${entry.status === 'pending' ? 'warn' : entry.status === 'rejected' ? 'err' : ''}">${escapeHtml(entry.status)}</span>
      </div>
      <div class="muted">${escapeHtml(entry.raw || entry.name || '')}</div>
      ${entry.output ? `<p>${escapeHtml(entry.output)}</p>` : ''}
      ${entry.error ? `<p class="badge err">${escapeHtml(entry.error)}</p>` : ''}
      <div class="muted">${escapeHtml(new Date(entry.createdAt).toLocaleString())}</div>
    </div>
  `;
}

function userDashboard({ user, message = '', view = 'home', prefill = '', commandResult = null }) {
  const settings = getSettings();
  const recentCommands = listCommands(15).filter((entry) => entry.username === user.username);

  return layout({
    title: 'Centipede Dashboard',
    user,
    active: view === 'commands' ? 'commands' : 'dashboard',
    admin: user.role === 'admin',
    notice: message,
    body: `
      <div class="hero">
        <div class="panel pad">
          <h1>Dashboard</h1>
          <p>${escapeHtml(settings.announcement || 'Welcome.')}</p>
          <div class="grid-3">
            <div class="stat"><strong>${escapeHtml(user.role)}</strong><span>Current role</span></div>
            <div class="stat"><strong>${escapeHtml(settings.accessMode)}</strong><span>Access mode</span></div>
            <div class="stat"><strong>${recentCommands.length}</strong><span>Your recent commands</span></div>
          </div>
        </div>
        <div class="panel pad">
          <h2>Run a command</h2>
          <p>Safe commands run instantly. Sensitive ones are queued for approval.</p>
          <form method="post" action="/command">
            <label>Command
              <textarea name="command" required placeholder=".ping or help">${escapeHtml(prefill)}</textarea>
            </label>
            <div class="actions">
              <button type="submit">Run command</button>
              <a class="button secondary" href="/app?view=commands&prefill=ping">Try ping</a>
            </div>
          </form>
        </div>
      </div>

      ${commandResult ? `
        <div class="panel pad" style="margin-bottom: 18px;">
          <div class="section-title">
            <h2>Last result</h2>
            <span class="badge ${commandResult.error ? 'err' : 'warn'}">${escapeHtml(commandResult.status || 'done')}</span>
          </div>
          ${commandResult.outputs?.length
            ? `<div class="list">${commandResult.outputs.map((item) => `<div class="card"><strong>${escapeHtml(item.kind)}</strong><p>${escapeHtml(item.text || '')}</p></div>`).join('')}</div>`
            : '<p class="muted">No visible output.</p>'}
          ${commandResult.error ? `<p class="badge err">${escapeHtml(commandResult.error)}</p>` : ''}
        </div>
      ` : ''}

      <div class="panel pad">
        <div class="section-title">
          <h2>Your recent commands</h2>
          <a class="button secondary" href="/app?view=commands">See all</a>
        </div>
        <div class="list">
          ${recentCommands.length ? recentCommands.map(renderCommandCard).join('') : '<p class="muted">No command history yet.</p>'}
        </div>
      </div>
    `,
  });
}

function adminDashboard({ user, message = '' }) {
  const users = listUsers();
  const pending = listPendingCommands();
  const commands = listCommands(20);
  const audit = listAudit(20);
  const settings = getSettings();

  return layout({
    title: 'Centipede Admin',
    user,
    active: 'admin',
    admin: true,
    notice: message,
    body: `
      <div class="hero">
        <div class="panel pad">
          <div class="section-title">
            <h1>Admin console</h1>
            <span class="badge warn">${escapeHtml(settings.accessMode)}</span>
          </div>
          <p>Create users, change roles, manage premium access, and review pending commands before they execute.</p>
          <form method="post" action="/admin/settings">
            <div class="grid-2">
              <label>Access mode
                <select name="accessMode">
                  <option value="private" ${settings.accessMode === 'private' ? 'selected' : ''}>Private</option>
                  <option value="public" ${settings.accessMode === 'public' ? 'selected' : ''}>Public</option>
                </select>
              </label>
              <label>Announcement
                <input name="announcement" value="${escapeHtml(settings.announcement || '')}" placeholder="Dashboard message" />
              </label>
            </div>
            <div class="actions">
              <button type="submit">Save settings</button>
            </div>
          </form>
        </div>
        <div class="panel pad">
          <h2>Create user</h2>
          <form method="post" action="/admin/users">
            <div class="grid-2">
              <label>Username
                <input name="username" required placeholder="newuser" />
              </label>
              <label>Password
                <input name="password" type="password" required placeholder="temporary password" />
              </label>
            </div>
            <div class="grid-2">
              <label>Role
                <select name="role">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>Premium days
                <input name="premiumDays" type="number" min="0" placeholder="0" />
              </label>
            </div>
            <div class="actions">
              <button type="submit">Create account</button>
            </div>
          </form>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel pad">
          <div class="section-title">
            <h2>Users</h2>
            <span class="badge">${users.length}</span>
          </div>
          <div class="list">
            ${users.map((entry) => `
              <div class="card">
                <div class="section-title">
                  <strong>${escapeHtml(entry.username)}</strong>
                  <span class="badge ${entry.role === 'admin' ? 'warn' : ''}">${escapeHtml(entry.role)}</span>
                </div>
                <div class="muted">${entry.premiumUntil ? `Premium until ${escapeHtml(new Date(entry.premiumUntil).toLocaleString())}` : 'No premium'}</div>
                <div class="muted">Created ${escapeHtml(new Date(entry.createdAt).toLocaleString())}</div>
                <div class="actions" style="margin-top:12px;">
                  <form method="post" action="/admin/users/update">
                    <input type="hidden" name="username" value="${escapeHtml(entry.username)}" />
                    <label style="margin:0; min-width: 140px;">Role
                      <select name="role">
                        <option value="user" ${entry.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${entry.role === 'admin' ? 'selected' : ''}>Admin</option>
                      </select>
                    </label>
                    <button type="submit">Update</button>
                  </form>
                  <form method="post" action="/admin/users/reset">
                    <input type="hidden" name="username" value="${escapeHtml(entry.username)}" />
                    <input name="password" type="password" placeholder="new password" required />
                    <button type="submit">Reset pass</button>
                  </form>
                  <form method="post" action="/admin/users/delete" onsubmit="return confirm('Delete ${escapeHtml(entry.username)}?');">
                    <input type="hidden" name="username" value="${escapeHtml(entry.username)}" />
                    <button class="danger" type="submit">Delete</button>
                  </form>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="panel pad">
          <div class="section-title">
            <h2>Pending approvals</h2>
            <span class="badge warn">${pending.length}</span>
          </div>
          <div class="list">
            ${pending.length ? pending.map((entry) => `
              <div class="card">
                <div class="section-title">
                  <strong>${escapeHtml(entry.username)}</strong>
                  <span class="badge warn">${escapeHtml(entry.name)}</span>
                </div>
                <div class="muted">${escapeHtml(entry.raw || '')}</div>
                <div class="actions" style="margin-top:12px;">
                  <form method="post" action="/admin/commands/approve">
                    <input type="hidden" name="id" value="${escapeHtml(entry.id)}" />
                    <button type="submit">Approve</button>
                  </form>
                  <form method="post" action="/admin/commands/reject">
                    <input type="hidden" name="id" value="${escapeHtml(entry.id)}" />
                    <button class="danger" type="submit">Reject</button>
                  </form>
                </div>
              </div>
            `).join('') : '<p class="muted">Nothing is waiting for approval.</p>'}
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel pad">
          <div class="section-title">
            <h2>Recent commands</h2>
            <span class="badge">${commands.length}</span>
          </div>
          <div class="list">
            ${commands.map(renderCommandCard).join('')}
          </div>
        </div>
        <div class="panel pad">
          <div class="section-title">
            <h2>Audit log</h2>
            <span class="badge warn">${audit.length}</span>
          </div>
          <div class="list">
            ${audit.map((entry) => `
              <div class="card">
                <strong>${escapeHtml(entry.type)}</strong>
                <div class="muted">${escapeHtml(new Date(entry.createdAt).toLocaleString())}</div>
                <div>${escapeHtml(Object.entries(entry).filter(([key]) => !['id', 'type', 'createdAt'].includes(key)).map(([key, value]) => `${key}=${value}`).join(', ') || 'No details')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,
  });
}

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const user = getAuthUser(req);
    const message = flashMessage(urlObj);

    if (req.method === 'GET' && urlObj.pathname === '/') {
      return user ? redirect(res, user.role === 'admin' ? '/admin' : '/app') : send(res, 200, loginPage(message));
    }

    if (req.method === 'POST' && urlObj.pathname === '/login') {
      const body = querystring.parse(await readBody(req));
      const username = sanitizeUsername(body.username);
      const password = String(body.password || '');
      const account = authenticate(username, password);
      if (!account) return send(res, 401, loginPage('Invalid username or password.'));

      const token = createSession(account.username);
      res.setHeader('Set-Cookie', `web_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`);
      return redirect(res, account.role === 'admin' ? '/admin' : '/app');
    }

    if (req.method === 'GET' && urlObj.pathname === '/app') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      return send(res, 200, userDashboard({ user, message, view: urlObj.searchParams.get('view') || 'home', prefill: urlObj.searchParams.get('prefill') || '' }));
    }

    if (req.method === 'POST' && urlObj.pathname === '/command') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      const body = querystring.parse(await readBody(req));

      try {
        const result = await runWebCommand({ username: user.username, commandText: body.command });
        const entry = addCommand(result.commandEntry);
        if (result.status === 'pending') {
          return redirect(res, `/app?msg=${encodeURIComponent(`Queued for approval: ${entry.name}`)}`);
        }
        return send(res, 200, userDashboard({
          user,
          message: 'Command executed.',
          view: 'home',
          prefill: '',
          commandResult: result,
        }));
      } catch (err) {
        addCommand({
          username: user.username,
          role: user.role,
          name: 'error',
          raw: String(body.command || ''),
          args: [],
          status: 'rejected',
          output: '',
          error: err.message,
          category: 'error',
        });
        return send(res, 500, userDashboard({
          user,
          message: err.message,
          view: 'home',
          prefill: String(body.command || ''),
          commandResult: {
            status: 'error',
            outputs: [],
            error: err.message,
          },
        }));
      }
    }

    if (req.method === 'GET' && urlObj.pathname === '/admin') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, layout({ title: 'Forbidden', user, active: 'dashboard', body: '<div class="panel pad"><h1>Forbidden</h1><p>You do not have permission to open this page.</p></div>' }));
      return send(res, 200, adminDashboard({ user, message }));
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/settings') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        setAccessMode(String(body.accessMode || 'private'));
        setAnnouncement(String(body.announcement || ''));
        return redirect(res, '/admin?msg=' + encodeURIComponent('Settings updated.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/users') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        createUser({
          username: body.username,
          password: body.password,
          role: body.role,
          premiumUntil: null,
          createdBy: user.username,
        });
        const premiumDays = Number(body.premiumDays || 0);
        if (premiumDays > 0) {
          updateUser(sanitizeUsername(body.username), {
            premiumUntil: new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        return redirect(res, '/admin?msg=' + encodeURIComponent(`Created ${sanitizeUsername(body.username)}.`));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/users/update') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        updateUser(sanitizeUsername(body.username), { role: body.role });
        return redirect(res, '/admin?msg=' + encodeURIComponent('User updated.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/users/reset') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        updatePassword(sanitizeUsername(body.username), body.password);
        return redirect(res, '/admin?msg=' + encodeURIComponent('Password reset.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/users/delete') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        deleteUser(sanitizeUsername(body.username));
        return redirect(res, '/admin?msg=' + encodeURIComponent('User deleted.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/commands/approve') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        const cmd = getCommand(body.id);
        if (!cmd) throw new Error('Command not found.');
        if (cmd.status !== 'pending') throw new Error('Command is not pending.');
        const executed = resolvePendingCommand(cmd, user.username);
        updateCommand(cmd.id, {
          ...executed,
          status: 'executed',
          output: executed.output,
          error: null,
        });
        return redirect(res, '/admin?msg=' + encodeURIComponent('Command approved and executed.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/admin/commands/reject') {
      if (!user) return redirect(res, '/?msg=' + encodeURIComponent('Please sign in first.'));
      if (user.role !== 'admin') return send(res, 403, 'Forbidden');
      const body = querystring.parse(await readBody(req));
      try {
        const cmd = getCommand(body.id);
        if (!cmd) throw new Error('Command not found.');
        updateCommand(cmd.id, {
          status: 'rejected',
          rejectedBy: user.username,
          error: 'Rejected by admin',
        });
        return redirect(res, '/admin?msg=' + encodeURIComponent('Command rejected.'));
      } catch (err) {
        return redirect(res, '/admin?msg=' + encodeURIComponent(err.message));
      }
    }

    if (req.method === 'GET' && urlObj.pathname === '/logout') {
      const cookies = parseCookies(req.headers.cookie || '');
      if (cookies.web_session) destroySession(cookies.web_session);
      res.setHeader('Set-Cookie', 'web_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
      return redirect(res, '/?msg=' + encodeURIComponent('You are signed out.'));
    }

    send(res, 404, layout({
      title: 'Not found',
      user,
      active: 'dashboard',
      admin: user?.role === 'admin',
      body: '<div class="panel pad"><h1>404</h1><p>This page does not exist.</p></div>',
    }));
  });

  await new Promise((resolve) => server.listen(PORT, HOST, resolve));
  console.log(`[web] server listening on http://${HOST}:${PORT}`);
  return server;
}

module.exports = { startServer };
