const http = require("http");
const { respond } = require("./status");

function probeService(host, port) {
  const timeoutMs = Number(process.env.TIMEOUT_MS || 3000);
  const req = http.request(
    { host, port, path: "/", method: "GET", timeout: timeoutMs },
    (res) => {
      res.resume();
      respond(res.statusCode, `${host}:${port}/`);
    }
  );

  req.on("timeout", () => {
    req.destroy();
    respond(408, `timeout after ${timeoutMs}ms`);
  });

  req.on("error", (err) => {
    if (["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH"].includes(err.code)) {
      respond(0, `${err.code} ${host}:${port} is down`);
    }
    if (err.code === "ECONNRESET") {
      respond(502, "connection reset by peer");
    }
    respond(503, err.code || err.message);
  });

  req.end();
}

module.exports = { probeService };
