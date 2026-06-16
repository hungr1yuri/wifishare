// wifishare: a tiny LocalSend-style file drop for your local network.
// Zero dependencies, just Node's built-ins. Start it, open the page on your
// phone (same WiFi), and move files either way.
//   node server.js
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT) || 4000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Received files land in a "shared" folder next to this script. On Windows,
// keep the project out of Documents/Pictures/Desktop: Controlled Folder Access
// blocks Node from writing there and uploads silently stall. Override with SHARE_DIR.
const SHARE_DIR = process.env.SHARE_DIR || path.join(__dirname, "shared");
fs.mkdirSync(SHARE_DIR, { recursive: true });

// ---- helpers ---------------------------------------------------------------

// Keep filenames safe: strip path separators and weird chars, keep it readable.
function safeName(name) {
  const base = path.basename(String(name || "file"));
  const cleaned = base.replace(/[\\/:*?"<>| -]/g, "_").trim();
  return cleaned || "file";
}

// Avoid clobbering: foo.png -> foo (1).png -> foo (2).png
function uniquePath(name) {
  const ext = path.extname(name);
  const stem = path.basename(name, ext);
  let candidate = name;
  let i = 1;
  while (fs.existsSync(path.join(SHARE_DIR, candidate))) {
    candidate = `${stem} (${i})${ext}`;
    i++;
  }
  return candidate;
}

function fmtSize(bytes) {
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes, i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".pdf": "application/pdf",
  ".txt": "text/plain", ".json": "application/json", ".zip": "application/zip",
};
function mimeFor(name) { return MIME[path.extname(name).toLowerCase()] || "application/octet-stream"; }

function listFiles() {
  return fs.readdirSync(SHARE_DIR)
    .filter((f) => !f.startsWith(".") && fs.statSync(path.join(SHARE_DIR, f)).isFile())
    .map((f) => {
      const st = fs.statSync(path.join(SHARE_DIR, f));
      return { name: f, size: st.size, sizeText: fmtSize(st.size), mtime: st.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function lanIPs() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === "IPv4" && !ni.internal) out.push(ni.address);
    }
  }
  // Prefer 192.168.* / 10.* / 172.* (typical home LANs) first.
  return out.sort((a, b) => (a.startsWith("192.168.") ? -1 : 1) - (b.startsWith("192.168.") ? -1 : 1));
}

// Send a file from a base directory, refusing anything that escapes it.
function sendFrom(res, baseDir, rawName, { forceDownload = false } = {}) {
  const name = safeName(rawName);
  const target = path.join(baseDir, name);
  if (!target.startsWith(baseDir) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return res.writeHead(404).end("not found");
  }
  const headers = { "Content-Type": mimeFor(name) };
  if (forceDownload) headers["Content-Disposition"] = `attachment; filename="${name}"`;
  res.writeHead(200, headers);
  fs.createReadStream(target).pipe(res);
}

// ---- server ----------------------------------------------------------------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // Upload: raw file body, filename comes in the x-filename header.
  if (req.method === "POST" && pathname === "/upload") {
    let raw = req.headers["x-filename"] || "file";
    try { raw = decodeURIComponent(raw); } catch { /* keep raw */ }
    const name = uniquePath(safeName(raw));
    const ws = fs.createWriteStream(path.join(SHARE_DIR, name));
    req.pipe(ws);
    ws.on("finish", () => {
      console.log(`  ⬆  received  ${name}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, name }));
    });
    ws.on("error", (err) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    });
    return;
  }

  // List shared files as JSON.
  if (req.method === "GET" && pathname === "/files") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(listFiles()));
    return;
  }

  // Inline preview (images/video).
  if (req.method === "GET" && pathname.startsWith("/raw/")) {
    return sendFrom(res, SHARE_DIR, pathname.slice("/raw/".length));
  }

  // Force download.
  if (req.method === "GET" && pathname.startsWith("/download/")) {
    return sendFrom(res, SHARE_DIR, pathname.slice("/download/".length), { forceDownload: true });
  }

  // Delete a shared file.
  if (req.method === "POST" && pathname === "/delete") {
    const target = path.join(SHARE_DIR, safeName(url.searchParams.get("name")));
    fs.rm(target, { force: true }, () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // Connection info: the address a phone should use, for the QR code.
  if (req.method === "GET" && pathname === "/info") {
    const ips = lanIPs();
    const phoneURL = ips.length ? `http://${ips[0]}:${PORT}` : `http://localhost:${PORT}`;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ phoneURL, ips, port: PORT }));
    return;
  }

  // Everything else is a static asset from public/ (the page and the QR library).
  if (req.method === "GET") {
    const asset = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    return sendFrom(res, PUBLIC_DIR, asset);
  }

  res.writeHead(404).end("not found");
});

server.on("connection", (s) => s.setNoDelay(true)); // lower latency for the many small round-trips
server.listen(PORT, "0.0.0.0", () => {
  const ips = lanIPs();
  console.log("\n  📡  wifishare is running\n");
  console.log(`  On this computer:  http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  On your phone:     http://${ip}:${PORT}`);
  console.log(`\n  Files are saved to: ${SHARE_DIR}`);
  console.log("  Make sure your phone is on the same WiFi. Ctrl+C to stop.\n");
});
