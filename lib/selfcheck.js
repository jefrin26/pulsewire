const net = require("net");
const os = require("os");

const LOOPBACK_TIMEOUT_MS = 3000;

function hasActiveInterface() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (!iface.internal) {
        return true;
      }
    }
  }
  return false;
}

function loopbackAlive() {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const server = net.createServer((socket) => socket.end());
    server.once("error", () => done(false));
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const client = net.connect({ host: "127.0.0.1", port });
      client.once("connect", () => {
        client.end();
        server.close(() => done(true));
      });
      client.once("error", () => {
        server.close(() => done(false));
      });
    });
    setTimeout(() => done(false), LOOPBACK_TIMEOUT_MS);
  });
}

async function runSelfCheck() {
  let alive;
  try {
    alive = await loopbackAlive();
  } catch (err) {
    return { code: 500, detail: `loopback error: ${err.code || err.message}` };
  }

  if (!alive) {
    return { code: 0, detail: "loopback test failed on 127.0.0.1" };
  }

  if (!hasActiveInterface()) {
    return { code: 503, detail: "loopback OK but no active network interface" };
  }

  return { code: 200, detail: `${os.hostname()} is up` };
}

module.exports = { runSelfCheck };
