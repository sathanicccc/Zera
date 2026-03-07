const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs-extra');
const { handleCommand } = require('./plugin');

async function startZera() {
    const { state, saveCreds } = await useMultiFileAuthState('session_id');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // Browser settings modified for better stability
        browser: ["Chrome (Linux)", "Zera-Bot", "1.0.0"],
        markOnlineOnConnect: true
    });

    // PAIRING CODE GENERATOR
    if (!sock.authState.creds.registered) {
        const myNumber = "918921016567"; // Your Number
        
        // Wait for connection to be ready before requesting code
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\x1b[1;32m\n>>> ZERA BOT PAIRING CODE: ${code}\n\x1b[0m`);
            } catch (err) {
                console.log("Pairing code error: ", err);
            }
        }, 5000); // 5 seconds delay for stability
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startZera();
        } else if (connection === 'open') {
            console.log('✅ ZERA BOT CONNECTED SUCCESSFULLY!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        await handleCommand(sock, m);
    });
    
    console.log("Zera Bot Engine Started...");
}

startZera();
