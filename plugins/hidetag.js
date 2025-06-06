module.exports = async function hidetagPlugin({
  sock,
  remoteJid,
  isGroup,
  sender,
  message,
  text,
  isAdmin
}) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: "❌ Perintah ini hanya bisa digunakan di grup." });
    return;
  }

  if (!isAdmin) {
    await sock.sendMessage(remoteJid, { text: "❌ Hanya admin yang bisa menggunakan perintah ini." });
    return;
  }

  const teks = text.split(" ").slice(1).join(" ").trim();
  if (!teks) {
    await sock.sendMessage(remoteJid, { text: "⚠️ Masukkan teks untuk dikirim dengan .hidetag" });
    return;
  }

  try {
    const metadata = await sock.groupMetadata(remoteJid);
    const participants = metadata.participants.map(p => p.id);

    await sock.sendMessage(remoteJid, {
      text: teks,
      mentions: participants
    });
  } catch (err) {
    console.error("❌ Gagal mengirim hidetag:", err);
    await sock.sendMessage(remoteJid, { text: "❌ Terjadi kesalahan saat mengirim pesan." });
  }
};
