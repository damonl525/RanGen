import uvicorn
import os
import sys

# Fix for PyInstaller noconsole mode where sys.stdout/stderr are None
# This prevents "AttributeError: 'NoneType' object has no attribute 'isatty'" in uvicorn logging
class NullWriter:
    def write(self, text):
        pass
    def flush(self):
        pass
    def isatty(self):
        return False

if sys.stdout is None:
    sys.stdout = NullWriter()

if sys.stderr is None:
    sys.stderr = NullWriter()

def get_base_path():
    """Get the base path for resources, handling both dev and PyInstaller frozen mode."""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        return sys._MEIPASS
    else:
        # Running in development
        return os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    # Get the base path (handles PyInstaller frozen mode)
    base_path = get_base_path()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Add paths to sys.path for module imports
    # In frozen mode, modules are in _MEIPASS
    # In dev mode, we need the parent directory for sas_randomizer
    if getattr(sys, 'frozen', False):
        # PyInstaller mode: add _MEIPASS to path
        if base_path not in sys.path:
            sys.path.insert(0, base_path)
        print(f"Running in frozen mode. Base path: {base_path}")
    else:
        # Development mode: add project root
        project_root = os.path.dirname(current_dir)
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        # Also add backend directory for 'app' module
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        print(f"Running in development mode. Project root: {project_root}")
    
    print(f"Starting RanGen Backend Server...")
    print(f"sys.path: {sys.path[:3]}...")  # Show first 3 paths for debugging
    
    # Import app directly (required for PyInstaller compatibility)
    # This must be done AFTER setting up sys.path
    from app.main import app as application
    
    # Run Uvicorn in Production Mode
    # Using the imported app object directly instead of string import
    # This is mandatory for PyInstaller builds as string imports don't work
    uvicorn.run(application, host="127.0.0.1", port=8000, reload=False, workers=1)
