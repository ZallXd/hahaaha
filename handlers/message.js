const {
  loadJSON,
  saveJSON,
  containsGroupLink,
  extractGroupJidFromLink,
  formatPhoneNumber
} = require("../utils/helpers");

const {
  channelJid,
  initialGroupJids,
  ownerNumbers,
  linkPatterns
} = require("../utils/config");

const plugins = {
  menu: require("../plugins/menu"),
  cekid: require("../plugins/cekid"),
  blacklist: require("../plugins/blacklist"),
  stock: require("../plugins/stock"),
  antilink: require("../plugins/antilink"),
  whitelist: require("../plugins/whitelist"),
  kick: require("../plugins/kick"),
  hidetag: require("../plugins/hidetag"),
  antilink2: require("../plugins/antilink2")
};

const state = {
  antiLinkState: loadJSON("antilink.json", {}),
  whitelist: loadJSON("whitelist.json", {}),
  blacklist: loadJSON("blacklist.json", {}),
  antilink2: loadJSON("antilink2.json", {}),
  lastStockMessage: null
};

function extractText(message) {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  );
}

async function isAdminOrOwner(sock, remoteJid, sender) {
  const normalizedSender = sender.replace(/:.*@/, "@");
  if (ownerNumbers.includes(normalizedSender)) return true;
  if (!remoteJid.endsWith("@g.us")) return false;
  const metadata = await sock.groupMetadata(remoteJid);
  const participant = metadata.participants.find(p => p.id === normalizedSender);
  return participant?.admin === "admin" || participant?.admin === "superadmin";
}

async function handleMessage(sock, { messages, type }) {
  if (type !== "notify") return;

  for (const msg of messages) {
    try {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith("@g.us");
      const sender = msg.key.participant || msg.key.remoteJid;
      const normalizedSender = sender.replace(/:.*@/, "@");
      const message = msg.message;

      let text = extractText(message).trim();
      const command = text.split(" ")[0].toLowerCase();
      const cmdName = command.startsWith(".") ? command.slice(1) : command;

      const isAdmin = await isAdminOrOwner(sock, remoteJid, sender);

      // ====== HANDLE BLACKLIST LINK ======
      if (containsGroupLink(message, linkPatterns)) {
        const links = text.match(/https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/g) || [];
        for (const link of links) {
          const groupJidFromLink = await extractGroupJidFromLink(sock, link);
          if (groupJidFromLink && state.blacklist[groupJidFromLink]) {
            const isOwner = ownerNumbers.includes(normalizedSender);
            let isSenderAdmin = false;

            if (isGroup) {
              const meta = await sock.groupMetadata(remoteJid);
              const participant = meta.participants.find(p => p.id === normalizedSender);
              isSenderAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
            }

            if (!isOwner && !isSenderAdmin) {
              try {
                await sock.sendMessage(remoteJid, {
                  delete: {
                    remoteJid,
                    fromMe: false,
                    id: msg.key.id,
                    participant: sender
                  }
                });
              } catch (e) {
                console.error("Gagal menghapus pesan blacklist:", e);
              }
              return;
            }
          }
        }
      }

      // ====== FORWARD PESAN DARI CHANNEL ======
      if (remoteJid === channelJid) {
        const msgContent = extractText(message);

        if (/\b(stock|weather)\b/i.test(msgContent)) {
          state.lastStockMessage = msg;

          let cleaned = msgContent;
          cleaned = cleaned.replace(/`?Copyright\s*©\s*growagarden\.info`?/gi, "`Stock by Zall`");

          for (const gJid of initialGroupJids) {
            try {
              await sock.sendMessage(gJid, { text: cleaned });
            } catch (e) {
              console.error("Gagal kirim pesan custom ke grup:", e);
            }
          }
        }
        return;
      }

      // ====== FITUR ANTILINK (standar) ======
      if (isGroup) {
        const alwaysRemove = state.blacklist[remoteJid] || false;
        if (containsGroupLink(message, linkPatterns)) {
          if (!state.whitelist[sender] && (state.antiLinkState[remoteJid] || alwaysRemove)) {
            const isOwner = ownerNumbers.includes(normalizedSender);
            const meta = await sock.groupMetadata(remoteJid);
            const participant = meta.participants.find(p => p.id === normalizedSender);
            const isSenderAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";

            if (!isOwner && !isSenderAdmin) {
              try {
                await sock.sendMessage(remoteJid, { delete: msg.key });
              } catch {}
              continue;
            }
          }
        }
      }

      // ====== EKSEKUSI PLUGIN JIKA COMMAND ======
      if (plugins[cmdName]) {
        await plugins[cmdName]({
          sock,
          remoteJid,
          isGroup,
          sender: normalizedSender,
          message: msg,
          text,
          isAdmin,
          state,
          formatPhoneNumber
        });
      } else {
        // ====== JALANKAN ANTILINK2 JIKA BUKAN COMMAND (untuk saluran) ======
        await plugins.antilink2({
          sock,
          remoteJid,
          isGroup,
          sender: normalizedSender,
          message: msg,
          text,
          isAdmin,
          state
        });
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }
}

module.exports = { handleMessage };
