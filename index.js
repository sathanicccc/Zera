const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
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
        browser: ["Zera Bot", "Chrome", "20.0.04"]
    });

    // PAIRING CODE GENERATOR
    if (!sock.authState.creds.registered) {
        const myNumber = "918921016567"; // NINGALUDE NUMBER IVIDE KODUKKUKA (With 91)
        setTimeout(async () => {
            let code = await sock.requestPairingCode(myNumber);
            console.log(`\x1b[1;32m\n>>> ZERA BOT PAIRING CODE: ${code}\n\x1b[0m`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        await handleCommand(sock, m);
    });
    
    console.log("Zera Bot Engine Started...");
}

startZera();
