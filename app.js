/* ============================================================================
 * app.js — 界面与海报
 * ========================================================================== */
(function () {
  'use strict';

  var D = window.MCD;
  var L = window.MCDLogic;

  /* ---------- 营养表：启动时解析一次（data 是一整段字符串） ---------- */
  var parsed, NUT;
  try {
    parsed = L.parseNutrition(D.NUTRITION_RAW);
    NUT = L.buildNutritionIndex(parsed);
  } catch (e) {
    document.body.innerHTML = '<pre style="color:#f88;padding:40px">营养表解析失败：' + e.message + '</pre>';
    return;
  }

  /* ---------- 状态 ---------- */
  var selected = [];
  var current = null;
  var filter = '全部';
  var ALL_CODES = Object.keys(D.PRICE_FEN);

  /* ---------- 本地存储（file:// 下可能被禁，降级到内存） ---------- */
  var LS_LEDGER = 'mcdlab.ledger.v1';
  var LS_VOTED = 'mcdlab.voted.v1';
  var memLedger = null, memVoted = null;

  function lsGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) { /* 静默降级 */ }
  }

  function loadLedger() {
    var raw = lsGet(LS_LEDGER);
    if (raw) {
      try {
        var a = JSON.parse(raw);
        if (Array.isArray(a) && a.length) {
          // 未带名称快照的旧账本，只按原算法还原一次；票数与组合键保持原样。
          var pinned = a.map(L.freezeLegacyEntry);
          if (JSON.stringify(pinned) !== JSON.stringify(a)) lsSet(LS_LEDGER, JSON.stringify(pinned));
          return pinned;
        }
      } catch (e) { /* ignore */ }
    }
    if (memLedger) return memLedger;
    memLedger = L.SEED_ENTRIES.map(function (e) {
      return { key: L.comboKey(e.codes), codes: e.codes.slice(), votes: e.votes, seed: true,
        naming: L.snapshotNaming(L.generateName(e.codes)) };
    });
    return memLedger;
  }
  function saveLedger(list) {
    memLedger = list;
    lsSet(LS_LEDGER, JSON.stringify(list));
  }
  function loadVoted() {
    var raw = lsGet(LS_VOTED);
    if (raw) { try { return JSON.parse(raw) || {}; } catch (e) { /* ignore */ } }
    return memVoted || {};
  }
  function saveVoted(v) { memVoted = v; lsSet(LS_VOTED, JSON.stringify(v)); }

  var ledger = loadLedger();
  var voted = loadVoted();

  function votesOf(key) {
    for (var i = 0; i < ledger.length; i++) if (ledger[i].key === key) return ledger[i].votes;
    return 0;
  }

  /* ==========================================================================
   * 渲染：单品卡
   * ======================================================================== */
  var $grid = document.getElementById('menuGrid');
  var $filters = document.getElementById('filters');

  function renderFilters() {
    var cats = ['全部'];
    ALL_CODES.forEach(function (c) {
      var k = D.CATEGORY[c];
      if (cats.indexOf(k) < 0) cats.push(k);
    });
    $filters.innerHTML = cats.map(function (c) {
      return '<button data-cat="' + c + '" class="' + (c === filter ? 'on' : '') + '">' + c + '</button>';
    }).join('');
  }

  function renderMenu() {
    var codes = ALL_CODES.filter(function (c) {
      return filter === '全部' || D.CATEGORY[c] === filter;
    });

    $grid.innerHTML = codes.map(function (code) {
      var m = D.MENU[code];
      var detail = D.DETAIL_NAME[code];
      var fen = D.PRICE_FEN[code].subtotal;
      var on = selected.indexOf(code) >= 0;
      var full = selected.length >= 4 && !on;

      return '' +
        '<button class="card' + (on ? ' on' : '') + (full ? ' dim' : '') + '" data-code="' + code + '" ' +
        'title="' + code + ' · 菜单名「' + m.name + '」· 详情名「' + detail + '」· 算价 ' + fen + ' 分">' +
          '<span class="pick">✓</span>' +
          '<span class="thumb">' +
            '<span class="ph">' + detail.charAt(0) + '</span>' +
            '<img src="' + m.image + '" alt="" loading="lazy" ' +
              'onerror="this.style.display=\'none\'" style="position:absolute;inset:0">' +
          '</span>' +
          '<span class="nm">' + m.name + '</span>' +
          '<span class="row"><span class="pr">¥' + L.fenToYuan(fen) + '</span></span>' +
        '</button>';
    }).join('');
  }

  renderFilters();
  renderMenu();

  $filters.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-cat]');
    if (!b) return;
    filter = b.getAttribute('data-cat');
    renderFilters();
    renderMenu();
  });

  $grid.addEventListener('click', function (ev) {
    var card = ev.target.closest('.card');
    if (!card) return;
    toggle(card.getAttribute('data-code'));
  });

  /* ==========================================================================
   * 选择逻辑
   * ======================================================================== */
  var $selList = document.getElementById('selList');
  var $selCount = document.getElementById('selCount');
  var $mPrice = document.getElementById('mPrice');
  var $mKcal = document.getElementById('mKcal');
  var $hint = document.getElementById('labHint');
  var $btnGen = document.getElementById('btnGenerate');

  function toggle(code) {
    var i = selected.indexOf(code);
    if (i >= 0) selected.splice(i, 1);
    else if (selected.length >= 4) { pulseHint('最多 4 个，想换就先取消一个'); return; }
    else selected.push(code);
    sync();
  }

  function sync() {
    renderMenu();
    $selCount.textContent = selected.length + ' / 4';

    if (!selected.length) {
      $selList.innerHTML = '<div class="sel-empty">还没选东西 · 从左边挑 2–4 个</div>';
    } else {
      $selList.innerHTML = selected.map(function (c) {
        return '<div class="sel-row">' +
          '<span class="k">' + D.DETAIL_NAME[c] + '</span>' +
          '<span class="v">¥' + L.fenToYuan(D.PRICE_FEN[c].subtotal) + '</span>' +
          '<button class="x" data-del="' + c + '" aria-label="移除">×</button>' +
        '</div>';
      }).join('');
    }

    if (selected.length >= 1) {
      var fen = L.priceFen(selected);
      $mPrice.innerHTML = '<span style="font-size:15px;color:#A29185">¥</span>' + L.fenToYuan(fen);

      var cal = L.calories(selected, NUT);
      if (cal.allKnown) {
        $mKcal.innerHTML = cal.kcal;
      } else {
        $mKcal.innerHTML = (cal.kcal ? cal.kcal : '—') +
          '<span class="unk" style="font-size:10.5px;display:block;line-height:1.2">＋' + cal.unknown.length + ' 项未知</span>';
      }
    } else {
      $mPrice.textContent = '—';
      $mKcal.textContent = '—';
    }

    var n = selected.length;
    $btnGen.disabled = n < 2 || n > 4;
    var msg = '';
    if (n < 2) msg = n === 0 ? '至少选 2 个' : '还差 1 个';
    $hint.textContent = msg;
    $hint.style.visibility = msg ? 'visible' : 'hidden';
  }

  function pulseHint(msg) {
    $hint.textContent = msg;
    $hint.style.visibility = 'visible';
    $hint.style.color = '#FF8A7A';
    setTimeout(function () { $hint.style.color = ''; sync(); }, 1600);
  }

  $selList.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-del]');
    if (!b) return;
    toggle(b.getAttribute('data-del'));
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    selected = [];
    sync();
  });

  document.getElementById('btnRandom').addEventListener('click', function () {
    var pool = ALL_CODES.slice();
    var n = 2 + Math.floor(Math.random() * 3); // 2..4
    var pick = [];
    while (pick.length < n && pool.length) {
      pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    selected = pick;
    sync();
    generate();
  });

  document.getElementById('btnGenerate').addEventListener('click', generate);

  /* ==========================================================================
   * 生成
   * ======================================================================== */
  var $result = document.getElementById('result');

  function generate() {
    if (selected.length < 2) return;
    var key = L.comboKey(selected);
    var saved = ledger.filter(function(e){return e.key===key;})[0];
    current = L.analyze(selected, NUT, saved && saved.naming);

    // 生成的组合先入账（0 票），这样才能投票
    if (!ledger.some(function (e) { return e.key === current.key; })) {
      ledger.push({ key: current.key, codes: current.codes.slice(), votes: 0, mine: true,
        naming: L.snapshotNaming(current.naming) });
      saveLedger(ledger);
    }

    renderResult();
    renderBoards();
    $result.classList.remove('hidden');
    drawPoster(current);

    setTimeout(function () {
      $result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function starBlock(opts) {
    opts = opts || {};
    var ready = D.CONFIG.REPO_READY;
    return '' +
      '<div class="star">' +
        '<span class="ico">⭐</span>' +
        '<div class="body">' +
          '<p class="t">' + (opts.title || '喜欢这个隐藏款？顺手去 GitHub 点个 Star') +
            (ready ? '' : '<span class="warn">地址待填</span>') + '</p>' +
          '<a class="go" href="' + D.CONFIG.REPO_URL + '" target="_blank" rel="noopener noreferrer">去 GitHub 看看 ↗</a>' +
          '<p class="fine">Star 完全自愿，不影响玩法与投票，也不换取任何奖励。</p>' +
        '</div>' +
      '</div>';
  }

  function renderResult() {
    var a = current;
    var v = votesOf(a.key);
    var hasVoted = !!voted[a.key];

    var kcalBlock = a.kcalAllKnown
      ? '<div><div class="l">热量</div><div class="v">' + a.kcal + '<span class="u">千卡</span></div></div>'
      : '<div><div class="l">热量</div><div class="v">' + a.kcal +
        '<span class="u">千卡</span><span class="badge-unk" style="margin-left:5px">＋' + a.kcalUnknown.length + ' 未知</span></div></div>';

    var items = a.codes.map(function (c) {
      var d = a.calDetail.filter(function (x) { return x.code === c; })[0];
      var bad = d.kcal === null;
      return '<li>' +
        '<span class="nm">' + D.DETAIL_NAME[c] + '</span>' +
        (bad ? '<span class="badge-unk">未知</span>' : '<span class="kcal">' + d.kcal + '<span> kcal</span></span>') +
        '<span class="pr">¥' + L.fenToYuan(D.PRICE_FEN[c].subtotal) + '</span>' +
      '</li>';
    }).join('');

    $result.innerHTML = '' +
      '<div class="res-grid">' +
        '<div>' +
          '<div class="res-kicker">用户 DIY 款 · 非官方产品名</div>' +
          '<h2 class="res-name">' + a.name + '</h2>' +
          '<p class="res-slogan">' + a.slogan + '</p>' +

          '<div class="data-strip">' +
            '<div><div class="l">总价</div><div class="v">¥' + a.priceYuan + '</div></div>' +
            kcalBlock +
            '<div><div class="l">件数</div><div class="v">' + a.count + '</div></div>' +
          '</div>' +

          '<ul class="items-list">' + items + '</ul>' +

          '<div class="vote">' +
            '<p class="q">够离谱吗？投一票送它上榜。</p>' +
            '<button class="vote-btn' + (hasVoted ? ' done' : '') + '" data-vote="' + a.key + '"' + (hasVoted ? ' disabled' : '') + '>' +
              (hasVoted ? '已投过' : '▲ 投它一票') + ' <span class="n">' + v + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="poster-wrap">' +
          '<div class="poster-frame"><canvas id="poster" width="1080" height="1440"></canvas></div>' +
          '<div class="poster-tools">' +
            '<button class="btn btn-ghost" id="btnDownload">保存海报 PNG</button>' +
            '<button class="btn btn-ghost" id="btnCopy">复制文案</button>' +
          '</div>' +
          '<div style="margin-top:14px">' + starBlock({}) + '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('btnDownload').addEventListener('click', downloadPoster);
    document.getElementById('btnCopy').addEventListener('click', copyText);
  }

  $result.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-vote]');
    if (!b) return;
    var key = b.getAttribute('data-vote');
    if (voted[key]) return;
    var entry = ledger.filter(function (e) { return e.key === key; })[0];
    if (!entry) {
      entry = { key: key, codes: current.codes.slice(), votes: 0,
        naming: L.snapshotNaming(current.naming) };
      ledger.push(entry);
    }
    entry.votes += 1;
    voted[key] = 1;
    saveLedger(ledger);
    saveVoted(voted);

    b.classList.add('done');
    b.disabled = true;
    b.innerHTML = '已投过 <span class="n">' + entry.votes + '</span>';
    renderBoards();
    toast('已投票 · 榜单已更新');
  });

  /* ==========================================================================
   * 海报
   * ======================================================================== */
  var F_LATIN = '"Inter","Helvetica Neue",Arial,sans-serif';
  var F_CN = '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans CJK SC",sans-serif';

  function setFont(ctx, size, weight, cn) {
    ctx.font = (weight || 400) + ' ' + size + 'px ' + (cn === false ? F_LATIN : F_CN);
  }

  function wrapLines(ctx, text, maxWidth) {
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var test = cur + ch;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function fitText(ctx, text, maxWidth, maxLines, maxSize, minSize) {
    for (var s = maxSize; s >= minSize; s -= 3) {
      setFont(ctx, s, 900);
      var lines = wrapLines(ctx, text, maxWidth);
      // 新名字保留完整食物词，避免仅最后一两个字被挤到第二行。
      if (lines.length>1 && lines[lines.length-1].length<3) continue;
      if (lines.length <= maxLines) {
        var w = 0;
        for (var i = 0; i < lines.length; i++) w = Math.max(w, ctx.measureText(lines[i]).width);
        if (w <= maxWidth) return { size: s, lines: lines };
      }
    }
    setFont(ctx, minSize, 900);
    return { size: minSize, lines: wrapLines(ctx, text, maxWidth).slice(0, maxLines) };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPoster(a) {
    var cv = document.getElementById('poster');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = 1080, H = 1440;

    /* 背景 */
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1B0C08');
    g.addColorStop(.42, '#3C0F09');
    g.addColorStop(1, '#100504');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var rg = ctx.createRadialGradient(940, 120, 0, 940, 120, 720);
    rg.addColorStop(0, 'rgba(255,199,44,.20)');
    rg.addColorStop(1, 'rgba(255,199,44,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    rg = ctx.createRadialGradient(90, 1290, 0, 90, 1290, 660);
    rg.addColorStop(0, 'rgba(218,41,28,.34)');
    rg.addColorStop(1, 'rgba(218,41,28,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    /* 右侧淡字装饰 */
    ctx.save();
    ctx.translate(1012, 700);
    ctx.rotate(-Math.PI / 2);
    setFont(ctx, 132, 900, false);
    ctx.fillStyle = 'rgba(255,199,44,.055)';
    ctx.textBaseline = 'middle';
    ctx.fillText('DIY', 0, 0);
    ctx.restore();

    /* 顶部 */
    ctx.textBaseline = 'alphabetic';
    setFont(ctx, 30, 800);
    ctx.fillStyle = '#FFC72C';
    ctx.fillText('抽抽想香堡', 80, 116);

    setFont(ctx, 22, 400, false);
    ctx.fillStyle = 'rgba(246,238,227,.46)';
    ctx.fillText('CHOUCHOU XIANGXIANGBAO  ·  USER-MADE COMBO', 80, 154);

    setFont(ctx, 22, 700, false);
    ctx.fillStyle = 'rgba(255,199,44,.72)';
    ctx.textAlign = 'right';
    ctx.fillText('#' + a.id, 1000, 116);
    ctx.textAlign = 'left';

    ctx.strokeStyle = 'rgba(255,199,44,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 196);
    ctx.lineTo(1000, 196);
    ctx.stroke();

    /* ---------- 版式：名字和口号压顶，数据卡与清单贴底，空白集中在中段 ---------- */
    var fit = fitText(ctx, a.name, 920, 2, 112, 56);
    var nameLH = Math.round(fit.size * 1.16);
    var nameH = fit.lines.length * nameLH;

    setFont(ctx, 40, 500);
    var sl = wrapLines(ctx, '「' + a.slogan + '」', 900).slice(0, 3);
    var slogLH = 58, slogH = sl.length * slogLH;

    var itemH = 50, itemsH = a.codes.length * itemH;
    var cardH = 206;
    var GAP_SLOG = 40, GAP_CARD = 86;
    var BOTTOM = 1258;

    /* 数据卡与清单先贴底定位，再让标题在剩余空间里居中 */
    var itemsTop = BOTTOM - itemsH;
    var cardY = itemsTop - GAP_CARD - cardH;
    var heroH = nameH + GAP_SLOG + slogH;
    var REG_TOP = 226, REG_BOTTOM = cardY - 46;
    var y = Math.max(REG_TOP, REG_TOP + ((REG_BOTTOM - REG_TOP) - heroH) / 2);
    if (y + heroH > REG_BOTTOM) {            // 内容过高时才往下挤
      y = REG_TOP;
      cardY = Math.max(cardY, y + heroH + 46);
      itemsTop = cardY + cardH + GAP_CARD;
    }

    /* 名字 */
    setFont(ctx, fit.size, 900);
    ctx.fillStyle = '#FFC72C';
    ctx.textBaseline = 'top';
    for (var i = 0; i < fit.lines.length; i++) {
      ctx.fillText(fit.lines[i], 80, y);
      y += nameLH;
    }

    /* 口号 */
    y += GAP_SLOG;
    setFont(ctx, 40, 500);
    ctx.fillStyle = 'rgba(255,231,190,.92)';
    for (var j = 0; j < sl.length; j++) {
      ctx.fillText(sl[j], 80, y);
      y += slogLH;
    }

    ctx.save();
    roundRect(ctx, 80, cardY, 920, cardH, 28);
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,199,44,.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    var cols = [
      { label: '总价', value: '¥' + a.priceYuan, note: a.priceFen + ' 分' },
      {
        label: '热量',
        value: String(a.kcal),
        note: a.kcalAllKnown ? '千卡' : '千卡 · 另有 ' + a.kcalUnknown.length + ' 项未知',
        accent: !a.kcalAllKnown
      },
      { label: '件数', value: String(a.count), note: '份' }
    ];
    var colW = 920 / 3;
    cols.forEach(function (c, k) {
      var cx = 80 + colW * k + 46;
      setFont(ctx, 21, 600);
      ctx.fillStyle = 'rgba(246,238,227,.44)';
      ctx.textBaseline = 'top';
      ctx.fillText(c.label, cx, cardY + 36);

      setFont(ctx, 62, 900);
      ctx.fillStyle = c.accent ? '#FFB4A6' : '#FFC72C';
      ctx.fillText(c.value, cx, cardY + 68);

      setFont(ctx, 18, 400);
      ctx.fillStyle = 'rgba(246,238,227,.38)';
      ctx.fillText(c.note, cx, cardY + 152);

      if (k < 2) {
        ctx.strokeStyle = 'rgba(255,255,255,.09)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80 + colW * (k + 1), cardY + 36);
        ctx.lineTo(80 + colW * (k + 1), cardY + cardH - 36);
        ctx.stroke();
      }
    });

    /* 单品清单：一条细线分隔，不再加英文小标签 */
    ctx.strokeStyle = 'rgba(255,199,44,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, itemsTop - 34);
    ctx.lineTo(1000, itemsTop - 34);
    ctx.stroke();

    a.codes.forEach(function (code, idx) {
      var d = a.calDetail.filter(function (x) { return x.code === code; })[0];
      var yy = itemsTop + idx * itemH;
      setFont(ctx, 26, 600);
      ctx.fillStyle = 'rgba(246,238,227,.9)';
      ctx.fillText(D.DETAIL_NAME[code], 80, yy);

      var w = ctx.measureText(D.DETAIL_NAME[code]).width;
      if (d.kcal === null) {
        setFont(ctx, 17, 700);
        ctx.fillStyle = 'rgba(255,138,122,.85)';
        ctx.fillText('热量未知', 80 + w + 12, yy + 7);
      } else {
        setFont(ctx, 17, 400);
        ctx.fillStyle = 'rgba(246,238,227,.34)';
        ctx.fillText(d.kcal + ' kcal', 80 + w + 12, yy + 7);
      }

      setFont(ctx, 26, 700, false);
      ctx.fillStyle = 'rgba(255,199,44,.88)';
      ctx.textAlign = 'right';
      ctx.fillText('¥' + L.fenToYuan(D.PRICE_FEN[code].subtotal), 1000, yy);
      ctx.textAlign = 'left';
    });

    /* 页脚 */
    ctx.strokeStyle = 'rgba(255,199,44,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 1290);
    ctx.lineTo(1000, 1290);
    ctx.stroke();

    setFont(ctx, 21, 700);
    ctx.fillStyle = 'rgba(246,238,227,.72)';
    ctx.textBaseline = 'top';
    ctx.fillText(D.STORE.storeName + ' · 到店自取', 80, 1314);

    setFont(ctx, 19, 400);
    ctx.fillStyle = 'rgba(246,238,227,.4)';
    ctx.fillText('2026-10-24 · 门店 ' + D.STORE.storeCode, 80, 1348);

    setFont(ctx, 18, 500);
    ctx.fillStyle = 'rgba(255,199,44,.62)';
    ctx.fillText('DIY 吃法仅供参考，实际供应和价格以门店为准 · 用户 DIY 款，非官方产品名', 80, 1384);
  }

  function downloadPoster() {
    var cv = document.getElementById('poster');
    if (!cv) return;
    try {
      cv.toBlob(function (blob) {
        if (!blob) { toast('导出失败，可以直接截图'); return; }
        var url = URL.createObjectURL(blob);
        var aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = 'chouchou-xiangxiangbao-' + (current ? current.id : 'combo') + '.png';
        document.body.appendChild(aEl);
        aEl.click();
        document.body.removeChild(aEl);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('海报已导出');
      }, 'image/png');
    } catch (e) {
      toast('导出失败，可以直接截图保存');
    }
  }

  function copyText() {
    if (!current) return;
    var a = current;
    var txt = '【' + a.name + '】' + a.slogan + '\n' +
      '总价 ¥' + a.priceYuan + ' · 热量 ' + (a.kcalAllKnown ? a.kcal + ' 千卡' : a.kcal + ' 千卡（另有 ' + a.kcalUnknown.length + ' 项未知）') +
      ' · ' + a.codes.map(function (c) { return D.DETAIL_NAME[c]; }).join(' + ') + '\n' +
      '—— 抽抽想香堡 · 用户 DIY 款，非官方产品名';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('文案已复制'); },
        function () { fallbackCopy(txt); });
    } else fallbackCopy(txt);
  }

  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('文案已复制'); }
    catch (e) { toast('复制失败，请手动选中'); }
    document.body.removeChild(ta);
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(14px);' +
        'background:#FFC72C;color:#2A1200;font-size:13px;font-weight:800;padding:11px 20px;border-radius:11px;' +
        'box-shadow:0 16px 34px -14px rgba(0,0,0,.9);z-index:200;opacity:0;transition:.22s;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(14px)';
    }, 2000);
  }

  /* ==========================================================================
   * 榜单
   * ======================================================================== */
  function renderBoards() {
    var boards = L.buildBoards(ledger, NUT, 5);

    function row(a, i, kind) {
      var metric = kind === 'absurd'
        ? '<div class="met">' + a.kcal + '<small>千卡</small></div>'
        : '<div class="met">' + a.perYuan.toFixed(2) + '<small>kcal / 元</small></div>';
      return '<li>' +
        '<span class="rk">' + (i + 1) + '</span>' +
        '<span class="nm">' + a.name +
          '<i>¥' + a.priceYuan + ' · ' + a.count + ' 件 · ' + a.votes + ' 票</i>' +
        '</span>' +
        metric +
      '</li>';
    }

    document.getElementById('boardAbsurd').innerHTML =
      boards.absurd.length ? boards.absurd.map(function (a, i) { return row(a, i, 'absurd'); }).join('')
        : '<div class="empty">还没有组合上榜</div>';

    document.getElementById('boardValue').innerHTML =
      boards.value.length ? boards.value.map(function (a, i) { return row(a, i, 'value'); }).join('')
        : '<div class="empty">还没有组合上榜</div>';

    document.getElementById('boardStar').innerHTML = starBlock({});
  }

  /* ==========================================================================
   * 启动
   * ======================================================================== */
  var shortStore = D.STORE.storeName.replace(/^麦当劳/, '').replace(/^北京/, '').replace(/餐厅$/, '');
  document.getElementById('storeLine').textContent =
    shortStore + ' · ' + D.STORE.distance + 'm · ' + D.STORE.businessStartTime + '–' + D.STORE.businessEndTime;
  document.getElementById('footStore').textContent = D.STORE.storeCode;

  sync();
  renderBoards();
})();
