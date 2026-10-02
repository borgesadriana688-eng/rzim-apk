const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const B = 'https://base44.app/api/apps/6a524569f09129fda4648829/files/mp/public/6a524569f09129fda4648829';
const SHA = '92b61f0b73c5e905ae820299dc412379a0fd8f7423985dedce5b8b4eb2c8beb7';
const OUT = '/tmp/rzim22.apk';

const URLS = [
  `${B}/0377060eb_rzimfix2partaa.bin`,
  `${B}/b73f26a22_rzimfix2partab.bin`,
  `${B}/1c470250e_rzimfix2partac.bin`,
  `${B}/40b1b5b97_rzimfix2partad.bin`,
  `${B}/9170f2a6c_rzimfix2partae.bin`,
  `${B}/7eab41259_rzimfix2partaf.bin`,
  `${B}/fda3a4eb7_rzimfix2partag.bin`,
  `${B}/845f2a84d_rzimfix2partah.bin`,
  `${B}/d4709a3aa_rzimfix2partai.bin`,
  `${B}/f0ee75f1d_rzimfix2partaj.bin`,
  `${B}/4a398873f_rzimfix2partak.bin`,
  `${B}/e4c42b34c_rzimfix2partal.bin`,
  `${B}/075338a9e_rzimfix2partam.bin`,
  `${B}/e02dea147_rzimfix2partan.bin`,
  `${B}/89ecaca79_rzimfix2partao.bin`,
  `${B}/d41799b2d_rzimfix2partap.bin`,
  `${B}/2648b3215_rzimfix2partaq.bin`,
  `${B}/0d114474e_rzimfix2partar.bin`,
  `${B}/399b4e968_rzimfix2partas.bin`,
  `${B}/f889c5a99_rzimfix2partat.bin`,
  `${B}/b9cbf8655_rzimfix2partau.bin`,
  `${B}/bc8c7769d_rzimfix2partav.bin`,
  `${B}/65533edf3_rzimfix2partaw.bin`,
];

function download(url, dest, tries, redirects) {
  redirects = redirects || 0;
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { timeout: 120000, headers: { 'User-Agent': 'rzim-fetch/1.0' } }, (res) => {
        const code = res.statusCode;
        if (code >= 300 && code < 400 && res.headers.location && redirects < 5) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(download(next, dest, tries, redirects + 1));
        }
        if (code !== 200) {
          res.resume();
          if (n < tries) return setTimeout(() => attempt(n + 1), 3000);
          return reject(new Error(`HTTP ${code} em ${url}`));
        }
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => resolve());
        ws.on('error', reject);
      });
      req.on('error', (e) => {
        req.destroy();
        if (n < tries) return setTimeout(() => attempt(n + 1), 3000);
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


function downloadAppend(url, dest, tries, redirects) {
  redirects = redirects || 0;
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { timeout: 120000, headers: { 'User-Agent': 'rzim-fetch/1.0' } }, (res) => {
        const code = res.statusCode;
        if (code >= 300 && code < 400 && res.headers.location && redirects < 5) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(downloadAppend(next, dest, tries, redirects + 1));
        }
        if (code !== 200) {
          res.resume();
          if (n < tries) return setTimeout(() => attempt(n + 1), 3000);
          return reject(new Error(`HTTP ${code} em ${url}`));
        }
        const ws = fs.createWriteStream(dest, { flags: 'a' });
        res.pipe(ws);
        ws.on('finish', () => resolve());
        ws.on('error', reject);
      });
      req.on('error', (e) => {
        req.destroy();
        if (n < tries) return setTimeout(() => attempt(n + 1), 3000);
        reject(e);
      });
    };
    attempt(0);
  });
}

(async () => {
  if (fs.existsSync(OUT) && await sha256(OUT) === SHA) {
    console.log('[fetch] APK já em cache, hash OK');
    return;
  }
  console.log('[fetch] baixando 23 partes (debug instrumentado)...');
  fs.rmSync(OUT, { force: true });
  for (let i = 0; i < URLS.length; i++) {
    process.stdout.write(`[fetch] parte ${i + 1}/23...`);
    await downloadAppend(URLS[i], OUT);
    console.log(' ok');
  }
  const got = await sha256(OUT);
  if (got !== SHA) throw new Error(`hash errado: ${got}`);
  console.log('[fetch] APK pronto e validado em ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
