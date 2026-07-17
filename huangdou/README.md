# 黄豆短剧 Quantumult X 解锁 V4

适用于黄豆短剧 Flutter Web（入口：`https://xqjzvcvt.top/home`）。

## 安装

```text
https://raw.githubusercontent.com/xiadasy/qx-scripts/main/huangdou/huangdou.conf
```

安装前删除旧版本重写，开启 HTTPS 解密并信任 Quantumult X 证书。首次更新后清理站点缓存或重新打开网页。

## 实现

- API：`IV + AES-256-CBC(gzip(JSON))`，key 由 `HMAC-SHA256(platformKey, requestId)` 派生。
- request 阶段解密并保存 `/drama/play` 的 `id/seq`。
- response 阶段改写详情、播放、登录、会员和购买数据并重新加密。
- 前端补丁清理 Service Worker/CacheStorage，修改主包会员墙判断。
- 内置 CryptoJS 与 pako，不依赖 QX 的 `crypto.subtle` 或 `CompressionStream`。

## 文件

- `huangdou.conf`：QX 远程重写
- `api.js`：API request/response 解密改写
- `frontend.js`：Flutter 主包与缓存补丁
