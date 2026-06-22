# RanGen v2.3 修复核对报告

> 对另一团队依据 `ROADMAP_v2.3.md` 所做修复的一手核对（QC）。
> 核对方式：完整 `git diff` + 关键文件逐行复核 + `pytest` 实跑 + `/app/version`、`/generate` 端到端 smoke。
> 核对时点：2026-06-23｜版本：v2.3｜结论以**实际代码与测试运行结果**为准，不采纳二手描述。

---

## 一、总体结论

**8 项 P0/P1 中：7 项完全修复，1 项（P1-3）为预期内的"缓解"而非根治。整体质量可信，可进入发版流程。**

| 编号 | 问题 | 判定 | 核心证据 |
|---|---|---|---|
| P0-1 | generate 异常处理（400/500 错位 + 信息泄露） | ✅ **完全修复** | `sas_service.py`、`endpoints.py`；7 个契约/单测通过 |
| P0-2 | axios 无 timeout | ✅ **修复** | `frontend/lib/api.ts`（共享实例+60s+拦截器）、`templates/page.tsx` |
| P1-1 | 版本号三处分裂（含 v2.2 遗漏） | ✅ **完全修复** | `version_info.py`→v2.3；`/app/version` 端到端返回 v2.3 |
| P1-2 | standalone 日志被 NullWriter 吞 | ✅ **修复** | `backend/run.py` RotatingFileHandler 1MB×3 |
| P1-3 | shutdown 残留（best-effort） | 🟡 **缓解（符合预期）** | `run.py` 端口锁 + PID 文件；根治仍待 v2.4 看门狗 |
| P1-4 | 零测试覆盖 | ✅ **完成** | `tests/` 24 测试**全部通过**（0.70s） |
| P1-5 | Electron 死路径 | ✅ **完全修复** | `package.json` 删 main/脚本/build/5 个 devDeps |
| P1-6 | 无 ErrorBoundary + query 无错误反馈 | ✅ **修复** | `ErrorBoundary.tsx` + `layout.tsx` 包裹 + templates `isError` 分支 |

**验证执行结果：**
- `python -m pytest tests/ -v` → **24 passed in 0.70s**（含 app 启动导入，证明 `main.py`/`endpoints.py` 改动不破坏启动）
- `GET /api/v1/app/version` → `version=2.3`、`release_date=2026-06-23`、history 8 条、顶层 v2.3 含 8 条变更
- `POST /api/v1/generate`（合法输入）→ 200

---

## 二、逐项核对

### P0-1　generate 异常处理 — ✅ 完全修复

**要求**：业务校验错误（`ValueError`）→ 400 + 友好文案；系统错误 → 500 + 通用文案，不泄露 `str(e)`。

**实际改动**（`backend/app/services/sas_service.py`、`backend/app/api/endpoints.py`）：
```python
# sas_service.py — ValueError 透传，RuntimeError 不再含 str(e)
except ValueError:
    raise                              # → 透传到 endpoints 的 400 分支
except Exception as e:
    logging.error(f"Unexpected error generating SAS code: {e}", exc_info=True)
    raise RuntimeError("SAS Code Generation Failed") from e   # 无 str(e)

# endpoints.py — 500 通用文案
except RuntimeError:
    raise HTTPException(status_code=500, detail="Internal server error. Please check the application logs.")
except Exception:
    raise HTTPException(status_code=500, detail="Internal server error. Please check the application logs.")
```
**判定**：异常传递链正确，400 能接到 `ValueError`，500 不含内部文本。`exc_info=True` 额外把堆栈写进日志（利于排障）。`test_generate_endpoint.py` 的 4 个校验失败用例确认返回 400 且 `detail` 含中文提示（"研究ID"/"方案标题"/"治疗组别"等）。
> 注：500 路径**无自动化测试**守护（见第四节盲区），靠代码核对确认无泄露。

### P0-2　axios 无 timeout — ✅ 修复

**要求**：共享 axios 实例 + timeout + 响应拦截器统一提取 detail。

**实际改动**（`frontend/lib/api.ts`）：
```ts
export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const api = axios.create({ baseURL: API_BASE_URL, timeout: 60000 });   // 60s
api.interceptors.response.use(r => r, error => {                        // 统一提取 detail
    const detail = error.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(new Error(detail));
});
// useGenerateSAS / useDefaultConfig / useTemplates / useAppVersion 均改用 api.get/post
```
`templates/page.tsx` 同步：预览改用 `${API_BASE_URL}` 并加 `timeout: 30000`，下载链路统一。
**判定**：核心目标达成——生成慢/后端卡死不再永久 loading；toast 文案质量提升（直接显示后端 detail）。
> 小瑕疵（非阻塞）：`TemplatePreviewDialog` 仍用裸 `axios.get`（非共享 `api` 实例），未走拦截器，靠自身 catch 兜底；arraybuffer 错误体不会自动解析为 detail，fallback 文案生效。建议后续统一改用 `api` 实例。
> 说明：`api.ts` 的本批修复**已在 HEAD（已提交）**，不在本次工作区 diff 内，但当前代码状态满足要求。

### P1-1　版本号统一 — ✅ 完全修复（并顺手修了一个既有 bug）

**实际改动**：
- `version_info.py`：`CURRENT_VERSION = "v2.3"`，新增 v2.3 完整 history（8 条 details）
- `endpoints.py` `/app/version`：改为 `from ...version_info import VersionInfo` 动态读取，**删除整段硬编码副本**；格式映射（`lstrip("v")`、`details→changes`）保留前端契约
- `main.py`：`version=VersionInfo.get_current_version()`
- **附带修复**：`main.py` 的 `project_root` 由 `"../../.."` 改为 `"../.."`——原值多退一层到项目根之外，本就是错的，顺手修正

**判定**：三处版本号现在同源于 `version_info.py`，app 内"关于/更新日志"正确显示 v2.3。我上轮漏同步 `endpoints.py` 的疏漏已补上。端到端 smoke 实测 `/app/version` 返回 v2.3。

### P1-2　standalone 日志落盘 — ✅ 修复

**实际改动**（`backend/run.py`，+169 行重写）：
- 冻结模式：`RotatingFileHandler` 写 `%LOCALAPPDATA%/RanGen/rangen.log`（1MB×3 轮转），`_LogWriter` 把 `sys.stdout/stderr` 重定向到 logger——**彻底替换原 `NullWriter`**（原先全部丢弃）
- dev 模式：保持控制台输出
- 路径跨平台处理（win32 取 `LOCALAPPDATA`）

**判定**：核心目标达成——分发形态下出问题有日志可查。`print` 也接入日志，`os.path`/`pathlib` 推导路径，无硬编码。
> 小瑕疵（建议后续完善）：logger 命名空间未统一——`run.py` 配置的是 `"rangen"` logger，而 `sas_service.py` 等用 `logging.error()`（root logger）。root logger 日志能否进 `rangen.log` 依赖 stderr 重定向链（仅 ERROR+ 可达），INFO 级跨模块日志未必落盘。建议后续统一用命名 logger（如 `logging.getLogger("rangen.xxx")`）。此项**未在真实 PyInstaller 产物中实测**（见第四节）。

### P1-3　shutdown 残留 — 🟡 缓解（符合 roadmap 预期，根治待 v2.4）

**实际改动**（`backend/run.py` + `endpoints.py`）：
- `run.py`：`_check_port_available()` 检测 8000 占用；`_write_pid_file()`/`_remove_pid_file()` 维护 `%LOCALAPPDATA%/RanGen/rangen.pid`；`main` 的 `finally` 清理 PID
- `endpoints.py` `/system/shutdown`：退出前 `_cleanup_pid()` 清理 PID 文件

**判定**：实现了 roadmap 的 **(c) 最小方案**——单实例由 OS 端口绑定隐式强制（二次启动 uvicorn 绑定失败），PID 文件 + 关闭清理提升可诊断性。但**浏览器崩溃/任务管理器强杀→后端孤儿**这个原始残留场景仍未根治（需 v2.4 看门狗或父子进程托管）。这与 roadmap 明确的"短期 (c) + 长期 v2.4"规划一致，判定为**按预期缓解**。
> 待清理：`_detect_instance()` 的返回值在 `main` 中**被忽略**（调用后未用），属 dead-ish code；建议要么用于"检测到已存在实例则拒绝启动/提示用户"，要么删除返回值。另外二次启动失败时会先覆盖 PID 再被 `finally` 删除，使 PID 文件在失败启动后可能失真（minor）。

### P1-4　测试基建 — ✅ 完成（24 测试全过）

**实际新增**（`tests/`，未提交）：
- `conftest.py`：`default_request_data` 合法 payload + `client` (TestClient)
- `test_generate_endpoint.py`（7）：happy path（minimal / 分层 / 药物随机）+ 4 个校验失败→400 契约
- `test_validation.py`（14）：`_validate_parameters` 各分支 happy + 11 个 ValueError 用例（study_id/protocol_title/client/company/arms/armcd/分层/可变区组/多子方案）
- `test_snapshot.py`（3）：固定输入→确定性输出 + 结构标记（PROC PLAN/DATA/%m_rpt）+ 固定种子字面量

**判定**：覆盖 generate 契约 + 校验分支 + 模板快照三层，正是 roadmap 要求的起步基建。`pytest` 实跑 **24 passed**，校验错误串与生成器实际输出一致（否则会 fail）。
> 缺口：**无 500 路径测试**（P0-1 的系统错误分支无守护）；快照测试只断言"两次相同输入相等"与若干标记存在，未存基准快照文件（无法在模板回归时自动 fail + diff 提示）——可作为下一轮增强。

### P1-5　Electron 死路径清理 — ✅ 完全修复

**实际改动**（`frontend/package.json`）：
- 删 `"main": "electron/main.js"`
- 删 3 个脚本：`electron:dev` / `dist` / `pack-app`
- 删整个 `"build"`（electron-builder）配置块
- 删 5 个 devDeps：`concurrently` / `cross-env` / `electron` / `electron-builder` / `wait-on`

**判定**：彻底移除与 PyInstaller standalone 并存的废弃路径。`frontend/electron/` 本就不存在，现在 package.json 也不再引用，维护者困惑消除。
> 注：`node_modules` 未重装（删 devDep 不影响已装包），建议后续 `npm install` 同步 `package-lock.json`。此项**未跑 `npm build`/`lint` 验证**（见第四节）。

### P1-6　ErrorBoundary + query 错误反馈 — ✅ 修复

**实际改动**：
- 新增 `frontend/components/ErrorBoundary.tsx`：class 组件，`getDerivedStateFromError` + `componentDidCatch`，渲染异常时显示友好页（AlertTriangle + 错误 message + "Reload Application" 按钮）
- `app/layout.tsx`：`<ErrorBoundary>` 包裹 `{children}`（在 Providers 内、Toaster 同级）
- `templates/page.tsx`：`useTemplates` 解构 `isError/error/refetch`，加 isError 分支（AlertTriangle + Retry 按钮）

**判定**：渲染异常不再整页白屏；模板加载失败不再静默"卡住"。mutation 路径的 `onError` toast 此前已有，query 路径现已对齐。
> 小瑕疵：`ErrorBoundary` 的 reload 是 `window.location.reload()`（整页刷新），对 static export 可接受；未做错误上报。非阻塞。

---

## 三、意外加分项（修复中顺手改善）

- **`main.py` project_root 路径 bug 修正**：`"../../.."` → `"../.."`，原值本就多退一层，是潜在导入隐患
- **`sas_service.py` 加 `exc_info=True`**：异常堆栈进日志，排障能力提升
- **axios 拦截器统一提取 detail**：所有 toast 文案质量统一提升，不再显示原始 axios 错误

---

## 四、验证盲区与建议（诚实披露）

以下**未在本轮验证中覆盖**，建议发版前补：

| 盲区 | 影响 | 建议 |
|---|---|---|
| **前端未跑 `npm run build`/`lint`** | TS 类型/导入解析仅靠代码核对（`API_BASE_URL` 已确认 export，`ErrorBoundary` 文件存在） | 发版前跑一次 `npm run build` + `lint` |
| **500 路径无自动化测试** | P0-1 系统错误分支靠代码核对，无回归守护 | 补一个 mock 注入非 ValueError → 断言 500 + detail 不含内部信息的测试 |
| **standalone 打包形态未实测** | P1-2 日志落盘、P1-3 PID/端口锁仅在代码层验证，未跑真实 PyInstaller 产物 | 跑 `python build_standalone_web.py` 生成 RanGen.exe，实测日志文件生成 + 二次启动行为 |
| **logger 命名空间未统一** | `sas_service` 等用 root logger，INFO 级跨模块日志在 frozen 下未必全进 `rangen.log` | 后续统一命名 logger（完善 P1-2） |
| **快照无基准文件** | 模板回归只能靠"两次相等"，无法自动 diff 提示改动 | 引入 pytest-regressions 或存基准 `.sas` 文件 |

---

## 五、仓库卫生（非本次修复范围，顺带提示）

- `_fix_version.py` 仍在工作区（未跟踪临时脚本）——建议确认无用后删除（**删文件属红线，需 Damon 确认**）
- 本次修复 + `ROADMAP_v2.3.md` + 本报告均**未提交**，工作区现状为 8 改 + 3 新增（`ErrorBoundary.tsx`、`tests/`、`VERIFICATION_v2.3.md`）

---

## 六、发版建议

**可以进入 v2.3 发版流程。** 建议发版前补的最小动作（按性价比）：
1. 跑 `npm run build` 确认前端无编译错误（10 分钟）
2. 跑一次 `build_standalone_web.py` 实测 standalone 形态（30 分钟，覆盖 P1-2/P1-3 的真实行为）
3. 补一个 500 路径测试（守护 P0-1 系统错误分支）

P1-3 的看门狗根治、logger 命名空间统一、快照基准文件，可纳入 v2.4 持续项，不阻塞 v2.3 发版。
