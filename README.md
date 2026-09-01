# 黄果短剧 · Quantumult X 解析

圈X 重写资源。Safari 打开 [huangguoai.com](https://huangguoai.com) 后，详情页跳播放页，播放页换成系统 HLS。

## 添加解析

圈X → 重写 → 规则资源 → 右上角添加：

https://raw.githubusercontent.com/xiadasy/qx-scripts/main/huangguo/huangguo.conf

打开 HTTPS 解密，信任证书。Safari 进官网点一部剧即可。

## 规则

- `/detail/{id}/` → 302 `/video/{id}/`
- `/video/{id}/`、`/video/{id}/ep-N/` 注入原生播放器
- `*.nkgjoa.cn` / `*.vjxyrj.cn` 的 m3u8、ts、key 补黄果 Referer

播不动用页面上的 nPlayer / Infuse。
