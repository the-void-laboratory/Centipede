const state = {
  selectedSession: null,
  page: 'home',
  selectedCommand: null,
};

const COMMANDS = [
  { id: "x-delay", label: "Private Delay", category: "Bug", description: "Send the delay bug to a private number.", alias: ["delay"], targetType: "private", template: "x-delay {{victim}}", fields: [
      { id: "victim", label: "Victim number", type: "text", placeholder: "2348032391634", help: "Enter the target number without + or @s.whatsapp.net.", required: true }
    ], example: "x-delay 2348032391634" },
  { id: "x-fc", label: "Private Crash", category: "Bug", description: "Send the private crash payload to a number.", alias: ["crash"], targetType: "private", template: "x-fc {{victim}}", fields: [
      { id: "victim", label: "Victim number", type: "text", placeholder: "2348032391634", help: "The number to target with the crash payload.", required: true }
    ], example: "x-fc 2348032391634" },
  { id: "x-blank", label: "Private Blank", category: "Bug", description: "Send the blank payload to a private number.", targetType: "private", template: "x-blank {{victim}}", fields: [
      { id: "victim", label: "Victim number", type: "text", placeholder: "2348032391634", help: "The number to target with the blank payload.", required: true }
    ], example: "x-blank 2348032391634" },
  { id: "x-ios", label: "iOS Crash", category: "Bug", description: "Send the iOS crash payload to a private number.", alias: ["ios"], targetType: "private", template: "x-ios {{victim}}", fields: [
      { id: "victim", label: "Victim number", type: "text", placeholder: "2348032391634", help: "The number to target with the iOS crash payload.", required: true }
    ], example: "x-ios 2348032391634" },
  { id: "delay-gc", label: "Group Delay", category: "Bug", description: "Execute the delay payload in a WhatsApp group.", targetType: "group", template: "delay-gc", example: "delay-gc" },
  { id: "x-gc", label: "Group Crash", category: "Bug", description: "Execute the group crash payload in a WhatsApp group.", targetType: "group", template: "x-gc", example: "x-gc" },
  { id: "antilink", label: "Antilink", category: "Group", description: "Turn antilink protection on or off in the group.", targetType: "group", template: "antilink {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose on or off to enable or disable antilink.", required: true, options: ["on", "off"] }
    ], example: "antilink on" },
  { id: "setgcname", label: "Set Group Name", category: "Group", description: "Rename the current group.", alias: ["setgroupname", "setsubject"], targetType: "group", template: "setgcname {{name}}", fields: [
      { id: "name", label: "New group name", type: "text", placeholder: "My Group Name", help: "Enter the new group name.", required: true }
    ], example: "setgcname My Group" },
  { id: "setgcdesc", label: "Set Group Description", category: "Group", description: "Update the group description.", alias: ["setdesk"], targetType: "group", template: "setgcdesc {{description}}", fields: [
      { id: "description", label: "Group description", type: "text", placeholder: "Group description here", help: "Enter the new group description.", required: true }
    ], example: "setgcdesc Welcome to the group!" },
  { id: "linkgroup", label: "Group Invite Link", category: "Group", description: "Get the current group invite link.", alias: ["linkgc", "gclink", "grouplink"], targetType: "group", template: "linkgroup", example: "linkgroup" },
  { id: "resetlinkgc", label: "Reset Group Link", category: "Group", description: "Reset the group invite link.", targetType: "group", template: "resetlinkgc", example: "resetlinkgc" },
  { id: "everyone", label: "Everyone Mention", category: "Group", description: "Mention everyone in the group.", targetType: "group", template: "everyone", example: "everyone" },
  { id: "groupjid", label: "Group JIDs", category: "Group", description: "List group JIDs for all members.", targetType: "group", template: "groupjid", example: "groupjid" },
  { id: "poll", label: "Create Poll", category: "Group", description: "Create a poll in the current group.", targetType: "group", template: "poll {{question}}|{{options}}", fields: [
      { id: "question", label: "Question", type: "text", placeholder: "Your poll question", help: "The poll question.", required: true },
      { id: "options", label: "Options", type: "text", placeholder: "Yes,No,Maybe", help: "Separate options with commas.", required: true }
    ], example: "poll Do you agree?|Yes,No,Maybe" },
  { id: "tag", label: "Tag", category: "Group", description: "Mention all members in the group.", targetType: "group", template: "tag", example: "tag" },
  { id: "totag", label: "Tag All (alt)", category: "Group", description: "Alternative tag-all command.", targetType: "group", template: "totag", example: "totag" },
  { id: "promote", label: "Promote User", category: "Group", description: "Promote a member to admin.", targetType: "group", template: "promote {{member}}", fields: [
      { id: "member", label: "Member number", type: "text", placeholder: "2348032391634", help: "The member number to promote.", required: true }
    ], example: "promote 2348032391634" },
  { id: "demote", label: "Demote User", category: "Group", description: "Demote an admin to member.", targetType: "group", template: "demote {{member}}", fields: [
      { id: "member", label: "Member number", type: "text", placeholder: "2348032391634", help: "The number to demote.", required: true }
    ], example: "demote 2348032391634" },
  { id: "mute", label: "Mute Group", category: "Group", description: "Enable admin-only sending in the group.", targetType: "group", template: "mute", example: "mute" },
  { id: "unmute", label: "Unmute Group", category: "Group", description: "Allow all members to send messages.", targetType: "group", template: "unmute", example: "unmute" },
  { id: "left", label: "Leave Group", category: "Group", description: "Make the bot leave the current group.", targetType: "group", template: "left", example: "left" },
  { id: "add", label: "Add Member", category: "Group", description: "Add a user to the group by number.", targetType: "group", template: "add {{member}}", fields: [
      { id: "member", label: "Member number", type: "text", placeholder: "2348032391634", help: "Enter the number to add.", required: true }
    ], example: "add 2348032391634" },
  { id: "kick", label: "Kick Member", category: "Group", description: "Remove a member from the group.", targetType: "group", template: "kick {{member}}", fields: [
      { id: "member", label: "Member number", type: "text", placeholder: "2348032391634", help: "Enter the number to kick.", required: true }
    ], example: "kick 2348032391634" },
  { id: "setppgroup", label: "Set Group Photo", category: "Group", description: "Update the group profile picture.", targetType: "group", unsupported: true, help: "Requires a replied image and cannot be executed from the browser UI.", example: "setppgroup (reply to image)" },
  { id: "join", label: "Join Group", category: "Group", description: "Join a group using an invite link.", targetType: "any", template: "join {{link}}", fields: [
      { id: "link", label: "Invite link", type: "text", placeholder: "https://chat.whatsapp.com/…", help: "The group invite link.", required: true }
    ], example: "join https://chat.whatsapp.com/ABC" },
  { id: "checkidch", label: "Check Channel ID", category: "Utility", description: "Extract a WhatsApp channel ID from a link.", alias: ["idch"], targetType: "any", template: "checkidch {{link}}", fields: [
      { id: "link", label: "Channel link", type: "text", placeholder: "https://www.whatsapp.com/channel/…", help: "Enter the channel link.", required: true }
    ], example: "checkidch https://www.whatsapp.com/channel/ABC" },
  { id: "getpp", label: "Get Profile Photo", category: "Utility", description: "Get a user's profile picture by number.", targetType: "private", template: "getpp {{number}}", fields: [
      { id: "number", label: "User number", type: "text", placeholder: "2348032391634", help: "The number whose profile photo you want.", required: true }
    ], example: "getpp 2348032391634" },
  { id: "play1", label: "Play Audio", category: "Media", description: "Download audio from a YouTube search.", targetType: "any", template: "play1 {{query}}", fields: [
      { id: "query", label: "Search query", type: "text", placeholder: "Lo-fi beats", help: "Enter the song or audio query.", required: true }
    ], example: "play1 lo-fi beats" },
  { id: "video", label: "Video Search", category: "Media", description: "Search for a video and return its result.", alias: ["vid"], targetType: "any", template: "video {{query}}", fields: [
      { id: "query", label: "Search query", type: "text", placeholder: "Funny video", help: "Enter the video search query.", required: true }
    ], example: "video funny cat" },
  { id: "play", label: "YouTube Play", category: "Media", description: "Search YouTube and play content.", alias: ["ytplay"], targetType: "any", template: "play {{query}}", fields: [
      { id: "query", label: "Search query", type: "text", placeholder: "Best rap songs", help: "Enter the search query.", required: true }
    ], example: "play Never gonna give you up" },
  { id: "brat", label: "Brat Sticker", category: "Media", description: "Create a sticker using text on the external Brat API.", targetType: "any", template: "brat {{text}}", fields: [
      { id: "text", label: "Sticker text", type: "text", placeholder: "Hello world", help: "Text to render on the sticker.", required: true }
    ], example: "brat Hello world" },
  { id: "get", label: "Fetch URL", category: "Utility", description: "Fetch a URL and return text or JSON.", targetType: "any", template: "get {{url}}", fields: [
      { id: "url", label: "URL", type: "text", placeholder: "https://example.com", help: "The URL to fetch.", required: true }
    ], example: "get https://example.com/api" },
  { id: "savenumber", label: "Save Number", category: "Utility", description: "Save a number with a label.", targetType: "any", template: "savenumber {{number}}|{{name}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "Enter the number to save.", required: true },
      { id: "name", label: "Label", type: "text", placeholder: "Friend", help: "Enter the display name.", required: true }
    ], example: "savenumber 2348032391634|Friend" },
  { id: "ban", label: "Ban User", category: "Admin", description: "Ban a user from the bot.", alias: ["banuser"], targetType: "any", template: "ban {{number}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "Enter the number to ban.", required: true }
    ], example: "ban 2348032391634" },
  { id: "unban", label: "Unban User", category: "Admin", description: "Unban a user.", alias: ["unbanuser"], targetType: "any", template: "unban {{number}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "Enter the number to unban.", required: true }
    ], example: "unban 2348032391634" },
  { id: "listban", label: "List Banned Users", category: "Admin", description: "Show the current banned users list.", alias: ["listbanuser"], targetType: "any", template: "listban", example: "listban" },
  { id: "broadcastimage", label: "Broadcast Image", category: "Media", description: "Broadcast a replied image or video to all groups.", targetType: "any", unsupported: true, help: "Requires a replied image or video; not supported from the browser UI.", example: "broadcastimage (reply to media)" },
  { id: "listonline", label: "List Online Members", category: "Admin", description: "Show online group presence.", targetType: "group", template: "listonline", example: "listonline" },
  { id: "tovn", label: "Text to Voice", category: "Media", description: "Convert text to voice (TTS).", targetType: "any", template: "tovn {{text}}", fields: [
      { id: "text", label: "Text", type: "text", placeholder: "Hello world", help: "Text to convert to voice.", required: true }
    ], example: "tovn Hello world" },
  { id: "qc", label: "Quote Card", category: "Media", description: "Generate a quote sticker from text.", targetType: "any", template: "qc {{text}}", fields: [
      { id: "text", label: "Quote text", type: "text", placeholder: "Believe in yourself", help: "Enter the quote text.", required: true }
    ], example: "qc Believe in yourself" },
  { id: "ai", label: "AI Chat", category: "AI", description: "Ask the bot an AI question.", targetType: "any", template: "ai {{question}}", fields: [
      { id: "question", label: "Question", type: "text", placeholder: "How are you?", help: "Enter your question.", required: true }
    ], example: "ai How are you?" },
  { id: "radiateai", label: "Radiate AI", category: "AI", description: "Ask the Radiate AI assistant a question.", targetType: "any", template: "radiateai {{question}}", fields: [
      { id: "question", label: "Question", type: "text", placeholder: "Explain this bot", help: "Enter your question.", required: true }
    ], example: "radiateai Explain this bot" },
  { id: "public", label: "Public Mode", category: "Admin", description: "Enable public bot mode.", targetType: "any", template: "public", example: "public" },
  { id: "private", label: "Private Mode", category: "Admin", description: "Enable private/self bot mode.", alias: ["self"], targetType: "any", template: "private", example: "private" },
  { id: "speedtest", label: "Speed Test", category: "Admin", description: "Run a speed test on the bot.", alias: ["speed"], targetType: "any", template: "speedtest", example: "speedtest" },
  { id: "ping", label: "Ping", category: "Admin", description: "Ping the bot for latency.", targetType: "any", template: "ping", example: "ping" },
  { id: "runtime", label: "Runtime", category: "Admin", description: "Show bot uptime.", alias: ["alive"], targetType: "any", template: "runtime", example: "runtime" },
  { id: "mygroups", label: "My Groups", category: "Admin", description: "List the groups the bot is in.", alias: ["grouplist"], targetType: "any", template: "mygroups", example: "mygroups" },
  { id: "autobio", label: "Auto Bio", category: "Admin", description: "Enable or disable automatic bio updates.", targetType: "any", template: "autobio {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autobio is on or off.", required: true, options: ["on", "off"] }
    ], example: "autobio on" },
  { id: "autoread", label: "Auto Read", category: "Admin", description: "Enable or disable automatic read receipts.", targetType: "any", template: "autoread {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autoread is on or off.", required: true, options: ["on", "off"] }
    ], example: "autoread on" },
  { id: "autolike", label: "Auto Like", category: "Admin", description: "Enable or disable automatic status likes.", targetType: "any", template: "autolike {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autolike is on or off.", required: true, options: ["on", "off"] }
    ], example: "autolike on" },
  { id: "autoreact", label: "Auto React", category: "Admin", description: "Enable or disable automatic reactions.", targetType: "any", template: "autoreact {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autoreact is on or off.", required: true, options: ["on", "off"] }
    ], example: "autoreact on" },
  { id: "creategc", label: "Create Group", category: "Admin", description: "Create a new WhatsApp group.", alias: ["creategroup"], targetType: "any", template: "creategc {{name}}", fields: [
      { id: "name", label: "Group name", type: "text", placeholder: "New group name", help: "The name of the new group.", required: true }
    ], example: "creategc Project Team" },
  { id: "delpair", label: "Delete Pair", category: "Admin", description: "Delete a paired WhatsApp session.", targetType: "any", template: "delpair {{session}}", fields: [
      { id: "session", label: "Session name", type: "text", placeholder: "session-123", help: "The paired session name to delete.", required: true }
    ], example: "delpair session-123" },
  { id: "addowner", label: "Add Owner", category: "Admin", description: "Add a bot owner by number.", alias: ["addown"], targetType: "any", template: "addowner {{number}}", fields: [
      { id: "number", label: "Owner number", type: "text", placeholder: "2348032391634", help: "The number to add as owner.", required: true }
    ], example: "addowner 2348032391634" },
  { id: "delowner", label: "Remove Owner", category: "Admin", description: "Remove a bot owner by number.", alias: ["delown"], targetType: "any", template: "delowner {{number}}", fields: [
      { id: "number", label: "Owner number", type: "text", placeholder: "2348032391634", help: "The number to remove as owner.", required: true }
    ], example: "delowner 2348032391634" },
  { id: "addpremium", label: "Grant Premium", category: "Admin", description: "Give premium access to a number.", alias: ["addprem"], targetType: "any", template: "addpremium {{number}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "The number to grant premium.", required: true }
    ], example: "addpremium 2348032391634" },
  { id: "delpremium", label: "Revoke Premium", category: "Admin", description: "Remove premium access from a number.", alias: ["delprem"], targetType: "any", template: "delpremium {{number}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "The number to remove premium.", required: true }
    ], example: "delpremium 2348032391634" },
  { id: "autobio", label: "Auto Bio", category: "Admin", description: "Enable or disable automatic bio updates.", targetType: "any", template: "autobio {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autobio is on or off.", required: true, options: ["on", "off"] }
    ], example: "autobio on" },
  { id: "autoread", label: "Auto Read", category: "Admin", description: "Enable or disable automatic message reads.", targetType: "any", template: "autoread {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autoread is on or off.", required: true, options: ["on", "off"] }
    ], example: "autoread on" },
  { id: "autolike", label: "Auto Like", category: "Admin", description: "Enable or disable automatic likes.", targetType: "any", template: "autolike {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autolike is on or off.", required: true, options: ["on", "off"] }
    ], example: "autolike on" },
  { id: "autoreact", label: "Auto React", category: "Admin", description: "Enable or disable automatic reactions.", targetType: "any", template: "autoreact {{state}}", fields: [
      { id: "state", label: "State", type: "select", placeholder: "on or off", help: "Choose whether autoreact is on or off.", required: true, options: ["on", "off"] }
    ], example: "autoreact on" },
  { id: "public", label: "Public Mode", category: "Admin", description: "Switch the bot to public mode.", targetType: "any", template: "public", example: "public" },
  { id: "private", label: "Private Mode", category: "Admin", description: "Switch the bot to private/self mode.", alias: ["self"], targetType: "any", template: "private", example: "private" },
  { id: "speedtest", label: "Speed Test", category: "Admin", description: "Check the bot speed.", alias: ["speed"], targetType: "any", template: "speedtest", example: "speedtest" },
  { id: "mypairs", label: "My Pairs", category: "Admin", description: "List paired sessions.", targetType: "any", template: "mypairs", example: "mypairs" },
  { id: "getcase", label: "Get Case", category: "Admin", description: "Show the current bug case.", targetType: "any", template: "getcase", example: "getcase" },
  { id: "clearbugs", label: "Clear Bugs", category: "Admin", description: "Clear stored bug state.", targetType: "any", template: "clearbugs", example: "clearbugs" },
  { id: "setname", label: "Set Bot Name", category: "Admin", description: "Set the bot profile name.", targetType: "any", template: "setname {{name}}", fields: [
      { id: "name", label: "Name", type: "text", placeholder: "Centipede Bot", help: "The new bot name.", required: true }
    ], example: "setname Centipede Bot" },
  { id: "setbio", label: "Set Bio", category: "Admin", description: "Set the bot bio/status.", targetType: "any", template: "setbio {{bio}}", fields: [
      { id: "bio", label: "Bio text", type: "text", placeholder: "Online and ready", help: "The new bot bio.", required: true }
    ], example: "setbio Online and ready" },
  { id: "getpp", label: "Get Profile Picture", category: "Utility", description: "Fetch a user's profile picture by number.", targetType: "private", template: "getpp {{number}}", fields: [
      { id: "number", label: "Number", type: "text", placeholder: "2348032391634", help: "Enter the number to fetch.", required: true }
    ], example: "getpp 2348032391634" },
  { id: "device", label: "Check Device", category: "Utility", description: "Detect a user's device from a replied message.", alias: ["checkdevice"], targetType: "any", unsupported: true, help: "Requires a reply and is not supported from the browser UI.", example: "checkdevice (reply to a message)" },
  { id: "tourl", label: "Media to URL", category: "Media", description: "Upload replied media and return a URL.", targetType: "any", unsupported: true, help: "Requires replied media and is not supported from the browser UI.", example: "tourl (reply to media)" },
  { id: "hd", label: "HD Image", category: "Media", description: "Enhance an image with Remini.", alias: ["remini"], targetType: "any", unsupported: true, help: "Requires a replied image and is not supported from the browser UI.", example: "hd (reply to image)" },
  { id: "vv", label: "Forward Media", category: "Media", description: "Forward replied media back to chat.", targetType: "any", unsupported: true, help: "Requires replied media and is not supported from the browser UI.", example: "vv (reply to media)" },
  { id: "sticker", label: "Create Sticker", category: "Media", description: "Create a sticker from replied media.", alias: ["s"], targetType: "any", unsupported: true, help: "Requires replied media and is not supported from the browser UI.", example: "sticker (reply to media)" },
  { id: "toimage", label: "Sticker to Image", category: "Media", description: "Convert a sticker into an image.", alias: ["toimg"], targetType: "any", unsupported: true, help: "Requires a replied sticker and is not supported from the browser UI.", example: "toimage (reply to sticker)" },
  { id: "setbotpp", label: "Set Bot Photo", category: "Media", description: "Change the bot profile picture from a replied image.", alias: ["setpp", "setppbot"], targetType: "any", unsupported: true, help: "Requires a replied image and is not supported from the browser UI.", example: "setbotpp (reply to image)" }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const sessionStatus = $('#active-sessions');
const sessionSelect = $('#session-select');
const pairNumber = $('#pair-number');
const pairSubmit = $('#pair-submit');
const pairingCode = $('#pairing-code');
const commandList = $('#command-list');
const commandSearch = $('#command-search');
const homeTarget = $('#home-target-input');
const homeCommand = $('#home-command-input');
const homeExecuteButton = $('#home-execute-button');
const homeResult = $('#home-execute-result');
const detailPage = $('#command-detail-page');
const detailTitle = $('#detail-title');
const detailDescription = $('#detail-description');
const detailCategory = $('#detail-category');
const detailTargetRow = $('#detail-target-row');
const detailTarget = $('#detail-target');
const detailTargetLabel = $('#detail-target-label');
const detailHelp = $('#detail-help');
const detailFields = $('#detail-fields');
const detailExtra = $('#detail-extra');
const detailCustom = $('#detail-custom');
const detailExecute = $('#detail-execute');
const detailResult = $('#detail-result');
const commandBack = $('#command-back');
const navButtons = $$('.nav-button');
const pages = $$('.page-section');

function showPage(page) {
  state.page = page;
  pages.forEach(section => section.classList.toggle('active', section.id === `${page}-page` || (page === 'home' && section.id === 'home-page')));
  navButtons.forEach(button => button.classList.toggle('active', button.dataset.page === page));
}

function formatCommandText(command) {
  return command.alias ? `${command.id} (${command.alias.join(', ')})` : command.id;
}

function findCommandFromText(text) {
  const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase();
  return COMMANDS.find(command =>
    command.id === firstWord || (command.alias || []).map(alias => alias.toLowerCase()).includes(firstWord)
  );
}

function setResult(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function createFieldInput(field) {
  if (field.type === 'select') {
    const select = document.createElement('select');
    select.id = field.id;
    select.innerHTML = [`<option value="">${field.placeholder || 'Select an option'}</option>`, ...(field.options || []).map(option => `<option value="${option}">${option}</option>`) ].join('');
    return select;
  }

  if (field.type === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.id = field.id;
    textarea.rows = field.rows || 3;
    textarea.placeholder = field.placeholder || '';
    textarea.value = field.default || '';
    return textarea;
  }

  const input = document.createElement('input');
  input.id = field.id;
  input.type = field.type || 'text';
  input.placeholder = field.placeholder || '';
  input.value = field.default || '';
  return input;
}

function renderCommandFields(command) {
  detailFields.innerHTML = '';
  if (!command.fields?.length) return;

  command.fields.forEach(field => {
    const row = document.createElement('div');
    row.className = 'input-row';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;
    row.appendChild(label);

    const control = createFieldInput(field);
    row.appendChild(control);

    if (field.help) {
      const help = document.createElement('p');
      help.className = 'helper-text';
      help.textContent = field.help;
      row.appendChild(help);
    }

    detailFields.appendChild(row);
  });
}

function buildCommandText(command) {
  let commandText = command.template || command.id;
  if (command.fields?.length) {
    const values = {};

    command.fields.forEach(field => {
      const element = document.getElementById(field.id);
      const value = element?.value.trim() || '';
      if (field.required && !value) {
        throw new Error(`${field.label} is required.`);
      }
      values[field.id] = value;
    });

    if (command.template) {
      Object.entries(values).forEach(([fieldId, fieldValue]) => {
        commandText = commandText.replace(new RegExp(`{{${fieldId}}}`, 'g'), fieldValue);
      });
    } else {
      const extraParts = Object.values(values).filter(Boolean);
      if (extraParts.length) {
        commandText = `${command.id} ${extraParts.join(' ')}`;
      }
    }
  }

  commandText = commandText.replace(/\s+/g, ' ').trim();
  const extra = detailExtra.value.trim();
  if (extra) commandText += ` ${extra}`;
  return commandText;
}

function renderCommandTiles(filter = '') {
  const query = filter.trim().toLowerCase();
  const visible = COMMANDS.filter(command => {
    const text = `${command.id} ${command.label} ${command.category} ${command.description} ${(command.alias || []).join(' ')}`.toLowerCase();
    return !query || text.includes(query);
  });

  const categories = [...new Set(visible.map(command => command.category))];
  commandList.innerHTML = categories.map(category => {
    const categoryCommands = visible.filter(command => command.category === category);
    return `
      <div class="command-category">
        <h3>${category}</h3>
        <div class="command-grid">
          ${categoryCommands.map(command => `
            <button class="command-card${command.unsupported ? ' unsupported' : ''}" data-command="${command.id}">
              <strong>${command.label}</strong>
              <span>${command.description}</span>
              <div class="command-meta-labels">
                <small>${command.category}</small>
                ${command.unsupported ? '<small class="unsupported-label">Reply/media only</small>' : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  $$('.command-card').forEach(button => {
    button.addEventListener('click', () => openCommandPage(button.dataset.command));
  });
}

function openCommandPage(commandId) {
  const command = COMMANDS.find(cmd => cmd.id === commandId);
  if (!command) return;
  state.selectedCommand = command;
  detailTitle.textContent = command.label;
  detailDescription.textContent = command.description;
  detailCategory.textContent = command.category;
  detailTarget.value = '';
  detailExtra.value = '';
  detailCustom.value = '';
  detailResult.textContent = '';
  detailResult.classList.remove('error');
  detailTargetRow.style.display = command.targetType === 'none' ? 'none' : 'block';
  detailTargetLabel.textContent = command.targetType === 'group'
    ? 'Group JID'
    : command.targetType === 'private'
      ? 'Phone number'
      : 'Target number or group JID';
  detailTarget.placeholder = command.targetType === 'group'
    ? '1234567890-123456@g.us'
    : '2348032391634 or 1234567890-123456@g.us';
  detailHelp.textContent = command.unsupported
    ? command.help || 'This command requires replied media or reply context and cannot be executed from the browser UI.'
    : (command.example ? `Example: ${command.example}` : 'Use custom text or fill the fields below.');
  detailCategory.textContent = command.category;
  detailCategory.classList.toggle('unsupported', !!command.unsupported);
  detailExecute.disabled = !!command.unsupported;
  renderCommandFields(command);
  showPage('command-detail');
}

async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Unable to fetch sessions');
    sessionStatus.textContent = `${data.sessions.length} active`;
    sessionSelect.innerHTML = '';
    data.sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session;
      option.textContent = session;
      sessionSelect.appendChild(option);
    });
    if (data.sessions.length) {
      state.selectedSession = data.sessions[0];
      sessionSelect.value = state.selectedSession;
    } else {
      state.selectedSession = null;
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No active session';
      sessionSelect.appendChild(option);
    }
  } catch (error) {
    sessionStatus.textContent = 'Error';
    console.error(error);
  }
}

async function postSend(body) {
  if (!state.selectedSession) {
    throw new Error('No active WhatsApp session selected');
  }
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: state.selectedSession, ...body }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Execution failed');
  return data;
}

function formatResult(message, success = true) {
  return message;
}

async function executeHomeCommand() {
  const target = homeTarget.value.trim();
  const command = homeCommand.value.trim();
  if (!command) {
    setResult(homeResult, 'Command text is required.', true);
    return;
  }

  const matchedCommand = findCommandFromText(command);
  const isGroupTarget = target.includes('@g.us');

  if (matchedCommand) {
    if (matchedCommand.unsupported) {
      setResult(homeResult, 'This command cannot be sent from the browser UI because it requires reply/media context.', true);
      return;
    }
    if (matchedCommand.targetType === 'group' && !isGroupTarget) {
      setResult(homeResult, 'A group JID is required for this command.', true);
      return;
    }
    if (matchedCommand.targetType === 'private' && !target) {
      setResult(homeResult, 'A private phone number is required for this command.', true);
      return;
    }
    if (matchedCommand.targetType === 'private' && isGroupTarget) {
      setResult(homeResult, 'This command requires a private phone number, not a group JID.', true);
      return;
    }
  }

  setResult(homeResult, 'Sending command...');
  try {
    const data = await postSend({
      target,
      command,
      mode: isGroupTarget ? 'group' : 'private',
      action: 'custom',
    });
    setResult(homeResult, `Executed ${data.command} via session ${data.session}.`);
  } catch (err) {
    setResult(homeResult, `Error: ${err.message}`, true);
  }
}

async function executeDetailCommand() {
  const command = state.selectedCommand;
  if (!command) return;
  const target = detailTarget.value.trim();
  const custom = detailCustom.value.trim();
  let commandText = custom;

  if (!commandText) {
    try {
      commandText = buildCommandText(command);
    } catch (err) {
      setResult(detailResult, `Error: ${err.message}`, true);
      return;
    }
  }

  if (command.unsupported) {
    setResult(detailResult, 'This command cannot be executed from the browser UI because it requires reply/media context.', true);
    return;
  }

  if (!commandText) {
    setResult(detailResult, 'Command text is required.', true);
    return;
  }

  if (command.targetType === 'group') {
    if (!target) {
      setResult(detailResult, 'A group JID is required for this command.', true);
      return;
    }
    if (!target.includes('@g.us')) {
      setResult(detailResult, 'Enter a valid group JID ending with @g.us.', true);
      return;
    }
  }

  if (command.targetType === 'private') {
    if (!target) {
      setResult(detailResult, 'A private phone number is required for this command.', true);
      return;
    }
    if (target.includes('@g.us')) {
      setResult(detailResult, 'This command requires a private phone number, not a group JID.', true);
      return;
    }
  }

  setResult(detailResult, 'Executing command...');
  try {
    const isGroupTarget = target.includes('@g.us');
    const data = await postSend({
      target,
      command: commandText,
      mode: command.targetType === 'group' || isGroupTarget ? 'group' : 'private',
      action: 'command',
    });
    setResult(detailResult, `Executed ${data.command}${target ? ` on ${target}` : ''}.`);
  } catch (err) {
    setResult(detailResult, `Error: ${err.message}`, true);
  }
}

async function generatePairingCode() {
  const number = pairNumber.value.trim();
  if (!number) {
    pairingCode.textContent = 'Enter a phone number first.';
    return;
  }
  pairingCode.textContent = 'Generating pairing code...';
  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Pairing failed');
    pairingCode.textContent = `Pairing code: ${data.code}`;
    await fetchSessions();
  } catch (err) {
    pairingCode.textContent = `Error: ${err.message}`;
  }
}

navButtons.forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

commandSearch.addEventListener('input', event => renderCommandTiles(event.target.value));
commandBack.addEventListener('click', () => showPage('commands'));
homeExecuteButton.addEventListener('click', executeHomeCommand);
detailExecute.addEventListener('click', executeDetailCommand);
pairSubmit.addEventListener('click', generatePairingCode);
sessionSelect.addEventListener('change', () => {
  if (sessionSelect.value) state.selectedSession = sessionSelect.value;
});

window.addEventListener('load', async () => {
  renderCommandTiles();
  await fetchSessions();
  showPage('home');
});
