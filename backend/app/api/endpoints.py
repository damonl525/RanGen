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
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Internal server error. Please check the application logs.")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error. Please check the application logs.")

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
    Reads from the authoritative version_info.py source.
    """
    from sas_randomizer.utils.version_info import VersionInfo
    current_version = VersionInfo.get_current_version()
    history_raw = VersionInfo.get_update_history()

    # Map version_info.py format to the API response format the frontend expects
    history = [
        {
            "version": item["version"].lstrip("v"),
            "date": item["date"],
            "changes": item.get("details", [item["description"]]),
        }
        for item in history_raw
    ]

    # Determine release_date from the current version entry
    release_date = ""
    for item in history_raw:
        if item["version"] == current_version:
            release_date = item["date"]
            break

    return JSONResponse({
        "version": current_version.lstrip("v"),
        "release_date": release_date,
        "history": history,
    })

@router.post("/system/shutdown")
async def shutdown_server():
    """
    Shutdown the application server.
    """
    import threading
    import time
    
    # Clean up PID file before exit
    def _cleanup_pid():
        try:
            from pathlib import Path
            pid_file = Path(os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))) / "RanGen" / "rangen.pid"
            if pid_file.exists():
                pid_file.unlink()
        except Exception:
            pass
    
    def force_exit():
        time.sleep(1) # Give time for the response to be sent
        _cleanup_pid()
        os._exit(0) # Force exit
        
    # Schedule exit in a separate thread
    threading.Thread(target=force_exit, daemon=True).start()
    
    return {"status": "shutting_down", "message": "Application is closing..."}
