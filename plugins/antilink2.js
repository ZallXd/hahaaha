const fs = require("fs");
const path = require("path");
const { ownerNumbers } = require("../utils/config");

const antilink2Path = path.join(__dirname, "../storage/antilink2.json");
let antilink2 = fs.existsSync(antilink2Path)
  ? JSON.parse(fs.readFileSync(antilink2Path))
  : {};

// Simpan perubahan ke file
function saveAntilink2() {
  fs.writeFileSync(antilink2Path, JSON.stringify(antilink2, null, 2));
}

// Regex mendeteksi link saluran WhatsApp
const channelLinkRegex = /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+/i;

// Ekstrak teks dari berbagai jenis pesan
function extractTextFromMessage(message) {
  const msg = message?.message || {};
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsMessage?.contentText ||
    msg.templateMessage?.hydratedTemplate?.hydratedContentText ||
    msg.listMessage?.description ||
    ""
  );
}

module.exports = async function antilink2Handler({ sock, remoteJid, isGroup, isAdmin, sender, text, message }) {
  const isOwner = ownerNumbers.includes(sender);
  if (!isGroup || !message?.message) return;

  const isAntilink2Active = antilink2[remoteJid] === true;
  const msgText = extractTextFromMessage(message);

  // ✅ Deteksi & hapus link saluran jika fitur aktif (tanpa balasan)
  if (isAntilink2Active && channelLinkRegex.test(msgText)) {
    if (!isAdmin && !isOwner) {
      try {
        await sock.sendMessage(remoteJid, {
          delete: message.key,
        });
      } catch (err) {
        console.error("Gagal menghapus pesan antilink2:", err);
      }
    }
  }

  // ⚙️ Perintah .antilink2 on/off (admin atau owner saja)
  if (text === ".antilink2 on" || text === ".antilink2 off") {
    if (!isAdmin && !isOwner) {
      return await sock.sendMessage(remoteJid, {
        text: "❌ Hanya admin grup atau owner yang bisa mengatur fitur ini.",
      });
    }

    const status = text.endsWith("on");
    if (status) {
      antilink2[remoteJid] = true;
    } else {
      delete antilink2[remoteJid];
    }

    saveAntilink2();

    await sock.sendMessage(remoteJid, {
      text: `✅ Fitur Anti-Link Saluran sekarang *${status ? "AKTIF" : "NONAKTIF"}*.`,
    });
  }
};
