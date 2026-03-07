const axios = require('axios');
const fs = require('fs-extra');

async function handleCommand(sock, m) {
    const from = m.key.remoteJid;
    const type = Object.keys(m.message)[0];
    const body = (type === 'conversation') ? m.message.conversation : (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (type === 'imageMessage') ? m.message.imageMessage.caption : '';
    const command = body.toLowerCase().split(' ')[0];
    const args = body.split(' ').slice(1).join(' ');

    switch (command) {
        case '.alive':
            await sock.sendMessage(from, { 
                text: "🌸 *ZERA IS ONLINE* 🌸\n\n🚀 *Status:* Active\n📶 *Ping:* Fast (0-2s)\n📅 *Year:* 2026 Latest\n\n_Zera is ready to help you!_" 
            });
            break;

        case '.menu':
            const zeraMenu = `╭═══〔 *ZERA BOT MENU* 〕═══╮
│ 🤖 .alive / .ping
│ 🖼️ .sticker (Reply Image)
│ 🎙️ .tts (Text to Audio)
│ 📥 .insta (Reel/Post)
│ 🎵 .song (Download Music)
│ 📞 .true (Number Info)
│ 📍 .locate (Live Location)
│ ☁️ .save (Cloud Storage)
│ 📥 .status (Save Status)
╰════════════════════════╯`;
            await sock.sendMessage(from, { text: zeraMenu });
            break;

        case '.tts':
            if (!args) return sock.sendMessage(from, { text: "Zera: Please provide text!" });
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(args)}&tl=ml&client=tw-ob`;
            await sock.sendMessage(from, { audio: { url: ttsUrl }, mimetype: 'audio/mp4', ptt: true });
            break;

        case '.ping':
            const start = Date.now();
            await sock.sendMessage(from, { text: `⚡ Zera Speed: ${Date.now() - start}ms` });
            break;

        case '.sticker':
            await sock.sendMessage(from, { text: "⏳ Zera is converting image to sticker..." });
            // Sticker logic remains the same
            break;
    }
}

module.exports = { handleCommand };
