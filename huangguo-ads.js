/**
 * 黄果短剧 · Quantumult X 去广告
 * 类型：script-response-body
 * 匹配：huangguo 站点 HTML（不含 /video/，播放页由 huangguo.js 整页替换）
 *
 * 去掉 SSP 广告位、暂停贴片、广告 SDK 和统计脚本，并塌掉预留高度。
 */

try {
  main();
} catch (e) {
  $done({});
}

function main() {
  const reqUrl = String(($request && $request.url) || "");
  if (/\/video\//i.test(reqUrl) || /\/static\//i.test(reqUrl)) return $done({});

  const headers = ($response && $response.headers) || {};
  const ctype = String(header(headers, "Content-Type") || "").toLowerCase();
  let html = String(($response && $response.body) || "");
  if (!html) return $done({});
  if (ctype && ctype.indexOf("html") === -1 && html.indexOf("<html") === -1 && html.indexOf("<!DOCTYPE") === -1) {
    return $done({});
  }

  html = stripTags(html, /<aside\b[^>]*\b(?:hg-ssp-slot|data-ssp-slot-key)[^>]*>[\s\S]*?<\/aside>/gi);
  html = stripTags(html, /<div\b[^>]*\bhg-ssp-pause\b[^>]*>[\s\S]*?<\/div>/gi);
  html = html.replace(/<script\b[^>]*src=["'][^"']*(?:ssp-core|ssp-mount|tracking\.js|gtag\/js|googletagmanager|mc\.yandex|analytics\.ahrefs|cloudflareinsights\.com\/beacon)[^"']*["'][^>]*>\s*<\/script>/gi, "");
  html = html.replace(/<script\b[^>]*>[\s\S]*?window\.__hgSsp[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script\b[^>]*>[\s\S]*?(?:gtag\(|ym\(|mc\.yandex)[\s\S]*?<\/script>/gi, "");
  html = html.replace(/window\.__hgSsp\s*=\s*\{[\s\S]*?\};?/g, "window.__hgSsp={};");

  const css =
    "<style id=\"hg-qx-adblock\">" +
    "[data-ssp-slot-key],.hg-ssp-slot,.hg-ssp-pause,[aria-label=\"推广\"]," +
    ".hg-ssp-pause__card{display:none!important;height:0!important;min-height:0!important;" +
    "margin:0!important;padding:0!important;overflow:hidden!important;border:0!important}" +
    "</style>";
  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, css + "</head>");
  else html = css + html;

  const out = {};
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (/^(content-length|content-encoding)$/i.test(k)) continue;
    out[k] = headers[k];
  }
  out["Content-Type"] = "text/html; charset=utf-8";
  $done({ body: html, headers: out });
}

function header(headers, name) {
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === name.toLowerCase()) return headers[keys[i]];
  }
  return "";
}

function stripTags(html, re) {
  let prev = "";
  let cur = html;
  while (prev !== cur) {
    prev = cur;
    cur = cur.replace(re, "");
  }
  return cur;
}
