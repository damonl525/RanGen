# SAS 随机化代码生成器 (Web UI 版)

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/your-repo)
[![Status](https://img.shields.io/badge/status-Stable-green.svg)]()
![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

**SAS 随机化代码生成器** 是一款专为生物统计师和临床程序员设计的专业工具，旨在自动化生成复杂的 SAS 随机化方案代码。

本项目彻底重构了传统的桌面应用程序，将其迁移至强大的 **Web 架构 (v2.0)**，从而提供卓越的灵活性、用户体验和严格的数据校验。

---

## ✨ v2.0 新特性 (2026-02-03)

**v2.0** 更新标志着项目发展的一个重要里程碑：

*   **🌐 Web 架构迁移**：从桌面端 (Tkinter) 完全迁移至基于 **Next.js 15** + **FastAPI** 的现代化 B/S 架构。
*   **🎨 用户体验升级**：引入 Shadcn/UI 组件库，提供现代化的用户界面，支持响应式设计及 **深色模式 (Dark Mode)**。
*   **🧙‍♂️ 可视化配置向导**：提供分步向导，简化研究信息、分层因素和药物供应的复杂配置流程。
*   **🌍 国际化支持 (i18n)**：支持 **中文** 与 **英文** 界面的一键切换。
*   **⚡ 实时预览**：无需本地编译，即可实时生成、预览、复制或下载 SAS 代码。

---

## 🏗 系统架构

本应用采用 **厚模型 (Thick Model) + 模板引擎** 架构，以确保逻辑分离和系统的可扩展性。

### 1. 前端 (`/frontend`)
*   **技术栈**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand via Persist.
*   **核心能力**:
    *   **BatchConfigManager (批次配置管理器)**：用于管理基于分层因素的多批次药物供应的高级 UI。
    *   **动态校验**：基于 Zod 的 Schema 校验，确保所有输入（如区组大小、比例）在生成前均合法。
    *   **状态持久化**：自动保存您的配置进度到本地。

### 2. 后端 API (`/backend`)
*   **技术栈**: FastAPI (Python 3.10+), Pydantic.
*   **职责**:
    *   前端的 API 网关。
    *   **厚模型转换**：将扁平的 JSON 配置转换为深层嵌套、类型安全的领域对象 (`StudyDesignConfig`)。
    *   **模板服务**：管理并提供不同 IVRS 供应商的 Excel 模板下载。

### 3. 核心引擎 (`/sas_randomizer`)
*   **引擎**: Jinja2 + Python Builders.
*   **设计哲学**: **逻辑在模板中，数据在模型中**。
*   **特性**:
    *   **异构队列**：支持每个队列使用不同的随机化逻辑（如不同的区组大小）。
    *   **模板化 (`.sas.j2`)**：所有 SAS 逻辑驻留在可维护的 Jinja2 模板中，而非 Python 字符串拼接。
    *   **多供应商支持**：内置支持 **供应商A** 和 **供应商B** 的盲底格式。

---

## 📂 项目结构

```bash
.
├── frontend/                  # Next.js 应用程序
│   ├── app/                   # App Router 页面
│   ├── components/            # Shadcn UI 及功能组件
│   ├── lib/                   # 状态存储, API Hooks, 翻译文件
│   └── ...
│
├── backend/                   # FastAPI 服务器
│   ├── app/
│   │   ├── api/               # API 端点
│   │   └── schemas/           # API 契约 Pydantic 模型
│   └── ...
│
└── sas_randomizer/            # 核心生成库
    ├── core_refactored/       
    │   ├── templates/         # Jinja2 SAS 模板 (*.sas.j2)
    │   ├── builders/          # Python 数据构建器
    │   └── transformers.py    # UI -> 领域模型适配器
    └── ...
```

---

## 🚀 快速开始

### 前置要求
*   **Node.js** (v18+)
*   **Python** (v3.10+)

### 1. 启动后端
```bash
# 安装依赖
pip install fastapi uvicorn jinja2 pydantic pandas openpyxl

# 从项目根目录运行服务器
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API 文档地址: http://localhost:8000/docs*

### 2. 启动前端
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
*Web UI 地址: http://localhost:3000*

---

## 📜 版本历史

*   **v2.0 (2026-02-03)**: Web 版迁移, 国际化支持, 可视化向导。
*   **v1.3 (2025-10-10)**: 针对供应商B 5.X 更新，支持生成 xlsx 格式盲底。
*   **v1.2 (2025-09-28)**: 修复路径生成 Bug；优化 RTF 分页；增强 CSV DSD 选项。
*   **v1.1 (2025-09-19)**: 新增供应商B Lite 支持及受试者/药物盲底模板。
*   **v1.0 (2025-09-17)**: 初始版本发布 (桌面版)。

---

## 📝 许可证 (License)
Proprietary / Internal Use Only (专有软件 / 仅限内部使用).
