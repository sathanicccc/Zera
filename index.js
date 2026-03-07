const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");

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
        // Desktop browser identity (Less likely to be blocked)
        browser: Browsers.macOS("Desktop"),
        syncFullHistory: false
    });

    // PAIRING CODE GENERATOR
    if (!sock.authState.creds.registered) {
        const myNumber = "918921016567"; 
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(myNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\x1b[1;32m\n✅ NEW PAIRING CODE: ${code}\n\x1b[0m`);
            } catch (err) {
                console.log("Error requesting pairing code: ", err);
            }
        }, 8000); // Increased delay to 8 seconds
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Reconnecting in 5 seconds...");
                setTimeout(() => startZera(), 5000);
            }
        } else if (connection === 'open') {
            console.log('🎊 ZERA BOT CONNECTED SUCCESSFULLY!');
        }
    });
}

startZera();
