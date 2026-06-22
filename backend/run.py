import uvicorn
import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import socket

# --- Logging Setup ---
# In frozen (standalone) mode, write logs to a file so users can share them for troubleshooting.
# In dev mode, keep console output as normal.

def _get_data_dir() -> Path:
    """Determine the data directory. Uses %LOCALAPPDATA%/RanGen on Windows."""
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
    else:
        base = os.path.expanduser("~")
    data_dir = Path(base) / "RanGen"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def _setup_logging():
    """Configure logging: file in frozen mode, console in dev mode."""
    logger = logging.getLogger("rangen")
    logger.setLevel(logging.INFO)

    if getattr(sys, "frozen", False):
        # Standalone: log to file with rotation (max 1 MB, keep 3 backups)
        log_file = _get_data_dir() / "rangen.log"
        handler = RotatingFileHandler(
            str(log_file), maxBytes=1_000_000, backupCount=3, encoding="utf-8"
        )
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
        ))
        logger.addHandler(handler)
        # Also redirect stdout/stderr — previously NullWriter dropped them entirely
        sys.stdout = _LogWriter(logger, logging.INFO)
        sys.stderr = _LogWriter(logger, logging.ERROR)
    else:
        # Dev mode: console only
        handler = logging.StreamHandler(sys.__stdout__ or sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
        ))
        logger.addHandler(handler)

    return logger


class _LogWriter:
    """File-like object that redirects writes to a logger."""
    def __init__(self, logger: logging.Logger, level: int):
        self._logger = logger
        self._level = level
        self._buffer = ""

    def write(self, text: str):
        if text and text.strip():
            for line in text.splitlines():
                line = line.strip()
                if line:
                    self._logger.log(self._level, line)

    def flush(self):
        pass

    def isatty(self):
        return False


log = _setup_logging()

# --- Port Lock / Instance Detection ---
PORT = 8000
HOST = "127.0.0.1"
PID_FILE = _get_data_dir() / "rangen.pid"


def _check_port_available(host: str, port: int) -> bool:
    """Check if a port is available on the given host."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return True
        except OSError:
            return False


def _write_pid_file():
    """Write current process PID to the marker file."""
    try:
        _get_data_dir()  # ensure dir exists
        PID_FILE.write_text(str(os.getpid()))
    except Exception as e:
        log.warning("Could not write PID file: %s", e)


def _remove_pid_file():
    """Remove the PID marker file."""
    try:
        if PID_FILE.exists():
            PID_FILE.unlink()
    except Exception:
        pass


def _detect_instance() -> bool:
    """Check if another RanGen instance may already be running.
    Returns True if an existing instance is detected."""
    if not _check_port_available(HOST, PORT):
        log.warning("Port %s:%d is already in use — possible existing instance.", HOST, PORT)
        return True

    if PID_FILE.exists():
        try:
            pid = int(PID_FILE.read_text().strip())
            # Check if process still exists (signal 0 on Windows is not available,
            # but we already checked the port — if port was free, old PID is stale)
            log.info("Stale PID file found (port is free), cleaning up.")
            _remove_pid_file()
        except (ValueError, OSError):
            _remove_pid_file()
    return False


def get_base_path():
    """Get the base path for resources, handling both dev and PyInstaller frozen mode."""
    if getattr(sys, "frozen", False):
        return sys._MEIPASS
    else:
        return os.path.dirname(os.path.abspath(__file__))


if __name__ == "__main__":
    base_path = get_base_path()
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Add paths to sys.path for module imports
    if getattr(sys, "frozen", False):
        if base_path not in sys.path:
            sys.path.insert(0, base_path)
        log.info("Running in frozen mode. Base path: %s", base_path)
    else:
        project_root = os.path.dirname(current_dir)
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        log.info("Running in development mode. Project root: %s", project_root)

    # Instance detection: warn if port is already taken
    _detect_instance()

    log.info("Starting RanGen Backend Server...")
    _write_pid_file()

    try:
        from app.main import app as application
        uvicorn.run(application, host=HOST, port=PORT, reload=False, workers=1)
    finally:
        _remove_pid_file()
