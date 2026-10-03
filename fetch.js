const https = require('https');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const URL = 'https://github.com/borgesadriana688-eng/rzim-apk/releases/download/v3-brayan/FREE_FIRE_BRAYAN.apk';
const SHA = '8fed0e0f344aa04671ddc98e8d1aed4ef2e65599078ba2af88fe31531f63211f';
const SIZE = 655387843;
const OUT = '/tmp/FREE_FIRE_BRAYAN.apk';

function download(url, dest, tries, redirects) {
  redirects = redirects || 0;
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { timeout: 300000, headers: { 'User-Agent': 'rzim-fetch/2.0' } }, (res) => {
        const code = res.statusCode;
        if (code >= 300 && code < 400 && res.headers.location && redirects < 10) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(download(next, dest, tries, redirects + 1));
        }
        if (code !== 200) {
          res.resume();
          if (n < tries) return setTimeout(() => attempt(n + 1), 5000);
          return reject(new Error(`HTTP ${code} em ${url}`));
        }
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => resolve());
        ws.on('error', reject);
      });
      req.on('error', (e) => {
        req.destroy();
        if (n < tries) return setTimeout(() => attempt(n + 1), 5000);
        reject(e);
      });
    };
    attempt(0);
  });
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const rs = fs.createReadStream(file);
    rs.on('data', d => h.update(d));
    rs.on('end', () => resolve(h.digest('hex')));
    rs.on('error', reject);
  });
}

(async () => {
  if (fs.existsSync(OUT) && await sha256(OUT) === SHA) {
    console.log('[fetch] APK já em cache, hash OK');
    return;
  }
  console.log('[fetch] baixando APK (FREE FIRE BRAYAN) do GitHub Release...');
  fs.rmSync(OUT, { force: true });
  await download(URL, OUT, 5);
  const got = await sha256(OUT);
  const sz = fs.statSync(OUT).size;
  if (got !== SHA || sz !== SIZE) {
    console.error(`[fetch] ERRO: hash ${got} tamanho ${sz} (esperado ${SHA} ${SIZE})`);
    process.exit(1);
  }
  console.log(`[fetch] APK OK: ${sz} bytes, sha256 confere`);
})().catch(e => { console.error('[fetch] falhou:', e.message); process.exit(1); });
