/**
 * 黑料网 (yrc8b.aeevdzyk.cc / heiliao.com) 去广告
 * Quantumult X · script-response-body 重写
 *
 * 原理：
 *   1) 广告 DOM 由服务端 SSR 直出在 HTML 中（.tjtagmanager / .popup-form / .slf-ad-list / .ad-item / swiper-slide）
 *   2) tjtag.3.2.6.js 是自研广告 SDK，负责扫描广告位、上报曝光、处理点击跳转
 *   3) opendsp.vip/flutter-loader.js 是接的 DSP 广告联盟
 *   配合 .conf 里的 reject 拦截上述 SDK 后，本脚本再清理掉 SSR 已写入的广告 DOM，
 *   并用 MutationObserver 兜底删除后续被其他 JS（popup.js / homepage.js）动态插入的广告。
 *
 * 注入位置：</body> 之前，此时 SSR 广告 DOM 已在文档中，可被即时清理。
 */

(function () {
    var body = $response.body;
    var headers = $response.headers || {};
    var ct = headers["Content-Type"] || headers["content-type"] || "";

    // 只处理 HTML 文档，其余资源（js/css/图片/字体）原样放行
    if (
        String(ct).indexOf("text/html") === -1 &&
        String(ct).indexOf("application/xhtml") === -1
    ) {
        $done({});
        return;
    }
    if (!body || typeof body !== "string") {
        $done({});
        return;
    }

    var inject = [
        "(function(){",
        "  'use strict';",
        "  // 黑料网去广告注入 by 阿伟的小助手",
        "  var SEL = [",
        "    '.popup-form',                 // 弹窗广告（含 popup-img / popup-wrapper 公告宫格）",
        "    '.popup-img',                  // 弹窗广告图",
        "    '.slf-ad-list',                // 横排广告列表容器",
        "    '.slf-ad-list-horizontal',",
        "    '.slf-ad-list-vertical',",
        "    '.slf-ad-list-type-a',",
        "    '.ad-item',                    // 广告列表项",
        "    '.ad-image-box',               // 详情页广告图片容器",
        "    '.list-sec-top',               // 详情页顶部标签广告 C1",
        "    '.swiper-slide.tjtagmanager',  // 底部悬浮滑动广告",
        "    '.van-grid-item__icon.tjtagmanager', // 弹窗宫格广告图标",
        "    '[data-event=\"ad_click\"]', // 广告点击埋点元素",
        "    '[data-ad_slot_key]',          // 广告位元素",
        "    '.gotoclick.tjtagmanager'      // 详情页跳转广告",
        "  ].join(',');",
        "  // CSS 先隐藏，避免脚本删除前广告闪现",
        "  try{ var st=document.createElement('style'); st.id='hlw-adblock-style'; st.textContent=SEL+'{display:none!important;visibility:hidden!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}'; (document.head||document.documentElement).appendChild(st); }catch(e){}",
        "  function rm(sel){ try{ document.querySelectorAll(sel).forEach(function(el){ el.remove(); }); }catch(e){} }",
        "  var cleaning=false;",
        "  function clean(){",
        "    if(cleaning) return; cleaning=true;",
        "    rm(SEL);",
        "    // 兜底：所有广告标记元素一并移除（tjtagmanager 为广告专属标记）",
        "    try{ document.querySelectorAll('.tjtagmanager').forEach(function(el){ el.remove(); }); }catch(e){} ",
        "    // 清掉空广告容器残留",
        "    try{ document.querySelectorAll('.slf-ad-list-type-a, .ad-list, [class*=\"slf-ad\"], .detail-list-title').forEach(function(el){",
        "      if((!el.children.length) && (!el.textContent.trim())) el.remove();",
        "    }); }catch(e){}",
        "    cleaning=false;",
        "  }",
        "  var mo = null;",
        "  function bind(){",
        "    if (mo || !document.body) return;",
        "    try{",
        "      var queued=false;",
        "      mo = new MutationObserver(function(){ if(queued)return; queued=true; setTimeout(function(){queued=false;clean();},0); });",
        "      mo.observe(document.body, { childList:true, subtree:true });",
        "      // 播放/暂停/点击时再清一次，覆盖视频贴片、暂停广告和点击后延迟广告",
        "      ['play','pause','click','visibilitychange'].forEach(function(ev){ document.addEventListener(ev,clean,true); });",
        "    }catch(e){}",
        "  }",
        "  function run(){ clean(); bind(); }",
        "  if (document.body) run();",
        "  else document.addEventListener('DOMContentLoaded', run);",
        "  // 持续兜底：详情页广告可能在播放或停留数秒后才插入",
        "  setTimeout(clean, 300);",
        "  setTimeout(clean, 1000);",
        "  setTimeout(clean, 3000);",
        "  setTimeout(clean, 8000);",
        "  setTimeout(clean, 15000);",
        "})();"
    ].join("\n");

    var tag = "<script>" + inject + "</script>";
    var newBody;
    if (body.indexOf("</body>") !== -1) {
        newBody = body.replace(/<\/body>/i, tag + "</body>");
    } else if (body.indexOf("</html>") !== -1) {
        newBody = body.replace(/<\/html>/i, tag + "</html>");
    } else {
        newBody = body + tag;
    }

    $done({ body: newBody });
})();
