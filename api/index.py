import sys
from pathlib import Path

# Add project root and backend directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for path_str in (str(BACKEND_DIR), str(ROOT_DIR)):
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# Import the FastAPI application from backend.main
from main import app
