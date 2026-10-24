# WorkBuddy 开发对话记录

> **项目**：麦门隐藏菜单实验室（MCD Hidden Menu Lab）
> **开发时间**：2026-10-24 18:54 – 20:16（GMT+8）
> **使用工具**：腾讯 WorkBuddy（Agent 模式）+ 麦当劳 `mcd-mcp`
> **说明**：本文件按轮次记录本次开发对话 —— 用户原话、每一步执行动作、关键产出与踩坑。
> 为便于阅读，部分较长的需求描述做了分点归纳，其余为用户原话。

---

## 0. 一页摘要

一个下午，从「实测 MCP 接口」到「上线一个可玩的网页 + 可提交的仓库」：

| 时间 | 里程碑 |
|---|---|
| 18:54 | 开始 |
| 18:55 | 用 mcd-mcp 跑通 5 个只读工具，产出实测报告（字段缺失/类型差异清单） |
| 19:03 | 补充 16 个单品的详情名与逐项算价，为前端固化数据 |
| 19:20 | 网页版「麦门隐藏菜单实验室」跑通（逻辑 38 条 + 浏览器 35 条断言） |
| 19:28 | 按用户要求做 UI 减法：删掉 8 处次要标签与说明 |
| 19:31 | 删掉命名链路与「数据账本」两块内部说明 |
| 19:41 | 接入用户提供的 `name-bank.md` 抽象谐音名字库 |
| 20:00 | 生成比赛四件套 + Skill 真实版 + 敏感信息扫描脚本 |
| 20:08 | 建公开仓库并推送 |
| 20:12 | GitHub Pages 上线 |

最终产物：
- 线上演示：<https://dachengzi6661.github.io/mcd-hidden-menu-lab/>
- 仓库：<https://github.com/dachengzi6661/mcd-hidden-menu-lab>

---

## 1. 对话轮次

### 第 1 轮 · 实测麦当劳 MCP（只读）

**用户**：要求用 `mcd-mcp` 实测一次，只读，不下单不抽奖不领券；按 `query-nearby-stores → query-meals → query-meal-detail ×3 → list-nutrition-foods → calculate-price` 的顺序走一遍，最后**把每个工具实际返回的字段原样列出来**，说明哪些字段缺失、哪些是字符串而不是数字。

**助手**：
1. 用「北京·国贸」作为测试地标（用户未给地址，先声明假设）
2. `query-nearby-stores(searchType=2, city=北京, keyword=国贸, beType=1)` → 5 家门店，选 `1950564` 建外SOHO(A座)，269 米
3. `query-meals` → 13 个分类，`data.meals` 是 **map** 不是数组
4. 选「巨无霸 1100 / 麦辣鸡腿汉堡 1440 / 薯条 4810」各查一次详情
5. `list-nutrition-foods` → `data` 是**一整段字符串**，头部自述 `[160]` 条 9 列
6. `calculate-price` → `price=6150`（分），逐项小计 2550/2250/1350

**关键发现**（后来全部写进了业务代码）：
- 价格有三套表达：菜单 `currentPrice` 是**字符串·元**，算价是**整数·分**，详情**没有价格**
- 同一 `code=4810`，菜单叫「薯条」、详情叫「中薯条」
- 营养表 `nutritionDescription` 约 157/160 为 `null`，且有重名行
- `longitude/latitude` 恒为 `0.0`，不能打点
- `withOrder.specId` 与 `calculate-price` 的 `membershipSpecId` 名字不一致

产出：`麦当劳MCP实测报告-20261024.md`

---

### 第 2 轮 · 做网页版「麦门隐藏菜单实验室」

**用户**：给了一整套硬规则 —— 只能从真实在售单品里选 2–4 个；总价以 `calculate-price` 为准；热量按营养表求和、缺失标未知；名字要够抽象够谐音；生成可截图海报；投票 + 双榜；Star 引导必须完全自愿；**解析规则按实测写死，不要按文档想当然**。

> 用户原话（节选）：
> - 「总价以 calculate-price 为准，热量以 list-nutrition-foods 求和，缺失项标注"未知"，不要估算、不要编造」
> - 「解析硬规则，按第 1 条实测结果写死，不要按文档想当然：价格唯一来源是 calculate-price，单位分、整数，除以 100 显示元」
> - 「Join 唯一键是 productCode，绝不用商品名，因为同一 code=4810 在菜单叫薯条、详情和营养表叫中薯条」
> - 「名字一定要够抽象、够谐音，不能只出直白名。先从所选单品取关键词，再做谐音替换，最后套抽象前缀或句式」
> - 「Star 必须完全自愿，不挡核心玩法，不要求先 Star 才能投票，不承诺以 Star 换奖励，不自动点 Star，不索要 GitHub 账号密码」

**助手**：确定架构 —— 静态单页（`file://` 双击即开），把真实返回原样固化进 `data.js`：

- **价格**：用一次 `calculate-price` 拿到 16 项逐项 `subtotal`（合计 27150 分），组合总额 = 所选小计之和；另用 1100+1440+4810 单独核价 6150 对账，确认可加性
- **营养**：把 `list-nutrition-foods` 的原串整段嵌进 `data.js`，前端运行时 `parseNutrition()` 解析（160 行 / 9 列 / 2 个重名）
- **拼接键**：只用 `productCode`；另建 `code → 营养名` 手工映射表，可乐、经典麦旋风**判为未知**（表里只有带杯型/口味后缀的行，不推断）
- **命名**：`hash32(排序后 code)` 播种 mulberry32 → 取词 → 同音字替换 → 16 个抽象句式；同一组合名字恒定
- **海报**：Canvas 1080×1440，含名字、口号、总价、热量、单品清单、免责

同时写了 `test.js`（逻辑 38 条）与 `test-browser.js`（本机 Chromium + CDP 真实渲染 35 条）自测。

**遇到并修复**：
- `file://` 下 `localStorage` 可能抛异常 → try/catch + 内存兜底
- 海报固定坐标会在一行名字时留大片空白 → 改为「名字压顶 + 数据卡贴底 + 中段留白」
- 名字以语气词开头读起来散 → 加 `BAD_START` 过滤，最多重试 12 次

---

### 第 3 轮 · UI 减法

**用户**：`Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.`

**助手**：删掉 8 处小字标签 —— hero 的胶囊标签组、卡片上的「可特调/算价」、指标下的口径小字、数据条注释、榜单副标题、命名推导的四行卡片、投票处括号说明、Star 中间那段长描述；页脚重复的第三个 Star 也去掉（保留要求的 2 处）。

---

### 第 4 轮 · 再删两处

**用户**：发了两张截图，一张是命名链路 `不素之霸双层牛堡 → 霸 → 罢 → {A}的{B}宣言`，一张是「数据账本（点开核对）」折叠面板，说这两处不用展示给用户。

**助手**：整块删除 —— `renderResult` 里的链路行、`renderLedger()` 整个函数、`.ledger / .kv / pre.raw` 全部样式。并在测试里加了**反向断言**防止回潮：

```js
ok(await evaluate("!document.querySelector('.res-chain')"), '命名推导链路不展示给用户');
ok(await evaluate("!document.querySelector('.ledger') && !document.querySelector('details.sheet')"), '数据账本不展示给用户');
```

---

### 第 5 轮 · 接入名字库

**用户**：给了 `name-bank.md`（抽象谐音名字库），分「谐音梗 / 网络流行抽象话 / 抽象哲学 / 打工人程序员专属」四类。

**助手**：内联进 `logic.js`，不额外留文件：

- `ABSTRACT` 38 个抽象前缀（典中典 / 抽象圣经 / 绷不住了 / 薛定谔的 / 热量守恒 / 需求文档不存在 / Bug 改不完 …）
- `IDIOM_BY_KEY` 按食材字分组的谐音成语（鸡 / 薯 / 辣 / 堡 / 吉 / 巨 / 乐 / 霸 / 麦 / 香）
- 新增三种句式 B1/B2/B3，`build()` 允许返回 `null` 表示「这轮不合用」，遍历时换下一个
- 口号补充「热量是真的，快乐也是真的。」「这个名字很抽象，但味道很具体。」
- 精简同音字表：删掉读着别扭的 巨→句、翅→赤、乐→勒、鱼→予、排→拍 等

---

### 第 6 轮 · 删 hero 那句

**用户**：圈出 hero 里的「价格以 calculate-price 为准，热量按营养表求和，查不到的写「未知」，不估算。」，要求删掉。

**助手**：删除整句，hero 只剩一句「选 2–4 个在售单品，凑一个官方没有的隐藏款。」

---

### 第 7 轮 · 比赛提交材料

**用户**：要 README / MCP_INTEGRATION / CONTEST_DECLARATION（官方原文原样复制）/ mcp-config.example.json，另要提交说明与 30 秒录屏脚本，最后提醒检查 Token 与个人信息；并给了演示版「必须有 / 一定不要」两张清单。

**助手**：
1. 找到官方仓库 `M-China/mcd-developer-innovation-challenge`，直接下载 raw 声明，
   **MD5 `91a7b32ec28098b609ca3f215cdf7147`，1522 字节，与远端逐字节一致**
2. 写 README（含用户指定的"两个版本"段落原文）、MCP_INTEGRATION（5 个工具 + 流程 + 「DIY 不是 MCP 自带能力」的显式说明 + 12 条坑）、
   mcp-config.example.json（只有 `${MCD_MCP_TOKEN}` / `${MCD_MCP_URL}`）
3. 补了 `skill/`（真实版，`compose.js` 能出 SVG 海报）、`SUBMISSION.md`、`scripts/check-secrets.js`
4. 演示版按清单改了文案：顶栏改「演示版 · 静态数据」，页脚明写「静态快照，页面不联网查询，不是实时价格」

**自查发现并修掉一处真实泄露**：`test-browser.js` 里硬编码了含用户名的本机路径，改成 `CHROME_BIN` 环境变量探测。

---

### 第 8 轮 · 建仓库

**用户**：`都帮我做一下除了开Pages录屏发issue`

**助手**：替换全部 `<your-name>` 占位符、`REPO_READY: true`、加 `.gitattributes` 把声明文件锁成 `eol=lf`（防止 `core.autocrlf=true` 把官方原文改成 CRLF）、
`gh repo create --public` 建仓推送、加 topics。

推送后拉远端 raw 复核声明文件，MD5 仍为 `91a7b32e…`。

---

### 第 9 轮 · 部署 Pages

**用户**：`部署到github page`

**助手**：用 API 启用 Pages（`POST /repos/{owner}/{repo}/pages`，source = main/root），轮询到 `built`，四个资源全部 200。

**上线后测出并修掉一个问题**：`file://` 下不会请求站点图标，一上 HTTPS 浏览器就去找 `/favicon.ico` → 404 → console 报错。加了一个内联 SVG 图标（`data:` URI），不新增文件也不产生请求。复测线上 **35/35 全绿，零 console 错误**。

---

## 2. 关键决策记录

| 决策 | 理由 |
|---|---|
| 演示版做成**纯静态**，不接实时 MCP | 浏览器无法直连 MCP；且比赛明确要求"演示版不要写实时调用" |
| 价格用**一次算价取逐项小计**再求和 | 静态页没法为每个组合单独调接口；`discount=0` 时可加性成立，且用单组合调用对过账 |
| 营养表**原串嵌入**、运行时解析 | 让"必须先 parse 才能算"这条口径在代码里真实发生，而不是注释里说说 |
| 可乐 / 经典麦旋风**判未知** | 表里只有「可乐小/中/大杯」和具体口味麦旋风，需要推断就说明不可靠，宁可不写 |
| 名字用**哈希播种**而非随机 | 同一组合永远同一个名字，榜单不会刷新就漂移 |
| 真实版单独做 `skill/` + `compose.js` | 让 README 里"两个版本"的说法成立，而不是空口声明 |
| 删除命名链路与数据账本 | 用户明确要求：内部实现说明不给用户看 |

---

## 3. MCP 调用清单（本项目全部调用，均为只读）

| Tool | 次数 | 用途 |
|---|---|---|
| `query-nearby-stores` | 1 | 定位门店，取 `storeCode` |
| `query-meals` | 1 | 拉在售菜单（16 个单品） |
| `query-meal-detail` | 16 | 取详情名作为营养匹配键 |
| `list-nutrition-foods` | 1 | 营养表原串 |
| `calculate-price` | 2 | 3 项算价对账 / 16 项批量取逐项小计 |

**未调用**：`create-order`、`query-order`、`draw-lottery`、`available-coupons`、`auto-bind-coupons`、
`query-my-account`、`delivery-*`、`party-*` 等一切写操作与个人资产类工具。

---

## 4. 测试与验收

| 套件 | 断言数 | 覆盖 |
|---|---|---|
| `node test.js` | 41 | 营养解析（160 行/9 列/2 重名）、分转元、未知项定位、加和对账、命名库命中、榜单排序 |
| `node test-browser.js` | 35 | 16 张卡渲染、实时汇总、未知标注、海报像素、投票重排、Star 两处、免责文案、零 console 错误 |

线上验收：

```bash
PAGE_URL="https://dachengzi6661.github.io/mcd-hidden-menu-lab/" CHROME_BIN="<chrome>" node test-browser.js
# → 通过 35 / 35，console.error：无
```

敏感信息扫描：

```bash
node scripts/check-secrets.js
# → 17 个文件，0 命中
```

---

## 5. 产物清单

```
mcd-hidden-menu-lab/
├── index.html / data.js / logic.js / app.js    演示版
├── skill/SKILL.md + scripts/compose.js         真实版（WorkBuddy Skill）
├── test.js / test-browser.js                   自测
├── scripts/check-secrets.js                    敏感信息扫描
├── README.md / MCP_INTEGRATION.md
├── CONTEST_DECLARATION.md                      官方原文（MD5 已核对）
├── mcp-config.example.json                     仅环境变量占位符
├── workbuddy.md                                本文件（开发对话记录）
└── SUBMISSION.md                               提交说明与录屏脚本
```
