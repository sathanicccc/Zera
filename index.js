const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startZera() {
    // Session handle cheyyanulla vazhi
    const { state, saveCreds } = await useMultiFileAuthState('session_id');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Zera-Bot", "MacOS", "3.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ ZERA BOT CONNECTED SUCCESSFULLY!');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startZera(); 
        }
    });

    // COMMANDS SECTION (Ithilaanu prashnam varunnathu)
    sock.ev.on('messages.upsert', async (chat) => {
        try {
            const msg = chat.messages[0];
            if (!msg.message || msg.key.fromMe) return; // Swantham message skip cheyyaam
            
            const content = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            // .ping command
            if (content.toLowerCase() === '.ping') {
                await sock.sendMessage(from, { text: 'Zera Bot is Online! ⚡' });
            }

            // .alive command
            if (content.toLowerCase() === '.alive') {
                await sock.sendMessage(from, { text: '*Zera Bot v1.0 is Alive* 🤖\n\nWorking perfectly!' });
            }
        } catch (err) {
            console.log("Error in messages: ", err);
        }
    });
}

startZera();
