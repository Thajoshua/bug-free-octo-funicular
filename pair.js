const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
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
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(`./session`);
        
        const Wrld = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
            },
            printQRInTerminal: false,
            logger: pino({level: "fatal"}).child({level: "fatal"}),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
        });

        if (!Wrld.authState.creds.registered) {
            await delay(1500);
            const formattedNum = num.replace(/[^0-9]/g,'');
            const code = await Wrld.requestPairingCode(formattedNum);
            return res.send({ code });
        }

        Wrld.ev.on('creds.update', saveCreds);
        Wrld.ev.on("connection.update", async (s) => {
            const {
                connection,
                lastDisconnect
            } = s;

            if (connection === "open") {
                await delay(10000);
                const sessionizuku = fs.readFileSync('./session/creds.json');
                const izuku = fs.readFileSync('./Wrld.mp3');
                Wrld.groupAcceptInvite("HxVuy25MtqoFOsYuyxBx0G");
                const b64 = await Buffer.from(sessionizuku).toString("base64");
                await Wrld.sendMessage(Wrld.user.id, { text: "IZUKU;;;" + b64 });
                console.log(`SESSION_ID => ${b64}`);
                Wrld.sendMessage(Wrld.user.id, {
                    audio: izuku,
                    mimetype: 'audio/mp4',
                    ptt: true
                });
                await Wrld.sendMessage(Wrld.user.id, { text: `🛑Do not share this file with anybody\n\n© YOU CAN FOLLOW @wrld.iz on TIKTOK` });
                await delay(100);
                removeFile('./session');
                process.exit(0);
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                await delay(10000);
                XeonPair();
            }
        });
    } catch (error) {
        console.error('Error in pair.js:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;
