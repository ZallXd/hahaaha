module.exports = async ({ sock, remoteJid, state, isAdmin }) => {
  if (!isAdmin) return;

  if (state.lastStockMessage) {
    try {
      await sock.sendMessage(remoteJid, state.lastStockMessage);
    } catch (err) {
      console.error("Gagal mengirim ulang pesan stock:", err);
    }
  } else {
    await sock.sendMessage(remoteJid, { text: "Belum ada data stock terbaru." });
  }
};
