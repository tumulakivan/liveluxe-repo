// Runs the API and the web dev server together. On exit it kills both whole
// process trees, which `pnpm --parallel` doesn't do on Windows.
import { spawn, spawnSync } from 'node:child_process';

const children = [
  ['api', ['--filter', '@repo/api', 'dev']],
  ['web', ['--filter', '@repo/web', 'dev']],
].map(([name, args]) => {
  const child = spawn('pnpm', args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  const prefix = (chunk) =>
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `[${name}] ${line}`)
      .join('\n') + '\n';
  child.stdout.on('data', (c) => process.stdout.write(prefix(c)));
  child.stderr.on('data', (c) => process.stderr.write(prefix(c)));
  child.on('exit', (code) => {
    console.log(`[${name}] exited (${code})`);
    stop(code ?? 1);
  });
  return child;
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
