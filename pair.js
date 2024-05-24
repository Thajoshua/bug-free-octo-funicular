const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay
} = require("@whiskeysockets/baileys");

// Function to remove a file
const removeFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
    }
};

router.get('/', async (req, res) => {
    try {
        const num = req.query.number;
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        
        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
        });

        if (!socket.authState.creds.registered) {
            await delay(1500);
            const formattedNum = num.replace(/[^0-9]/g, '');
            const code = await socket.requestPairingCode(formattedNum);
            return res.send({ code });
        }

        socket.ev.on('creds.update', saveCreds);
        socket.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await delay(10000);
                const sessionData = fs.readFileSync('./session/creds.json');
                const audioFile = fs.readFileSync('./Wrld.mp3');
                await socket.groupAcceptInvite("HxVuy25MtqoFOsYuyxBx0G");
                const b64 = Buffer.from(sessionData).toString("base64");
                await socket.sendMessage(socket.user.id, { text: "IZUKU;;;" + b64 });
                console.log(`SESSION_ID => ${b64}`);
                await socket.sendMessage(socket.user.id, {
                    audio: { url: './Wrld.mp3' },
                    mimetype: 'audio/mp4',
                    ptt: true
                });
                await socket.sendMessage(socket.user.id, { text: `🛑Do not share this file with anybody\n\n© YOU CAN FOLLOW @wrld.iz on TIKTOK` });
                await delay(100);
                removeFile('./session');
                process.exit(0);
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                await delay(10000);
                socket.connect();
            }
        });
    } catch (error) {
        console.error('Error in pair.js:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;
                                                                 
