import sys
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse, FileResponse, JSONResponse
from .schemas import SASGenerationRequest
from ..services.sas_service import SASService
import os
from pathlib import Path
from typing import List, Dict

router = APIRouter()

# Define project root and templates directory
# Handle frozen (PyInstaller) vs dev mode
if getattr(sys, 'frozen', False):
    # In frozen mode:
    # 1. Look for 'assets' next to the executable (User custom path)
    EXE_DIR = Path(sys.executable).parent
    TEMPLATES_DIR = EXE_DIR / "assets" / "templates"
    
    # 2. If not found, fall back to internal _MEIPASS assets (Bundled default)
    if not TEMPLATES_DIR.exists():
        MEIPASS = Path(sys._MEIPASS)
        TEMPLATES_DIR = MEIPASS / "assets" / "templates"
else:
    # In dev mode:
    # Assuming this file is in backend/app/api/
    # backend/app/api -> backend/app -> backend -> test (PROJECT_ROOT)
    BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
    PROJECT_ROOT = BACKEND_DIR.parent
    TEMPLATES_DIR = PROJECT_ROOT / "assets" / "templates"

@router.post("/generate", response_class=PlainTextResponse)
async def generate_sas(request: SASGenerationRequest):
    """
    Generate SAS Randomization Code based on the provided configuration.
    Returns plain text SAS code.
    """
    try:
        sas_code = SASService.generate_sas_code(request)
        return sas_code
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/config/defaults")
async def get_defaults():
    """
    Return default configuration values to populate the frontend form.
    """
    from sas_randomizer.config import (
        DEFAULT_PROJECT_SETTINGS,
        DEFAULT_RANDOMIZATION_SETTINGS,
        DEFAULT_SUBJECT_SETTINGS
    )
    
    return {
        "project": DEFAULT_PROJECT_SETTINGS,
        "randomization": DEFAULT_RANDOMIZATION_SETTINGS,
        "subject": DEFAULT_SUBJECT_SETTINGS
    }

@router.get("/templates", response_model=List[Dict[str, str]])
async def list_templates():
    """
    List available Excel templates in assets/templates.
    """
    if not TEMPLATES_DIR.exists():
        # Fallback or create if missing
        return []
    
    templates = []
    for file_path in TEMPLATES_DIR.glob("*.xlsx"):
        # Fix: In frozen mode, relative_to(PROJECT_ROOT) might fail if PROJECT_ROOT is not set correctly or cross-drive
        # Just return the filename as path is not really used by frontend for downloading (it uses name)
        try:
             # Just use the name for the path display or a simple relative path
             # The frontend likely uses this 'path' just for display or we can just send the name
             templates.append({
                "name": file_path.name,
                "path": file_path.name 
            })
        except Exception:
             continue
             
    return templates

@router.get("/debug/paths")
async def debug_paths():
    """
    Debug endpoint to show current paths
    """
    return {
        "frozen": getattr(sys, 'frozen', False),
        "executable": sys.executable,
        "base_dir": str(Path(sys.executable).parent) if getattr(sys, 'frozen', False) else str(BACKEND_DIR),
        "templates_dir": str(TEMPLATES_DIR),
        "exists": TEMPLATES_DIR.exists(),
        "files": [p.name for p in TEMPLATES_DIR.glob("*")] if TEMPLATES_DIR.exists() else []
    }

@router.get("/templates/{template_name}")
async def download_template(template_name: str):
    """
    Download a specific Excel template.
    """
    file_path = TEMPLATES_DIR / template_name
    
    # Security check to prevent directory traversal
    try:
        file_path = file_path.resolve()
        # Verify that the resolved path is within TEMPLATES_DIR
        if not str(file_path).startswith(str(TEMPLATES_DIR.resolve())):
             raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
         raise HTTPException(status_code=404, detail="Template not found")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")
        
    return FileResponse(
        path=file_path, 
        filename=template_name,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@router.get("/app/version")
async def get_version_info():
    """
    Get application version and change history.
    """
    return JSONResponse({
        "version": "2.0",
        "release_date": "2026-02-03",
        "history": [
            {
                "version": "2.0",
                "date": "2026-02-03",
                "changes": [
                    "Web版全新发布：从桌面端迁移至 Web 架构 (Next.js + FastAPI)",
                    "交互体验升级：引入现代化 UI 组件库，支持深色模式与响应式设计",
                    "可视化配置向导：新增分步式随机化配置流程，降低使用门槛",
                    "国际化支持：全面支持中英文界面一键切换",
                    "实时预览：支持 SAS 代码的实时生成、预览与一键复制/下载",
                    "单文件部署：支持打包为独立的 exe 可执行文件，开箱即用"
                ]
            },
            {
                "version": "1.3",
                "date": "2025-10-10",
                "changes": [
                    "针对供应商B5.X更新：支持生成xlsx格式盲底",
                    "优化药物二次随机：供应商B5.X系统xlsx盲底移除区组号与区组随机数"
                ]
            },
            {
                "version": "1.2",
                "date": "2025-09-28",
                "changes": [
                    "修复路径生成与分层因素生成的 Bug",
                    "优化药物 RTF 盲底：增加 pg_add，每页最多展示 440 个药物",
                    "优化 CSV 输出：FILE 行增加 DSD option 以解决空白值显示问题",
                    "供应商B模板优化：不再生成取药顺序号，直接使用系统随机发药功能",
                    "逻辑增强：确保有分层情况下区组号唯一"
                ]
            },
            {
                "version": "1.1",
                "date": "2025-09-19",
                "changes": [
                    "修复药物有分层时的方法描述错误",
                    "新增供应商B 5.X 受试者盲底模板 (支持一次镜像替换)",
                    "新增供应商B 5.X 药物盲底模板",
                    "新增供应商B Lite 受试者盲底模板"
                ]
            },
             {
                "version": "1.0",
                "date": "2025-09-17",
                "changes": [
                    "v1.0 正式发布",
                    "支持常用随机化功能配置",
                    "内置供应商A和供应商B 6.X 盲底模板支持"
                ]
            }
        ]
    })

@router.post("/system/shutdown")
async def shutdown_server():
    """
    Shutdown the application server.
    """
    import threading
    import time
    import uvicorn
    import signal
    
    def force_exit():
        time.sleep(1) # Give time for the response to be sent
        os._exit(0) # Force exit
        
    # Schedule exit in a separate thread
    threading.Thread(target=force_exit, daemon=True).start()
    
    return {"status": "shutting_down", "message": "Application is closing..."}
