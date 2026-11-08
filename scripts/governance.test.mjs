import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));

function fixture(t) {
  const folder = mkdtempSync(path.join(os.tmpdir(), 'golift-governance-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const root = path.join(folder, 'repo');
  const worktree = path.join(folder, 'feature');
  mkdirSync(root);
  function git(cwd, ...args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  }
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'GoLift Fixture');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  cpSync(source, path.join(root, 'scripts'), { recursive: true });
  cpSync(path.join(source, '..', '.githooks'), path.join(root, '.githooks'), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'chore(test): create fixture');
  const base = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/develop', base);
  git(root, 'worktree', 'add', '-b', 'feat/GL-TEST-example', worktree);
  return {
    root, worktree, base,
    git: (...args) => git(worktree, ...args),
    run: (command, args = [], cwd = worktree) => spawnSync(process.execPath,
      [path.join(source, 'governance.mjs'), command, ...args], { cwd, encoding: 'utf8' }),
    write: (name, lines = 1) => writeFileSync(path.join(worktree, name), 'line\n'.repeat(lines)),
    commit(message) { git(worktree, 'add', '.'); git(worktree, 'commit', '-m', message); },
  };
}

function rejected(result, pattern) {
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, pattern);
}

test('linked feature accepts small staged changes and Conventional Commits', t => {
  const f = fixture(t);
  f.write('feature.txt', 10);
  f.git('add', 'feature.txt');
  assert.equal(f.run('staged').status, 0);
  f.commit('feat(workout): save session');
  assert.equal(f.run('range', [f.base, f.git('rev-parse', 'HEAD'), 'develop', 'feat/GL-TEST-example']).status, 0);
});

test('protected branches, detached HEAD and reference checkout reject commits', t => {
  const f = fixture(t);
  rejected(f.run('staged', [], f.root), /main, develop/);
  for (const branch of ['develop', 'release/0.1.0']) {
    f.git('switch', '-c', branch);
    rejected(f.run('staged'), /blocked/);
  }
  f.git('switch', '--detach');
  rejected(f.run('staged'), /blocked/);
  f.git('switch', '-c', 'chore/GL-TEST-safe');
  // The main checkout is still refused even on an ordinary feature branch.
  execFileSync('git', ['switch', '-c', 'feat/GL-ROOT-example'], { cwd: f.root, stdio: 'pipe' });
  rejected(f.run('staged', [], f.root), /reference checkout/);
});

test('message and commit size limits reject invalid changes', t => {
  const f = fixture(t);
  f.write('message.txt');
  rejected(f.run('message', ['message.txt']), /Conventional Commit/);
  f.write('large.txt', 301);
  f.git('add', 'large.txt');
  rejected(f.run('staged'), /300 manual/);
});

test('commit file count includes generated files', t => {
  const f = fixture(t);
  for (let i = 0; i < 11; i++) f.write(`file-${i}.txt`);
  f.git('add', '.');
  rejected(f.run('staged'), /10 files/);
});

test('lockfiles report explicit review and do not inflate manual lines', t => {
  const f = fixture(t);
  f.write('package-lock.json', 1000);
  f.git('add', '.');
  const result = f.run('staged');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated files require review/);
});

test('PR aggregate limit catches several individually small commits', t => {
  const f = fixture(t);
  f.write('one.txt', 260);
  f.commit('feat(workout): add first slice');
  f.write('two.txt', 260);
  f.commit('feat(workout): add second slice');
  const head = f.git('rev-parse', 'HEAD');
  f.git('update-ref', 'refs/remotes/origin/develop', head);
  rejected(f.run('range', [f.base, head, 'develop', 'feat/GL-TEST-example']), /PR exceeds 500/);
  assert.equal(f.run('range', [f.base, head, 'main', 'release/0.1.0']).status, 0);
});

test('remote range catches oversized or malformed commits despite bypassed hooks', t => {
  const f = fixture(t);
  f.write('oversized.txt', 301);
  f.commit('feat(workout): oversized change');
  f.git('update-ref', 'refs/remotes/origin/develop', f.git('rev-parse', 'HEAD'));
  rejected(f.run('range', [f.base, f.git('rev-parse', 'HEAD'), 'main', 'release/0.1.0']), /300 manual/);
  f.git('reset', '--soft', f.base);
  f.commit('updates');
  rejected(f.run('range', [f.base, f.git('rev-parse', 'HEAD'), 'develop', 'feat/GL-TEST-example']), /Conventional Commit/);
});

test('PRs into main require release or hotfix branch', t => {
  const f = fixture(t);
  rejected(f.run('range', [f.base, f.base, 'main', 'feat/GL-TEST-example']), /release/);
  rejected(f.run('range', [f.base, f.base, 'develop', 'misc']), /task branch/);
});

test('worktree helper rejects unsafe paths and reused destinations', t => {
  const f = fixture(t);
  f.git('branch', 'develop');
  f.git('remote', 'add', 'origin', f.root);
  function helper(...args) {
    return spawnSync(process.execPath, [path.join(source, 'worktree.mjs'), ...args], { cwd: f.worktree, encoding: 'utf8' });
  }
  assert.equal(helper('create', '../escape', 'fix', 'example').status, 1);
  assert.equal(helper('create', 'GL-NEW', 'fix', '../escape').status, 1);
  assert.equal(helper('create', 'GL-NEW', 'fix', 'example').status, 0);
  assert.equal(helper('create', 'GL-NEW', 'fix', 'example').status, 1);
});

test('installed hooks protect main even when that checkout has no scripts', t => {
  const f = fixture(t);
  execFileSync(process.execPath, [path.join(source, 'worktree.mjs'), 'hooks'], { cwd: f.worktree });
  assert.ok(path.isAbsolute(f.git('config', 'core.hooksPath')));
  rmSync(path.join(f.root, 'scripts'), { recursive: true });
  rmSync(path.join(f.root, '.githooks'), { recursive: true });
  writeFileSync(path.join(f.root, 'blocked.txt'), 'blocked');
  execFileSync('git', ['add', 'blocked.txt'], { cwd: f.root });
  const result = spawnSync('git', ['commit', '-m', 'fix(test): blocked'], { cwd: f.root, encoding: 'utf8' });
  rejected(result, /blocked/);
  f.write('allowed.txt');
  f.commit('fix(test): allowed feature');
});

test('release size exception requires a head already contained in develop', t => {
  const f = fixture(t);
  f.write('unreviewed.txt');
  f.commit('feat(test): unreviewed release');
  assert.equal(f.run('range', [f.base, f.git('rev-parse', 'HEAD'), 'main', 'release/0.1.0']).status, 1);
});

test('merge content added outside the automatic merge is subject to commit limits', t => {
  const f = fixture(t);
  f.git('switch', '-c', 'feat/GL-OTHER-example');
  f.write('other.txt');
  f.commit('feat(test): other feature');
  f.git('switch', 'feat/GL-TEST-example');
  f.write('feature.txt');
  f.commit('feat(test): feature');
  f.git('merge', '--no-commit', '--no-ff', 'feat/GL-OTHER-example');
  f.write('hidden.txt', 301);
  f.commit('chore(test): merge features');
  rejected(f.run('range', [f.base, f.git('rev-parse', 'HEAD'), 'develop', 'feat/GL-TEST-example']), /Merge resolution.*exceeds 300/);
});

test('Git error diagnostics fail closed even with status zero, while warnings remain allowed', t => {
  const f = fixture(t);
  f.git('switch', '-c', 'feat/GL-OTHER-example');
  f.write('other.txt');
  f.commit('feat(test): other feature');
  f.git('switch', 'feat/GL-TEST-example');
  f.write('feature.txt');
  f.commit('feat(test): feature');
  f.git('merge', '--no-ff', 'feat/GL-OTHER-example', '-m', 'chore(test): merge features');
  const head = f.git('rev-parse', 'HEAD');
  const preload = path.join(path.dirname(f.root), 'fake-git.mjs');
  for (const diagnostic of [
    'error: unable to create temporary object directory\n',
    'warning: preceding diagnostic\nfatal: cannot read merge objects\n',
    'warning: legitimate message containing error: as ordinary text\n',
  ]) {
    writeFileSync(preload, `
      import childProcess from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      const original = childProcess.spawnSync;
      childProcess.spawnSync = (command, args, options) => {
        if (command === 'git' && args.includes('--remerge-diff')) {
          return { status: 0, signal: null, stdout: '', stderr: ${JSON.stringify(diagnostic)} };
        }
        return original(command, args, options);
      };
      syncBuiltinESMExports();
    `);
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href,
      path.join(source, 'governance.mjs'), 'range', f.base, head,
      'develop', 'feat/GL-TEST-example'], { cwd: f.worktree, encoding: 'utf8' });
    if (/^(?:error|fatal):/m.test(diagnostic)) rejected(result, /Git show failed/);
    else assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stderr.includes(diagnostic.trim()), result.stderr);
  }
});
