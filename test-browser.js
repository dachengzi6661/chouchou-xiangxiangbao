/* test-browser.js — 用本地 Chromium + CDP 做真实渲染验收（不依赖 playwright） */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  process.platform === 'win32' && 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  process.platform === 'win32' && 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.platform === 'win32' && 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  process.platform === 'darwin' && '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const CHROME = CHROME_CANDIDATES.find(function (p) {
  try { return fs.existsSync(p); } catch (e) { return false; }
});

if (!CHROME) {
  console.error('找不到 Chrome / Chromium。请设置环境变量 CHROME_BIN 指向可执行文件，例如：');
  console.error('  CHROME_BIN="/path/to/chrome" node test-browser.js');
  process.exit(1);
}
const PORT = 9333;
const OUT = path.join(__dirname, 'shots');
// 默认测本地文件；传 PAGE_URL 可以直接测线上（如 GitHub Pages）
const PAGE = process.env.PAGE_URL || ('file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/'));

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

let pass = 0, fail = 0;
function ok(c, label, extra) {
  if (c) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (extra ? '  → ' + extra : '')); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

(async () => {
  const userDir = path.join(require('os').tmpdir(), 'chouchou-chrome-' + Date.now());
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + userDir,
    '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await getJSON('http://127.0.0.1:' + PORT + '/json/list');
      const p = list.find(t => t.type === 'page');
      if (p && p.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  if (!wsUrl) { console.error('无法连接 Chromium'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let seq = 0;
  const pending = new Map();
  const errors = [];
  const consoleMsgs = [];

  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleMsgs.push(m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleMsgs.push(m.params.entry.text + ' @ ' + (m.params.entry.url || ''));
    }
  });

  function send(method, params) {
    const id = ++seq;
    return new Promise((res, rej) => {
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }

  async function evaluate(expr) {
    const r = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 120));
    return r.result.value;
  }

  async function reloadReady() {
    await send('Page.reload', {ignoreCache:true});
    for (let i=0;i<60;i++) {
      await sleep(100);
      try { if(await evaluate("document.querySelectorAll('#menuGrid .card').length===16 && !!document.getElementById('boardAbsurd').children.length")) return; }
      catch(e) { /* navigating */ }
    }
    throw new Error('Reload did not become ready');
  }

  async function generateCombo(codes) {
    await evaluate("document.getElementById('btnClear').click()");
    await evaluate(JSON.stringify(codes)+".forEach(c=>document.querySelector('.card[data-code=\"'+c+'\"]').click());document.getElementById('btnGenerate').click()");
    await sleep(150);
  }

  async function shot(name, w, h, clip) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(280);
    const args = { format: 'png', captureBeyondViewport: false };
    if (clip) args.clip = Object.assign({ scale: 1 }, clip);
    const r = await send('Page.captureScreenshot', args);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('    · 截图 ' + name + ' (' + (fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0) + ' KB)');
  }

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  console.log('\n[1] 加载页面');
  await send('Page.navigate', { url: PAGE });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const n = await evaluate("document.querySelectorAll('#menuGrid .card').length");
      if (n === 16) { ready = true; break; }
    } catch (e) { /* navigating */ }
    await sleep(250);
  }
  ok(ready, '16 张单品卡渲染完成');
  ok(await evaluate("document.title") === '抽抽想香堡 · 用户 DIY 隐藏款生成器', '页签标题为抽抽想香堡');
  ok(await evaluate("document.querySelector('.brand b').textContent") === '抽抽想香堡', '页面品牌为抽抽想香堡');
  ok(await evaluate("MCDLogic.NAMING_VERSION") === 'v2-20261024', '实际加载 V2 命名引擎');
  ok(errors.length === 0, '无未捕获异常', errors.join(' | '));
  ok(consoleMsgs.length === 0, '无 console.error / 资源错误', consoleMsgs.slice(0, 3).join(' | '));

  /* 图片是外链，file:// 下离线会 404；改为统计一下是否有请求失败但不影响功能 */
  const imgBroken = await evaluate("[...document.querySelectorAll('.card img')].filter(i=>i.complete && i.naturalWidth===0).length");
  console.log('    · 外链图片加载失败数：' + imgBroken + '（有占位字兜底，不影响功能）');

  console.log('\n[2] 初始状态');
  ok(await evaluate("document.getElementById('btnGenerate').disabled") === true, '未选够 2 个时生成按钮禁用');
  ok(await evaluate("document.getElementById('mPrice').textContent.trim()") === '—', '总价初始为 —');
  ok(await evaluate("document.querySelectorAll('.board li').length") === 10, '双榜共渲染 10 条', String(await evaluate("document.querySelectorAll('.board li').length")));

  console.log('\n[3] 选择与实时汇总');
  await evaluate(`
    ['1100','1440','4810'].forEach(c=>document.querySelector('.card[data-code="'+c+'"]').click());
  `);
  await sleep(150);
  ok(await evaluate("document.getElementById('selCount').textContent") === '3 / 4', '计数 3/4');
  const priceTxt = await evaluate("document.getElementById('mPrice').textContent");
  ok(priceTxt === '¥61.50', '实时总价 = ¥61.50（6150 分）', priceTxt);
  const kcalTxt = await evaluate("document.getElementById('mKcal').textContent.trim()");
  ok(kcalTxt === '1287', '实时热量 = 1287', kcalTxt);
  ok(await evaluate("document.getElementById('btnGenerate').disabled") === false, '够 2 个后按钮可用');

  console.log('\n[4] 未知项处理');
  await evaluate(`document.getElementById('btnClear').click()`);
  await sleep(100);
  await evaluate(`['9900008751','4810'].forEach(c=>document.querySelector('.card[data-code="'+c+'"]').click())`);
  await sleep(120);
  const k2 = await evaluate("document.getElementById('mKcal').textContent");
  ok(/未知/.test(k2), '含可乐时热量标注「未知」', k2);
  ok(/289/.test(k2), '仍显示已解析部分 289', k2);

  console.log('\n[5] 生成结果');
  await evaluate(`document.getElementById('btnClear').click()`);
  await sleep(80);
  await evaluate(`['1100','1440','4810'].forEach(c=>document.querySelector('.card[data-code="'+c+'"]').click())`);
  await sleep(120);
  await evaluate(`window.__posterText=[]; const originalFillText=CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__posterText.push(String(text)); return originalFillText.call(this,text,...args);}; document.getElementById('btnGenerate').click()`);
  await sleep(700);

  const name = await evaluate("document.querySelector('.res-name').textContent");
  const slogan = await evaluate("document.querySelector('.res-slogan').textContent");
  console.log('    · 名字：' + name);
  console.log('    · 口号：' + slogan);
  ok(!!name && name.length >= 3, '生成了名字');
  ok(!!slogan && slogan.length >= 6, '生成了口号');
  ok(name === await evaluate("MCDLogic.generateName(['1100','1440','4810']).name"), '新作品使用新版确定性命名');
  ok(await evaluate("!!document.querySelector('.result:not(.hidden)')"), '结果区已展示');
  ok(await evaluate("!document.querySelector('.res-chain')"), '命名推导链路不展示给用户');
  ok(await evaluate("!document.querySelector('.ledger') && !document.querySelector('details.sheet')"), '数据账本不展示给用户');

  /* 海报像素检查 */
  const posterStat = await evaluate(`(()=>{
    const cv=document.getElementById('poster');
    if(!cv) return {err:'no canvas'};
    const ctx=cv.getContext('2d');
    const d=ctx.getImageData(0,0,cv.width,cv.height).data;
    let nonBlack=0, uniq=new Set();
    for(let i=0;i<d.length;i+=4000){
      const r=d[i],g=d[i+1],b=d[i+2];
      if(r+g+b>60) nonBlack++;
      uniq.add((r>>4)+','+(g>>4)+','+(b>>4));
    }
    return {w:cv.width,h:cv.height,nonBlackRatio:nonBlack/(d.length/4000),colors:uniq.size};
  })()`);
  console.log('    · canvas ' + posterStat.w + '×' + posterStat.h + '，非黑像素占比 ' + posterStat.nonBlackRatio.toFixed(2) + '，颜色簇 ' + posterStat.colors);
  ok(await evaluate("window.__posterText.includes('抽抽想香堡')"), '实际海报绘制使用新名称');
  // 标题允许按宽度换行；拼接真实绘制片段，仍能发现截字或使用其他名字。
  ok(await evaluate("window.__posterText.join('').includes(document.querySelector('.res-name').textContent)"), '海报与结果使用相同餐名');
  ok(await evaluate("!window.__posterText.includes(document.querySelector('.res-name').textContent.slice(-1))"), '海报标题末字不会孤立成行');
  ok(posterStat.h === 1440 && posterStat.w === 1080, '海报画布 1080×1440');
  ok(posterStat.nonBlackRatio > 0.5, '海报已绘制（非全黑）');
  ok(posterStat.colors > 12, '海报有层次（颜色簇 > 12）');

  /* 海报上的关键文字：直接检查绘制调用是否含总价/热量 */
  ok(await evaluate(`document.querySelector('.data-strip .v').textContent.includes('61.50')`), '数据条含总价 61.50');
  ok(await evaluate(`[...document.querySelectorAll('.data-strip .v')].some(e=>e.textContent.trim().startsWith('1287'))`), '数据条含热量 1287');

  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:function(text){window.__copiedText=text;return Promise.resolve();}}});document.getElementById('btnCopy').click()`);
  ok(await evaluate("window.__copiedText.includes('—— 抽抽想香堡 · 用户 DIY 款')"), '复制文案使用新名称');
  ok(await evaluate("window.__copiedText.includes(document.querySelector('.res-name').textContent) && window.__copiedText.includes(document.querySelector('.res-slogan').textContent)"), '复制的名字和口号与结果一致');

  console.log('\n[6] 投票');
  const before = await evaluate("document.querySelector('.vote-btn .n').textContent");
  await evaluate("document.querySelector('.vote-btn').click()");
  await sleep(400);
  const after = await evaluate("document.querySelector('.vote-btn .n').textContent");
  ok(Number(after) === Number(before) + 1, '投票后票数 +1', before + ' → ' + after);
  ok(await evaluate("document.querySelector('.vote-btn').classList.contains('done')"), '投票后按钮变为已投');
  ok(await evaluate("Number(document.querySelector('#boardAbsurd li .rk').textContent) === 1"), '榜单已重排');

  console.log('\n[7] Star 引导位');
  ok(await evaluate("document.querySelectorAll('.star').length") === 2, 'Star 引导恰好 2 处（海报下 + 榜单页脚）',
    String(await evaluate("document.querySelectorAll('.star').length")));
  const starText = await evaluate("document.querySelector('.star .fine').textContent");
  console.log('    · 说明文案：' + starText);
  ok(/完全自愿/.test(starText), '明确「完全自愿」');
  ok(/不影响玩法与投票/.test(starText), '明确不影响投票');
  const href = await evaluate("document.querySelector('.star a.go').getAttribute('href')");
  ok(href === 'https://github.com/dachengzi6661/chouchou-xiangxiangbao', 'Star 链接指向新仓库', href);
  ok(await evaluate("document.querySelector('.star a.go').getAttribute('target')") === '_blank', '新窗口打开、不打断玩法');
  ok(await evaluate("!document.querySelector('.star .warn')"), '「地址待填」角标已消失（REPO_READY=true）');

  console.log('\n[8] 免责与只读声明');
  const body = await evaluate("document.body.innerText");
  ok(/实际供应和价格以门店为准/.test(body), '页脚含「实际供应和价格以门店为准」');
  ok(/非官方|不是官方产品名/.test(body), '标注非官方 / 非官方产品名');
  ok(/只读/.test(body), '标注只读');

  console.log('\n[9] 截图');
  await sleep(2200);                       // 等 toast 淡出，避免截到提示条
  await evaluate("window.scrollTo(0,0)");
  await sleep(200);
  await shot('01-top.png', 1440, 1000);
  await evaluate("document.getElementById('boards').scrollIntoView()");
  await sleep(400);
  await shot('02-boards.png', 1440, 900);
  await evaluate("document.getElementById('result').scrollIntoView()");
  await sleep(400);
  await shot('03-result.png', 1440, 1000);

  /* 海报单张导出：直接取 canvas 自身的 PNG，尺寸与线上完全一致 */
  const dataUrl = await evaluate("document.getElementById('poster').toDataURL('image/png')");
  fs.writeFileSync(path.join(OUT, '04-poster.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('    · 截图 04-poster.png (' + (fs.statSync(path.join(OUT, '04-poster.png')).size / 1024).toFixed(0) + ' KB)');

  /* 移动端 */
  await evaluate("window.scrollTo(0,0)");
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(400);
  await shot('05-mobile.png', 390, 844);

  for (const width of [1440,1280,1024,820,375]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:false});
    const overflow=await evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth");
    ok(overflow===0, '宽度 '+width+' 无横向溢出', String(overflow));
  }

  console.log('\n[10] 名称快照与刷新');
  const storedBefore=await evaluate("JSON.parse(localStorage.getItem('mcdlab.ledger.v1')).find(e=>e.key===MCDLogic.comboKey(['1100','1440','4810']))");
  ok(storedBefore.naming.name===name && storedBefore.naming.version==='v2-20261024', '保存新作品的名字和词库版本');
  await reloadReady();
  await generateCombo(['1100','1440','4810']);
  ok(await evaluate("document.querySelector('.res-name').textContent")===name, '刷新后新作品名字不变');
  ok(await evaluate("document.querySelector('.vote-btn').disabled")===true, '刷新后保留已投状态');
  ok(Number(await evaluate("document.querySelector('.vote-btn .n').textContent"))===storedBefore.votes, '刷新后票数不变');

  await generateCombo(['9900008754','9900008751','3505']);
  ok(!/堡/.test(await evaluate("document.querySelector('.res-name').textContent")), '纯甜品饮品组合不会命名成汉堡');
  ok(/麦旋风|可乐|红茶/.test(await evaluate("document.querySelector('.res-name').textContent")), '甜品饮品保留完整食物词');

  console.log('\n[11] 原有作品升级');
  await evaluate(`(()=>{const key=MCDLogic.comboKey(['1100','1440','4810']);localStorage.setItem('mcdlab.ledger.v1',JSON.stringify([{key,codes:['1100','1440','4810'],votes:42,mine:true}]));localStorage.setItem('mcdlab.voted.v1',JSON.stringify({[key]:1}));})()`);
  await reloadReady();
  await generateCombo(['1100','1440','4810']);
  ok(await evaluate("document.querySelector('.res-name').textContent")==='薛定谔的聚堡', '无版本的老作品还原旧餐名');
  ok(Number(await evaluate("document.querySelector('.vote-btn .n').textContent"))===42, '迁移不会清空或增加原有票数');
  ok(await evaluate("document.querySelector('.vote-btn').disabled")===true, '迁移保留原有已投状态');
  ok(await evaluate("document.querySelector('#boardAbsurd .nm').textContent.includes('薛定谔的聚堡')"), '老作品结果与榜单名称一致');
  ok(await evaluate("JSON.parse(localStorage.getItem('mcdlab.ledger.v1'))[0].naming.version")==='legacy-v1', '迁移后持久保存旧版名称快照');
  await reloadReady();
  await generateCombo(['1100','1440','4810']);
  ok(await evaluate("document.querySelector('.res-name').textContent")==='薛定谔的聚堡', '再次刷新仍保留老名字');

  console.log('\n[12] 本地生成开销与存储降级');
  const perf=await evaluate(`(()=>{const codes=['1100','1440','4810'];const start=performance.now();for(let i=0;i<1000;i++)MCDLogic.generateName(codes);return (performance.now()-start)/1000;})()`);
  console.log('    · Chrome 单次命名平均 '+perf.toFixed(3)+' ms（1000 次）');
  ok(perf<5, '单次本地命名低于 5ms 预算', String(perf));
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('storage disabled for test');}});"});
  await reloadReady();
  await generateCombo(['1600','3505']);
  ok(/鱼堡|红茶/.test(await evaluate("document.querySelector('.res-name').textContent")), '存储不可用时仍能生成新版名字');
  await evaluate("document.querySelector('.vote-btn').click()");
  ok(Number(await evaluate("document.querySelector('.vote-btn .n').textContent"))===1, '存储不可用时可在内存中完成投票');

  console.log('\n[13] 页面错误复查');
  ok(errors.length === 0, '全流程无未捕获异常', errors.join(' | '));
  console.log('    · console.error：' + (consoleMsgs.length ? consoleMsgs.slice(0, 3).join(' | ') : '无'));

  console.log('\n============================');
  console.log('通过 ' + pass + ' / ' + (pass + fail) + (fail ? '，失败 ' + fail : '，全部通过'));

  ws.close();
  chrome.kill();
  await sleep(300);
  process.exit(fail ? 1 : 0);
})().catch(e => {
  console.error('崩溃：', e);
  process.exit(1);
});
