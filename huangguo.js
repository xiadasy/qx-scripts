/**
 * 黄果短剧 · Quantumult X
 * 类型：script-response-body
 * 匹配：^https?://(www\.)?huangguoai\.(com|ai)/video/
 *
 * 站点播放页已经从 /play/ 改成 /video/{id}/ 和 /video/{id}/ep-N/，
 * 真实地址在 <script id="videoInitialData"> 的 videoSrc / epPlaySrcs。
 * 本脚本把播放页换成 iOS 原生 HLS 播放器，并保留选集、nPlayer / Infuse。
 */

const SITE = "https://huangguoai.com";
const ACCENT = "#ff9500";

try {
  main();
} catch (e) {
  $done({});
}

function main() {
  const html = String(($response && $response.body) || "");
  if (!html) return $done({});

  const data = parseInitialData(html);
  const fromUrl = parseUrl($request.url);
  const vid = String((data && data.id) || fromUrl.vid || "");
  const ep = pickEp(data, fromUrl);
  const srcs = (data && data.epPlaySrcs && typeof data.epPlaySrcs === "object") ? data.epPlaySrcs : {};
  let play = pickPlay(data, srcs, ep);
  if (!play) play = scanMediaUrl(html);
  play = cleanUrl(play);

  const title = buildTitle(data, ep);
  const episodes = buildEpisodes(html, vid, srcs, fromUrl.vid || vid);

  const headers = sanitizeHeaders(($response && $response.headers) || {});
  headers["Content-Type"] = "text/html; charset=utf-8";

  $done({ body: renderPage({ title, play, ep, vid, episodes, rawTitle: (data && data.title) || "" }), headers });
}

function parseInitialData(html) {
  const m = html.match(/id=["']videoInitialData["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch (e) {
    return null;
  }
}

function parseUrl(u) {
  const m = String(u || "").match(/\/video\/(\d+)(?:\/ep-(\d+))?/i);
  return {
    vid: m ? m[1] : "",
    ep: m && m[2] ? m[2] : "",
  };
}

function pickEp(data, fromUrl) {
  if (fromUrl.ep) return String(fromUrl.ep);
  if (data && data.ep != null && String(data.ep) !== "") return String(data.ep);
  return "1";
}

function pickPlay(data, srcs, ep) {
  const wanted = String(ep == null ? "" : ep).trim();
  let play = "";
  if (wanted) {
    play = srcs[wanted] || "";
    if (!play) {
      const n = parseInt(wanted, 10);
      if (!isNaN(n)) {
        const keys = Object.keys(srcs);
        for (let i = 0; i < keys.length; i++) {
          if (parseInt(keys[i], 10) === n) {
            play = srcs[keys[i]];
            break;
          }
        }
      }
    }
  }
  if (!play && data) play = data.videoSrc || data.previewSrc || "";
  if (!play) {
    const keys = Object.keys(srcs);
    if (keys.length === 1) play = srcs[keys[0]];
  }
  return play;
}

function cleanUrl(u) {
  u = unescapeUrl(String(u || ""));
  if (!u) return "";
  if (u.indexOf("//") === 0) u = "https:" + u;
  if (u.indexOf("http") !== 0) {
    const mm = u.match(/(https?:\/\/[^\s"']+)/);
    u = mm ? mm[1] : "";
  }
  return u;
}

function unescapeUrl(u) {
  return String(u || "")
    .replace(/\\u0026/g, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function scanMediaUrl(html) {
  const re = /https?:\/\/[^"'\s\\<>]+\.(?:m3u8|mp4)(?:\?[^"'\s\\<>]*)?/gi;
  const hits = [];
  let m;
  while ((m = re.exec(html)) !== null) hits.push(m[0]);
  if (!hits.length) {
    const re2 = /https?:(?:\\\/|\/)+[^"'\s<>]+?\.(?:m3u8|mp4)/gi;
    let m2;
    while ((m2 = re2.exec(html)) !== null) hits.push(unescapeUrl(m2[0]));
  }
  for (let i = 0; i < hits.length; i++) if (hits[i].indexOf(".m3u8") !== -1) return hits[i];
  return hits[0] || "";
}

function buildTitle(data, ep) {
  const name = (data && (data.title || data.vod_name)) || "黄果短剧";
  const n = parseInt(ep, 10);
  if (!isNaN(n) && n > 0) return name + " 第" + n + "集";
  return name;
}

function buildEpisodes(html, vid, srcs, urlVid) {
  const id = String(vid || urlVid || "");
  const map = {};

  const keys = Object.keys(srcs || {});
  for (let i = 0; i < keys.length; i++) {
    const n = parseInt(keys[i], 10);
    if (isNaN(n) || n <= 0) continue;
    map[n] = {
      n: n,
      src: cleanUrl(srcs[keys[i]]),
      href: epHref(id, n),
    };
  }

  const re = /<a\b[^>]*href="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const vm = href.match(/\/video\/(\d+)(?:\/ep-(\d+))?/i);
    if (!vm) continue;
    if (id && vm[1] !== id) continue;
    const n = vm[2] ? parseInt(vm[2], 10) : 1;
    if (isNaN(n) || n <= 0) continue;
    if (!map[n]) map[n] = { n: n, src: "", href: epHref(id || vm[1], n) };
  }

  const epIdRe = /data-ep-id="(\d+)"/g;
  while ((m = epIdRe.exec(html)) !== null) {
    const n = parseInt(m[1], 10);
    if (isNaN(n) || n <= 0) continue;
    if (!map[n]) map[n] = { n: n, src: "", href: epHref(id, n) };
  }

  return Object.keys(map)
    .map(function (k) { return map[k]; })
    .sort(function (a, b) { return a.n - b.n; });
}

function epHref(vid, n) {
  if (!vid) return SITE + "/";
  if (n <= 1) return SITE + "/video/" + vid + "/";
  return SITE + "/video/" + vid + "/ep-" + n + "/";
}

function sanitizeHeaders(headers) {
  const h = {};
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (/^(content-length|content-encoding|content-security-policy|x-frame-options)$/i.test(k)) continue;
    h[k] = headers[k];
  }
  return h;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage(opt) {
  const payload = {
    play: opt.play || "",
    ep: String(opt.ep || "1"),
    vid: String(opt.vid || ""),
    title: opt.rawTitle || opt.title || "",
    episodes: opt.episodes || [],
  };
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const hasPlay = !!opt.play;
  const nplayer = hasPlay ? String(opt.play).replace(/^https:\/\//i, "nplayer-https://").replace(/^http:\/\//i, "nplayer-http://") : "";
  const infuse = hasPlay ? "infuse://x-callback-url/play?url=" + encodeURIComponent(opt.play) : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"/>
<meta name="referrer" content="no-referrer"/>
<title>${esc(opt.title)}</title>
<style>
:root{--bg:#0b0b0d;--card:#16161a;--line:#2a2a30;--txt:#f5f5f7;--sub:#8e8e93;--acc:${ACCENT};}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC",sans-serif}
body{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
header{padding:14px 16px 8px}
header .k{font-size:12px;color:var(--sub);letter-spacing:.08em}
header h1{margin:6px 0 0;font-size:18px;line-height:1.35;font-weight:700}
.stage{margin:8px 12px 12px;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9}
video{width:100%;height:100%;display:block;background:#000}
.empty{height:100%;display:flex;align-items:center;justify-content:center;color:var(--sub);padding:20px;text-align:center;font-size:14px}
.bar{display:flex;gap:8px;padding:0 12px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.bar a,.bar button{flex:none;border:0;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:600;background:var(--card);color:var(--txt);text-decoration:none}
.bar .pri{background:var(--acc);color:#111}
.sec{padding:4px 16px 18px}
.sec h2{margin:0 0 10px;font-size:14px;color:var(--sub);font-weight:600}
.eps{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.eps a,.eps button{appearance:none;border:0;border-radius:10px;background:var(--card);color:var(--txt);padding:10px 0;font-size:13px;font-weight:600;text-align:center;text-decoration:none}
.eps .on{background:var(--acc);color:#111}
.tip{padding:0 16px 24px;color:var(--sub);font-size:12px;line-height:1.5}
</style>
</head>
<body>
<header>
  <div class="k">HUANGGUO · QX</div>
  <h1 id="title">${esc(opt.title)}</h1>
</header>
<div class="stage">
  ${hasPlay
    ? `<video id="player" controls playsinline webkit-playsinline preload="auto" src="${esc(opt.play)}"></video>`
    : `<div class="empty">这一集没有解析到 m3u8。返回首页换一部，或检查圈X 已启用 MITM / 重写。</div>`}
</div>
<div class="bar">
  ${hasPlay ? `<a class="pri" href="${esc(nplayer)}">nPlayer</a>` : ""}
  ${hasPlay ? `<a href="${esc(infuse)}">Infuse</a>` : ""}
  ${hasPlay ? `<button id="copy" type="button">复制 m3u8</button>` : ""}
  <a href="${SITE}/">回首页</a>
</div>
<div class="sec">
  <h2>选集</h2>
  <div class="eps" id="eps"></div>
</div>
<p class="tip">Safari / 圈X 内置浏览器可直接播加密 HLS。播不动就用 nPlayer 或 Infuse。详情页已 302 到播放页。</p>
<script>
const DATA = ${json};
const SITE = ${JSON.stringify(SITE)};
const epsBox = document.getElementById("eps");
const player = document.getElementById("player");
const titleEl = document.getElementById("title");
let current = String(DATA.ep || "1");

function epHref(vid, n) {
  if (!vid) return SITE + "/";
  if (n <= 1) return SITE + "/video/" + vid + "/";
  return SITE + "/video/" + vid + "/ep-" + n + "/";
}
function label(n) {
  const s = String(n);
  return s.length < 2 ? ("0" + s) : s;
}
function setActive() {
  const nodes = epsBox.querySelectorAll("[data-ep]");
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].className = String(nodes[i].getAttribute("data-ep")) === String(current) ? "on" : "";
  }
}
function playSrc(src, n, href) {
  current = String(n);
  setActive();
  if (src && player) {
    player.src = src;
    player.play().catch(function(){});
    if (titleEl && DATA.title) titleEl.textContent = DATA.title + " 第" + n + "集";
    const copy = document.getElementById("copy");
    if (copy) copy.setAttribute("data-url", src);
    return;
  }
  location.href = href || epHref(DATA.vid, n);
}
function renderEps() {
  const list = DATA.episodes || [];
  if (!list.length) {
    epsBox.innerHTML = '<div style="grid-column:1/-1;color:#8e8e93;font-size:13px">没有集数</div>';
    return;
  }
  epsBox.innerHTML = "";
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const a = document.createElement("a");
    a.href = item.href || epHref(DATA.vid, item.n);
    a.textContent = label(item.n);
    a.setAttribute("data-ep", String(item.n));
    a.addEventListener("click", function (e) {
      e.preventDefault();
      playSrc(item.src, item.n, item.href);
    });
    epsBox.appendChild(a);
  }
  setActive();
}
renderEps();
if (player) {
  player.addEventListener("error", function () {
    const t = document.getElementById("title");
    if (t) t.textContent = (DATA.title || "播放失败") + " · 点 nPlayer";
  });
}
const copyBtn = document.getElementById("copy");
if (copyBtn) {
  copyBtn.setAttribute("data-url", DATA.play || "");
  copyBtn.addEventListener("click", function () {
    const url = copyBtn.getAttribute("data-url") || DATA.play || "";
    if (!url) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function(){ copyBtn.textContent = "已复制"; }, function(){ prompt("m3u8", url); });
    } else {
      prompt("m3u8", url);
    }
  });
}
</script>
</body>
</html>`;
}
