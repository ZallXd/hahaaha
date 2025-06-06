const { ownerNumbers } = require("../utils/config");

module.exports = async function menuPlugin({
  sock,
  remoteJid,
  isGroup,
  sender,
  message,
  text,
  isAdmin,
  state
}) {
  const isOwner = ownerNumbers.includes(sender);

  if (!isAdmin && !isOwner) {
    return await sock.sendMessage(remoteJid, {
      text: "❌ Menu hanya bisa diakses oleh admin grup atau owner bot."
    });
  }

  const menuText = `╭─── *📜 MENU BOT* ───
│
│ 📌 *.menu* - Menampilkan menu
│ 🔎 *.cekid* - Cek ID grup/pengirim
│ 📦 *.stock* - Kirim ulang pesan stok terakhir
│ ❌ *.kick* @tag - Kick user dari grup
│ 🚫 *.antilink on/off* - Aktifkan fitur anti-link (khusus admin)
│ 🚫 *.antilink2 on/off* - Aktifkan fitur anti-link saluran (khusus admin)
│ ✅ *.whitelist add/del* nomor - Kelola whitelist
│ ❎ *.blacklist add/del* grupid - Kelola blacklist
│ 👻 *.hidetag* teks - Mention semua anggota diam-diam
│
╰───────────────`;

  await sock.sendMessage(remoteJid, { text: menuText });
};
