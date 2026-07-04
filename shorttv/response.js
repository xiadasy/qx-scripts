/* ShortTV authorized security test for Quantumult X */
const CDN = "https://cdn.shorttv.online";
const media = id => CDN + "/uploads/direct/" + id + "/video.mp4";

const SECRET_ITEMS = [
  { id:"cmqx3onj9229y07p0iwsoxuyd", title:"禁忌的喘息第二季", cover:"https://cdn.shorttv.online/images/2026-06-28/cce3acb0-8404-4e38-9f84-073c67a133ce.jpg", totalEpisodes:4 },
  { id:"cmr0hvpto191t07p6yu8bimj0", title:"儿媳觉醒：公公的秘密藏不住", cover:"https://cdn.shorttv.online/images/2026-06-30/fea41053-16b0-4b36-a0e4-d22482a67143.png", totalEpisodes:9 },
  { id:"cmqkof0xc00vu07t8cwqacvsw", title:"AI极品家丁成人完整版", cover:"https://cdn.shorttv.online/images/2026-06-19/9bc242be-3d51-41b0-8686-0ab14da94762.png", totalEpisodes:10 },
  { id:"cmqkbx8o50boi07rxyxx91aze", title:"暮色心囚第一季完整版", cover:"https://cdn.shorttv.online/images/2026-06-19/e164daf8-de69-4321-89bb-cbc92191e42a.png", totalEpisodes:4 },
  { id:"cmqm6xocn0xlf06p9365mua7o", title:"AI自制小短剧善良的嫂子", cover:"https://cdn.shorttv.online/images/2026-06-20/e5abf191-3a8b-44c4-ac75-edda1ac9817d.jpg", totalEpisodes:7 },
  { id:"cmqcfj1o100050bjb8pcac9n8", title:"淫魔重生之情欲江山", cover:"https://cdn.shorttv.online/images/2026-06-18/c68f09de-c7bd-47fa-be37-12e9f4f3cbf7.jpg", totalEpisodes:9 }
].map(x => Object.assign({},x,{price:0,unlocked:true}));

function secretList(){return JSON.stringify([{result:{data:{json:{items:SECRET_ITEMS,nextCursor:null}}}}]);}
function walk(x){
 if(!x||typeof x!=="object")return;
 if("secretUnlocked" in x)x.secretUnlocked=true; if("ageConfirmed" in x)x.ageConfirmed=true;
 if("gap" in x)x.gap=0; if("episodesNeeded" in x)x.episodesNeeded=0; if("balance" in x)x.balance=999999;
 if("requiresAdultConfirm" in x)x.requiresAdultConfirm=false;
 if(!Array.isArray(x)&&typeof x.id==="string"){const e=("isFree" in x)||("locked" in x)||("hlsUrl" in x);if(e){if("isFree" in x)x.isFree=true;if("locked" in x)x.locked=false;if("hlsUrl" in x&&!x.hlsUrl)x.hlsUrl=media(x.id);}}
 Object.keys(x).forEach(k=>walk(x[k]));
}
function flight(body){
 const m=body.match(/\\"episode\\":\{\\"id\\":\\"([^"\\]+)\\"/);
 body=body.replace(/\\"isFree\\":false/g,'\\"isFree\\":true').replace(/\\"locked\\":true/g,'\\"locked\\":false').replace(/\\"secretUnlocked\\":false/g,'\\"secretUnlocked\\":true').replace(/\\"ageConfirmed\\":false/g,'\\"ageConfirmed\\":true').replace(/\\"requiresAdultConfirm\\":true/g,'\\"requiresAdultConfirm\\":false');
 if(m)body=body.replace(/\\"hlsUrl\\":null/,'\\"hlsUrl\\":\\"'+media(m[1])+'\\"'); return body;
}
function rewrite(body,url){url=url||"";if(/secret\.list/.test(url))return secretList();if(!body)return body;try{const x=JSON.parse(body);walk(x);return JSON.stringify(x)}catch(_){return flight(body)}}
if(typeof $done!=="undefined"){const url=typeof $request!=="undefined"?$request.url:"";const body=rewrite($response.body,url);if(/secret\.list/.test(url)){const headers=Object.assign({},$response.headers||{});headers["Content-Type"]="application/json; charset=utf-8";delete headers["Content-Encoding"];delete headers["content-encoding"];delete headers["Content-Length"];delete headers["content-length"]; $done({status:"HTTP/1.1 200 OK",headers,body})}else $done({body})}
if(typeof module!=="undefined")module.exports={rewrite,secretList};
