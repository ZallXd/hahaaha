const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

// Load config
const { channelJid, initialGroupJids, ownerNumbers } = require("./utils/config");

// Load message handler
const { handleMessage } = require("./handlers/message");

const authFolder = "./storage/auth_info";
if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop")
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") console.log("✅ Bot tersambung");
    if (connection === "close") {
      console.log("⚠️ Koneksi terputus, mencoba reconnect...");
      setTimeout(startBot, 5000);
    }
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("messages.upsert", async (m) => await handleMessage(sock, m));
}

startBot();