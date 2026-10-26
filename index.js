const { loadEnv } = require("./lib/loadEnv");
const { respond } = require("./lib/status");
const { runSelfCheck } = require("./lib/selfcheck");
const { probeService } = require("./lib/probe");
const { startPush } = require("./lib/push");

loadEnv();

const args = process.argv.slice(2);

async function checkSelf() {
  const { code, detail } = await runSelfCheck();
  respond(code, detail);
}

if (args.includes("--check")) {
  checkSelf();
} else if (args.includes("--probe")) {
  const probeIdx = args.indexOf("--probe");
  const port = Number(args[probeIdx + 1]);
  if (!port) {
    respond(400, "--probe requires a port number");
  }
  probeService(process.env.HOST || "localhost", port);
} else {
  const pushUrl = process.env.KUMA_PUSH_URL;
  if (!pushUrl) {
    respond(400, "KUMA_PUSH_URL is not set");
  }
  try {
    new URL(pushUrl);
  } catch {
    respond(400, "KUMA_PUSH_URL is not a valid URL");
  }
  startPush(pushUrl, Number(process.env.HEARTBEAT_SEC) || 30);
}
