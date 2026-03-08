const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs-extra');

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
        browser: Browsers.macOS("Desktop"),
        syncFullHistory: false
    });

    // PAIRING CODE GENERATOR
    if (!sock.authState.creds.registered) {
        const myNumber = "918921016567"; // Ningalude Number
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\x1b[1;32m>>> YOUR PAIRING CODE: ${code}\x1b[0m\n`);
            } catch (err) {
                console.log("Error: ", err);
            }
        }, 10000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('✅ CONNECTED TO WHATSAPP!');
            try {
                const credsData = fs.readFileSync('session_id/creds.json');
                const sessionID = Buffer.from(credsData).toString('base64');
                const finalID = `Zera~${sessionID}`;
                
                // Print in Logs
                console.log(`\n\x1b[1;33m>>> SESSION ID (Copy this): \x1b[0m\n\x1b[1;36m${finalID}\x1b[0m\n`);
                
                // Send to WhatsApp
                await sock.sendMessage(sock.user.id, { text: finalID });
                console.log("✅ Session ID sent to your WhatsApp!");
            } catch (e) {
                console.log("Session Error: ", e);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startZera();
        }
    });
}
startZera();
