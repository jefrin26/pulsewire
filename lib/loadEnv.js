const fs = require("fs");
const path = require("path");

function loadEnv(file = path.join(process.cwd(), ".env")) {
  let data;
  try {
    data = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }

  for (const line of data.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadEnv };
