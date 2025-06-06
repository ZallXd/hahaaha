const { formatPhoneNumber } = require("../utils/helpers");
const { ownerNumbers } = require("../utils/config");

module.exports = async function kickHandler({ sock, remoteJid, isGroup, text, isAdmin, message, sender }) {
  if (!isGroup) {
    return await sock.sendMessage(remoteJid, { text: "❌ Perintah ini hanya untuk grup." });
  }

  const isOwner = ownerNumbers.includes(sender);

  if (!isAdmin && !isOwner) {
    return await sock.sendMessage(remoteJid, { text: "❌ Hanya admin grup atau owner bot yang bisa menggunakan perintah ini." });
  }

  const groupMetadata = await sock.groupMetadata(remoteJid);
  const botId = (sock.user?.id?.split(":")[0] || sock.user.id) + "@s.whatsapp.net";
  const botParticipant = groupMetadata.participants.find(p => p.id === botId);

  if (!botParticipant || !["admin", "superadmin"].includes(botParticipant.admin)) {
    return await sock.sendMessage(remoteJid, {
      text: "❌ Bot belum dijadikan admin di grup ini."
    });
  }

  let targetId = null;

  // 1. Jika reply
  if (message?.message?.extendedTextMessage?.contextInfo?.participant) {
    targetId = message.message.extendedTextMessage.contextInfo.participant;
  }

  // 2. Jika mention
  const mentioned = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!targetId && mentioned?.length > 0) {
    targetId = mentioned[0];
  }

  // 3. Jika dari argumen
  const args = text.trim().split(" ");
  if (!targetId && args.length > 1) {
    targetId = formatPhoneNumber(args[1]);
  }

  if (!targetId) {
    return await sock.sendMessage(remoteJid, {
      text: "❌ Silakan *reply pesan*, *tag anggota*, atau *sertakan nomor* yang ingin dikeluarkan."
    });
  }

  const targetParticipant = groupMetadata.participants.find(p => p.id === targetId);
  if (!targetParticipant) {
    return await sock.sendMessage(remoteJid, {
      text: `❌ Nomor ${targetId.split("@")[0]} tidak ditemukan di grup.`
    });
  }

  if (["admin", "superadmin"].includes(targetParticipant.admin)) {
    return await sock.sendMessage(remoteJid, {
      text: `❌ Tidak bisa mengeluarkan admin/superadmin.`
    });
  }

  try {
    await sock.groupParticipantsUpdate(remoteJid, [targetId], "remove");
    await sock.sendMessage(remoteJid, {
      text: `✅ Berhasil mengeluarkan @${targetId.split("@")[0]}`,
      mentions: [targetId]
    });
  } catch (err) {
    console.error("❌ Gagal kick:", err);
    await sock.sendMessage(remoteJid, {
      text: "❌ Terjadi kesalahan saat mencoba mengeluarkan anggota."
    });
  }
};
