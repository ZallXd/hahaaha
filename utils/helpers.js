const fs = require("fs");
const path = require("path");

// Load JSON dari file
function loadJSON(fileName, defaultValue = {}) {
  const filePath = path.join(__dirname, '../storage', fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch {
    return defaultValue;
  }
}

// Simpan data ke file JSON
function saveJSON(fileName, data) {
  const filePath = path.join(__dirname, '../storage', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Cek apakah pesan mengandung link grup WhatsApp
function containsGroupLink(message, linkPatterns) {
  const texts = [];

  if (message?.conversation) texts.push(message.conversation);
  if (message?.extendedTextMessage?.text) texts.push(message.extendedTextMessage.text);
  if (message?.imageMessage?.caption) texts.push(message.imageMessage.caption);
  if (message?.videoMessage?.caption) texts.push(message.videoMessage.caption);
  if (message?.pollCreationMessage?.name) texts.push(message.pollCreationMessage.name);
  if (message?.pollCreationMessage?.options?.length) {
    message.pollCreationMessage.options.forEach(o => {
      if (o.optionName) texts.push(o.optionName);
    });
  }

  return texts.some(t => linkPatterns.some(p => p.test(t)));
}

// Format nomor WhatsApp ke JID
function formatPhoneNumber(num) {
  let number = num.replace(/\D/g, '');
  if (number.startsWith('0')) {
    number = '62' + number.slice(1);
  } else if (!number.startsWith('62')) {
    number = '62' + number;
  }
  return number + '@s.whatsapp.net';
}

// Ekstrak ID grup dari link undangan
async function extractGroupJidFromLink(sock, link) {
  try {
    const code = link.split("https://chat.whatsapp.com/")[1];
    if (!code) return null;
    const res = await sock.groupGetInviteInfo(code);
    return res.id ? `${res.id}@g.us` : null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  loadJSON,
  saveJSON,
  containsGroupLink,
  formatPhoneNumber,
  extractGroupJidFromLink
};
