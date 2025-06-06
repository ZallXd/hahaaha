const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "whitelist.json");

function saveWhitelist(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = async ({ sock, remoteJid, isGroup, text, isAdmin, state, formatPhoneNumber }) => {
  if (!isGroup) return;
  if (!isAdmin) return;

  const [cmd, sub, nomor] = text.trim().split(" ");

  if (cmd !== ".whitelist") return;

  const no = formatPhoneNumber(nomor || "");
  if (!no.endsWith("@s.whatsapp.net")) return;

  if (sub === "add") {
    state.whitelist[no] = true;
    saveWhitelist(state.whitelist);
    await sock.sendMessage(remoteJid, { text: `✅ @${no.split("@")[0]} ditambahkan ke whitelist.`, mentions: [no] });
  } else if (sub === "del") {
    delete state.whitelist[no];
    saveWhitelist(state.whitelist);
    await sock.sendMessage(remoteJid, { text: `❌ @${no.split("@")[0]} dihapus dari whitelist.`, mentions: [no] });
  } else if (sub === "list") {
    const list = Object.keys(state.whitelist);
    if (list.length === 0) {
      await sock.sendMessage(remoteJid, { text: "📭 Whitelist kosong." });
    } else {
      const listText = list.map(n => `- @${n.split("@")[0]}`).join("\n");
      await sock.sendMessage(remoteJid, {
        text: `📃 *Daftar Whitelist:*\n${listText}`,
        mentions: list
      });
    }
  }
};
