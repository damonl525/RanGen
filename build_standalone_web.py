import subprocess
import sys
import os
import signal
import platform
import time
import shutil

# Handle Ctrl+C gracefully
def signal_handler(sig, frame):
    print("\n\nBuild cancelled by user.")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def kill_process(proc_name):
    """Attempt to kill a process by name to release file locks."""
    print(f"Checking for existing instances of {proc_name}...")
    try:
        if platform.system() == "Windows":
             subprocess.call(f"taskkill /F /IM {proc_name} >nul 2>&1", shell=True)
        else:
             subprocess.call(f"pkill -f {proc_name} >nul 2>&1", shell=True)
    except Exception:
        pass

def robust_rmtree(path, retries=5, delay=2):
    """Robustly remove a directory."""
    if not os.path.exists(path):
        return

    print(f"Cleaning directory: {path}")
    for i in range(retries):
        try:
            shutil.rmtree(path)
            return
        except OSError:
            if i < retries - 1:
                print(f"  Access denied. Retrying cleanup in {delay}s...")
                kill_process("rangen_backend.exe")
                time.sleep(delay)
            else:
                print(f"  Warning: Could not fully clean {path}.")

def run_command(command, cwd=None, description=None, env=None):
    if description:
        print(f"\n--- {description} ---")
    
    print(f"Executing: {command}")
    
    process_env = os.environ.copy()
    if env:
        process_env.update(env)
        
    try:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, 
            text=True,
            encoding='utf-8',
            errors='replace',
            env=process_env
        )
        
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                sys.stdout.write(line)
                sys.stdout.flush()
        
        return_code = process.poll()
        if return_code == 0:
            print("Success.")
            return True
        else:
            print(f"Failed with return code {return_code}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    dist_final_dir = os.path.join(root_dir, "dist_standalone")
    frontend_dir = os.path.join(root_dir, "frontend")
    frontend_out_dir = os.path.join(frontend_dir, "out")
    
    is_windows = platform.system() == "Windows"
    npm_cmd = "npm.cmd" if is_windows else "npm"

    # Define Mirror Environment Variables for China
    cn_env = {
        "NPM_CONFIG_REGISTRY": "https://registry.npmmirror.com" 
    }

    print("===================================")
    print("Building Standalone Web App (No Electron)")
    print("===================================")

    # 1. Clean
    kill_process("rangen_backend.exe")
    kill_process("RanGen.exe")
    robust_rmtree(dist_final_dir)
    os.makedirs(dist_final_dir, exist_ok=True)

    # 2. Build Backend
    # Note: We use the same PyInstaller command but output to our new dist folder
    backend_cmd = (
        'pyinstaller --noconfirm --onefile --windowed --clean --name RanGen '
        '--icon "assets/logo.ico" '
        '--paths . --paths backend --add-data "sas_randomizer;sas_randomizer" --add-data "backend/app;app" '
        '--hidden-import "uvicorn" '
        '--hidden-import "uvicorn.logging" '
        '--hidden-import "uvicorn.loops" '
        '--hidden-import "uvicorn.loops.auto" '
        '--hidden-import "uvicorn.protocols" '
        '--hidden-import "uvicorn.protocols.http" '
        '--hidden-import "uvicorn.protocols.http.auto" '
        '--hidden-import "uvicorn.lifespan" '
        '--hidden-import "uvicorn.lifespan.on" '
        '--hidden-import "app" '
        '--hidden-import "app.main" '
        '--hidden-import "sas_randomizer" '
        'backend/run.py '
        f'--distpath "{dist_final_dir}" --workpath backend/build_standalone --specpath .'
    )
    
    if not run_command(backend_cmd, cwd=root_dir, description="Step 1: Building Backend (PyInstaller)"):
        sys.exit(1)

    # 3. Build Frontend
    if not run_command(f"{npm_cmd} run build", cwd=frontend_dir, description="Step 2: Building Frontend (Next.js Export)", env=cn_env):
        sys.exit(1)
        
    # 4. Copy Frontend Assets
    print("\n--- Step 3: Assembling Application ---")
    dest_web_root = os.path.join(dist_final_dir, "web_root")
    
    if os.path.exists(frontend_out_dir):
        print(f"Copying web assets from {frontend_out_dir} to {dest_web_root}...")
        try:
            if os.path.exists(dest_web_root):
                shutil.rmtree(dest_web_root)
            shutil.copytree(frontend_out_dir, dest_web_root)
            print("Assets copied successfully.")
        except Exception as e:
            print(f"Failed to copy assets: {e}")
            sys.exit(1)
    else:
        print(f"Error: Frontend build directory not found at {frontend_out_dir}")
        sys.exit(1)

    # 5. Copy Assets (Templates, Logo, etc.)
    print("\n--- Step 4: Copying Application Assets ---")
    src_assets = os.path.join(root_dir, "assets")
    dest_assets = os.path.join(dist_final_dir, "assets")
    
    if os.path.exists(src_assets):
        print(f"Copying assets from {src_assets} to {dest_assets}...")
        try:
            if os.path.exists(dest_assets):
                shutil.rmtree(dest_assets)
            shutil.copytree(src_assets, dest_assets)
            print("Assets folder copied successfully.")
        except Exception as e:
            print(f"Failed to copy assets folder: {e}")
            # Non-critical, but warning
    else:
        print(f"Warning: Assets directory not found at {src_assets}")

    print("\n===================================")
    print("Build Complete!")
    print(f"Output Directory: {dist_final_dir}")
    print("To run the app:")
    print(f"  Double-click: {os.path.join(dist_final_dir, 'RanGen.exe')}")
    print("  (Authentication: Browser will open automatically at http://127.0.0.1:8000)")
    print("===================================")

if __name__ == "__main__":
    main()
