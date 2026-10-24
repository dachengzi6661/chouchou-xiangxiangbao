# HANDOFF · 抽抽想香堡

> 写于 2026-10-24 20:30（GMT+8）｜比赛截止 **2026-10-25 23:59**
> 这份文档是给「接手的人」看的：现在到哪一步了、哪些还没做、哪些坑别再踩一遍。

---

## 0. 当前状态

项目统一名称为 **抽抽想香堡**，仓库及 Pages 路径统一使用 `chouchou-xiangxiangbao`。

2026-10-24 用户已明确授权：本地 HTML、GitHub 和 GitHub Pages 等全部项目名称统一改名。本地替换、截图更新、测试、GitHub 改名及 Pages 发布均已完成；2026-10-24 已在新地址通过线上验收，详细记录见第 14 节。命名引擎现已升级至 V2 并通过线上验收，见第 16 节。

## 1. 改名阶段范围与验收（命名 V2 实施见第 16 节）

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
| 3 | 发报名 Issue | 已提交，待官方校验 | https://github.com/M-China/mcd-developer-innovation-challenge/issues/1287 |
| 4 | 把 Issue 链接回填到报名表 | ⬜ **未做** | 表单字段「麦当劳大赛报名 Issue 链接」 |
| 5 | 上传 `workbuddy.md`（可选） | ⬜ 已做 | 仓库里已有，表单传不传都行 |

---

## 4. 已经完成的（都验证过）

| 事项 | 证据 |
|---|---|
| 5 个 MCP 工具实测（只读） | 16 次详情 + 2 次算价，无写操作 |
| 演示版网页 | 线上可玩，64 条 Chrome 浏览器断言全绿 |
| 真实版 Skill | `skill/SKILL.md` + `compose.js` 能出 SVG 海报 |
| 四份必需文件 | README / CONTEST_DECLARATION / MCP_INTEGRATION / mcp-config.example 全在仓库根目录 |
| 声明文件未被改动 | 远端 raw 的 MD5 仍是 `91a7b32ec28098b609ca3f215cdf7147` |
| 敏感信息扫描 | `node scripts/check-secrets.js` → 22 个文件 0 命中 |
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
| 名称确定性 | V2 固定词库版本与排序后 code 播种；既有作品保存名称 / 口号快照 | `logic.js` `generateName()` |

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
├── test-browser.js     浏览器验收（64 条，支持 PAGE_URL 测线上）
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

## 15. 2026-10-24 命名引擎评审（建议阶段）

- 本次只做代码评审、全量枚举与近期热梗核验，未修改引擎、测试或线上版本；本节保留评审阶段的发现，后续实施见第 16 节。
- 现有 16 个单品的全部 2–4 件组合共 2500 组，产生 2024 个不同名字；额外同名结果为 476 个，不代表组合键冲突。
- 586 组的 swapped 记录所指替换字没有出现在最终名字中：模板会丢弃 A 或 B，不能只用 swapped.length 判断最终结果存在谐音。
- 不含汉堡的组合 246 组，其中 63 组名字以「堡」结尾；需要按选品类别限制后缀和模板。
- 单字取词和仅检查开头 / 长度无法保证语义；现有测试要求 12 个样本全部发生谐音，后续应以可读性和食材关联优先。
- IDIOM_BY_KEY 中「堡、麦、香」三个入口未被当前关键词 / 谐音候选覆盖。
- 近期方向：10 月餐饮 AI 短剧规矩句式、大水理论的生活理论句式；爱你老己在 2025 年末已经流行，应标为常青梗。所有新餐名示例是原创改编草稿，未做理解率验证。
- 建议保存热梗来源与核验日期；不将可乐写成白水，不把不烧心写成餐品效果保证。
- 现有 ledger 以 code 和票数为主，名字在分析时重新生成；修改词库前需考虑既有作品名称 / namingVersion 的保存策略，组合键和投票不变。
- 建议继续本地模板生成，不在每次选品时请求热榜或在线模型。
- 热点来源：<https://lmtw.com/mzw/content/detail/id/259150>；<https://m.dzplus.dzng.com/share/general/0/NEWS3732476KCTNMIRNUXMLB>；<https://www.jfdaily.com/wx/detail.do?id=1045035>。

## 16. 命名引擎 V2（2026-10-24 实施）

用户已批准第 15 节评审建议并要求开始。当前已完成实施、提交推送与 Pages 线上验收。

- 26 个带食材条件的模板；规矩 / 生活理论近期句式、常青老己与成句文字游戏。名字与口号成对，谐音可选。
- 词库版本 `v2-20261024`；出处与核验日期见 `docs/naming-sources.md`。原算法仅供迁移旧作品，不用于新生成默认结果。
- 本地账本继续使用原存储键；旧记录加载后一次还原并冻结原名、口号，组合键、票数、已投状态不变。新记录保存 naming 快照。
- 修改词库时也要更改版本；不要以日期自动换名。index 的 logic / app 资源加版本查询参数，避免客户端缓存混用。
- 陌生中文菜名不能用 ASCII 的非单词规则判掉；未知长名使用可读兜底，不能按字符截出半个食物词。
- 旧的“所有样本必须谐音”验收改为“记录的谐音必须实际进入结果”；现有价格 / 热量 / 榜单口径继续沿用。
- 执行清单：`docs/superpowers/plans/2026-10-24-naming-v2.md`。

- 海报标题可能按宽度分行，测试应拼接实际绘制片段再比对完整餐名；不能要求一次 fillText 输出完整标题。视觉检查发现末行单字时继续缩小字号，避免把定律拆成孤立的律。

### V2 本地验收（发布前）

- 逻辑 **41/41**；命名专项 **14 项 + 2500 组枚举**；实际项目目录 Chrome **64/64**。
- 无汉堡的 246 组全部不再生成堡类名；无输出字的谐音记录为 0；不同名字 2073 个，额外同名结果从 476 减至 427。
- 本机 Chrome 1000 次命名平均 **0.016 ms/次**；仍为本地计算，页面脚本请求数量不变。
- logic.js 从 21471 增至 34506 字节；gzip 测量从 8281 增至 12338 字节，增加 4057 字节（包含兼容旧作品的原算法）。压缩数为本地 gzip 测量，不等于实际传输编码。
- 海报、复制与结果名称一致；五档宽度无横向溢出；老名字、原票数、已投状态经两次刷新保持；存储不可用可在内存投票。

### V2 线上验收结果

- 代码提交 `d3617ea76c1e2ae0ef553a5ca30d804d2eac9f25`；Pages Actions run `40097638254` 成功。
- 显式 PAGE_URL 测线上：Chrome **64/64**，控制台 / 页面异常为 0；1000 次命名平均 **0.018 ms/次**。
- index、data / logic / app、docs 三张 PNG、词库来源文档、官方声明均返回 200，且与本地逐字节一致；声明 MD5 保持 `91a7b32ec28098b609ca3f215cdf7147`。
- 发布前敏感信息扫描 **22 个文件 0 命中**；报名 Issue / 表单仍未代发，原有 MCP 只读边界保持。

## 17. 2026-10-24 参赛 Issue 已提交

- 用户明确授权提交 Issue 并将报名表所需链接贴在聊天中。已用账号 dachengzi6661 发布官方仓库 Issue **#1287**：<https://github.com/M-China/mcd-developer-innovation-challenge/issues/1287>。
- 标题为「【参赛申请】抽抽想香堡」；正文严格四行，项目名称 / 项目地址 / 项目简介的字段名和值写在同一行，项目地址使用纯 URL。提交后核验为 OPEN，官方自动校验尚未回复。
- 官方 README 的标题要求是自定义报名标题，正文必须包含「【参赛申请】」；本项目继续用标题前缀便于检索。不要把此前标题前缀写成官方硬性要求。
- 官方说明不要将字段标题和值分行，也不要把项目地址组织成 Markdown 链接；本次已遵守。
- 报名表使用说明链接可填 <https://github.com/dachengzi6661/chouchou-xiangxiangbao/blob/main/README.md>；Pages 与 README 已核验 200。用户后续自行回填表单，未代填或提交表单。
- 再次接手时先查看 #1287 的官方反馈，避免重复创建报名 Issue。
