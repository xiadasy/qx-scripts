/**
 * 黄果短剧 · Quantumult X HLS 请求头
 * 类型：script-request-header
 * 匹配：m3u8 / ts / crypt.key 所在 CDN
 *
 * 播放器拉分片时补 Referer，避免部分节点 403。
 */

const headers = $request.headers || {};
const ua =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function setHeader(obj, name, value) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === name.toLowerCase()) {
      obj[keys[i]] = value;
      return;
    }
  }
  obj[name] = value;
}

setHeader(headers, "Referer", "https://huangguoai.com/");
setHeader(headers, "Origin", "https://huangguoai.com");
setHeader(headers, "User-Agent", ua);
setHeader(headers, "Accept", "*/*");

$done({ headers: headers });
