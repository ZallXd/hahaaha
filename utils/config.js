module.exports = {
  channelJid: "120363417721042596@newsletter",
  initialGroupJids: [
    "120363399159334380@g.us",
    "120363419497011726@g.us"
  ],
  ownerNumbers: [
    "6288989337059@s.whatsapp.net",
    "6285731706147@s.whatsapp.net"
  ],

  // Regex untuk deteksi link grup
  linkPatterns: [
    /chat\.whatsapp\.com\/(?:invite\/)?[0-9A-Za-z]{20,24}/i,
    /whatsapp\.com\/(?:invite|chat)\/[0-9A-Za-z]{20,24}/i,
    /wa\.me\/[0-9A-Za-z]{20,24}/i,
    /https?:\/\/(?:www\.)?whatsapp\.com\/groups?\/[0-9A-Za-z]{20,24}/i
  ]
};