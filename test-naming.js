'use strict';
const assert = require('assert/strict');
const { performance } = require('perf_hooks');
const D = require('./data.js');
const L = require('./logic.js');
let checks = 0;
function check(label, fn) { fn(); checks++; console.log('  ✓ ' + label); }
const index = L.buildNutritionIndex(L.parseNutrition(D.NUTRITION_RAW));
const combo = ['1100', '1440', '4810'];

check('新版词库有固定版本和可追溯来源', () => {
  assert.equal(typeof L.NAMING_VERSION, 'string');
  assert.ok(L.NAMING_VERSION.startsWith('v2-'));
  assert.ok(L.TREND_SOURCES.every(s => s.url.startsWith('https://') && s.verifiedAt === '2026-10-24'));
  assert.ok(L.TREND_SOURCES.some(s => s.freshness === 'evergreen'));
});
check('常用组合表达完整食物与同一笑点', () => {
  const n = L.generateName(combo);
  assert.match(n.name, /薯条|夹薯堡|鸡薯|汉堡|辣堡|巨无霸/);
  assert.ok(n.slogan.length >= 6);
  assert.ok(n.version === L.NAMING_VERSION && n.sourceId);
});
check('真实版按详情名识别陌生 code，不取商品首字', () => {
  const n = L.generateName(['custom-a', 'custom-b'], {'custom-a': '香辣鸡腿汉堡', 'custom-b': '中薯条'});
  assert.match(n.name, /鸡|薯|堡/);
  assert.doesNotMatch(n.name, /香中|custom/);
});
check('同一 code 的自定义详情名优先，不能借旧商品特征', () => {
  const n = L.generateName(['1100', '1440'], {'1100': '热红茶', '1440': '可乐'});
  assert.match(n.name, /红茶|可乐/);
  assert.doesNotMatch(n.name + n.slogan, /堡|鸡|牛|薯|白水|大水/);
});
check('类别未知时保留可理解的完整商品词', () => {
  const n = L.generateName(['custom-a', 'custom-b'], {'custom-a': '苹果片', 'custom-b': '酸奶'});
  assert.match(n.name, /苹果片|酸奶/);
  assert.doesNotMatch(n.name, /堡|薯|鸡/);
});
check('全是陌生中文菜名时也保留整词，不按 ASCII 规则丢弃汉字', () => {
  const n=L.generateName(['custom-a','custom-b'],{'custom-a':'苹果片','custom-b':'蔬菜沙拉'});
  assert.match(n.name,/苹果片|蔬菜沙拉/);
  assert.doesNotMatch(n.name,/自选/);
});
check('超长陌生名称可读回退，不截出半截食物名或越过长度上限', () => {
  const n=L.generateName(['custom-a','custom-b'],{'custom-a':'当季手工现做特别限定惊喜下午茶拼搭','custom-b':'主厨特别推荐春夏秋冬风味尝鲜套餐'});
  assert.ok(n.name.length<=16);
  assert.match(n.name,/自选|拼搭|加餐/);
});
check('缺少商品名仍有可读兜底，不暴露数字 code', () => {
  const n = L.generateName(['x-unknown', 'y-unknown'], {});
  assert.match(n.name, /自选|拼搭|加餐/);
  assert.doesNotMatch(n.name, /x-unknown|y-unknown/);
});
check('非法组合明确报错', () => {
  assert.throws(() => L.generateName([]), /组合|单品/);
  assert.throws(() => L.generateName(['1100', '1100']), /重复/);
});
check('原算法仍能还原已发布作品名称', () => {
  assert.equal(L.generateLegacyName(combo).name, '薛定谔的聚堡');
  assert.equal(L.generateLegacyName(['1450','515837','4810']).name, '需求文档不存在属堡');
});
check('旧账本冻结名称与口号，保留 key、票数和额外字段', () => {
  const old = { key:L.comboKey(combo), codes:combo, votes:27, mine:true };
  const frozen = L.freezeLegacyEntry(old);
  assert.equal(frozen.naming.name, '薛定谔的聚堡');
  assert.equal(frozen.naming.version, 'legacy-v1');
  assert.equal(frozen.naming.slogan, L.generateLegacyName(combo).slogan);
  assert.equal(frozen.key, old.key); assert.equal(frozen.votes, 27); assert.equal(frozen.mine,true);
  assert.equal(old.naming, undefined);
  assert.deepEqual(L.freezeLegacyEntry(frozen), frozen);
});
check('名称快照贯穿结果与榜单，升级不覆盖既有作品', () => {
  const saved = L.snapshotNaming(L.generateLegacyName(combo));
  const entry = {key:L.comboKey(combo), codes:combo, votes:27, naming:saved};
  const result = L.analyze(combo,index,saved);
  assert.equal(result.name,saved.name); assert.equal(result.slogan,saved.slogan);
  const board = L.buildBoards([entry],index,5).absurd[0];
  assert.equal(board.name,saved.name); assert.equal(board.votes,27);
  assert.equal(result.priceFen,6150); assert.equal(result.kcal,1287);
});
check('损坏或含 HTML 的快照不能进入展示', () => {
  const corrupt = {version:'v2-test',name:'<img src=x>',slogan:'坏数据'};
  assert.doesNotMatch(L.analyze(combo,index,corrupt).name, /[<>]/);
});

const all = Object.keys(D.PRICE_FEN), rows=[];
const burger = new Set(['1100','1120','1406','1440','1450','1600','4648']);
const chicken = new Set(['1440','1406','1450','1401','1700','521156']);
function combinations(start, selected) {
  if(selected.length>=2) rows.push(selected.slice());
  if(selected.length===4) return;
  for(let i=start;i<all.length;i++) combinations(i+1,selected.concat(all[i]));
}
combinations(0,[]);
const started=performance.now();
let noBurger=0, withPun=0;
const unique=new Set(), recipes=new Set(), sources=new Set();
for(const codes of rows) {
  const n=L.generateName(codes), reversed=L.generateName(codes.slice().reverse());
  assert.equal(n.name,reversed.name); assert.equal(n.slogan,reversed.slogan);
  assert.ok(n.name.length>=3&&n.name.length<=16,n.name);
  assert.doesNotMatch(n.name+n.slogan,/烧心|白水|大水|低卡|减脂|零卡|不长胖/);
  if(!codes.some(c=>burger.has(c))) { noBurger++; assert.doesNotMatch(n.name,/堡/); }
  if(!codes.some(c=>chicken.has(c))) assert.doesNotMatch(n.name,/鸡/);
  if(!codes.includes('1600')) assert.doesNotMatch(n.name,/鱼/);
  if(!codes.includes('1120')) assert.doesNotMatch(n.name,/吉士|芝士/);
  if(!codes.includes('4810')) assert.doesNotMatch(n.name,/薯/);
  if(!codes.includes('515837')) assert.doesNotMatch(n.name,/甜筒/);
  if(!codes.includes('9900008754')) assert.doesNotMatch(n.name,/麦旋风/);
  assert.ok(n.foodWords.some(word=>n.name.includes(word)),n.name);
  if(n.swapped.length) withPun++;
  for(const swap of n.swapped) assert.ok(n.name.includes(swap.to));
  unique.add(n.name); recipes.add(n.templateId); sources.add(n.sourceId);
}
console.log('  ✓ 2500 组：顺序稳定、食物关联、品类准确、谐音记录真实'); checks++;
assert.equal(rows.length,2500); assert.equal(noBurger,246);
assert.ok(recipes.size>=12,'模板覆盖不足');
// 2026-10-24 旧版全量审计：2500 组有 2024 个不同名字。
assert.ok(unique.size>=2024,'提高可懂度时不增加相对旧词库的全量同名数量');
assert.ok(sources.has('rules-202610')&&sources.has('theory-202610')&&sources.has('laoji-evergreen'));
console.log(JSON.stringify({checks,combinations:rows.length,uniqueNames:unique.size,templates:recipes.size,
  punNames:withPun,noBurgerCombos:noBurger,enumerationMs:Math.round(performance.now()-started)},null,2));
console.log('命名回归通过 '+checks+' 项。');
