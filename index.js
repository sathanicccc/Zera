const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startZera() {
    // Railway Variables-il ninnu Session ID edukkunnu
    const { state, saveCreds } = await useMultiFileAuthState('session_id');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Zera Bot", "MacOS", "3.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('🎊 ZERA BOT IS ONLINE AND CONNECTED!');
        }
        if (connection === 'close') {
            startZera(); // Auto Reconnect
        }
    });

    // Simple Ping Command (Example)
    sock.ev.on('messages.upsert', async (chat) => {
        const msg = chat.messages[0];
        if (!msg.message) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text === '.ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! 🚀' });
        }
    });
}

startZera();
