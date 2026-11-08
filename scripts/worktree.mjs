import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, mkdirSync, copyFileSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] }).trim();
}

try {
  const [command, task, kind, slug] = process.argv.slice(2);
  if (command === 'hooks') {
    const common = git('rev-parse', '--path-format=absolute', '--git-common-dir');
    const installed = path.join(common, 'golift-hooks');
    const scripts = path.dirname(fileURLToPath(import.meta.url));
    mkdirSync(installed, { recursive: true });
    copyFileSync(path.join(scripts, 'governance.mjs'), path.join(installed, 'governance.mjs'));
    for (const hook of ['pre-commit', 'commit-msg']) {
      copyFileSync(path.join(scripts, '..', '.githooks', hook), path.join(installed, hook));
      chmodSync(path.join(installed, hook), 0o755);
    }
    git('config', '--local', 'core.hooksPath', installed.replaceAll('\\', '/'));
    console.log('Hooks enabled for this repository and its worktrees.');
  } else if (command === 'create') {
    if (!/^GL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(task || '') ||
        !/^(feat|fix|docs|chore|refactor|test|ci|perf|build)$/.test(kind || '') ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) {
      throw new Error('Usage: node scripts/worktree.mjs create GL-003A fix session-owner');
    }
    const common = git('rev-parse', '--path-format=absolute', '--git-common-dir');
    const root = path.dirname(common);
    if (path.basename(common) !== '.git') throw new Error('Use the standard GoLift reference clone.');
    const worktrees = path.resolve(root, '.worktrees');
    if (existsSync(worktrees) && path.relative(worktrees, realpathSync(worktrees)) !== '') {
      throw new Error('The .worktrees directory must not redirect to another location.');
    }
    const destination = path.resolve(worktrees, `${task}-${slug}`);
    if (path.dirname(destination) !== worktrees || existsSync(destination)) {
      throw new Error('Worktree path must be new and inside the repository .worktrees directory.');
    }
    const branch = `${kind}/${task}-${slug}`;
    git('fetch', 'origin', 'refs/heads/develop:refs/remotes/origin/develop');
    git('rev-parse', '--verify', 'refs/remotes/origin/develop^{commit}');
    git('worktree', 'add', '-b', branch, destination, 'origin/develop');
    console.log(`Created ${branch} at ${destination}. Read AGENTS.md before editing.`);
  } else {
    throw new Error('Usage: node scripts/worktree.mjs hooks | create <GL-task> <kind> <slug>');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
