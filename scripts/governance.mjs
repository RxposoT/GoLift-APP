import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const conventional = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([a-z0-9][a-z0-9-]*\))?!?: .+/;
const protectedBranch = /^(main|develop|release\/.*)$/;
const generatedFile = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/;

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  const stderr = result.stderr || '';
  if (result.status !== 0 || /^\s*(?:error|fatal):/im.test(stderr)) {
    fail(`Git ${args[0]} failed (${result.signal || result.status}): ${stderr.trim()}`);
  }
  if (stderr) process.stderr.write(stderr);
  return result.stdout.trim();
}

function fail(message) {
  throw new Error(message);
}

export function assertDevelopmentWorktree() {
  const branch = git('branch', '--show-current');
  if (!branch || protectedBranch.test(branch)) {
    fail('Use a feature worktree. Commits on main, develop, release/* or detached HEAD are blocked.');
  }
  const root = git('rev-parse', '--show-toplevel');
  if (!statSync(path.join(root, '.git')).isFile()) {
    fail('Implementation requires a linked development worktree, not the reference checkout.');
  }
}

export function checkMessage(message) {
  const subject = message.split(/\r?\n/)[0];
  if (!conventional.test(subject)) fail('Use a Conventional Commit, for example fix(auth): validate session owner.');
}

function checkDiff(args, maxLines, maxFiles, label) {
  const output = git('diff', '--numstat', '-z', '--no-renames', ...args);
  checkStats(output, maxLines, maxFiles, label);
}

function checkStats(output, maxLines, maxFiles, label) {
  const records = output.split('\0').filter(Boolean);
  let lines = 0;
  const generated = [];
  const binary = [];
  for (const record of records) {
    const match = /^(\d+|-)\t(\d+|-)\t([\s\S]+)$/.exec(record);
    if (!match) fail('Cannot parse Git diff statistics.');
    const [, added, removed, filename] = match;
    if (generatedFile.test(filename)) generated.push(filename);
    else if (added === '-') binary.push(filename);
    else lines += Number(added) + Number(removed);
  }
  if (records.length > maxFiles || lines > maxLines) {
    fail(`${label} exceeds ${maxLines} manual changed lines / ${maxFiles} files (${lines} / ${records.length}). Split the task before committing.`);
  }
  if (generated.length) console.log(`Generated files require review: ${generated.join(', ')}`);
  if (binary.length) console.log(`Binary assets require explicit review: ${binary.join(', ')}`);
  console.log(`${label}: ${lines} manual changed lines, ${records.length} files.`);
}

export function checkStaged() {
  assertDevelopmentWorktree();
  checkDiff(['--cached'], 300, 10, 'Commit');
}

export function checkRange(base, head, target, source) {
  if (!base || !head) fail('Provide base and head SHAs.');
  for (const sha of [base, head]) {
    if (!/^[a-f0-9]{40}$/.test(sha)) fail('Use full immutable commit SHAs.');
    git('cat-file', '-e', `${sha}^{commit}`);
  }
  const promotion = target === 'main' && /^release\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source || '');
  const hotfix = target === 'main' && /^hotfix\/GL-[A-Z0-9-]+-[a-z0-9-]+$/i.test(source || '');
  if (!['develop', 'main'].includes(target)) fail('PR target must be develop or main.');
  if (target === 'main' && !promotion && !hotfix) fail('main accepts release/* or hotfix/* PRs only.');
  if (promotion) {
    git('merge-base', '--is-ancestor', head, 'refs/remotes/origin/develop');
  }
  if (target === 'develop' && !/^(feat|fix|docs|chore|refactor|test|ci|perf|build|hotfix)\/GL-[A-Z0-9-]+-[a-z0-9-]+$/i.test(source || '')) {
    fail('Feature PRs require a task branch, for example fix/GL-003A-session-owner.');
  }
  const ancestor = git('merge-base', base, head);
  const commits = git('rev-list', '--reverse', `${base}..${head}`).split(/\r?\n/).filter(Boolean);
  for (const sha of commits) {
    const parents = git('rev-list', '--parents', '-n', '1', sha).split(' ').slice(1);
    if (parents.length > 1) {
      if (parents.length !== 2) fail('Octopus merges are not supported.');
      const resolution = git('show', '--format=', '--remerge-diff', '--numstat', '-z', sha);
      checkStats(resolution, 300, 10, `Merge resolution ${sha.slice(0, 8)}`);
      continue;
    }
    checkMessage(git('show', '-s', '--format=%B', sha));
    const diffArgs = parents.length ? [parents[0], sha] : ['--root', sha];
    if (!parents.length) fail('Unexpected root commit in the PR range.');
    checkDiff(diffArgs, 300, 10, `Commit ${sha.slice(0, 8)}`);
  }
  if (promotion) console.log('Release promotion: aggregate PR size exempt. A0 and owner release approval required.');
  else checkDiff([ancestor, head], 500, 15, 'PR');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'staged') checkStaged();
    else if (command === 'message') checkMessage(readFileSync(args[0], 'utf8'));
    else if (command === 'range') checkRange(...args);
    else fail('Usage: node scripts/governance.mjs staged | message <file> | range <base-sha> <head-sha> <target> <source>');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
