/**
 * Auto-Port Cleaner for Sevencore AI Frontend
 * Automatically frees port 3000 before Next.js starts up, preventing EADDRINUSE errors.
 */
const { execSync } = require('child_process');

try {
  const currentPid = process.pid;
  const pidsRaw = execSync('lsof -ti :3000', { encoding: 'utf8' }).trim();
  if (pidsRaw) {
    const pids = pidsRaw
      .split('\n')
      .map((p) => Number(p.trim()))
      .filter((p) => p && p !== currentPid);
    if (pids.length > 0) {
      console.log(`[Sevencore Auto-Port] Stale process on port 3000 (PIDs: ${pids.join(', ')}). Freeing port...`);
      pids.forEach((p) => {
        try {
          process.kill(p, 'SIGKILL');
        } catch (_) {}
      });
      console.log('[Sevencore Auto-Port] Port 3000 is clean.');
    }
  }
} catch (_) {
  // Port is already free
}

