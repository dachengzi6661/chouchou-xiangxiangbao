# MCP 集成说明

本文说明本作品**实际使用了哪些麦当劳 MCP 工具**、**调用顺序与参数**、以及**为什么这样组合**。
所有字段行为均来自 2026-10-24 的真实调用记录（门店 `1950564`，到店自取），不是照抄文档推断的。

---

## 一、先说清楚一件事

**「DIY 隐藏款」不是 MCP 提供的功能，MCP 也没有「DIY / 组合」这类工具。**

麦当劳 MCP 提供的是**原子能力**：查门店、查菜单、查餐品详情、查营养、算价格。
本作品做的是在这个原子能力之上加一层**组合与生成**：

```
用户选 N 个在售单品（N ∈ [2,4]）
        ↓  ← 用户自己选的，不是接口推荐的
把 N 个 productCode 组成一个"不存在的套餐"
        ↓  ← 本地拼装，MCP 里没有这个 SKU
交给 calculate-price 核价（这是官方对"这堆东西多少钱"的唯一权威回答）
        ↓
营养表按 code 求和 → 名字/海报 → 投票
```

换句话说：**单品是官方的，组合是用户的，价格是官方算的，名字是我们编的。**
MCP 只回答「这个单品多少钱」「这个单品多少卡」，从不回答「这几个搭一起叫什么」——后者是创意层，属于本作品。

这一点在实现上是硬约束：`calculate-price` 的入参就是 `items: [{productCode, quantity}]`，
它天然接受任意组合，所以「拼组合」这件事是**合法使用官方能力**，而不是绕过或伪造。

---

## 二、实际使用的 MCP 工具（5 个，全部只读）

| # | Tool | 入参（实际传的） | 取用字段 | 用途 |
|---|---|---|---|---|
| 1 | `query-nearby-stores` | `searchType=2, city=北京, keyword=国贸, beType=1` | `data[].storeCode / storeName / distance / reservation` | 定位门店，拿 `storeCode` |
| 2 | `query-meals` | `storeCode, orderType=1, beType=1` | `data.meals`（**map**，key=code）、`categories[].meals[].code` | 拉在售菜单，取 16 个单品 |
| 3 | `query-meal-detail` | `storeCode, orderType=1, beType=1, code` | `data.name`（**营养匹配键**）、`data.supportModify`、`data.rounds` | 逐个取详情名 |
| 4 | `list-nutrition-foods` | 无参数 | `data`（**一整段字符串**） | 营养表，按 `energyKcal` 求和 |
| 5 | `calculate-price` | `storeCode, orderType=1, beType=1, items[]` | `data.price` / `productList[].subtotal` | 官方核价（单位：分） |

### 明确**没有**调用的工具

`create-order`、`query-order`、`mall-*`、`draw-lottery`、`available-coupons`、`auto-bind-coupons`、
`query-my-account`、`delivery-*`、`party-*` 等一律未调用。

原因有二：
1. 本作品的核心是「拼 + 算 + 生成」，不需要写操作；
2. 这些工具涉及**下单、支付、优惠券、积分、个人地址与订单**，属于用户资产。演示作品不应该碰，也不应该让评审担心。

> `calculate-price` 本身无副作用：只算价，不锁库存、不生成订单。这一点已实测确认（多次调用返回 200，无订单产生）。

---

## 三、调用流程

```
① query-nearby-stores(beType=1, searchType=2, city, keyword)
   └─ 返回 5 家门店；选距离最近的一家，记住 storeCode
   └─ 注意：beType=1 时**没有 beCode 字段**（键不存在），后续工具一律不传

② query-meals(storeCode, orderType=1, beType=1)
   └─ data.meals 是 **map（key=productCode）不是数组**，遍历要 Object.values()
   └─ 从 categories[].meals[].code 拿到在售清单，人工筛出 16 个"单品"
      （排除套餐/双人餐/周边/酱料）

③ 用户选 2–4 个 code
   └─ 每个 code 调一次 query-meal-detail，取 data.name
   └─ 为什么必须调：菜单名和详情名会不一样
      4810 菜单叫「薯条」，详情叫「中薯条」
      1700 菜单叫「麦辣鸡翅」，详情叫「麦辣鸡翅2块」
      4437 菜单叫「玉米杯」，详情叫「小杯玉米杯」

④ list-nutrition-foods()
   └─ data 是字符串："[160]{productName,nutritionDescription,...}:\n  巨无霸,null,2146,..."
   └─ 按头部自述的列名 split 解析，用**详情名**匹配 productName，取 energyKcal

⑤ calculate-price(storeCode, orderType=1, beType=1,
                   items=[{productCode, quantity:1}, ...])
   └─ 返回 productList[].subtotal（整数·分），求和即组合总价
   └─ 实测：16 项一次算价 productPrice=27150；1100+1440+4810 单独算是 6150
      与逐项小计之和完全一致 → 可加性成立，演示版因此可以用逐项小计求和

⑥ 本地生成：完整食物词 → 有条件热梗句式 → 配对口号 → 名字/口号 → Canvas/SVG 海报
```

真实版的这套流程写在 `skill/SKILL.md`，可复现；演示版把 ①–⑤ 的返回原样固化成快照存在 `data.js`。

---

## 四、踩过的坑（都写进了代码）

这些不是文档里写的，是实测撞出来的。列在这里，既是为了让评审能验证，也方便后来者少走弯路。

| 坑 | 现象 | 处理 |
|---|---|---|
| 价格有三套表达 | 菜单 `currentPrice` 是**字符串·元**（`"25.5"`）；算价是**整数·分**（`2550`）；详情**没有价格** | 只认 `calculate-price` 的分值；菜单价仅展示，绝不参与求和 |
| `data.meals` 是 map | 不是数组，直接 `map()` 会报错 | `Object.values()` |
| `data.frequent` 文档有、实测无 | 按文档写会拿到 `undefined` | 全部可选字段做存在性判断 |
| `beCode` 条件缺失 | 到店自取（beType=1）时整个键不存在，不是空串 | 不按固定 schema 反序列化 |
| 名字三处不一致 | 同一 `productCode` 在菜单 / 详情 / 算价里可能三个名字 | **只用 code 做 join**，人工维护 code→营养名映射表 |
| 营养表是字符串 | 不是 JSON 数组，头部声明 `[160]` 与 9 列 | 先解析再求和；列名以头部自述为准 |
| 营养表有重名行 | 「小杯玉米杯」「纯牛奶（盒装）」各出现 2 次 | 取首条命中，并标注"可能重复" |
| 营养表没有份量 | 无法判断是"每份"还是"每 100g" | 按表内原样使用，页面注明口径 |
| 查不到就真的查不到 | 「可乐」在表里只有「可乐小/中/大杯」；「经典麦旋风」只有具体口味 | 标 **未知**，不推断、不外推 |
| `withOrder.specId` vs `membershipSpecId` | 读写两端字段名不同，直传会失败 | 本作品不涉及随单购；已在文档标注供参考 |
| 特调不是必传 | 详情页要求"特调组全传"，实测不传 `modification` 也能算价 | 不做强制特调，少一层出错面 |
| 经纬度是 0.0 | `longitude/latitude` 恒为 0 | 不做地图打点 |

---

## 五、业务价值

### 1. 对用户：把「选择困难」变成一个可玩的决策

平台每天有大量单品和套餐，用户真正的痛点是「我不知道怎么搭」。直接枚举组合不现实——
16 个单品，2 到 4 个的组合就有 **2,500 种**（C(16,2)+C(16,3)+C(16,4) = 120+560+1820）。本作品做了三件事让它变得可消费：

- **收敛**：只让用户点 2–4 个，用真实算价兜住"到底多少钱"，用真实营养兜住"到底多少卡"
- **赋予意义**：给组合一个名字和一句口号，把「一堆食物」变成「一个作品」，这是纯组合列表给不了的
- **可传播**：一张 1080×1440 的海报，让结果能离开页面

### 2. 对品牌：一个零风险的菜单二次创作场

- 全程**只读**，不触碰订单、支付、优惠券、积分、地址，不存在资损与越权风险
- 用户创造的名字会自然带出单品名（薯、鸡、巨无霸、麦辣），是**用户自发**的菜单曝光
- 双榜（最离谱 / 最划算）提供了天然的运营抓手：官方可以照着"最划算"的组合做活动

### 3. 对开发者：一个可复用的口径样板

`logic.js` 把「字符串价格 / 整数分值 / 非结构化营养表 / 条件缺失字段」这四类脏数据处理成了可测试的纯函数，
41 条自测覆盖解析、算价、求和、未知项、榜单排序。换一个品牌的 MCP，这层几乎能直接搬。

### 4. 对评审：可验证

- 价格：`data.js` 里留着 `calculate-price` 的原始返回 JSON，逐项小计可自行相加核对
- 热量：`NUTRITION_RAW` 是原串，`parseNutrition()` 可复现 160 行解析
- 名字：固定词库版本与组合键决定；新旧作品用名称快照保持稳定
- 一致性：演示版与真实版共用同一套命名引擎与口径

---

## 六、凭证与安全

- 仓库内**没有任何真实 Token**；`mcp-config.example.json` 只有 `${MCD_MCP_TOKEN}` 这类环境变量占位符
- Token 绑定的是麦当劳会员身份，等同账号钥匙：不写进代码、不进截图、不进 commit
- 建议把真实配置放在仓库外（如 `~/.workbuddy/mcp.json`），并在 `.gitignore` 里排除本地配置文件

---

## 七、复现所需

```bash
# 1. 申请 Token
open https://open.mcd.cn        # 手机号登录 → 控制台 → 申请并激活

# 2. 配置环境变量（不要把值写进文件）
export MCD_MCP_URL="<官方端点>"
export MCD_MCP_TOKEN="<你的 Token>"

# 3. 装 Skill 目录
cp -r skill ~/.workbuddy/skills/chouchou-xiangxiangbao

# 4. 验证（不联网，只验证命名与渲染链路）
node skill/scripts/compose.js skill/examples/combo.example.json ./out
```
