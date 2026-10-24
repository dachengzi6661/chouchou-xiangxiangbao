---
name: chouchou-xiangxiangbao
description: 从麦当劳门店真实在售的单品里挑 2–4 个，拼成一个官方没有的"隐藏款"，用 mcd-mcp 官方核价与算营养，再生成食材可辨的热梗名字和海报。当用户说"帮我拼一个麦当劳隐藏款 / DIY 组合 / 这套多少钱多少卡 / 随便配一个"时使用。
---

# 抽抽想香堡（真实调用版）

把一个门店**真实在售**的 2–4 个单品拼成一个不存在的组合，用官方接口算钱算卡，起个抽象名字，出张海报。

## 边界（先读这段）

- **只读**：只允许调用 `query-nearby-stores`、`query-meals`、`query-meal-detail`、`list-nutrition-foods`、`calculate-price`。
- **禁止**：`create-order`、`query-order`、`draw-lottery`、`available-coupons`、`auto-bind-coupons`、`query-my-account`、`delivery-*`、`party-*` 等任何写操作与个人资产类工具。用户明确要求下单也不在本 Skill 范围内。
- **DIY 组合是本地拼的**：MCP 没有"DIY/组合"工具。用户选的是**现有单品**，"拼"这一步发生在本地，价格的权威回答来自 `calculate-price`。
- 名字是程序生成的**民间 DIY 名**，必须标注「用户 DIY 款 · 非官方产品名」，绝不能当成官方产品名。
- 价格与热量必须来自接口返回，**查不到就写「未知」，不许估算、不许外推**。

## 调用流程

### 1. 定位门店

```
query-nearby-stores(searchType=2, city=<城市>, keyword=<地标>, beType=1)
```

- `beType=1` 是到店自取，`beType=5` 是得来速；本 Skill 默认 `1`
- 展示 `storeName / address / distance`，让用户选一家；**记住 `storeCode`**
- **`beType=1` 时返回里没有 `beCode`**（键不存在，不是空串），后续所有工具都不传

### 2. 拉菜单

```
query-meals(storeCode=<上一步>, orderType=1, beType=1)
```

- `data.meals` 是 **map（key = productCode）不是数组**，遍历要 `Object.values()`
- 只挑**单品**，排除套餐 / 双人餐 / 周边 / 酱料
- 展示时给出「名称 + 价格」，价格用 `D.PRICE_FEN` 等价的权威值（见第 5 步），菜单里的 `currentPrice` 只做参考

### 3. 用户选定 2–4 个后，逐个取详情名

```
query-meal-detail(storeCode, orderType=1, beType=1, code=<productCode>)
```

- 只取 `data.name`（后面匹配营养表要用）和 `data.supportModify`
- **为什么必须调**：菜单名和详情名会不一样 —— 菜单「薯条」详情「中薯条」、菜单「麦辣鸡翅」详情「麦辣鸡翅2块」
- 不需要传 `modification`（实测不传也能算价）

### 4. 查营养

```
list-nutrition-foods()
```

- `data` 是**一整段字符串**：`[160]{productName,nutritionDescription,energyKj,energyKcal,...}:\n  巨无霸,null,2146,513,...`
- 必须按头部自述的列名自己 parse，**不能当 JSON 用**
- 用**第 3 步拿到的详情名**去匹配 `productName`，取 `energyKcal`
- 匹配规则：
  - 完全一致 → 用
  - 只差标点/连字符（`麦辣鸡翅2块` vs `麦辣鸡翅-2块`）→ 用
  - 只差括号里的风味后缀（`那么大鸡排（椒盐风味）` vs `那么大鸡排`）→ 用
  - 需要靠推断才能确定（`可乐` 只有「可乐小/中/大杯」；`经典麦旋风` 只有具体口味）→ **判为未知，不许猜**
- 表里有重名行（「小杯玉米杯」「纯牛奶（盒装）」各 2 条），取首条并提示"可能重复"
- 表里**没有份量字段**，数值按原样用

### 5. 官方核价

```
calculate-price(storeCode, orderType=1, beType=1,
                items=[{productCode:"1100", quantity:1}, {productCode:"1440", quantity:1}, ...])
```

- 金额单位是**分（整数）**，展示时 ÷100
- 取 `data.productList[].subtotal` 逐项小计；`data.price` 是总额
- 不要传 `couponId` / `modification` / `withOrder`，本 Skill 不涉及优惠与特调
- 这个接口无副作用：不锁库存、不生成订单

### 6. 生成名字与海报

把结果写成 `combo.json`，跑脚本：

```bash
node skill/scripts/compose.js <combo.json> <输出目录>
```

`combo.json` 结构：

```json
{
  "store": { "storeCode": "1950564", "storeName": "麦当劳北京…" },
  "generatedAt": "2026-10-24 19:03",
  "items": [
    { "code": "1100", "detailName": "巨无霸", "subtotalFen": 2550, "kcal": 513 }
  ]
}
```

脚本会输出名字、口号、总价（元/分）、热量，并生成 `poster.svg`。
`kcal` 查不到就写 `null`，脚本会显示「热量未知」，**不要填 0 或估算值**。

## 命名规则

使用与网页共用的 `logic.js`，当前词库版本为 `v2-20261024`。

1. 从实际详情名识别完整食物词：吉士、鸡排、薯条、甜筒、麦旋风。
2. 按选品类别匹配规矩句式、生活理论句式、常青老己句式或成句文字游戏。
3. 名字与口号成对生成；谐音为可选，不得为了换字牺牲句意。

- 名字最多 16 字；无汉堡的组合不生成堡类名字，不凭空加入食材、规格或包装。
- 词库来源与核验日期见 `docs/naming-sources.md`；改编餐名为原创，不宣称自身已经流行。
- 同一词库版本、同一详情名和同一组合结果稳定；已有作品保留名称快照。
- 必须标注「用户 DIY 款 · 非官方产品名」。

## 输出格式

```
「<名字>」   ← 用户 DIY 款，非官方产品名
「<口号>」

总价 ¥61.50（6150 分）
热量 1287 千卡            ← 若含未知项：1287 千卡 + 1 项未知
单品 巨无霸 + 麦辣鸡腿汉堡 + 中薯条
门店 麦当劳北京建外SOHO(A座)餐厅 · 到店自取

（可选）poster.svg 已生成
```

必须保留的提示：**DIY 吃法仅供参考，实际供应与价格以门店为准。**

## 出错时

| 情况 | 处理 |
|---|---|
| `success=false` / `code≠200` | 原样报出 `message` 与 `traceId`，不要重试超过一次 |
| 门店没有在售单品 | 提示换店，不要编造 code |
| 营养表查不到 | 该单品热量写「未知」，其余照常求和，并在结果里点明有几项未知 |
| 价格接口失败 | **不要**用菜单价自己加总代替，直接报错（菜单价是字符串·元，口径不同） |
| 用户想加饮品/甜品 | 允许，但提醒"含未知项的组合不进热量榜" |
