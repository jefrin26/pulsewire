const REASON_PHRASES = {
  0: "No Response",
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

function statusText(code) {
  const phrase = REASON_PHRASES[code] || "Unknown";
  return `HTTP/1.1 ${String(code).padStart(3, "0")} ${phrase}`;
}

function respond(code, detail) {
  console.log(statusText(code));
  if (detail) {
    console.log(`X-Check-Detail: ${detail}`);
  }
  process.exit(code >= 200 && code < 400 ? 0 : 1);
}

module.exports = { statusText, respond };
