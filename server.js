const http = require('http');
const fs = require('fs');
const path = require('path');
const APK = '/tmp/rzim22.apk';
const PORT = process.env.PORT || 8080;

const HTML = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RZIM 2022 - Download</title>
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{background:#1c1c1c;border:1px solid #333;border-radius:14px;padding:32px;max-width:420px;text-align:center}
a.dl{display:block;margin:18px 0;padding:16px;background:#e62e2e;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;font-size:18px}
p{color:#999;font-size:13px;margin:6px 0}
</style></head><body><div class="card">
<h2>RZIM 2022 🎮</h2>
<p>APK modificado - servidor próprio</p>
<a class="dl" href="/rzim22.apk">Baixar APK (625 MB)</a>
<p>Fontes desconhecidas precisam estar liberadas.</p>
</div></body></html>`;

http.createServer((req, res) => {
  if (req.url === '/' || req.url.startsWith('/index')) {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    return res.end(HTML);
  }
  if (req.url.startsWith('/rzim22.apk')) {
    fs.stat(APK, (err, st) => {
      if (err) { res.writeHead(500); return res.end('APK nao encontrado'); }
      const size = st.size;
      const range = req.headers.range;
      const type = 'application/vnd.android.package-archive';
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        let start = m[1] ? parseInt(m[1]) : 0;
        let end = m[2] ? parseInt(m[2]) : size - 1;
        if (isNaN(start) || start > end || start >= size) {
          res.writeHead(416, {'Content-Range': `bytes */${size}`});
          return res.end();
        }
        if (end >= size) end = size - 1;
        res.writeHead(206, {
          'Content-Type': type,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Disposition': 'attachment; filename="rzim22.apk"'
        });
        return fs.createReadStream(APK, { start, end }).pipe(res);
      }
      res.writeHead(200, {
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Content-Length': size,
        'Content-Disposition': 'attachment; filename="rzim22.apk"'
      });
      fs.createReadStream(APK).pipe(res);
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => console.log('rzim-apk listening on ' + PORT));
