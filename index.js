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

    // 1. PAIRING CODE LOGIC
    if (!sock.authState.creds.registered) {
        const myNumber = "918921016567"; // Your Number
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n\x1b[1;32m>>> YOUR PAIRING CODE: ${code}\x1b[0m\n`);
            } catch (err) {
                console.log("Error: ", err);
            }
        }, 5000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('✅ CONNECTED TO WHATSAPP!');
            
            // 2. GENERATE SESSION ID IN LOGS
            try {
                const credsData = fs.readFileSync('session_id/creds.json');
                const sessionID = Buffer.from(credsData).toString('base64');
                console.log(`\n\x1b[1;33m>>> YOUR SESSION ID (Copy this): \x1b[0m\n\x1b[1;36mZera~${sessionID}\x1b[0m\n`);
                
                // 3. SEND TO WHATSAPP
                await sock.sendMessage(sock.user.id, { text: `Zera~${sessionID}` });
                console.log("✅ Session ID sent to your WhatsApp!");
            } catch (e) {
                console.log("Session generation error: ", e);
            }
        }

        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startZera();
        }
    });
}
startZera();
