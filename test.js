/* test.js — 逻辑层自检（Node 运行，不依赖浏览器） */
'use strict';

const D = require('./data.js');
const L = require('./logic.js');

let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (extra ? '  → ' + extra : '')); }
}
function head(t) { console.log('\n' + t); }

/* ---------------- 1. 营养表解析 ---------------- */
head('[1] 营养表解析');
const parsed = L.parseNutrition(D.NUTRITION_RAW);
ok(parsed.declared === 160, '头部自述 160 条', 'declared=' + parsed.declared);
ok(parsed.rows.length === 160, '实际解析 160 行', 'parsed=' + parsed.rows.length);
ok(parsed.anomalies.length === 0, '无列数异常行', JSON.stringify(parsed.anomalies));
ok(parsed.columns.length === 9, '解析出 9 列', parsed.columns.join('|'));
ok(parsed.columns[0] === 'productName' && parsed.columns[3] === 'energyKcal', '列名与头部自述一致');

const idx = L.buildNutritionIndex(parsed);
ok(idx.dupNames.length === 2, '识别出 2 个重名', JSON.stringify(idx.dupNames));
ok(idx.dupNames.includes('小杯玉米杯'), '「小杯玉米杯」重名');
ok(idx.dupNames.includes('纯牛奶（盒装）'), '「纯牛奶（盒装）」重名');

/* 抽查若干行的千卡值 */
const expect = {
  '巨无霸': 513, '麦辣鸡腿汉堡': 485, '中薯条': 289, '板烧鸡腿堡': 391,
  '麦香鸡': 369, '麦香鱼': 325, '双层吉士汉堡': 429, '不素之霸双层牛堡': 493,
  '麦辣鸡翅-2块': 224, '麦乐鸡5块': 213, '小杯玉米杯': 53, '圆筒冰淇淋': 93,
  '那么大鸡排': 385, '锡兰红茶': 2
};
let allOk = true;
for (const [n, v] of Object.entries(expect)) {
  const got = L.rowKcal(idx.byName[n] && idx.byName[n][0]);
  if (got !== v) { allOk = false; console.log('    异常：' + n + ' 期望 ' + v + ' 实得 ' + got); }
}
ok(allOk, '14 个单品营养值全部命中');

/* ---------------- 2. 价格 ---------------- */
head('[2] 价格口径');
const totalAll = Object.keys(D.PRICE_FEN).reduce((s, c) => s + D.PRICE_FEN[c].subtotal, 0);
ok(totalAll === 27150, '16 项小计之和 = calculate-price 的 productPrice(27150)', 'sum=' + totalAll);

const combo3 = ['1100', '1440', '4810'];
ok(L.priceFen(combo3) === 6150, '巨无霸+麦辣鸡腿汉堡+薯条 = 6150 分（与单独调用一致）', 'got=' + L.priceFen(combo3));
ok(L.fenToYuan(6150) === '61.50', '分转元格式 61.50', L.fenToYuan(6150));
ok(L.fenToYuan(500) === '5.00', '500 分 → 5.00 元（不是 5 元）', L.fenToYuan(500));

/* 菜单字符串 vs 算价整数：确认两者未混用 */
ok(typeof D.MENU['1100'].currentPrice === 'string', '菜单 currentPrice 保持字符串（未预处理成数字）');
ok(Number(D.MENU['1100'].currentPrice) * 100 === D.PRICE_FEN['1100'].subtotal, '同一 code：菜单元 × 100 = 算价分（可对账）');

/* ---------------- 3. 热量与未知 ---------------- */
head('[3] 热量求和与「未知」');
const c1 = L.calories(combo3, idx);
ok(c1.kcal === 513 + 485 + 289, '三件套热量 1287', 'got=' + c1.kcal);
ok(c1.allKnown === true, '三件套热量全部已知');

const c2 = L.calories(['9900008751', '4810'], idx);
ok(c2.allKnown === false, '含「可乐」的组合标记为不完整');
ok(c2.unknown.length === 1 && c2.unknown[0].code === '9900008751', '未知项精准定位到 9900008751');
ok(c2.kcal === 289, '未知项不计入，已解析部分 = 289', 'got=' + c2.kcal);

const c3 = L.calories(['9900008754'], idx);
ok(c3.allKnown === false, '「经典麦旋风」无对应行 → 未知');

const c4 = L.calories(['4437'], idx);
ok(c4.dups.length === 1 && c4.dups[0].count === 2, '「小杯玉米杯」命中并标注重复 2 次');
ok(c4.kcal === 53, '重复行取首条，值为 53');

/* 16 个单品全量：应只有 2 个未知 */
const allUnknown = Object.keys(D.PRICE_FEN).filter(c => !L.calories([c], idx).allKnown);
ok(allUnknown.length === 2, '16 个单品中恰好 2 个热量未知', JSON.stringify(allUnknown));

/* ---------------- 4. 命名引擎 ---------------- */
head('[4] 命名引擎（完整食物词 → 有条件梗句式 → 配对口号）');
const n1 = L.generateName(combo3);
console.log('    三件套名字：' + n1.name + ' ｜ 口号：' + n1.slogan);
console.log('    ' + n1.steps.extract + ' / ' + n1.steps.homophone + ' / ' + n1.steps.template);
ok(!!n1.name && n1.name.length >= 3, '名字非空');
ok(!!n1.slogan, '口号非空');
ok(n1.name === L.generateName(['4810', '1440', '1100']).name, '同一组合（乱序）名字稳定');

const samples = [
  ['1100', '4648', '1700', '4437'],
  ['1450', '515837', '4810'],
  ['1600', '4810'],
  ['1440', '1450', '1401'],
  ['521156', '1401', '3505'],
  ['1100', '1406', '4810'],
  ['4648', '4437', '515837'],
  ['1700', '1401', '4810', '3505'],
  ['1100', '1440', '1406', '1450'],
  ['9900008754', '9900008751', '3505'],
  ['1120', '4810', '515837'],
  ['4648', '521156', '1700', '4437']
];
const names = samples.map(c => L.generateName(c));
names.forEach((n, i) => {
  console.log('    ' + samples[i].map(c => D.DETAIL_NAME[c]).join(' + '));
  console.log('      → 「' + n.name + '」 ' + n.steps.homophone + ' ｜ ' + n.templateId);
});
ok(new Set(names.map(n => n.name)).size === names.length, '12 个组合名字互不重复',
  JSON.stringify(names.map(n => n.name)));
const punCount = names.filter(n => n.swapped.length > 0).length;
ok(names.every(n => n.swapped.every(s => n.name.includes(s.to))), '谐音记录必须实际进入名字，允许不用谐音');
ok(names.every(n => n.name.length <= 16), '名字长度均 ≤16 字');

/* 新词库：实际食物锚点、来源与类别条件 */
head('[4b] 食物词与热梗覆盖');
const many=[];const codesAll=Object.keys(D.PRICE_FEN);
for(let i=0;i<codesAll.length;i++)for(let j=i+1;j<codesAll.length;j++)many.push(L.generateName([codesAll[i],codesAll[j]]));
ok(many.every(n=>n.foodWords.some(word=>n.name.includes(word))), '每个名字保留可读食物词');
ok(many.some(n=>n.sourceId==='rules-202610')&&many.some(n=>n.sourceId==='theory-202610'), '十月规矩与生活理论句式实际进入产出');
ok(many.some(n=>n.sourceId==='laoji-evergreen'), '常青老己句式实际进入产出');
console.log('    两两组合 '+many.length+' 组；完整 2500 组验收见 test-naming.js');

/* ---------------- 5. 榜单 ---------------- */
head('[5] 榜单');
const boards = L.buildBoards(L.SEED_ENTRIES, idx, 5);
console.log('    今日最离谱（热量↓）：');
boards.absurd.forEach((a, i) => console.log('      ' + (i + 1) + '. ' + a.name + '  ' + a.kcal + ' 千卡  ¥' + a.priceYuan + '  ' + a.votes + '票'));
console.log('    今日最划算（kcal/元↓）：');
boards.value.forEach((a, i) => console.log('      ' + (i + 1) + '. ' + a.name + '  ' + a.perYuan.toFixed(2) + ' kcal/元  ¥' + a.priceYuan + '  ' + a.votes + '票'));
ok(boards.absurd.length === 5, '最离谱榜 5 条');
ok(boards.value.length === 5, '最划算榜 5 条');
ok(boards.absurd[0].kcal >= boards.absurd[4].kcal, '最离谱榜按热量降序');
ok(boards.value[0].perYuan >= boards.value[4].perYuan, '最划算榜按 kcal/元 降序');
ok(boards.absurd.every(a => a.kcalAllKnown), '榜单不含热量未知的组合');

/* ---------------- 6. 选项边界 ---------------- */
head('[6] 组合边界');
ok(L.analyze(['515837'], idx).priceYuan === '5.00', '单品 5.00 元展示正确');
ok(L.analyze(['515837'], idx).perYuan === 93 / 5, '单品 perYuan = 93/5', String(L.analyze(['515837'], idx).perYuan));
let threw = false;
try { L.priceFen(['999999']); } catch (e) { threw = true; }
ok(threw, '未知 code 直接抛错，不静默算 0');

console.log('\n============================');
console.log('通过 ' + pass + ' / ' + (pass + fail) + (fail ? '，失败 ' + fail : '，全部通过'));
process.exit(fail ? 1 : 0);
