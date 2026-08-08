import { spawn } from 'node:child_process';
import process from 'node:process';

const children = [
  spawn(process.execPath, ['server.mjs'], { cwd: process.cwd(), stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd: process.cwd(), stdio: 'inherit' }),
];

let closing = false;

function close(exitCode = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    close(1);
  });
  child.on('exit', (code, signal) => {
    if (!closing) close(code ?? (signal ? 1 : 0));
  });
}

process.on('SIGINT', () => close(0));
process.on('SIGTERM', () => close(0));
