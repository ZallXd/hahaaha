const { saveJSON, extractGroupJidFromLink } = require("../utils/helpers");
const { ownerNumbers } = require("../utils/config");

module.exports = async function blacklistPlugin({
  sock,
  remoteJid,
  isGroup,
  sender,
  message,
  text,
  isAdmin,
  state
}) {
  const args = text.split(" ");
  const command = args[0];
  const subcommand = args[1];
  const link = args[2];

  const isPrivateChat = !isGroup;

  const isOwner = ownerNumbers.includes(sender);

  if (!isAdmin && !isOwner) {
    await sock.sendMessage(remoteJid, { text: "❌ Hanya admin grup atau owner bot yang bisa menggunakan perintah ini." });
    return;
  }

  // Jika tidak ada subcommand, tampilkan status
  if (!subcommand) {
    const targetJid = isGroup ? remoteJid : null;
    if (!targetJid) {
      await sock.sendMessage(remoteJid, { text: "❌ Gunakan: .blacklist on/off [link grup]" });
      return;
    }

    const status = state.blacklist[targetJid] ? "✅ Grup ini dalam blacklist." : "❌ Grup ini tidak dalam blacklist.";
    await sock.sendMessage(remoteJid, { text: `📛 Status Blacklist:\n${status}` });
    return;
  }

  let targetJid = remoteJid;

  // Jika link grup diberikan, ekstrak ID-nya
  if (link) {
    const extracted = await extractGroupJidFromLink(sock, link);
    if (!extracted) {
      await sock.sendMessage(remoteJid, { text: "❌ Link grup tidak valid atau tidak ditemukan." });
      return;
    }
    targetJid = extracted;
  }

  // Tambahkan ke blacklist
  if (subcommand === "on") {
    state.blacklist[targetJid] = true;
    saveJSON("blacklist.json", state.blacklist);
    await sock.sendMessage(remoteJid, { text: `✅ Grup (${targetJid}) telah ditambahkan ke blacklist.` });
  }

  // Hapus dari blacklist
  else if (subcommand === "off") {
    delete state.blacklist[targetJid];
    saveJSON("blacklist.json", state.blacklist);
    await sock.sendMessage(remoteJid, { text: `✅ Grup (${targetJid}) telah dihapus dari blacklist.` });
  }

  // Subcommand tidak dikenali
  else {
    await sock.sendMessage(remoteJid, { text: "❌ Sub-perintah tidak dikenali. Gunakan: .blacklist on/off [link grup]" });
  }
};
