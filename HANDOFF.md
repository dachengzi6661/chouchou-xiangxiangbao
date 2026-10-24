# HANDOFF · 抽抽想香堡

> 写于 2026-10-24 20:30（GMT+8）｜比赛截止 **2026-10-25 23:59**
> 这份文档是给「接手的人」看的：现在到哪一步了、哪些还没做、哪些坑别再踩一遍。

---

## 0. 当前状态

项目统一名称为 **抽抽想香堡**，仓库及 Pages 路径统一使用 `chouchou-xiangxiangbao`。

2026-10-24 用户已明确授权：本地 HTML、GitHub 和 GitHub Pages 等全部项目名称统一改名。本地替换、截图更新、测试、GitHub 改名及 Pages 发布均已完成；2026-10-24 已在新地址通过线上验收，详细记录见第 14 节。

## 1. 改名范围与验收

- 页面标题、页眉、favicon、海报、复制文案、README 及截图、报名材料、Skill 名称和海报同步更新。
- GitHub 仓库名、简介、主页链接、Git remote 和 Pages 地址同步更新。
- 官方声明原文保持不变；不改价格、热量、命名算法、投票逻辑。
- localStorage 的既有内部键继续保留，避免清空用户已有的本地投票记录；它们不属于展示名称。
- 最终验收：逻辑与 Chrome 浏览器测试通过，敏感信息扫描干净，线上资源返回 200，页签、页面、海报、分享及 Star 地址均正确。

---

## 2. 关键链接

| 用途 | 地址 |
|---|---|
| 仓库（公开） | <https://github.com/dachengzi6661/chouchou-xiangxiangbao> |
| 在线演示（Pages，已 built） | <https://dachengzi6661.github.io/chouchou-xiangxiangbao/> |
| 官方活动仓库 | <https://github.com/M-China/mcd-developer-innovation-challenge> |
| 报名入口（新 Issue） | <https://github.com/M-China/mcd-developer-innovation-challenge/issues/new> |
| 同类作品（题材对比） | [#272](https://github.com/M-China/mcd-developer-innovation-challenge/issues/272) ｜ [#492](https://github.com/M-China/mcd-developer-innovation-challenge/issues/492) |

---

## 3. 还剩什么

| # | 事项 | 状态 | 备注 |
|---|---|---|---|
| 1 | 统一改名并推送 | 已完成 | 新 Pages 已通过线上验收，见第 14 节 |
| 2 | 录 30 秒屏 | ⬜ **已做** | 脚本在 `SUBMISSION.md` 第二节 |
| 3 | 发报名 Issue | ⬜ **未做** | 文案见第 5 节，2026-10-24 改名前核验：本账号尚无报名 Issue |
| 4 | 把 Issue 链接回填到报名表 | ⬜ **未做** | 表单字段「麦当劳大赛报名 Issue 链接」 |
| 5 | 上传 `workbuddy.md`（可选） | ⬜ 已做 | 仓库里已有，表单传不传都行 |

---

## 4. 已经完成的（都验证过）

| 事项 | 证据 |
|---|---|
| 5 个 MCP 工具实测（只读） | 16 次详情 + 2 次算价，无写操作 |
| 演示版网页 | 线上可玩，44 条 Chrome 浏览器断言全绿 |
| 真实版 Skill | `skill/SKILL.md` + `compose.js` 能出 SVG 海报 |
| 四份必需文件 | README / CONTEST_DECLARATION / MCP_INTEGRATION / mcp-config.example 全在仓库根目录 |
| 声明文件未被改动 | 远端 raw 的 MD5 仍是 `91a7b32ec28098b609ca3f215cdf7147` |
| 敏感信息扫描 | `node scripts/check-secrets.js` → 19 个文件 0 命中 |
| Pages 部署 | 状态 `built`，index/data/logic/app 四个资源全 200 |
| Star 按钮 | 已指向真实仓库，`REPO_READY: true`，页面无「地址待填」角标 |

---

## 5. 报名 Issue 文案（直接复制）

**标题**

```text
【参赛申请】抽抽想香堡
```

**正文**

```text
【参赛申请】

项目名称：抽抽想香堡

项目地址：https://github.com/dachengzi6661/chouchou-xiangxiangbao

项目简介：不做下单，只做玩梗。从门店真实在售单品里选 2–4 个本地拼成官方没有的隐藏款，用 calculate-price 官方核价、营养表求和算热量，再按「取词→谐音→句式」起个抽象名并出海报，可投票进「最离谱 / 最划算」双榜。演示版零配置在线体验，Skill 版真实调 MCP，全程只读不下单。
```

> 官方仓库**没有 Issue 模板**，靠标题前缀 `【参赛申请】` 识别，这几个字不能少。

---

## 6. 名称与差异点

用户最终确定名称为「抽抽想香堡」，不再保留临时副标题。官方仓库已有相似题材作品 #272 / #492，项目介绍仍突出「抽象命名引擎 + 投票双榜 + 海报」，全程只读不下单。

---

## 7. 硬约束（比赛规则，别踩）

- 截止 **2026-10-25 23:59**（北京时间）；Star 统计截止 **2026-10-26 00:00**
- 仓库必须**公开**、创建时间在 2025-12-25 ~ 2026-10-25 之间（本仓库 2026-10-24 创建 ✅）
- 四个文件**文件名一个字都不能改**：`README.md`、`CONTEST_DECLARATION.md`、`MCP_INTEGRATION.md`、`mcp-config.example.json`
- 排名按**公开 Star 数**，0 Star 不进榜
- 提交后**不要改仓库名**，改名会让 Issue 里的链接失效
- `workbuddy.md` 是**选填**，只影响 WorkBuddy 专项奖

---

## 8. 数据口径（改代码前必读）

这几条是实测撞出来的，不是文档写的。改任何数字相关代码前先看这里：

| 项目 | 口径 | 位置 |
|---|---|---|
| 价格 | **只**取 `calculate-price` 的 `productList[].subtotal`，整数·**分**，展示时 ÷100 | `data.js` `PRICE_FEN` / `logic.js` `priceFen()` |
| 菜单价 | `query-meals.currentPrice` 是**字符串·元**，只核对，**从不参与求和** | `data.js` `MENU[].currentPrice` |
| 详情价 | `query-meal-detail` **没有价格字段** | — |
| 热量 | 解析 `list-nutrition-foods.data`（**一整段字符串**，头部自述 160 条 / 9 列），按 `energyKcal` 求和 | `logic.js` `parseNutrition()` |
| 缺失 | 营养表无对应行 → **「未知」**，不计入、不估算 | `logic.js` `calories()` |
| 拼接键 | **只用 `productCode`**。同一 code 在三个接口里可能三个名字（薯条 / 中薯条 / 中薯条） | 三条数据表都在 `data.js` |
| 重名行 | 「小杯玉米杯」「纯牛奶（盒装）」各 2 条，取首条并标注 | `buildNutritionIndex()` |
| 名称确定性 | 名字由 `hash32(排序后 code)` 播种，同一组合永远同一个名字 | `logic.js` `generateName()` |

**两个被判为「未知」的单品**（不是 bug）：可乐（表里只有可乐小/中/大杯）、经典麦旋风（表里只有具体口味）。要改这两条，先想清楚凭什么能唯一定位。

---

## 9. 文件地图

```
chouchou-xiangxiangbao/
├── index.html          演示版页面（结构 + 全部样式 + favicon）
├── data.js             真实接口快照：门店/菜单/详情名/算价分/营养表原串/CONFIG
├── logic.js            纯函数：营养解析、算价、热量、命名引擎、榜单
├── app.js              交互 + Canvas 海报
├── test.js             逻辑自测（41 条）
├── test-browser.js     浏览器验收（44 条，支持 PAGE_URL 测线上）
├── skill/SKILL.md      真实版：WorkBuddy Skill 调用流程
├── skill/scripts/compose.js   组合 → 名字/总价/热量 → SVG 海报
├── scripts/check-secrets.js   敏感信息扫描
├── docs/               README 用图（home/result/poster）
├── README.md           项目介绍、安装、示例、目标用户
├── MCP_INTEGRATION.md  5 个工具、调用流程、12 条坑、业务价值
├── CONTEST_DECLARATION.md     官方原文（MD5 已核对）
├── mcp-config.example.json    只有环境变量占位符
├── workbuddy.md        开发对话记录（记录稿，非客户端导出）
├── SUBMISSION.md       提交清单、录屏脚本、Issue 文案
└── HANDOFF.md          本文件
```

---

## 10. 命令速查

```bash
# 本地自测（不需要网络）
node test.js
CHROME_BIN="/path/to/chrome" node test-browser.js

# 测线上
PAGE_URL="https://dachengzi6661.github.io/chouchou-xiangxiangbao/" \
CHROME_BIN="/path/to/chrome" node test-browser.js

# 敏感信息体检（提交前必跑）
node scripts/check-secrets.js

# 真实版合成一张海报
node skill/scripts/compose.js skill/examples/combo.example.json ./out

# 查仓库状态
gh repo view --json visibility,url,stargazerCount
gh api repos/dachengzi6661/chouchou-xiangxiangbao/pages --jq .status
```

> `test-browser.js` 会自动探测 Chrome/Edge；装在非标准路径才需要 `CHROME_BIN`。

---

## 11. 已知问题 / 别再踩

1. **favicon 404**：`file://` 下不会请求图标，一上 HTTPS 就会。已用内联 `data:` SVG 解决，别再删那一行。
2. **换行符**：本机 `core.autocrlf=true`，`.gitattributes` 里锁了 `CONTEST_DECLARATION.md text eol=lf`，否则官方原文会被转成 CRLF、不再「一字未改」。
3. **不要写"实时价格"**：演示版是静态快照，页面已标注「演示版 · 静态数据」，录屏时也别配这种旁白。
4. **文档里别写路径示例**：之前 SUBMISSION.md 里拿「某盘符 + 用户目录」举例，被自己的扫描器判成"本机路径"误报了一次，改成描述性表述才干净。
5. **WorkBuddy 没有导出对话功能**：文档顶栏只有「分享任务」，本地数据库 `sessions` 表也只有元数据没有消息，日志里搜不到原话。所以 `workbuddy.md` 是记录稿，不是导出件。

---

## 12. 如果换人接手

最短路径：

1. 先核对最终验收记录及当前 Git / Pages 状态
2. `node test.js` + `node test-browser.js` 确认没坏
3. 录 30 秒屏（脚本见 `SUBMISSION.md`）
4. 发 Issue（文案见第 5 节）
5. 把 Issue 链接回填报名表

整套东西没有后端、没有构建、没有依赖，双击 `index.html` 就能跑；真出问题，`test-browser.js` 会告诉你哪一条断言挂了。

## 13. 本次改名注意事项

- 文本替换不能更新 PNG 里已经绘制的标题，README 截图必须从新页面重新生成。
- GitHub 改仓库名后需要同步所有仓库 / Pages 链接和本地 origin，并验证新 Pages 路径；不能依赖旧路径跳转。
- 沙箱身份读取原目录 Git 可能出现 dubious ownership；只对当前命令指定 safe.directory，或在已授权的实际用户执行环境操作，不修改全局信任名单。
- 本地 Chrome 浏览器测试使用项目自带 CDP 脚本，无须安装依赖。线上验收必须显式传 PAGE_URL，避免误测本地页面。

- GitHub Pages 使用 Jekyll 构建时，带 YAML front matter 的 Skill Markdown 会输出为 `skill/SKILL.html`；下载原始 Skill 应使用仓库文件或 GitHub raw，不要把 Pages 的 `.md` 地址 404 误判成代码未发布。

## 14. 2026-10-24 改名验收结果

- 名称：抽抽想香堡；仓库：`dachengzi6661/chouchou-xiangxiangbao`；Pages：<https://dachengzi6661.github.io/chouchou-xiangxiangbao/>。
- 改名代码提交：`d156a12f9157fdf0ff007c4e48edfd2b2ab04914`；对应 Pages Actions run `40094933712` 成功。
- 本地逻辑测试 **41/41**；本地及新 Pages 地址 Chrome 测试均 **44/44**。覆盖页面品牌、实际海报绘制、复制文案、Star 新地址和 1440 / 1280 / 1024 / 820 / 375 五档无横向溢出。
- 线上页面、data / logic / app 三个脚本和 docs 三张 PNG 均返回 200，内容与本地逐字节一致；Skill 的 Pages HTML 与 GitHub raw 均返回 200 且包含新名称。
- 敏感信息扫描 **19 个文件 0 命中**；官方声明线上与本地 MD5 均为 `91a7b32ec28098b609ca3f215cdf7147`。
- 当前工作文件、示例 SVG 和文档中的旧展示名、旧英文展示名及旧仓库路径已清除；Git 历史不重写。
- 页面未新增请求、运行依赖或功能逻辑；仅文案、图标、仓库地址及既有截图更新，未增加运行时性能开销。
- Git origin 已指向新仓库；报名 Issue / 表单仍待单独处理。本目录名保持不变，以便原有本地入口继续使用。
