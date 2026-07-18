/* Run Kerbit on your own PC:  node local-server.js  → http://localhost:3000 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const apiHandler = require("./api/index.js");

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, "public");
const MIME = { ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

http.createServer((req, res) => {
  if (req.url.startsWith("/api")) return apiHandler(req, res);
  let p = req.url.split("?")[0];
  if (p === "/") p = "/index.html";
  if (p === "/privacy") p = "/privacy.html";
  if (p === "/terms") p = "/terms.html";
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(200, { "Content-Type": "text/html" });
    return fs.createReadStream(path.join(PUB, "index.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log("Kerbit running → http://localhost:" + PORT);
  console.log("Data mode:", process.env.SUPABASE_URL ? "supabase (permanent)" : "in-memory demo (set SUPABASE_URL + SUPABASE_SERVICE_KEY for permanent data)");
});
