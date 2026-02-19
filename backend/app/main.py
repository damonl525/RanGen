from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sys
import os
import webbrowser
import threading
import time

# Fix path to allow importing sas_randomizer from parent directory
# This assumes run.py or uvicorn is run from the backend directory or project root correctly
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))

# Only modify path in development mode
if not getattr(sys, 'frozen', False):
    project_root = os.path.abspath(os.path.join(current_dir, "../../.."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

from .api.endpoints import router as api_router

app = FastAPI(
    title="RanGen API",
    description="Backend API for SAS Randomization Generator",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "RanGen API"}

# --- Static File Serving (Standalone Mode) ---
def get_web_root():
    """Determine the path to the static web files."""
    if getattr(sys, 'frozen', False):
        # In PyInstaller bundle, look in _MEIPASS or adjacent to exe
        # We will package 'web_root' parallel to the exe or inside
        # Strategy: Checks for 'web_root' folder in the same directory as the executable
        base_path = os.path.dirname(sys.executable)
        web_root = os.path.join(base_path, "web_root")
        if os.path.exists(web_root):
            return web_root
        
        # Fallback: check inside the temporary bundle (_MEIPASS)
        bundle_path = getattr(sys, '_MEIPASS', None)
        if bundle_path:
            dist_web_root = os.path.join(bundle_path, "web_root")
            if os.path.exists(dist_web_root):
                return dist_web_root
                
    else:
        # Dev mode: assume 'frontend/out' or 'web_root' in project root
        # Adjust path relative to backend/app/main.py
        # backend/app/main.py -> backend/app -> backend -> test -> frontend/out
        dev_web_root = os.path.abspath(os.path.join(current_dir, "../../frontend/out"))
        if os.path.exists(dev_web_root):
            return dev_web_root
            
    return None

web_root_path = get_web_root()

if web_root_path:
    print(f"Serving static files from: {web_root_path}")
    
    # Mount the static directory
    app.mount("/", StaticFiles(directory=web_root_path, html=True), name="static")

    # Clean shutdown and browser open logic
    def open_browser():
        time.sleep(1.5) # Wait for server to start
        webbrowser.open("http://127.0.0.1:8000")

    # Only auto-open browser if we are serving static files (likely standalone mode)
    # and not in a debug reloader
    if not os.environ.get("UVICORN_RELOAD"):
         threading.Thread(target=open_browser, daemon=True).start()

else:
    @app.get("/")
    async def root():
        return {"message": "Welcome to RanGen API. Visit /docs for Swagger UI. (Web UI not found)"}
