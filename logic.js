/* ============================================================================
 * logic.js — 纯函数层：营养解析、算价、热量、命名引擎、榜单计算
 * 无 DOM 依赖，可在 Node 里直接 require 做单元验证
 * ========================================================================== */

(function (root) {
  'use strict';

  var D = (typeof module !== 'undefined' && module.exports)
    ? require('./data.js')
    : root.MCD;

  /* ==========================================================================
   * 一、营养表解析 —— data 是一整段字符串，必须先 parse
   * ======================================================================== */

  /**
   * 解析 list-nutrition-foods 的 data 字符串
   * 结构： [160]{col1,col2,...}:\n  值1,值2,...\n  值1,值2,...
   * 返回 { declared, columns, rows, anomalies }
   *   rows 里每行是 { __line, __raw, ...列名: 原始字符串 }
   *   —— 刻意不转数字，保持"原样是字符串"这个事实
   */
  function parseNutrition(raw) {
    var lines = String(raw).split('\n');
    var head = lines[0] || '';
    var m = head.match(/^\[(\d+)\]\{([^}]*)\}:\s*$/);
    if (!m) throw new Error('营养表头部格式不符：' + head.slice(0, 80));

    var declared = parseInt(m[1], 10);
    var columns = m[2].split(',').map(function (s) { return s.trim(); });
    var rows = [];
    var anomalies = [];

    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      if (!line || !line.trim()) continue;
      var body = line.replace(/^\s+/, '');
      var parts = body.split(',');
      if (parts.length !== columns.length) {
        anomalies.push({ line: i + 1, expect: columns.length, got: parts.length, raw: body });
        continue;
      }
      var row = { __line: i + 1, __raw: body };
      for (var c = 0; c < columns.length; c++) row[columns[c]] = parts[c];
      rows.push(row);
    }

    return { declared: declared, columns: columns, rows: rows, anomalies: anomalies };
  }

  /**
   * 建索引：按 productName 归组（表里有重名行，必须能识别）
   * 返回 { byName: {name: [row,...]}, dupNames: [name...] }
   */
  function buildNutritionIndex(parsed) {
    var byName = Object.create(null);
    parsed.rows.forEach(function (r) {
      var n = r.productName;
      if (!byName[n]) byName[n] = [];
      byName[n].push(r);
    });
    var dupNames = [];
    Object.keys(byName).forEach(function (n) {
      if (byName[n].length > 1) dupNames.push(n);
    });
    return { byName: byName, dupNames: dupNames };
  }

  /** 取一行的千卡值；字符串 "null" / 空 / 非数字 → null（= 未知） */
  function rowKcal(row) {
    if (!row) return null;
    var v = row.energyKcal;
    if (v === undefined || v === null) return null;
    var s = String(v).trim();
    if (s === '' || s.toLowerCase() === 'null') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  /* ==========================================================================
   * 二、价格与热量 —— 口径写死
   * ======================================================================== */

  /** 组合总价（单位：分，整数）。唯一来源 calculate-price 的 productList[].subtotal */
  function priceFen(codes) {
    var sum = 0;
    for (var i = 0; i < codes.length; i++) {
      var p = D.PRICE_FEN[codes[i]];
      if (!p) throw new Error('缺少 calculate-price 价格：' + codes[i]);
      sum += p.subtotal;                 // 整数相加，全程不出现浮点
    }
    return sum;
  }

  /** 分 → 元展示串（永远两位小数），不参与任何再运算 */
  function fenToYuan(fen) {
    return (fen / 100).toFixed(2);
  }

  /**
   * 组合热量。严格按 code → 营养名 手工映射表取值；
   * 映射为 null / 索引里查不到 / 千卡列为 null → 记为「未知」，不估算、不外推。
   */
  function calories(codes, index) {
    var sum = 0;
    var unknown = [];
    var dups = [];
    var detail = [];

    codes.forEach(function (code) {
      var map = D.NUTRITION_KEY[code];
      var detailName = D.DETAIL_NAME[code];
      var entry = {
        code: code,
        detailName: detailName,
        nutritionName: map && map.key ? map.key : null,
        reason: map ? map.reason : '映射表未覆盖',
        kcal: null,
        dup: 0
      };

      if (map && map.key) {
        var list = index.byName[map.key];
        if (list && list.length) {
          // 重复行：先命中第一条，并标注可能重复
          if (list.length > 1) {
            entry.dup = list.length;
            dups.push({ code: code, name: map.key, count: list.length });
          }
          var v = rowKcal(list[0]);
          if (v === null) {
            unknown.push({ code: code, name: detailName, why: '营养表该行 energyKcal 为 null' });
          } else {
            entry.kcal = v;
            sum += v;
          }
        } else {
          unknown.push({ code: code, name: detailName, why: '营养表中无「' + map.key + '」行' });
        }
      } else {
        unknown.push({ code: code, name: detailName, why: (map && map.reason) || '映射表未覆盖' });
      }

      detail.push(entry);
    });

    return {
      kcal: sum,                 // 已解析部分之和（不含未知项）
      unknown: unknown,
      dups: dups,
      detail: detail,
      allKnown: unknown.length === 0
    };
  }

  /* ==========================================================================
   * 三、命名引擎：取词 → 谐音替换 → 套抽象句式
   * ======================================================================== */

  /** 每个单品抽取一个"可玩"的关键字 + 语义权重 */
  var KEYWORD = {
    '1100': { k: '巨', role: 4 },
    '1440': { k: '辣', role: 4 },
    '1406': { k: '板', role: 4 },
    '1450': { k: '鸡', role: 4 },
    '1600': { k: '鱼', role: 4 },
    '1120': { k: '吉', role: 4 },
    '4648': { k: '霸', role: 4 },
    '1700': { k: '翅', role: 3 },
    '1401': { k: '乐', role: 3 },
    '521156': { k: '排', role: 3 },
    '4810': { k: '薯', role: 2 },
    '4437': { k: '玉', role: 2 },
    '515837': { k: '筒', role: 1 },
    '9900008754': { k: '旋', role: 1 },
    '9900008751': { k: '可', role: 0 },
    '3505': { k: '茶', role: 0 }
  };

  /** 谐音候选（第一项恒为原字，其余为同音/近音替换） */
  var HOMO = {
    '巨': ['巨', '距', '剧', '聚'],
    '辣': ['辣', '啦', '喇', '腊'],
    '板': ['板', '版', '扳'],
    '鸡': ['鸡', '机', '基', '积', '击', '饥'],
    '鱼': ['鱼', '余', '愉', '渔'],
    '吉': ['吉', '极', '级', '急'],
    '霸': ['霸', '吧', '爸', '罢'],
    '翅': ['翅', '次', '刺', '赐'],
    '乐': ['乐', '了'],
    '排': ['排', '牌', '派'],
    '薯': ['薯', '熟', '数', '属', '鼠', '暑'],
    '玉': ['玉', '遇', '欲', '预'],
    '筒': ['筒', '桶', '统', '通'],
    '旋': ['旋', '玄', '选'],
    '可': ['可', '克', '渴', '刻'],
    '茶': ['茶', '查', '察']
  };

  /* ---------- 名字库（来自 name-bank.md，按"能对上的食材字"分组） ---------- */

  /* 一、谐音梗成语：已经谐好音的成品词，按主字归类 */
  var IDIOM_BY_KEY = {
    '鸡': ['鸡不可失', '霸王别鸡', '鸡同鸭讲', '鸡飞狗跳'],
    '薯': ['薯光乍泄', '乐不思薯', '薯道难', '薯你最棒', '薯你最美', '薯你最强', '薯条君的逆袭'],
    '辣': ['辣么有才', '辣么快乐', '辣手神探'],
    '堡': ['堡你满意', '堡罗万象', '一堡口福', '饱经风霜'],
    '吉': ['吉士如意'],
    '巨': ['巨无霸道总裁'],
    '乐': ['乐不思薯'],
    '霸': ['霸气侧漏', '霸王别鸡'],
    '麦': ['麦门永存', '麦田守望者', '麦香鸡不可失'],
    '香': ['香飘飘', '香到离谱']
  };

  /* 二/三/四、抽象前缀池（网络抽象话 + 无厘头哲学 + 打工人程序员） */
  var ABSTRACT = [
    '典中典', '抽象圣经', '绷不住了', '属于是', '乐子人', '赛博', '电子榨菜',
    '急急急', '哈基米', '曼波', '义父请吃', '我宣布这就是', '你说的对',
    '薛定谔的', '不存在的', '昨天吃过的', '明天再减', '热量守恒', '卡路里不存在',
    '我思故我吃', '存在即', '宇宙的尽头是', '时间不存在', '星期三的',
    '月亮与六便士', '凌晨三点的', '需求文档不存在', '周五下班', '周一不想上班',
    '摸鱼', 'KPI', '需求又改了', '产品经理看了都摇头', 'Bug 改不完',
    '上线前夜', '代码跑通了', '带薪吃饭', '会议开到饭凉'
  ];

  var SUFFIX = ['堡', '薯', '塔', '卷', '盒'];

  /* 句式模板：{ id, label, build(A,B,r) → string|null }
     A / B 是取词并按需谐音后的字；返回 null 表示这轮不合用，换一个再试 */
  var TEMPLATES = [
    { id: 'T01', label: '{A}不可失{B}', build: function (A, B) { return A + '不可失' + B; } },
    { id: 'T02', label: '{A}你最{X}{S}', build: function (A, B, r) { return A + '你最' + r.pick(['棒', '横', '野', '怪', '飒', '莽']) + r.pick(['堡', '餐', '套', '桶']); } },
    { id: 'T03', label: '{P}{A}能{B}堡', build: function (A, B, r) { return r.pick(['', '超', '真', '硬核', '究极']) + A + '能' + B + '堡'; } },
    { id: 'T04', label: '{A}么有才{S}', build: function (A, B, r) { return A + '么有才' + r.pick(['堡', '人', '怪', '精']); } },
    { id: 'T05', label: '星期{W}的{B}堡', build: function (A, B, r) { return '星期' + r.pick(['一', '二', '三', '四', '五', '六', '日']) + '的' + B + '堡'; } },
    { id: 'T06', label: '薛定谔的{B}{S}', build: function (A, B, r) { return '薛定谔的' + B + r.pick(['堡', '午餐', '晚餐', '下午茶', '夜宵']); } },
    { id: 'T07', label: '关于{A}{B}这件事', build: function (A, B) { return '关于' + A + B + '这件事'; } },
    { id: 'T08', label: '{A}氏{B}学导论', build: function (A, B) { return A + '氏' + B + '学导论'; } },
    { id: 'T09', label: '{A}的自我修养·{B}篇', build: function (A, B) { return A + '的自我修养·' + B + '篇'; } },
    { id: 'T10', label: '第{N}号{B}实验体', build: function (A, B, r) { return '第' + r.int(2, 99) + '号' + B + '实验体'; } },
    { id: 'T11', label: '{A}不定{B}', build: function (A, B) { return A + '不定' + B; } },
    { id: 'T12', label: '后现代{A}{B}主义', build: function (A, B) { return '后现代' + A + B + '主义'; } },
    { id: 'T13', label: '{A}救不了{B}', build: function (A, B) { return A + '救不了' + B; } },
    { id: 'T14', label: '{A}{B}有限公司', build: function (A, B) { return A + B + '有限公司'; } },
    { id: 'T15', label: '{A}门{B}派', build: function (A, B) { return A + '门' + B + '派'; } },
    { id: 'T16', label: '{A}的{B}宣言', build: function (A, B) { return A + '的' + B + '宣言'; } },

    /* —— 以下三种走名字库 —— */
    { id: 'B1', label: '抽象词 + {A} + 后缀', build: function (A, B, r) {
      var abs = r.pick(ABSTRACT);
      var suf = r.pick(SUFFIX);
      if (A === '薯' && suf === '薯') suf = '堡';
      var s = abs + A + suf;
      return s.length <= 14 ? s : null;
    } },
    { id: 'B2', label: '谐音成语 + 后缀', build: function (A, B, r) {
      var pool = IDIOM_BY_KEY[A] || IDIOM_BY_KEY[B];
      if (!pool) return null;
      var base = r.pick(pool);
      if (/[堡薯塔卷盒]$/.test(base)) return base;      // 成品名已带后缀
      var s = base + r.pick(['堡', '薯', '塔']);
      return s.length <= 14 ? s : null;
    } },
    { id: 'B3', label: '抽象词 + {B} + 堡', build: function (A, B, r) {
      var abs = r.pick(ABSTRACT);
      var s = abs + B + '堡';
      return s.length <= 14 ? s : null;
    } }
  ];

  var SLOGANS = [
    function (A, B) { return A + '是过程，' + B + '是答案。'; },
    function (A, B) { return '在' + B + '面前，' + A + '不值一提。'; },
    function (A, B) { return '把' + A + '交给' + B + '，把热量交给命运。'; },
    function (A, B) { return '既然都点了' + A + '，就别问' + B + '。'; },
    function (A, B) { return '这一口' + A + '，下一口' + B + '，中间是我不想上班的一生。'; },
    function (A, B) { return '热量已认罪，' + A + '拒不悔改。'; },
    function (A, B) { return A + '可以等，' + B + '不行。'; },
    function (A, B) { return '我们用' + A + '对抗周一，用' + B + '对抗余生。'; },
    /* 来自 name-bank 的口号示例 + 同风格补充 */
    function () { return '热量是真的，快乐也是真的。'; },
    function () { return '这个名字很抽象，但味道很具体。'; },
    function () { return '不存在的组合，真实存在的快乐。'; },
    function (A) { return '先把' + A + '吃了，再谈理想。'; }
  ];

  /* ---------- 确定性伪随机：同一个组合永远得到同一个名字 ---------- */

  function hash32(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    var rnd = mulberry32(seed);
    return {
      next: rnd,
      pick: function (arr) { return arr[Math.floor(rnd() * arr.length) % arr.length]; },
      int: function (min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
    };
  }

  /** 组合的唯一键：按 code 排序后用 - 连接（绝不用商品名做键） */
  function comboKey(codes) {
    return codes.slice().sort().join('-');
  }

  /**
   * 生成隐藏款名字
   * 返回 { name, slogan, templateId, templateLabel, a, b, aRaw, bRaw, steps }
   *   steps 用于在页面上展示"取词 → 谐音 → 句式"的三步推导
   */
  function generateName(codes, nameMap) {
    var NM = nameMap || D.DETAIL_NAME;      // 真实版可传入任意门店的"code → 详情名"表
    var key = comboKey(codes);
    var rng = makeRng(hash32(key) || 1);

    // --- 第 1 步：取关键词（按语义权重降序，同权重用哈希定序保证稳定）
    var picked = codes.map(function (c) {
      var kw = KEYWORD[c] || { k: (NM[c] || c).charAt(0), role: 2 };
      return { code: c, k: kw.k, role: kw.role, name: NM[c] || c };
    }).sort(function (x, y) {
      if (y.role !== x.role) return y.role - x.role;
      return hash32(x.code) - hash32(y.code);
    });

    var aRaw = picked[0].k;
    var bIdx = 1;
    // 若前两个关键词抽到同一个字，优先换下一个单品的字，避免「鸡不可失鸡」
    if (picked.length > 2 && picked[1] && picked[1].k === aRaw && picked[2]) bIdx = 2;
    var bRaw = (picked[bIdx] || picked[0]).k;

    var BAD_START = '啦了吧呢吗啊呀的是和跟就才';
    var a = aRaw, b = bRaw, swapped = [], tpl = null, name = '';

    // 最多试 12 次：同一个 seed 下序列固定，因此结果依然可复现
    for (var attempt = 0; attempt < 12; attempt++) {
      var ca = aRaw, cb = bRaw, sw = [];
      var swapWhich = rng.next() < 0.5 ? 'a' : 'b';
      var va = HOMO[aRaw] || [aRaw];
      var vb = HOMO[bRaw] || [bRaw];

      if (swapWhich === 'a' && va.length > 1) {
        var t1 = va[1 + Math.floor(rng.next() * (va.length - 1))];
        if (t1 !== aRaw) { sw.push({ from: aRaw, to: t1 }); ca = t1; }
      } else if (vb.length > 1) {
        var t2 = vb[1 + Math.floor(rng.next() * (vb.length - 1))];
        if (t2 !== bRaw) { sw.push({ from: bRaw, to: t2 }); cb = t2; }
      }
      if (!sw.length) {
        var alt = (ca === aRaw) ? vb : va;
        if (alt.length > 1) {
          var t3 = alt[1 + Math.floor(rng.next() * (alt.length - 1))];
          if (ca === aRaw) { sw.push({ from: bRaw, to: t3 }); cb = t3; }
          else { sw.push({ from: aRaw, to: t3 }); ca = t3; }
        }
      }

      var tplTry = TEMPLATES[Math.floor(rng.next() * TEMPLATES.length)];
      var cand = tplTry.build(ca, cb, rng);
      if (!cand) continue;                       // 这轮句式不合用（比如没有对应成语）

      if (!name) { name = cand; tpl = tplTry; a = ca; b = cb; swapped = sw; }
      // 以语气词/虚词开头读起来太散，换一个句式再试
      if (BAD_START.indexOf(cand.charAt(0)) < 0 && cand.length <= 15) {
        name = cand; tpl = tplTry; a = ca; b = cb; swapped = sw;
        break;
      }
    }
    if (!name) name = aRaw + '不可失' + bRaw;     // 极端兜底，正常走不到

    // 口号用原字（不打谐音），保证句子读得通；谐音只出现在名字里
    var slogan = SLOGANS[Math.floor(rng.next() * SLOGANS.length)](aRaw, bRaw);

    return {
      name: name,
      slogan: slogan,
      templateId: tpl.id,
      templateLabel: tpl.label,
      a: a, b: b, aRaw: aRaw, bRaw: bRaw,
      swapped: swapped,
      sources: [picked[0], picked[bIdx] || picked[0]],
      steps: {
        extract: '从「' + picked[0].name + '」取「' + aRaw + '」、从「' + (picked[bIdx] || picked[0]).name + '」取「' + bRaw + '」',
        homophone: swapped.length
          ? '谐音替换：' + swapped[0].from + ' → ' + swapped[0].to
          : '谐音替换：本次两字无更优同音字，保留原字',
        template: '套句式 ' + tpl.label
      }
    };
  }

  /** 组合短编号（用于海报角落与榜单排序显示） */
  function shortId(key) {
    var h = hash32(key).toString(36).toUpperCase();
    while (h.length < 4) h = '0' + h;
    return h.slice(-4);
  }

  /* ==========================================================================
   * 四、组合整体评估
   * ======================================================================== */

  function analyze(codes, index) {
    var key = comboKey(codes);
    var fen = priceFen(codes);
    var cal = calories(codes, index);
    var nm = generateName(codes);

    return {
      key: key,
      id: shortId(key),
      codes: codes.slice(),
      priceFen: fen,
      priceYuan: fenToYuan(fen),
      kcal: cal.kcal,
      kcalUnknown: cal.unknown,
      kcalAllKnown: cal.allKnown,
      dups: cal.dups,
      calDetail: cal.detail,
      perYuan: cal.allKnown && fen > 0 ? cal.kcal / (fen / 100) : null,
      name: nm.name,
      slogan: nm.slogan,
      naming: nm,
      count: codes.length
    };
  }

  /* ==========================================================================
   * 五、榜单
   * ======================================================================== */

  /** 预置的演示条目（codes 都是真实可售单品；指标在运行时按真实数据算） */
  var SEED_ENTRIES = [
    { codes: ['1100', '1440', '4810'], votes: 23 },
    { codes: ['1100', '4648', '1700', '4437'], votes: 17 },
    { codes: ['1100', '1406', '4810'], votes: 12 },
    { codes: ['1450', '515837', '4810'], votes: 9 },
    { codes: ['1440', '1450', '1401'], votes: 7 },
    { codes: ['4648', '4437', '515837'], votes: 5 },
    { codes: ['1700', '1401', '4810', '3505'], votes: 4 },
    { codes: ['1600', '4810'], votes: 3 },
    { codes: ['521156', '1401', '3505'], votes: 2 }
  ];

  /**
   * 计算两个榜。
   * 上榜门槛：票数 ≥ 1（投票决定"谁能上"），且热量全部已知
   *            （含未知项的组合热量不完整，不参与排名 —— 不估算）
   * 排序规则：
   *   最离谱 = 热量降序
   *   最划算 = 每元千卡降序（kcal ÷ 元）
   */
  function buildBoards(entries, index, limit) {
    limit = limit || 5;
    var enriched = entries
      .filter(function (e) { return e.votes > 0; })
      .map(function (e) {
        var a = analyze(e.codes, index);
        a.votes = e.votes;
        return a;
      })
      .filter(function (a) { return a.kcalAllKnown; });

    var absurd = enriched.slice().sort(function (x, y) {
      if (y.kcal !== x.kcal) return y.kcal - x.kcal;
      return y.votes - x.votes;
    }).slice(0, limit);

    var value = enriched.slice().sort(function (x, y) {
      if (y.perYuan !== x.perYuan) return y.perYuan - x.perYuan;
      return y.votes - x.votes;
    }).slice(0, limit);

    return { absurd: absurd, value: value, eligible: enriched.length };
  }

  /* ==========================================================================
   * 导出
   * ======================================================================== */

  var LOGIC = {
    parseNutrition: parseNutrition,
    buildNutritionIndex: buildNutritionIndex,
    rowKcal: rowKcal,
    priceFen: priceFen,
    fenToYuan: fenToYuan,
    calories: calories,
    analyze: analyze,
    comboKey: comboKey,
    shortId: shortId,
    generateName: generateName,
    buildBoards: buildBoards,
    SEED_ENTRIES: SEED_ENTRIES,
    hash32: hash32,
    TEMPLATES: TEMPLATES,
    SLOGANS: SLOGANS,
    HOMO: HOMO,
    KEYWORD: KEYWORD,
    ABSTRACT: ABSTRACT,
    IDIOM_BY_KEY: IDIOM_BY_KEY,
    SUFFIX: SUFFIX
  };

  root.MCDLogic = LOGIC;
  if (typeof module !== 'undefined' && module.exports) module.exports = LOGIC;
})(typeof window !== 'undefined' ? window : globalThis);
