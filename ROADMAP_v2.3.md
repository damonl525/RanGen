# RanGen v2.3 更新方向（Roadmap）

> 基于 v2.2 发布后的全量代码审计（后端 / 前端 / 部署 / 测试），按 RanGen 的**实际定位——本地单机、绑 127.0.0.1、PyInstaller 打包给非技术用户使用的统计工具**——校准优先级。
>
> - 审计时点：2026-06-22（v2.2）
> - 当前版本：v2.2
> - 行号基于审计时点代码，后续改动可能偏移，**以实际代码为准**

---

## 一、优先级总览

| 编号 | 问题 | 优先级 | 工作量 | 关键证据 |
|---|---|---|---|---|
| P0-1 | generate 端点把业务校验错误报成 500 + 泄露内部文本 | **P0** | S–M | `sas_service.py:30-32`、`endpoints.py:41-44` |
| P0-2 | 前端 axios 无 timeout，生成卡住时永久 loading | **P0** | S | `frontend/lib/api.ts:14,35,45,56,67` |
| P1-1 | 版本号与 changelog 三处分裂（含 v2.2 遗漏） | **P1** | S | `main.py:27`、`endpoints.py:127-195`、`version_info.py` |
| P1-2 | standalone 模式日志被 NullWriter 吞掉 | **P1** | M | `backend/run.py`（NullWriter）、`main.py:82` |
| P1-3 | v2.1 的 shutdown 只是 best-effort，残留未真正解决 | **P1** | L | `endpoints.py:197-214`、`providers.tsx`（sendBeacon） |
| P1-4 | 零测试覆盖 | **P1** | M–L（持续） | 无 `tests/` 目录 |
| P1-5 | Electron 死路径（package.json 引用不存在的入口） | **P1** | S（需决策） | `frontend/package.json:5,11-13` |
| P1-6 | 前端无 Error Boundary + query 无错误反馈 | **P1** | S–M | `app/layout.tsx`、`templates/page.tsx` |
| P2-x | 地址散落 / store 无 migration / any / lang 等 | P2 | — | 见第六节 |

工作量口径：S = 半天内，M = 1–2 天，L = 需设计。

---

## 二、我的建议（执行顺序与发版节奏）

**核心判断**：P0 两条是高频撞到的体验硬伤，P1-1 是低风险且能补上 v2.2 遗漏，这三项是性价比最高的切入点。其余按"先体验/一致性 → 再排障/鲁棒性 → 最后架构/基建"推进。

**建议分两批发版：**

### 第一批 → v2.3.0（体验 + 一致性，低风险，建议优先）
- **P0-1** generate 异常处理（400/500 归位 + 友好文案）
- **P0-2** axios timeout + 共享实例
- **P1-1** 版本号/changelog 统一到 `version_info.py`（顺带补上 v2.2 更新日志在 app 内的显示）
- **P1-6** 前端 Error Boundary + query 错误反馈

> 这一批都不碰核心 SAS 生成逻辑，回归风险低，用户感知最强。

### 第二批 → v2.3.1 或并入 v2.3.0
- **P1-2** standalone 日志落盘（直接提升你支持用户的能力）
- **P1-5** Electron 死路径清理（需你先拍板：删 vs 补，涉及删依赖红线）

### 延后 → v2.4（架构级 / 持续投入）
- **P1-3** shutdown 残留的根治（看门狗或父子进程托管，架构级）
- **P1-4** 测试基础设施搭建（先从 generate 契约 + 模板 snapshot 起步）

**P2 项**可在任何批次顺手做，不单独立项。

---

## 三、P0 详述

### P0-1　generate 端点异常处理（状态码错乱 + 内部信息泄露）

- **问题**：业务校验错误（如 study_id 为空）被报成 HTTP 500，且响应体含 Python 异常文本。
- **证据**：
  - `backend/app/services/sas_service.py:30-32` 把**所有**异常（含业务 `ValueError`）统一包成 `RuntimeError`：
    ```python
    except Exception as e:
        logging.error(f"Error generating SAS code: {e}")
        raise RuntimeError(f"SAS Code Generation Failed: {str(e)}") from e
    ```
  - `backend/app/api/endpoints.py:41-44`：`except ValueError → 400` 永远接不到（已被包成 RuntimeError），全部落到 `except Exception → 500 + str(e)`。
- **影响**：用户填错配置时，前端 toast 弹出 `"Internal Server Error: SAS Code Generation Failed: ..."` 一串内部信息，而非"研究ID不能为空"。每个用错的用户都会撞到；状态码错乱也让前端无法区分"输入错误"vs"系统错误"。
- **修法**：`sas_service` 区分异常类型——业务校验异常（`ValueError`）原样 raise（透传到 endpoints 的 400 分支），仅对真正非预期异常记日志后抛 500，且 500 的 `detail` 不含 `str(e)`（只给通用文案，详情进日志）。
- **风险**：低。不动核心生成逻辑，只改异常传递路径。

### P0-2　前端 axios 无 timeout

- **问题**：所有 API 调用无超时，后端卡死时前端永久 loading。
- **证据**：`frontend/lib/api.ts:14/35/45/56/67` 全是裸 `axios.get/post`，无 timeout、无共享实例、无请求/响应拦截器；`app/templates/page.tsx` 的 arraybuffer 下载同样无 timeout。
- **影响**：SAS 生成慢或后端卡死时，`isPending` 永久为 true，生成按钮锁死，非技术用户只能强杀进程。
- **修法**：建共享 axios 实例，`timeout: 60000`（SAS 生成可能较久），加响应拦截器统一提取 `error.response?.data?.detail`；api.ts 与 templates page 的裸调用统一改用该实例。
- **风险**：低。

---

## 四、P1 详述

### P1-1　版本号与 changelog 统一（含 v2.2 遗漏）

- **问题**：三处版本号互相矛盾，且 `endpoints.py` 的 history 是与 `version_info.py` **脱节的硬编码副本**。
- **证据**：
  - `backend/app/main.py:27` `version="1.0.0"`（FastAPI 元数据，显示在 /docs）
  - `backend/app/api/endpoints.py:133` `/app/version` 返回 `"version": "2.1"`，且 `endpoints.py:127-195` 整段 history 是硬编码，**未读 `version_info.py`**
  - `sas_randomizer/utils/version_info.py` 已是 v2.2（权威源），README 也已是 v2.2
- **影响**：用户在 app 内"关于/更新日志"看到的还是 v2.1，与实际 v2.2 不符；两份 changelog 数据源分裂，每次发版要改两处，必然漂移。
  > **注**：v2.2 更新 `version_info.py` 时未同步 `endpoints.py` 这份副本，是上一轮的疏漏。
- **修法**：`endpoints.py` 的 `/app/version` 改为读 `version_info.py`（`get_update_history()` / `get_current_version()`），删掉硬编码副本；`main.py` 的 version 同步引用。
- **风险**：低。

### P1-2　standalone 模式日志被 NullWriter 吞掉

- **问题**：实际分发形态（standalone `--windowed`）下，stdout/stderr 被 `backend/run.py` 的 `NullWriter` 丢弃，出问题零线索。
- **证据**：`backend/run.py`（NullWriter 重定向）、`backend/app/main.py:82` 用 `print`、`build_standalone_web.py` 全用 `print`；`sas_randomizer/utils/logger.py` 定义了 `setup_logger`/`log_operation`（含 safe_params 白名单，设计正确）但**后端服务路径从未调用**。
- **影响**：v2.1 刚改过进程残留，但 standalone 下无任何持久化日志，用户报"起不来/还残留/模板找不到"时完全无法排查。
- **修法**：standalone 模式把日志写到本地文件（如 `%LOCALAPPDATA%/RanGen/rangen.log`）而非 NullWriter；统一改用 logging，移除 print；接上已写好的 `logger.py`。
- **风险**：中。需注意日志路径跨用户权限、日志体积轮转。

### P1-3　v2.1 的 shutdown 只是 best-effort（残留未根治）

- **问题**："关浏览器 = 关后端"这个不变量并未被真正保证，只是大概率工作。
- **证据**：唯一触发路径是前端 `providers.tsx` 的 `beforeunload → sendBeacon(".../system/shutdown")`；`endpoints.py:197-214` 用 `os._exit(0)` 硬终止。
- **影响**：以下场景后端仍残留——任务管理器强杀浏览器 / 浏览器崩溃 / sendBeacon 被禁用或网络栈已关闭 / 休眠唤醒。v2.1 是缓解，不是根治。
- **修法方向**（架构级，建议放 v2.4）：
  - (a) 后端看门狗：启动记录时间，无活跃连接 + 无 generate 请求超 N 分钟则自退；
  - (b) 父子进程托管：RanGen.exe 作父进程托管后端，提供托盘 UI 管理生命周期；
  - (c) 最小方案：独占端口锁 + 启动检测已有实例 + 文档明确说明局限。
- **风险**：高（架构级）。短期建议先用 (c) + 文档说明。

### P1-4　零测试覆盖

- **问题**：无任何测试文件，核心引擎与模板无回归保护。
- **证据**：全仓无 `tests/`、无 `conftest.py`；`requirements.txt` 列了 `pytest`/`httpx` 但无测试。对统计代码生成工具，输出正确性是核心价值。
- **影响**：核心引擎/模板改一次就可能悄悄回归（如 v2.2 这种模板改动）。
- **修法**：至少补——(1) `/api/v1/generate` happy path + 校验失败契约测试；(2) `SASRandomizationGenerator._validate_parameters` 各分支；(3) 固定输入 → 固定 SAS 输出的 snapshot 测试（防模板回归）。
- **风险**：低（新增，不改现有逻辑），但持续投入。

### P1-5　Electron 死路径清理（需决策，红线）

- **问题**：`package.json` 声明 `"main": "electron/main.js"` + 三个 electron 脚本（`electron:dev`/`dist`/`pack-app`），但 `frontend/electron/` 目录不存在。半成品/废弃路径，与实际在用的 PyInstaller standalone 并存，文档无说明。
- **证据**：`frontend/package.json:5,11-13`；全仓（排除 node_modules）无 `electron/main.js`。
- **影响**：维护者困惑；`npm run electron:dev` 直接失败。
- **取舍**（删依赖是红线，**需 Damon 拍板**）：
  - 走 standalone 唯一方案 → 删 package.json 的 `main`/electron scripts/`build` 字段 + `electron`/`electron-builder`/`concurrently`/`cross-env`/`wait-on` 五个 devDep；
  - 仍要保留 Electron → 补齐 `electron/main.js`（须 `contextIsolation: true`、`nodeIntegration: false`、加载 `out/index.html`）。
- **风险**：低（删除）。

### P1-6　前端无 Error Boundary + query 无错误反馈

- **问题**：渲染异常 = 整页白屏；templates 等加载失败 = 静默空白列表。
- **证据**：全仓无 `ErrorBoundary`/`componentDidCatch`，`app/layout.tsx` 直接渲染 `{children}` 无包裹；`app/templates/page.tsx` 的 useQuery 只解构 `data, isLoading`，无 `isError` 分支；`SettingsMenu.tsx` 的 shutdown fetch 无 catch。
- **影响**：static export 无 SSR error page 兜底，子组件抛错即白屏，非技术用户无从恢复；加载失败时误以为"加载中"卡住。
- **修法**：在 Providers 内加全局 ErrorBoundary（带 reload 按钮）；query hook 加 `isError` 分支或 `onError` toast（mutation 路径 `api.ts:21-24` 已做对，query 路径对齐即可）。
- **风险**：低。

---

## 五、其他审计确认（无需改）

以下经审计确认**做得不错或本地不适用**，列出以免重复怀疑：

- **CORS 配置合理**：`main.py:31-34` 是显式 `localhost:3000` 列表，非 `["*"]`；工具绑 127.0.0.1 不对外。
- **无硬编码密钥/token/绝对路径/用户名**：全仓干净，路径均用 `os.path`/`pathlib` 相对推导。
- **i18n key 完整对齐**：`translations.ts` zh/en 各 168 key，无缺 key。
- **强制 npmmirror 镜像**（`build_standalone_web.py:98-100`）：国内构建环境，**正确**，非 bug。
- **build 脚本 Linux 分支**：Windows-only 桌面工具，忽略。
- **schema 数值范围约束缺失 / 路径遍历 startswith / shutdown 无鉴权**：均属"公网服务标准套本地单机工具"，API 不对外、前端 Zod 已校验，本地定位下风险可忽略，列为 P2 观察项，不单独立项。

---

## 六、P2 速览（随手做，不立项）

| 问题 | 证据 | 备注 |
|---|---|---|
| backend 地址散落 4 处硬编码 | `api.ts:9`、`templates/page.tsx`、`providers.tsx`、`SettingsMenu.tsx` | 统一到 api.ts 的 baseURL，可维护性 |
| Zustand store 无 version/migration | `store.ts:133-135` | schema 演进会撞旧 localStorage |
| 默认 config 含 demo 真值 | `store.ts:57-121`（study_id='XXXXXX' 等） | 产品取舍，可改"加载演示"按钮显式注入 |
| 14 处 `any`/`as any` | `WizardForm.tsx:44,143` 等 | resolver 处 Zod4+RHF7 已知问题，短期可接受 |
| `<html lang="en">` 与中文 UI 不符 | `app/layout.tsx:19` | a11y + 翻译提示，lang 跟随当前语言 |

---

## 附：审计方法

后端/前端各由独立审计 agent 分维度扫描（安全/错误处理/部署/测试/工程化/依赖/可访问性），核心 P0/P1 结论由人工复核一手代码（`sas_service.py`、`endpoints.py`、`api.ts`、`main.py`、`version_info.py`）确认，行号以审计时点（v2.2, 2026-06-22）为准。
