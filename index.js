const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startZera() {
    // Railway-ile Variables-il ninnu Session ID edukkunnu
    const { state, saveCreds } = await useMultiFileAuthState('session_id');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Zera-Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ ZERA BOT IS ONLINE!');
            // Swantham number-ilekku message ayakkum
            await sock.sendMessage(sock.user.id, { text: '*Zera Bot Connected Successfully!* 🚀\n\nTry typing `.ping`' });
        }
        if (connection === 'close') {
            let reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("Reconnecting...");
                startZera();
            }
        }
    });

    // Command Logic
    sock.ev.on('messages.upsert', async (chat) => {
        const msg = chat.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: 'Pong! ⚡' });
        }
        
        if (text.toLowerCase() === '.alive') {
            await sock.sendMessage(from, { text: 'I am Alive and Working! 🤖' });
        }
    });
}

startZera();
