# Lovekey 键盘 1.8.5（Quantumult X）

适配 Lovekey iOS `1.8.5`。

## QX 订阅

```text
https://raw.githubusercontent.com/xiadasy/qx-scripts/main/lovekey/lovekey.conf
```

备用 CDN：

```text
https://cdn.jsdelivr.net/gh/xiadasy/qx-scripts@main/lovekey/lovekey.conf
```

## 修复内容

- 适配 `v1.8.5` 访客注册及签名协议；
- 内置 MD5、AES-128-ECB/PKCS7，不再下载第三方 `Utils.js`；
- 修复 `/v2/account` 加密响应中的会员状态；
- 修复聊天、开场白和超级对话请求鉴权；
- 缓存访客 Token 6 小时，减少重复注册。

## 使用

1. Quantumult X → 重写 → 引用，添加上面的订阅链接；
2. 开启 MitM，并信任 Quantumult X 证书；
3. 删除或停用旧版 Lovekey 重写，避免重复命中；
4. 强制退出 Lovekey 后重新打开。

## 已验证

- JavaScript 语法；
- MD5 签名；
- AES 解密/重加密；
- `v2/auth/guest` 访客登录；
- `v2/account` 账号改写；
- `stream_super_msg` 聊天鉴权与正常返回。
