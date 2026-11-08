const dedicatedChecks = new Set([
  'scripts/governance.mjs',
  'scripts/governance.test.mjs',
  'scripts/worktree.mjs',
  '.github/workflows/governance.yml',
  '.github/workflows/eas-build.yml',
  '.gitignore',
]);

export function detectDatabaseChanged(files) {
  return files.some(file => !/\.md$/i.test(file) &&
    (/\.sql$/i.test(file) || /^(database|supabase)\//i.test(file)));
}

export function selectChecks(files, fullChecks = false) {
  let app = fullChecks;
  let backend = fullChecks;
  for (const file of files) {
    if (/\.md$/i.test(file)) continue;
    if (dedicatedChecks.has(file) || file.startsWith('.githooks/') ||
        file.startsWith('.github/release/')) continue;
    if (file.startsWith('app/')) app = true;
    else if (file.startsWith('backend/')) backend = true;
    else app = backend = true;
  }
  return { app, backend, database: detectDatabaseChanged(files) };
}

export function assertDatabaseReadiness() {
  throw new Error('Database validation blocked. GL-005A must ratify the migration baseline ' +
    'and real database checks before SQL or Supabase changes can be integrated. ' +
    'https://github.com/RxposoT/GoLift-APP/issues/17');
}

export function assertQualityResults(results) {
  if (results.CHANGES_RESULT !== 'success') {
    throw new Error('Change detection did not succeed');
  }
  for (const scope of ['APP', 'BACKEND', 'DATABASE']) {
    const required = results[`${scope}_REQUIRED`];
    const result = results[`${scope}_RESULT`];
    if (!['true', 'false'].includes(required)) {
      throw new Error(`${scope} has no valid check requirement`);
    }
    const expected = required === 'true' ? 'success' : 'skipped';
    if (result !== expected) {
      throw new Error(`${scope} expected ${expected}, received ${result}`);
    }
  }
}
