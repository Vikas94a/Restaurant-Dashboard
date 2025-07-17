const { onRequest } = require("firebase-functions/v2/https");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

exports.nextjsFunc = onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
}); 