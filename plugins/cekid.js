// plugins/cekid.js
module.exports = async function cekid({ sock, remoteJid, isGroup, sender, message, text, isAdmin, state, formatPhoneNumber }) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: "Perintah ini hanya bisa dipakai di grup." });
    return;
  }

  const groupId = remoteJid;
  await sock.sendMessage(remoteJid, { text: `ID grup ini adalah:\n${groupId}` });
};
