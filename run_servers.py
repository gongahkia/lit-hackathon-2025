import subprocess
import sys
import time

# Adjust these as needed
BACKEND_COMMAND = [sys.executable, "backend.py"]  # or "app.py"
FRONTEND_COMMAND = ["npm", "run", "dev"]  # or "yarn start" if you use Yarn
FRONTEND_PATH = "."

# Start the backend
backend_proc = subprocess.Popen(BACKEND_COMMAND)
print("Flask backend started.")

# Optionally, wait a bit to ensure backend is ready
time.sleep(3)

# Start the frontend
frontend_proc = subprocess.Popen(FRONTEND_COMMAND, cwd=FRONTEND_PATH)
print("React frontend started.")

try:
    backend_proc.wait()
    frontend_proc.wait()
except KeyboardInterrupt:
    print("Shutting down...")
    backend_proc.terminate()
    frontend_proc.terminate()