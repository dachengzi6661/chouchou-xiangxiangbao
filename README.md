# 抽抽想香堡

<sub>CHOUCHOU XIANGXIANGBAO</sub>

> 官方菜单没有的，咱们自己拼出来。

**在线体验（演示版）**：<https://dachengzi6661.github.io/chouchou-xiangxiangbao/>

从一家门店**真实在售**的单品里挑 2–4 个，拼一个官方菜单上没有的「隐藏款」：算出总价和热量，起一个抽象谐音名字，渲染一张能直接发朋友圈的海报，再投个票上「今日最离谱 / 今日最划算」双榜。

个人参赛作品 · 非麦当劳官方产品。餐品信息、价格与供应状态以麦当劳官方渠道为准。

![抽抽想香堡 · 首页](docs/home.png)

---

## 两个版本

本仓库包含两个版本：**演示版**为纯静态网页，可直接在 GitHub Pages 打开体验完整玩法，数据为演示数据；**真实版**为 WorkBuddy Skill，通过 `mcd-mcp` 调用 `query-nearby-stores`、`query-meals`、`query-meal-detail`、`list-nutrition-foods`、`calculate-price` 实现真实菜单查询、官方核价和营养合计，使用者需按 `mcp-config.example.json` 自行配置 MCP Token，**Token 请勿提交到公开仓库**。

| | 演示版 | 真实版 |
|---|---|---|
| 入口 | `index.html`（GitHub Pages） | `skill/SKILL.md`（WorkBuddy） |
| 菜单 / 价格 / 营养 | 2026-10-24 的快照，**页面不联网** | 每次运行实时调用 `mcd-mcp` |
| 需要 Token | 不需要 | 需要（`open.mcd.cn` 免费申请） |
| 适合 | 30 秒看懂玩法、评审快速体验 | 真正拿来点单前核价 |

两个版本共用同一套「取词 → 谐音 → 句式」命名引擎（`logic.js`）与同一套数据口径（见下文）。

---

## 它能做什么

- **拼**：从 16 个在售单品里选 2–4 个，各 1 份，组成一个不存在的组合
- **算**：总价取自 `calculate-price`（整数·分 ÷ 100），热量按营养表 `energyKcal` 求和，查不到的写「未知」而不是估一个
- **起名**：先取单品关键词，再做谐音替换，最后套一个抽象句式 —— 产出的都是民间 DIY 名，不是官方产品名
- **出图**：1080×1440 海报，含名字、口号、总价、热量、单品清单与免责声明
- **上榜**：投票决定谁上榜，指标决定排第几

---

## 安装与运行

### 演示版（零依赖，30 秒）

```bash
git clone https://github.com/dachengzi6661/chouchou-xiangxiangbao.git
cd chouchou-xiangxiangbao
# 直接双击 index.html，或起个静态服务：
npx serve .
```

- 无构建、无 CDN、无 npm 依赖，`file://` 双击即可运行
- 商品图是外链（`menu-img.mcd.cn`），离线时自动降级为文字占位，不影响任何功能
- 本仓库已部署到 GitHub Pages：<https://dachengzi6661.github.io/chouchou-xiangxiangbao/>
- 想自己搭一份：Settings → Pages → Source 选 `main` / root，即可得到
  `https://<你的用户名>.github.io/chouchou-xiangxiangbao/`

### 真实版（WorkBuddy Skill）

1. 去 <https://open.mcd.cn> 用手机号登录，在控制台申请并激活 MCP Token（免费）
2. 按 `mcp-config.example.json` 的格式配置 MCP，**Token 只放环境变量**
   ```bash
   export MCD_MCP_URL="<官方文档给出的 MCP 端点>"
   export MCD_MCP_TOKEN="<你自己的 Token>"
   ```
3. 把 `skill/` 整个目录放进 `~/.workbuddy/skills/chouchou-xiangxiangbao/`
4. 在 WorkBuddy 里说：「帮我在楼下的麦当劳拼一个隐藏款，要 3 个单品的」

> ⚠️ 不同客户端（WorkBuddy / Claude Desktop / 其他 MCP Client）的配置字段略有差异，以官方接入指南为准；示例文件里只有环境变量占位符，**不要**把真实值写进去再 commit。

---

## 使用示例

### 网页版

1. 左边挑单品（顶部可按汉堡 / 炸物 / 小食 / 甜品 / 饮品筛选）
2. 右边实验台实时显示总价与热量，凑够 2 个，「生成隐藏款」才亮
3. 生成后拿到名字 + 口号 + 数据条 + 海报，「保存海报 PNG」或直接截图
4. 点「投它一票」，双榜即时刷新

样例（2026-10-24 快照，门店 1950564）：

| 组合 | 总价 | 热量 | 名字 |
|---|---|---|---|
| 巨无霸 + 麦辣鸡腿汉堡 + 中薯条 | ¥61.50 | 1287 千卡 | 薛定谔的聚堡 |
| 麦香鸡 + 圆筒冰淇淋 + 中薯条 | ¥35.50 | 751 千卡 | 需求文档不存在属堡 |
| 不素之霸双层牛堡 + 小杯玉米杯 + 圆筒冰淇淋 | ¥44.50 | 639 千卡 | 霸欲有限公司 |

> 名字由 `productCode` 哈希决定，同一组合在任何机器上都得到同一个名字，上面三条可以直接复现。

![生成结果与海报](docs/result.png)

海报是 1080×1440，可直接保存或截图：

![海报](docs/poster.png)

### Skill 版

```
你：帮我在建外SOHO那家麦当劳拼个隐藏款，用巨无霸、麦辣鸡腿堡和薯条
Skill：查门店 → 查菜单 → 查三个单品详情 → 查营养表 → calculate-price 核价
       → 总价 ¥61.50 · 1287 千卡 → 「薛定谔的聚堡」→ 输出海报 SVG
```

`skill/scripts/compose.js` 可以脱离对话单独跑：

```bash
node skill/scripts/compose.js skill/examples/combo.example.json ./out
# → 打印名字/口号/总价/热量，并生成 out/poster.svg
```

---

## 数据口径（为什么这些数字可信）

| 项目 | 口径 | 实现位置 |
|---|---|---|
| 价格 | **只**取 `calculate-price` 的 `productList[].subtotal`，整数、单位分，展示时 ÷100 | `data.js` `PRICE_FEN` / `logic.js` `priceFen()` |
| 菜单价 | `query-meals` 的 `currentPrice` 是**字符串**、单位**元**，仅作核对，**从不参与求和** | `data.js` `MENU[].currentPrice` |
| 详情价 | `query-meal-detail` **不返回价格**，所以价格只能来自上面两个来源 | — |
| 热量 | 解析 `list-nutrition-foods` 的 `data` 字符串（头部自述 160 条 / 9 列），按 `energyKcal` 列求和 | `logic.js` `parseNutrition()` / `calories()` |
| 缺失 | 营养表无对应行 → **「未知」**，不计入、不估算；含未知项的组合不参与热量榜 | `logic.js` `calories()` |
| 拼接键 | 只用 `productCode`。同一 code 在三个接口里可能叫三个名字（薯条 / 中薯条 / 中薯条） | `data.js` 注释 |
| 重名 | 营养表里「小杯玉米杯」「纯牛奶（盒装）」各出现 2 次，取首条并标注 | `logic.js` `buildNutritionIndex()` |

演示版是 **2026-10-24 的静态快照**，不联网、不是实时价格；真实版每次运行都重新调用接口。

---

## 项目结构

```
chouchou-xiangxiangbao/
├── index.html                  # 演示版页面（结构 + 全部样式）
├── data.js                     # 真实接口返回的快照：门店/菜单/详情名/算价/营养表原串
├── logic.js                    # 纯函数：营养解析、算价、热量、命名引擎、榜单
├── app.js                      # 交互 + Canvas 海报绘制
├── test.js                     # 逻辑层自测（41 条）
├── test-browser.js             # 无头 Chromium + CDP 真实渲染验收（34 条）
├── skill/
│   ├── SKILL.md                # 真实版：WorkBuddy Skill 定义与调用流程
│   ├── scripts/compose.js      # 真实版：组合 → 名字/总价/热量 → SVG 海报
│   └── examples/combo.example.json
├── scripts/check-secrets.js    # 提交前扫 Token / 密钥 / 邮箱 / 手机号 / 本机路径
├── docs/                       # README 用图（首页 / 结果 / 海报）
├── README.md                   # 本文件
├── MCP_INTEGRATION.md          # 用了哪些 MCP 工具、调用流程、业务价值
├── CONTEST_DECLARATION.md      # 参赛声明（官方原文，未改动）
├── mcp-config.example.json     # 脱敏配置示例（仅环境变量占位符）
├── workbuddy.md                # 本次开发的对话记录（选填材料，冲专项奖时提交）
├── SUBMISSION.md               # 提交说明与 30 秒录屏脚本（给自己看的清单）
└── .gitignore                  # 排除本地真实配置
```

---

## 目标用户

- **想在麦当劳吃点新花样的打工人**：菜单看腻了，想按自己的口味拼一个，顺便知道多少钱多少卡
- **内容创作者 / 社交平台玩家**：需要一张现成的、带梗的海报去发朋友圈或小红书
- **刚接触 MCP 的开发者**：这是一个只有 5 个只读工具、但把「查询 → 核价 → 求和 → 生成」跑完整的最小样例，可以直接读 `logic.js` 学数据口径怎么处理
- **评审**：打开 Pages 链接 30 秒能玩完一轮；想核验真实性，读 `MCP_INTEGRATION.md` 与 `data.js` 里的原始返回

---

## 自测

```bash
node test.js           # 逻辑层：解析/算价/热量/命名/榜单，41 条
node test-browser.js   # 真实浏览器渲染：用本机 Chromium + CDP，34 条，截图落在 shots/
```

`test-browser.js` 不依赖 Playwright，直接用 Chrome DevTools Protocol 驱动本机 Chromium，检查渲染、交互、海报像素与 console 错误。
它会自动探测系统里的 Chrome / Edge；装在非标准路径时用 `CHROME_BIN` 指定：

```bash
CHROME_BIN="/path/to/chrome" node test-browser.js
```

---

## 合规与边界

- **只读**：只调用 `query-* / list-* / calculate-price`，**不调用** `create-order`、抽奖、领券等任何写操作；`calculate-price` 本身不锁库存、不生成订单
- **非官方**：所有隐藏款名字都是程序生成的民间 DIY 名，页面与海报上都标注了「用户 DIY 款 · 非官方产品名」
- **不构成建议**：热量数值仅为营养表原值求和，不构成营养或医疗建议
- **无 Token**：仓库内不含任何真实 Token / 密钥 / 账号凭证，配置文件只有环境变量占位符
- **投票是本地数据**：榜单存在浏览器 `localStorage`，预置条目为演示数据，不是真实人气

---

## 已知限制

- 演示版是单店、单时刻的快照，换门店 / 换时段 / 换活动都会变
- 营养表**没有份量字段**，数值按表内原样使用，跨品类比较请保留怀疑
- 名字来自确定性哈希，同一组合永远同一个名字（好处是榜单稳定，代价是不能手动换一个）
- 投票没有后端，换浏览器就清空

---

## 致谢

麦当劳中国 MCP 平台（`open.mcd.cn`）提供接口；本项目的接口行为、字段缺失与类型差异均来自 2026-10-24 的实测记录，详见 `MCP_INTEGRATION.md`。
