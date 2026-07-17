/**
 * 黄豆短剧前端补丁 V4
 * - HTML: 禁用旧 Service Worker 缓存，给 main.js 加版本 query 强制走网络
 * - main.js: ano 永远 false / anL free / qu 不弹购买 / 锁图标清除
 */
(function () {
  var url = String($request.url || "");
  var body = $response.body;
  if (typeof body !== "string" || body.length < 100) return $done({});
  var n = 0;

  if (/main(\.[a-f0-9]+)?\.js(?:\?|$)/i.test(url) || body.indexOf("ano(a){var s,r=this.Id(a)") >= 0) {
    var reps = [
      [
        "ano(a){var s,r=this.Id(a)\nif(r==null)s=null\nelse{s=r.e\ns=!(s===\"free\"||s===\"\")&&!r.r}return s===!0||this.y.q(0,a)}",
        "ano(a){return!1}"
      ],
      [
        'anL(a){var s,r=this.Id(a)\nif(r==null)return"vip"\ns=r.e\nif(s==="coin")return"coin"\nif(s==="points")return"points"\nreturn"vip"}',
        'anL(a){return"free"}'
      ],
      ["qu(a){return this.bid(a)}", "qu(a){return null}"],
      [
        'if(s==="vip")return B.rU\nif(s==="coin")return B.zA\nif(s==="points")return B.L0\nreturn B.iJ',
        "return B.iJ"
      ],
      [
        'if(s==="vip")return B.rU\nif(s==="coin"||s==="money")return B.zA\nreturn B.iJ',
        "return B.iJ"
      ]
    ];
    reps.forEach(function (x) {
      if (body.indexOf(x[0]) >= 0) {
        body = body.split(x[0]).join(x[1]);
        n++;
      }
    });
    // 宽松兜底 ano
    if (body.indexOf("ano(a){return!1}") < 0) {
      var i = body.indexOf("ano(a){var s,r=this.Id(a)");
      var end = body.indexOf("return s===!0||this.y.q(0,a)}", i);
      if (i >= 0 && end > i && end - i < 300) {
        var oldLen = "return s===!0||this.y.q(0,a)}".length;
        body = body.slice(0, i) + "ano(a){return!1}" + body.slice(end + oldLen);
        n++;
      }
    }
    console.log("[HDF] main patches=" + n);
    if (!n) return $done({});
    var hs = {};
    var src = $response.headers || {};
    for (var k in src) {
      var l = String(k).toLowerCase();
      if (l !== "content-length" && l !== "content-encoding") hs[k] = src[k];
    }
    hs["Content-Type"] = "application/javascript; charset=utf-8";
    return $done({ body: body, headers: hs });
  }

  // SPA HTML：强制 main 请求变化，绕过 SW / CacheStorage 旧包
  if (/<html/i.test(body) && body.indexOf("main.") >= 0) {
    body = body.replace(/(main\.[a-f0-9]+\.js)(?!\?)/gi, "$1?hdqx=v4");
    // 不再注册 sw.js
    body = body.replace(/navigator\.serviceWorker\.register\(['"]sw\.js['"]\)/g, "Promise.resolve(null)");
    var clear = '<script>(function(){try{if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(function(a){a.forEach(function(r){r.unregister()})});if(window.caches)caches.keys().then(function(a){a.forEach(function(k){caches.delete(k)})})}catch(e){}})();</script>';
    body = body.replace("</head>", clear + "</head>");
    console.log("[HDF] html cache bypass");
    var hh = {};
    var sh = $response.headers || {};
    for (var x in sh) {
      var lx = String(x).toLowerCase();
      if (lx !== "content-length" && lx !== "content-encoding") hh[x] = sh[x];
    }
    hh["Content-Type"] = "text/html; charset=utf-8";
    return $done({ body: body, headers: hh });
  }

  $done({});
})();
