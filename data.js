/* ============================================================================
 * data.js — 「麦门隐藏菜单实验室」数据层
 * ----------------------------------------------------------------------------
 * 所有字段均来自 2026-10-24 实测的 mcd-mcp 真实返回（只读调用），未做任何改写。
 * 门店：storeCode 1950564 麦当劳北京建外SOHO(A座)餐厅 · 到店自取(beType=1)
 *
 * 字段命名刻意保留 MCP 原样（含首字母小写的驼峰、字符串型价格），
 * 以便前端必须显式处理类型差异，而不是"看起来像数字就用"。
 * ========================================================================== */

(function (root) {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1) query-nearby-stores 返回的门店对象（原样字段，仅取选中门店）
   *    注意：beType=1 场景下 **没有 beCode 字段**（键不存在，不是空串）
   *         longitude / latitude 实测恒为 0.0 —— 字段在、值无效，不可打点
   * ------------------------------------------------------------------------ */
  var STORE = {
    storeCode: '1950564',
    storeName: '麦当劳北京建外SOHO(A座)餐厅',
    address: '东三环中路39号院建外SOHO-A座',
    distance: 269,
    businessStatus: true,
    businessStartTime: '07:00',
    businessEndTime: '22:00',
    longitude: 0.0,
    latitude: 0.0,
    reservation: true
    /* beCode：不存在 —— 详见文档注释 */
  };

  /* 本次位置搜索命中的 5 家门店（只展示，不参与玩法） */
  var NEARBY_STORES = [
    { storeCode: '1950564', storeName: '麦当劳北京建外SOHO(A座)餐厅', address: '东三环中路39号院建外SOHO-A座', distance: 269 },
    { storeCode: '1950581', storeName: '麦当劳北京光华东里餐厅', address: '光华东里8号院1号楼B1层B1-03商铺 ', distance: 394 },
    { storeCode: '1950754', storeName: '麦当劳北京景辉街餐厅', address: '阳光保险金融中心地下一层麦当劳', distance: 538 },
    { storeCode: '1950925', storeName: '麦当劳北京光华路世纪财富中心餐厅', address: '光华路5号院世纪财富中心B1-107', distance: 649 },
    { storeCode: '1950553', storeName: '麦当劳北京景华南街餐厅', address: '东三环中路25号住总大厦', distance: 729 }
  ];

  /* --------------------------------------------------------------------------
   * 2) query-meals —— data.meals 是 **map（key=productCode）**，不是数组
   *    currentPrice / originalPrice 是 **字符串**，单位 **元**，仅作展示，绝不参与求和
   *    （原样保留字符串，不做 Number() 预处理，由展示层自行格式化）
   * ------------------------------------------------------------------------ */
  var MENU = {
    '1100': { name: '巨无霸', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260309/product/MS_1100_320.png', currentPrice: '25.5', originalPrice: '25.5', canWithOrder: false },
    '1440': { name: '麦辣鸡腿汉堡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260325/product/MS_1440_320.png', currentPrice: '22.5', originalPrice: '22.5', canWithOrder: false },
    '1406': { name: '板烧鸡腿堡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20241008/product/MS_1406_320.png', currentPrice: '23.5', originalPrice: '23.5', canWithOrder: false },
    '1450': { name: '麦香鸡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1450_320.png', currentPrice: '17', originalPrice: '17', canWithOrder: false },
    '1600': { name: '麦香鱼', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260101/product/MS_1600_320.png', currentPrice: '22.5', originalPrice: '22.5', canWithOrder: false },
    '1120': { name: '双层吉士汉堡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260309/product/MS_1120_320.png', currentPrice: '23', originalPrice: '23', canWithOrder: false },
    '4648': { name: '不素之霸双层牛堡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260309/product/MS_4648_320.png', currentPrice: '26.5', originalPrice: '26.5', canWithOrder: false },
    '1700': { name: '麦辣鸡翅', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260325/product/MS_G1700_320.png', currentPrice: '15', originalPrice: '15', canWithOrder: false },
    '1401': { name: '麦乐鸡', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260529/product/MS_G1401_320.png', currentPrice: '14', originalPrice: '14', canWithOrder: false },
    '4810': { name: '薯条', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20250523/product/MS_G4810_320_1747877491921.png', currentPrice: '13.5', originalPrice: '13.5', canWithOrder: false },
    '4437': { name: '玉米杯', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G4437_320.png', currentPrice: '13', originalPrice: '13', canWithOrder: false },
    '515837': { name: '圆筒冰淇淋', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G515837_320.png', currentPrice: '5', originalPrice: '5', canWithOrder: false },
    '9900008754': { name: '经典麦旋风', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G9900008754_320.gif', currentPrice: '15.5', originalPrice: '15.5', canWithOrder: false },
    '9900008751': { name: '可乐', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G9900008751_320.gif', currentPrice: '9.5', originalPrice: '9.5', canWithOrder: false },
    '521156': { name: '那么大鸡排（椒盐风味）', image: 'https://menu-img.mcd.cn/pcm/prod/menu/20260101/product/MS_521156_320.png', currentPrice: '14', originalPrice: '14', canWithOrder: false },
    '3505': { name: '锡兰红茶', image: 'https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_3505_320.png', currentPrice: '11.5', originalPrice: '11.5', canWithOrder: false }
  };

  /* --------------------------------------------------------------------------
   * 3) query-meal-detail 返回的 data.name —— **营养匹配的唯一键**
   *    与 menu 名并不一致：4810 菜单叫「薯条」、详情叫「中薯条」
   *    1700 菜单叫「麦辣鸡翅」、详情叫「麦辣鸡翅2块」
   *    4437 菜单叫「玉米杯」、详情叫「小杯玉米杯」
   * ------------------------------------------------------------------------ */
  var DETAIL_NAME = {
    '1100': '巨无霸',
    '1440': '麦辣鸡腿汉堡',
    '1406': '板烧鸡腿堡',
    '1450': '麦香鸡',
    '1600': '麦香鱼',
    '1120': '双层吉士汉堡',
    '4648': '不素之霸双层牛堡',
    '1700': '麦辣鸡翅2块',
    '1401': '麦乐鸡5块',
    '4810': '中薯条',
    '4437': '小杯玉米杯',
    '515837': '圆筒冰淇淋',
    '9900008754': '经典麦旋风',
    '9900008751': '可乐',
    '521156': '那么大鸡排（椒盐风味）',
    '3505': '锡兰红茶'
  };

  /* 详情接口是否支持特调（决定卡片上是否标【可特调】） */
  var SUPPORT_MODIFY = {
    '1100': true, '1440': true, '1406': true, '1450': true, '1600': true, '1120': true, '4648': true,
    '1700': false, '1401': false, '4810': false, '4437': false, '515837': false,
    '9900008754': false, '9900008751': false, '521156': false, '3505': false
  };

  /* --------------------------------------------------------------------------
   * 4) calculate-price 返回的 data.productList —— **价格唯一来源**
   *    subtotal / originalSubtotal 单位 **分（整数）**，展示时 ÷100
   *    这 16 项来自同一次 calculate-price 调用（合计 productPrice=27150 分），
   *    逐项小计之和 = 总额，且 discount=0，故组合总额 = 所选小计之和。
   *    已另做对账：1100+1440+4810 单独调用返回 price=6150，等于 2550+2250+1350。
   * ------------------------------------------------------------------------ */
  var PRICE_FEN = {
    '1100': { subtotal: 2550, originalSubtotal: 2550, productName: '巨无霸' },
    '1440': { subtotal: 2250, originalSubtotal: 2250, productName: '麦辣鸡腿汉堡' },
    '1406': { subtotal: 2350, originalSubtotal: 2350, productName: '板烧鸡腿堡' },
    '1450': { subtotal: 1700, originalSubtotal: 1700, productName: '麦香鸡' },
    '1600': { subtotal: 2250, originalSubtotal: 2250, productName: '麦香鱼' },
    '1120': { subtotal: 2300, originalSubtotal: 2300, productName: '双层吉士汉堡' },
    '4648': { subtotal: 2650, originalSubtotal: 2650, productName: '不素之霸双层牛堡' },
    '1700': { subtotal: 1500, originalSubtotal: 1500, productName: '麦辣鸡翅2块' },
    '1401': { subtotal: 1400, originalSubtotal: 1400, productName: '麦乐鸡5块' },
    '4810': { subtotal: 1350, originalSubtotal: 1350, productName: '中薯条' },
    '4437': { subtotal: 1300, originalSubtotal: 1300, productName: '小杯玉米杯' },
    '515837': { subtotal: 500, originalSubtotal: 500, productName: '圆筒冰淇淋' },
    '9900008754': { subtotal: 1550, originalSubtotal: 1550, productName: '经典麦旋风' },
    '9900008751': { subtotal: 950, originalSubtotal: 950, productName: '可乐' },
    '521156': { subtotal: 1400, originalSubtotal: 1400, productName: '那么大鸡排（椒盐风味）' },
    '3505': { subtotal: 1150, originalSubtotal: 1150, productName: '锡兰红茶' }
  };

  /* 原始响应片段（页面「数据账本」里原样展示，供核对） */
  var PRICE_RESPONSE_RAW = '{"success":true,"code":200,"message":"请求成功","datetime":"2026-10-24 19:03:31","traceId":"2602552eec71a0dfb3588e3dbe7d83b0","data":{"productOriginalPrice":27150,"productPrice":27150,"originalPrice":27150,"discount":0,"price":27150,"productList":[{"productCode":"1100","productName":"巨无霸","quantity":1,"originalSubtotal":2550,"subtotal":2550},{"productCode":"1440","productName":"麦辣鸡腿汉堡","quantity":1,"originalSubtotal":2250,"subtotal":2250},{"productCode":"1406","productName":"板烧鸡腿堡","quantity":1,"originalSubtotal":2350,"subtotal":2350},{"productCode":"1450","productName":"麦香鸡","quantity":1,"originalSubtotal":1700,"subtotal":1700},{"productCode":"1600","productName":"麦香鱼","quantity":1,"originalSubtotal":2250,"subtotal":2250},{"productCode":"1120","productName":"双层吉士汉堡","quantity":1,"originalSubtotal":2300,"subtotal":2300},{"productCode":"4648","productName":"不素之霸双层牛堡","quantity":1,"originalSubtotal":2650,"subtotal":2650},{"productCode":"1700","productName":"麦辣鸡翅2块","quantity":1,"originalSubtotal":1500,"subtotal":1500},{"productCode":"1401","productName":"麦乐鸡5块","quantity":1,"originalSubtotal":1400,"subtotal":1400},{"productCode":"4810","productName":"中薯条","quantity":1,"originalSubtotal":1350,"subtotal":1350},{"productCode":"4437","productName":"小杯玉米杯","quantity":1,"originalSubtotal":1300,"subtotal":1300},{"productCode":"515837","productName":"圆筒冰淇淋","quantity":1,"originalSubtotal":500,"subtotal":500},{"productCode":"9900008754","productName":"经典麦旋风","quantity":1,"originalSubtotal":1550,"subtotal":1550},{"productCode":"9900008751","productName":"可乐","quantity":1,"originalSubtotal":950,"subtotal":950},{"productCode":"521156","productName":"那么大鸡排（椒盐风味）","quantity":1,"originalSubtotal":1400,"subtotal":1400},{"productCode":"3505","productName":"锡兰红茶","quantity":1,"originalSubtotal":1150,"subtotal":1150}],"takeWayList":[{"code":"eat-in","title":"堂食","subtitle":"店内用餐"},{"code":"take-in-store","title":"外带","subtitle":"店内自提"}]}}';

  /* 详情接口原始返回（可乐自带选配轮次，展示"rounds 有内容"与"空数组"的差别） */
  var DETAIL_RESPONSE_RAW = {
    '4810': '{"success":true,"code":200,"message":"请求成功","datetime":"2026-10-24 18:55:50","traceId":"555ec0e6a5f0ff740c47af2940a8daf0","data":{"code":"4810","name":"中薯条","rounds":[],"image":"https://menu-img.mcd.cn/pcm/prod/menu/20250423/product/MS_4810_600_1745199801147.png","supportModify":false}}',
    '9900008751': '{"success":true,"code":200,"message":"请求成功","datetime":"2026-10-24 19:03:41","traceId":"d5c91d879348e6245af23fa255951446","data":{"code":"9900008751","name":"可乐","rounds":[{"id":1,"name":"选择饮料","quantity":1,"maxQuantity":1,"minQuantity":1,"choices":[{"code":"3000","name":"可乐小杯","quantity":1,"maxQuantity":-1,"isDefault":1,"diffPrice":"+ ¥0","supportModify":true},{"code":"3050","name":"可乐中杯","quantity":0,"maxQuantity":-1,"isDefault":0,"diffPrice":"+ ¥0.5","supportModify":true},{"code":"3100","name":"可乐大杯","quantity":0,"maxQuantity":-1,"isDefault":0,"diffPrice":"+ ¥2.5","supportModify":true}]}],"image":"https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_9900008751_600.png","supportModify":false}}'
  };

  /* --------------------------------------------------------------------------
   * 5) 手工映射表：code → 营养表 productName
   *    规则（写死在注里，可核对）：
   *      · 详情名与营养表名完全一致 → 直映射
   *      · 只差标点/连字符（麦辣鸡翅2块 vs 麦辣鸡翅-2块）→ 映射，注明依据
   *      · 只差括号内风味后缀（那么大鸡排（椒盐风味） vs 那么大鸡排）→ 映射，注明依据
   *      · 详情名不足以唯一定位（可乐 → 表里只有"可乐小/中/大杯"；经典麦旋风 → 表里只有具体口味）
   *        → **不映射，标未知，绝不模糊猜**
   * ------------------------------------------------------------------------ */
  var NUTRITION_KEY = {
    '1100': { key: '巨无霸', reason: '详情名与营养表名一致' },
    '1440': { key: '麦辣鸡腿汉堡', reason: '详情名与营养表名一致' },
    '1406': { key: '板烧鸡腿堡', reason: '详情名与营养表名一致' },
    '1450': { key: '麦香鸡', reason: '详情名与营养表名一致' },
    '1600': { key: '麦香鱼', reason: '详情名与营养表名一致' },
    '1120': { key: '双层吉士汉堡', reason: '详情名与营养表名一致' },
    '4648': { key: '不素之霸双层牛堡', reason: '详情名与营养表名一致' },
    '1700': { key: '麦辣鸡翅-2块', reason: '详情名「麦辣鸡翅2块」仅差一个连字符' },
    '1401': { key: '麦乐鸡5块', reason: '详情名与营养表名一致' },
    '4810': { key: '中薯条', reason: '详情名与营养表名一致（菜单名是「薯条」，不可用）' },
    '4437': { key: '小杯玉米杯', reason: '详情名与营养表名一致；该名称在表中出现 2 次' },
    '515837': { key: '圆筒冰淇淋', reason: '详情名与营养表名一致' },
    '9900008754': { key: null, reason: '详情名「经典麦旋风」在营养表中无对应行；表里只有「奥利奥麦旋风」「草莓麦旋风」等具体口味，按规则不推断 → 未知' },
    '9900008751': { key: null, reason: '详情名「可乐」在营养表中无对应行；表里只有「可乐小杯/中杯/大杯」，杯型不同数值不同，按规则不推断 → 未知' },
    '521156': { key: '那么大鸡排', reason: '详情名「那么大鸡排（椒盐风味）」去掉括号内风味标注后主名一致' },
    '3505': { key: '锡兰红茶', reason: '详情名与营养表名一致' }
  };

  /* 卡片分组的展示用分类（仅 UI 归类，不影响任何数据口径） */
  var CATEGORY = {
    '1100': '汉堡', '1440': '汉堡', '1406': '汉堡', '1450': '汉堡', '1600': '汉堡', '1120': '汉堡', '4648': '汉堡',
    '1700': '炸物', '1401': '炸物', '521156': '炸物',
    '4810': '小食', '4437': '小食',
    '515837': '甜品', '9900008754': '甜品',
    '9900008751': '饮品', '3505': '饮品'
  };

  /* --------------------------------------------------------------------------
   * 6) list-nutrition-foods 的 data —— **原样一整段字符串**（不是 JSON 数组）
   *    头部自述 [160] 条、9 列；每行 2 空格缩进、逗号分隔
   *    必须 parse 后才能求和；列名以这段头部自述为准
   * ------------------------------------------------------------------------ */
  var NUTRITION_RAW = '[160]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:\n' +
'  猪柳麦满分,null,1288,308,16,16,24,781,213\n' +
'  猪柳蛋麦满分,null,1618,387,23,21,25,846,243\n' +
'  烟肉蛋麦满分,null,1089,260,16,10,24,483,238\n' +
'  火腿扒麦满分,null,1092,261,14,12,24,608,131\n' +
'  中薯条,null,1210,289,4,12,38,165,18\n' +
'  大薯条,null,1587,379,6,16,50,216,23\n' +
'  小薯条,null,877,210,3,9,28,120,13\n' +
'  迷你薯条,null,444,106,2,4,14,61,6\n' +
'  圆筒冰淇淋,null,391,93,2,3,14,36,77\n' +
'  麦乐鸡5块,null,890,213,12,12,13,422,9\n' +
'  大杯玉米杯,null,365,87,4,1,12,2,10\n' +
'  小杯玉米杯,null,223,53,2,1,7,1,6\n' +
'  麦辣鸡翅-2块,null,937,224,13,15,9,537,13\n' +
'  朱古力新地,null,1178,282,5,9,44,126,182\n' +
'  草莓新地,null,1027,245,4,6,43,84,158\n' +
'  奥利奥麦旋风,null,1115,266,5,9,40,116,185\n' +
'  草莓麦旋风,null,1234,295,6,9,47,122,186\n' +
'  香芋派,null,971,232,2,12,28,159,7\n' +
'  菠萝派,null,925,221,2,11,27,147,5\n' +
'  大脆鸡扒麦满分,null,1510,361,16,17,35,804,130\n' +
'  原味板烧鸡腿麦满分,null,1029,246,15,9,25,611,133\n' +
'  双层原味板烧鸡腿麦满分,null,1486,355,23,17,27,984,138\n' +
'  吉士汉堡包,null,1231,294,16,12,30,673,144\n' +
'  双层吉士汉堡,null,1796,429,27,22,31,1017,232\n' +
'  麦香鸡,null,1546,369,15,17,39,731,73\n' +
'  麦香鱼,null,1359,325,16,13,35,556,99\n' +
'  麦辣鸡腿汉堡,null,2029,485,24,24,42,1208,154\n' +
'  板烧鸡腿堡,null,1638,391,23,17,35,1041,93\n' +
'  巨无霸,null,2146,513,27,26,42,961,171\n' +
'  培根蔬萃双层牛堡,null,1850,442,24,23,34,728,73\n' +
'  可乐中杯,null,616,147,0,0,36,0,10\n' +
'  可乐大杯,null,936,224,0,0,55,0,15\n' +
'  可乐小杯,null,446,107,0,0,26,0,7\n' +
'  雪碧中杯,null,440,105,0,0,26,29,0\n' +
'  雪碧大杯,null,669,160,0,0,39,45,0\n' +
'  雪碧小杯,null,319,76,0,0,19,21,0\n' +
'  无糖可口可乐中杯,null,0,0,0,0,1,35,0\n' +
'  无糖可口可乐大杯,null,0,0,0,0,1,53,0\n' +
'  无糖可口可乐小杯,null,0,0,0,0,0,25,0\n' +
'  大杯鲜萃咖啡,null,54,13,1,0,0,3,8\n' +
'  小杯鲜萃咖啡,null,63,15,1,0,3,2,6\n' +
'  锡兰红茶,null,8,2,0,0,0,0,5\n' +
'  热朱古力,null,525,125,2,2,22,107,36\n' +
'  纯牛奶（盒装）,null,541,129,7,7,10,73,231\n' +
'  麦旋酷阳光橙,null,955,228,1,2,50,77,52\n' +
'  浓缩咖啡,null,54,13,1,0,2,0,7\n' +
'  那么大鸡排,null,1612,385,24,21,24,996,13\n' +
'  阳光柠檬红茶中杯,null,488,117,0,0,29,17,0\n' +
'  阳光柠檬红茶大杯,null,743,178,0,0,43,25,0\n' +
'  阳光柠檬红茶小杯,null,354,85,0,0,21,12,0\n' +
'  脆薯饼,null,612,146,1,9,14,311,7\n' +
'  脆香油条,null,844,202,5,12,19,230,18\n' +
'  100%苹果汁,null,368,88,0,0,21,0,0\n' +
'  汉堡包,null,1039,248,13,8,29,492,61\n' +
'  麦乐鸡4块,null,712,170,10,10,11,337,7\n' +
'  小杯玉米杯,null,223,53,2,1,7,1,6\n' +
'  纯牛奶（盒装）,null,541,129,7,7,10,73,231\n' +
'  纯悦,能量约清水1杯,0,0,0,0,0,0,0\n' +
'  苹果片,null,133,32,0,0,7,0,18\n' +
'  不素之霸双层牛堡,null,2062,493,28,27,34,1012,75\n' +
'  双层深海鳕鱼堡,null,2029,485,28,21,46,917,147\n' +
'  儿童鱼排堡,null,1126,269,15,6,36,442,58\n' +
'  培根安格斯厚牛堡,null,2959,707,34,44,43,1037,161\n' +
'  芝士安格斯厚牛堡,能量约鲈鱼1条,2914,696,32,44,43,897,150\n' +
'  yeyeyeye奶冻款,null,932,223,1,4,43,37,64\n' +
'  皮蛋鸡肉粥,null,558,133,6,3,20,611,20\n' +
'  雪菜脆笋鸡肉粥,null,504,120,4,2,22,552,14\n' +
'  猪柳炒双蛋堡,null,1827,437,25,24,29,705,116\n' +
'  yeyeyeye爆珠款,null,889,212,1,3,42,122,124\n' +
'  柠檬拉明顿,能量约猕猴桃2个,506,121,2,7,12,35,17\n' +
'  芝士双层安格斯厚牛堡,null,4195,1003,58,65,46,1373,251\n' +
'  培根双层安格斯厚牛堡,null,4128,987,55,64,46,1191,226\n' +
'  火腿扒早安营养卷,null,1857,444,16,24,39,1065,108\n' +
'  麦麦脆汁鸡-琵琶腿,null,1372,328,21,20,16,905,24\n' +
'  德式图林根香肠,null,366,87,5,6,2,293,5\n' +
'  图林根香肠早安营养卷,null,1779,425,14,23,38,977,68\n' +
'  麦麦脆汁鸡-带骨里脊,null,1389,332,22,18,16,812,25\n' +
'  【美汁源】“黄金橙橙”,null,691,165,0,0,41,53,0\n' +
'  优品豆浆大杯,null,844,202,8,4,33,43,21\n' +
'  优品豆浆小杯,null,633,151,6,3,25,32,15\n' +
'  浓浓黑巧雪冰中杯,null,1501,359,8,12,51,224,207\n' +
'  浓浓黑巧雪冰大杯,null,1857,444,11,14,65,258,251\n' +
'  特浓奶香雪冰中杯,null,1124,269,6,11,36,180,188\n' +
'  特浓奶香雪冰大杯,null,1291,309,7,12,42,192,223\n' +
'  浓浓抹茶雪冰中杯,null,1208,289,7,11,39,181,220\n' +
'  浓浓抹茶雪冰大杯,null,1418,339,8,12,48,194,270\n' +
'  热牛奶中杯,null,738,176,10,8,15,101,319\n' +
'  热牛奶大杯,null,1006,240,13,11,21,137,435\n' +
'  热牛奶小杯,null,617,147,8,7,13,84,267\n' +
'  冰牛奶中杯,null,939,224,13,11,19,128,406\n' +
'  冰牛奶大杯,null,1127,269,15,13,23,154,487\n' +
'  冰牛奶小杯,null,617,147,8,7,13,84,267\n' +
'  冰奶铁中杯,null,618,148,8,7,13,77,251\n' +
'  冰奶铁大杯,null,678,162,9,7,15,85,275\n' +
'  冰奶铁小杯,null,358,86,5,4,8,44,144\n' +
'  热奶铁中杯,null,779,186,11,8,17,99,320\n' +
'  热奶铁大杯,null,1040,249,14,11,22,134,431\n' +
'  热奶铁小杯,null,559,134,8,6,12,72,231\n' +
'  冰燕麦奶铁中杯,null,554,132,3,5,17,87,270\n' +
'  冰燕麦奶铁大杯,null,608,145,4,5,19,96,296\n' +
'  冰燕麦奶铁小杯,null,322,77,2,3,10,50,155\n' +
'  热燕麦奶铁中杯,null,697,167,4,6,22,112,345\n' +
'  热燕麦奶铁大杯,null,929,222,5,8,29,152,464\n' +
'  热燕麦奶铁小杯,null,500,120,3,5,16,81,248\n' +
'  冰美式中杯,null,54,13,1,0,2,0,7\n' +
'  冰美式大杯,null,60,14,1,0,2,0,8\n' +
'  冰美式小杯,null,41,10,1,0,1,0,6\n' +
'  热美式中杯,null,54,13,1,0,2,0,7\n' +
'  热美式大杯,null,60,14,1,0,2,0,8\n' +
'  热美式小杯,null,41,10,1,0,1,0,6\n' +
'  冰焦糖玛奇朵,null,618,148,8,7,13,77,251\n' +
'  热焦糖玛奇朵,null,698,167,9,7,15,88,284\n' +
'  卡布奇诺中杯,null,698,167,9,7,15,88,285\n' +
'  卡布奇诺大杯,null,932,223,13,10,20,120,385\n' +
'  冰浓浓燕麦黑巧中杯,null,500,120,2,5,16,87,263\n' +
'  冰浓浓燕麦黑巧大杯,null,547,131,3,5,17,95,388\n' +
'  冰燕麦奶中杯,null,833,199,4,8,26,145,438\n' +
'  冰燕麦奶大杯,null,1000,239,5,9,32,174,525\n' +
'  冰燕麦奶小杯,null,547,131,3,5,17,95,288\n' +
'  热燕麦奶中杯,null,655,157,3,6,21,114,344\n' +
'  热燕麦奶大杯,null,893,213,4,8,28,156,469\n' +
'  热燕麦奶小杯,null,547,131,3,5,17,95,288\n' +
'  冰浓浓抹茶牛奶中杯,null,821,196,8,6,25,80,275\n' +
'  冰浓浓抹茶牛奶大杯,null,1004,240,9,7,33,89,314\n' +
'  热浓浓抹茶牛奶中杯,null,996,238,11,8,29,104,351\n' +
'  热浓浓抹茶牛奶大杯,null,1393,333,14,12,41,142,482\n' +
'  冰浓浓黑巧中杯,null,563,135,8,6,12,77,244\n' +
'  冰浓浓黑巧大杯,null,617,147,8,7,13,84,267\n' +
'  热浓浓黑巧中杯,null,738,176,10,8,15,101,319\n' +
'  热浓浓黑巧大杯,null,1006,240,13,11,21,137,435\n' +
'  川宁伯爵红茶,null,7,2,0,0,0,0,0\n' +
'  抹茶阿芙佳朵,null,613,147,3,4,23,50,136\n' +
'  咖啡阿芙佳朵,null,583,139,4,4,21,49,111\n' +
'  热浓浓燕麦黑巧中杯,null,655,157,3,6,21,114,344\n' +
'  热浓浓燕麦黑巧大杯,null,893,213,4,8,28,156,469\n' +
'  草莓拉明顿,null,507,121,2,8,11,34,17\n' +
'  原味板烧鸡腿炒双蛋堡,null,1754,419,27,21,30,715,116\n' +
'  双层猪柳蛋麦满分,null,2148,513,29,32,26,1210,249\n' +
'  双层火腿扒麦满分,null,1611,385,21,22,26,979,134\n' +
'  脆脆薯条,null,1168,279,4,14,32,540,13\n' +
'  麦麦趣鸡球,null,1113,266,17,13,19,789,13\n' +
'  酥酥多笋卷,null,1431,342,14,15,36,1044,41\n' +
'  薄皮焦香V翅,null,804,192,17,11,6,594,15\n' +
'  蜜汁BBQ风味薄皮脆汁鸡-带骨里脊,null,637,152,20,5,6,635,28\n' +
'  蜜汁BBQ风味薄皮脆汁鸡-琵琶腿,null,724,173,18,9,5,547,15\n' +
'  果然多肉,null,2001,478,36,17,44,1343,190\n' +
'  “苹板”支撑Pro,null,1993,476,25,18,50,1077,117\n' +
'  专“薯鱼”你,null,1936,463,18,17,57,652,123\n' +
'  绝代双翅,null,1964,469,32,27,23,1167,34\n' +
'  牛气满满,null,2073,495,26,24,42,764,79\n' +
'  蜜汁快乐,null,1081,258,22,9,20,721,34\n' +
'  迷你朱古力新地,null,586,140,3,4,22,63,90\n' +
'  迷你草莓新地,null,511,122,2,3,21,42,78\n' +
'  鲜蔬蛋沙拉叠叠卷,null,1114,266,11,14,24,518,62\n' +
'  鸡肉蛋沙拉叠叠卷,null,1621,387,17,21,31,842,67\n' +
'  中杯怡泉+C,null,461,110,0,0,27,0,0\n' +
'  大杯怡泉+C,null,701,168,0,0,41,0,0\n' +
'  蒜了吧黄油风味薄皮脆汁鸡-琵琶腿,null,688,164,19,6,6,867,9\n' +
'  蒜了吧黄油风味薄皮脆汁鸡-带骨里脊,null,526,126,19,2,4,750,59\n' +
'  柠萌风味薄皮焦香V翅,null,855,204,18,11,6,768,22';

  /* --------------------------------------------------------------------------
   * 7) 可配置项 —— 建好仓库后把这里换成真实地址即可
   * ------------------------------------------------------------------------ */
  var CONFIG = {
    REPO_URL: 'https://github.com/dachengzi6661/mcd-hidden-menu-lab',
    REPO_READY: true,
    STORE_CODE: '1950564',
    READONLY: true
  };

  var DATA = {
    STORE: STORE,
    NEARBY_STORES: NEARBY_STORES,
    MENU: MENU,
    DETAIL_NAME: DETAIL_NAME,
    SUPPORT_MODIFY: SUPPORT_MODIFY,
    PRICE_FEN: PRICE_FEN,
    PRICE_RESPONSE_RAW: PRICE_RESPONSE_RAW,
    DETAIL_RESPONSE_RAW: DETAIL_RESPONSE_RAW,
    NUTRITION_KEY: NUTRITION_KEY,
    NUTRITION_RAW: NUTRITION_RAW,
    CATEGORY: CATEGORY,
    CONFIG: CONFIG
  };

  root.MCD = DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
