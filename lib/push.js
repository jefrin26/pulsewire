const http = require("http");
const https = require("https");
const { statusText } = require("./status");
const { runSelfCheck } = require("./selfcheck");

const PUSH_MSG_MAX = 240;

function buildPushUrl(baseUrl, { status, msg, ping }) {
  const url = new URL(baseUrl);
  url.search = "";
  url.searchParams.set("status", status);
  url.searchParams.set("msg", msg.slice(0, PUSH_MSG_MAX));
  url.searchParams.set("ping", String(ping));
  return url;
}

function sendRequest(url, timeoutMs) {
  return new Promise((resolve) => {
    const client = url.protocol === "https:" ? https : http;
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        res.once("end", () =>
          done({ ok: res.statusCode === 200, code: res.statusCode })
        );
      }
    );

    req.on("timeout", () => {
      req.destroy();
      done({ ok: false, code: 408 });
    });
    req.on("error", (err) => done({ ok: false, code: 0, err }));
    req.end();
  });
}

async function sendBeat(baseUrl, timeoutMs) {
  const started = Date.now();
  const { code, detail } = await runSelfCheck();
  const ping = Date.now() - started;
  const healthy = code >= 200 && code < 400;
  const url = buildPushUrl(baseUrl, {
    status: healthy ? "up" : "down",
    msg: detail,
    ping,
  });

  const result = await sendRequest(url, timeoutMs);

  console.log(statusText(code));
  console.log(`X-Check-Detail: ${detail}`);
  const pushDetail = result.ok
    ? "ok"
    : `failed status=${result.code}${result.err ? ` ${result.err.code || result.err.message}` : ""}`;
  console.log(`X-Push: ${pushDetail}`);

  return result.ok;
}

function startPush(baseUrl, intervalSec) {
  const timeoutMs = Number(process.env.TIMEOUT_MS || 3000);
  const intervalMs = intervalSec * 1000;
  let running = false;

  const beat = async () => {
    if (running) return;
    running = true;
    const startedAt = Date.now();
    try {
      await sendBeat(baseUrl, timeoutMs);
    } catch (err) {
      console.log(statusText(500));
      console.log(`X-Check-Detail: beat error: ${err.code || err.message}`);
    } finally {
      running = false;
      const elapsed = Date.now() - startedAt;
      setTimeout(beat, Math.max(0, intervalMs - elapsed));
    }
  };

  beat();
}

module.exports = { startPush, sendBeat };
