const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");


const pino = require("pino");
const fs = require("fs");
const { Console } = require("console");
const path = "sessions/";
let x;

exports.gas = function (msg, no, to, type, imageURL = '') {
  connect(no, msg, to, type, imageURL);
};

async function connect(sta, msg, to, type, imageURL) {
  const { state, saveCreds } = await useMultiFileAuthState(path.concat(sta));

  const sock = makeWASocket({
    auth: state,
    defaultQueryTimeoutMs: undefined,
    logger: pino({ level: "fatal" }),
    browser: ["FFA", "EDGE", "1.0"],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection == "connecting") return;

    if (connection === "close") {
      let statusCode = lastDisconnect.error?.output?.statusCode;

      if (statusCode === DisconnectReason.restartRequired) {
        return;
      } else if (statusCode === DisconnectReason.loggedOut) {
        if (fs.existsSync(path.concat(sta))) {
          try {
            fs.unlinkSync(path.concat(sta));
          } catch (err) {
            console.error("Error deleting file:", err);
          }
          // fs.unlinkSync(path.concat(sta));
        }
        return;
      }
    } else if (connection === "open") {
      if (msg != null && to != null) {
        // for (let x in to) {
        //   const id = to[x] + "@s.whatsapp.net";
        //   if (type === "chat") {
        //     sock.sendMessage(id, {
        //       text: msg,
        //     });
        //   }
        // }

        const id = to + "@s.whatsapp.net";
        const times = new Date().toLocaleDateString();
        if (type === "chat") {
          sock.sendMessage(id, {
            text: msg,
          });
        }
        // doc 
        if (type === "image") {
          sock.sendMessage(
            id,
            {
              image: { url: imageURL },
              caption: `${msg}, ${times}`
            }
          );
        }

      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}
