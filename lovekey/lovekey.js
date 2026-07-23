/**
 * Lovekey 1.8.5 · Quantumult X 修复版
 * 2026-07-23
 */
const APP_VERSION = "v1.8.5";
const APP_NUM = "1.8.5";
const SOURCE = "App store";
const SIGN_SECRET = "BeJsdgiq1azlQItxc93W";
const AES_KEY = "d4XvusEYeafO9SBK";
const GUEST_URL = "https://sea.api.lovekeyboard.com/v2/auth/guest";
const CRYPTO_URL = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";
const CRYPTO_KEY = "Lovekey_CryptoJS_420";
const TOKEN_KEY = "Lovekey_GuestToken_V185";
const TOKEN_TIME_KEY = "Lovekey_GuestTokenTime_V185";
const TOKEN_TTL = 6 * 60 * 60 * 1000;
const CHAT_RE = /\/v1\/chat\/(?:keyboard-(?:ow|stream)-msg|stream_super_msg)/i;
const ACCOUNT_RE = /\/v2\/account(?:\?|$)/i;

function read(key) {
  try {
    if (typeof $prefs !== "undefined") return $prefs.valueForKey(key) || "";
    if (typeof $persistentStore !== "undefined") return $persistentStore.read(key) || "";
  } catch (_) {}
  return "";
}
function write(key, value) {
  try {
    if (typeof $prefs !== "undefined") return $prefs.setValueForKey(String(value), key);
    if (typeof $persistentStore !== "undefined") return $persistentStore.write(String(value), key);
  } catch (_) {}
  return false;
}
function request(options) {
  return new Promise((resolve, reject) => {
    const method = String(options.method || "GET").toUpperCase();
    if (typeof $task !== "undefined") {
      $task.fetch(options).then(r => resolve({ body: r.body, response: r }), e => reject(e && e.error || e));
    } else if (typeof $httpClient !== "undefined") {
      const fn = method === "POST" ? $httpClient.post : $httpClient.get;
      fn(options, (e, r, body) => e ? reject(e) : resolve({ body, response: r }));
    } else reject(new Error("Unsupported environment"));
  });
}
function json(text) {
  try { return JSON.parse(text); } catch (_) { return null; }
}
function installCrypto(code) {
  try { (0, eval)(code); } catch (_) { try { eval(code); } catch (_) {} }
  return typeof CryptoJS !== "undefined" ? CryptoJS :
    (typeof globalThis !== "undefined" ? globalThis.CryptoJS : null);
}
async function loadCrypto() {
  if (typeof CryptoJS !== "undefined") return CryptoJS;
  let code = read(CRYPTO_KEY);
  let C = code ? installCrypto(code) : null;
  if (C) return C;
  const r = await request({ url: CRYPTO_URL, method: "GET", headers: { "accept-encoding": "identity" }, timeout: 15 });
  code = r.body || "";
  C = installCrypto(code);
  if (C) write(CRYPTO_KEY, code);
  return C;
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : r & 3 | 8).toString(16).toUpperCase();
  });
}
function copyHeaders(source) {
  const out = {};
  Object.keys(source || {}).forEach(k => out[k] = source[k]);
  return out;
}
function delHeader(headers, name) {
  Object.keys(headers).forEach(k => {
    if (k.toLowerCase() === name.toLowerCase()) delete headers[k];
  });
}
function setHeader(headers, name, value) {
  const old = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  headers[old || name] = value;
}
function decrypt(C, text) {
  const key = C.enc.Utf8.parse(AES_KEY);
  const bytes = C.AES.decrypt({ ciphertext: C.enc.Base64.parse(text) }, key, {
    mode: C.mode.ECB,
    padding: C.pad.Pkcs7
  });
  return bytes.toString(C.enc.Utf8);
}
function encrypt(C, text) {
  const key = C.enc.Utf8.parse(AES_KEY);
  const result = C.AES.encrypt(C.enc.Utf8.parse(text), key, {
    mode: C.mode.ECB,
    padding: C.pad.Pkcs7
  });
  return result.ciphertext.toString(C.enc.Base64);
}
function patchVip(a) {
  if (!a || typeof a !== "object") return a;
  if (!a.nickname || String(a.nickname).indexOf("游客") === 0) a.nickname = "baby";
  a.guest = false;
  if (!a.member_id || a.member_id <= 0) a.member_id = 99999999;
  a.perpetual_vip = 1;
  a.vip_expired_at = "3742732800";
  a.member_vip = 2;
  a.vip_level = "永久会员";
  a.is_must_vip_keyboard = false;
  a.is_formal = true;
  a.restrict_times = 999999;
  a.free_search_time = 999999;
  a.img_analysis_remain_times = 999;
  a.hy_expired_day = "9999";
  return a;
}
async function createGuestToken() {
  const C = await loadCrypto();
  if (!C) return null;
  const ms = Date.now();
  const ts = Math.floor(ms / 1000);
  const models = ["iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16", "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"];
  const model = models[Math.random() * models.length | 0];
  const id = uuid();
  const prefix = id.replace(/-/g, "").slice(0, 16).padEnd(16, "0");
  const installId = C.MD5(prefix + String(ms)).toString();
  const pairs = [
    ["device[identifier]", id], ["device[name]", model], ["device[platform]", "0"],
    ["install_id", installId], ["source", SOURCE], ["version", APP_VERSION]
  ];
  const query = pairs.map(x => x[0].replace(/\[/g, "%5B").replace(/\]/g, "%5D") + "=" + encodeURIComponent(String(x[1]))).join("&");
  const sign = C.MD5(query + String(ts) + SIGN_SECRET).toString();
  const headers = {
    "User-Agent": `LoveKeyboard/${APP_NUM} (com.fd.lovekeyboard; build:55; iOS 18.5.0) Alamofire/5.10.2`,
    "device-name": "iPhone", "device-band": model, "device-version": "18.5",
    "device-type": "1", channel: "1", "app-version": APP_VERSION,
    "app-locale": "zh-Hans", "app-lan": "zh", timestamp: String(ts), sign,
    authorization: "", accept: "*/*", "content-type": "application/json;charset=utf-8",
    "accept-encoding": "identity", "X-Surge-Skip-Scripting": true
  };
  const body = JSON.stringify({
    version: APP_VERSION,
    install_id: installId,
    device: { name: model, platform: "0", identifier: id },
    source: SOURCE
  });
  const r = await request({ url: GUEST_URL, method: "POST", headers, body, timeout: 15 });
  const wrapped = json(r.body || "");
  if (!wrapped || typeof wrapped.data !== "string") return null;
  const value = json(decrypt(C, wrapped.data));
  return value && value.access_token || null;
}
async function guestToken() {
  const cached = read(TOKEN_KEY);
  const time = parseInt(read(TOKEN_TIME_KEY) || "0", 10) || 0;
  if (cached && Date.now() - time < TOKEN_TTL) return cached;
  const token = await createGuestToken();
  if (token) {
    write(TOKEN_KEY, token);
    write(TOKEN_TIME_KEY, Date.now());
  }
  return token;
}
async function chatRequest() {
  const headers = copyHeaders($request.headers || {});
  const token = await guestToken();
  delHeader(headers, "authorization");
  if (token) setHeader(headers, "Authorization", "Bearer " + token);
  $done({ headers });
}
async function accountResponse() {
  const C = await loadCrypto();
  const wrapped = json($response.body || "");
  if (!C || !wrapped || typeof wrapped.data !== "string") return $done({});
  const account = json(decrypt(C, wrapped.data));
  if (!account) return $done({});
  patchVip(account);
  wrapped.data = encrypt(C, JSON.stringify(account));
  const headers = copyHeaders($response.headers || {});
  setHeader(headers, "Content-Type", "application/json; charset=utf-8");
  delHeader(headers, "Content-Length");
  $done({ body: JSON.stringify(wrapped), headers });
}
(async () => {
  try {
    const url = typeof $request !== "undefined" && $request ? $request.url : "";
    const hasResponse = typeof $response !== "undefined" && !!$response;
    if (url && !hasResponse && CHAT_RE.test(url)) return await chatRequest();
    if (url && hasResponse && ACCOUNT_RE.test(url)) return await accountResponse();
    $done({});
  } catch (_) { $done({}); }
})();
