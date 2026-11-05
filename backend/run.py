"""
Sevencore AI - Safe Backend Runner
Automatically ensures port 8000 is clean and launches Uvicorn with reload.
"""
import os
import sys
import subprocess
import time

PORT = 8000

def free_port(port: int = PORT):
    try:
        current_pid = os.getpid()
        out = subprocess.check_output(["lsof", "-ti", f":{port}"], text=True, stderr=subprocess.DEVNULL).strip()
        if out:
            pids = [int(p) for p in out.split() if p.isdigit() and int(p) != current_pid]
            if pids:
                print(f"[Sevencore] Stale process on port {port} (PIDs: {pids}). Freeing port...")
                for p in pids:
                    try:
                        os.kill(p, 9)
                    except OSError:
                        pass
                time.sleep(0.4)
                print(f"[Sevencore] Port {port} is now clean.")
    except Exception:
        pass

if __name__ == "__main__":
    free_port(PORT)
    import uvicorn
    print(f"Starting Sevencore AI Backend on http://127.0.0.1:{PORT}...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=PORT, reload=True)

