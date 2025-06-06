const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "antilink.json");

function saveState(state) {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

module.exports = async ({ sock, remoteJid, isGroup, text, isAdmin, state, message }) => {
  if (!isGroup) return;

  const command = text.trim().split(" ")[0].toLowerCase();
  const arg = text.trim().split(" ")[1]?.toLowerCase();

  if (command !== ".antilink") return;

  const replyMessage = async (msg) => {
    await sock.sendMessage(remoteJid, {
      text: msg,
      quoted: message
    });
  };

  if (!isAdmin) {
    return await replyMessage("❌ Hanya admin yang dapat menggunakan perintah ini.");
  }

  if (!arg) {
    const isOn = state.antiLinkState[remoteJid];
    return await replyMessage(`📛 Antilink saat ini *${isOn ? "AKTIF" : "NONAKTIF"}* di grup ini.`);
  }

  if (arg === "on") {
    state.antiLinkState[remoteJid] = true;
    saveState(state.antiLinkState);
    return await replyMessage("✅ Fitur *antilink* telah *diaktifkan* untuk grup ini.");
  } else if (arg === "off") {
    delete state.antiLinkState[remoteJid];
    saveState(state.antiLinkState);
    return await replyMessage("⚠️ Fitur *antilink* telah *dinonaktifkan* untuk grup ini.");
  } else {
    return await replyMessage("❓ Penggunaan:\n.antilink on/off");
  }
};
