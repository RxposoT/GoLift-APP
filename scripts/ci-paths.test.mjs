import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDatabaseReadiness, assertQualityResults, detectDatabaseChanged, selectChecks } from './ci-paths.mjs';

test('SQL anywhere and Supabase code or configuration require the blocked database check', () => {
  for (const file of ['migration.sql', 'app/query.SQL', 'database/schema.sql',
    'database/settings.json', 'supabase/config.toml', 'supabase/functions/send-push/index.ts']) {
    assert.equal(detectDatabaseChanged([file]), true, file);
    assert.equal(selectChecks([file]).database, true, file);
    assert.throws(assertDatabaseReadiness, /GL-005A.*https:\/\/github.com\/RxposoT\/GoLift-APP\/issues\/17/);
  }
});

test('Markdown-only changes including database and Supabase documentation skip quality jobs', () => {
  const files = ['README.md', 'database/README.md', 'supabase/functions/notes.MD'];
  assert.deepEqual(selectChecks(files), { app: false, backend: false, database: false });
});

test('unknown code keeps app and backend checks without implying database validation', () => {
  assert.deepEqual(selectChecks(['shared/helper.js']), { app: true, backend: true, database: false });
  assert.deepEqual(selectChecks(['app/src/index.ts']), { app: true, backend: false, database: false });
  assert.deepEqual(selectChecks(['backend/server.js']), { app: false, backend: true, database: false });
});

test('main full checks keep database applicability tied to the actual changed paths', () => {
  for (const files of [[], ['README.md'], ['app/src/index.ts']]) {
    assert.deepEqual(selectChecks(files, true), { app: true, backend: true, database: false });
  }
  assert.deepEqual(selectChecks(['supabase/config.toml'], true),
    { app: true, backend: true, database: true });
});

test('deleted SQL and SQL renamed into Markdown still require database readiness', () => {
  assert.equal(selectChecks(['database/deleted.sql']).database, true);
  assert.equal(selectChecks(['schema.sql', 'docs/schema.md']).database, true);
});

test('dedicated governance and release paths retain their existing quality selection', () => {
  assert.deepEqual(selectChecks(['scripts/governance.mjs', '.github/release/guard.cjs']),
    { app: false, backend: false, database: false });
  assert.deepEqual(selectChecks(['app/eas.json']), { app: true, backend: false, database: false });
});

test('CI Gate rejects a failed or skipped required database check and permits legitimate skips', () => {
  const passed = { CHANGES_RESULT: 'success', APP_REQUIRED: 'true', APP_RESULT: 'success',
    BACKEND_REQUIRED: 'true', BACKEND_RESULT: 'success',
    DATABASE_REQUIRED: 'false', DATABASE_RESULT: 'skipped' };
  assert.doesNotThrow(() => assertQualityResults(passed));
  assert.doesNotThrow(() => assertQualityResults({ ...passed,
    APP_REQUIRED: 'false', APP_RESULT: 'skipped', BACKEND_REQUIRED: 'false', BACKEND_RESULT: 'skipped' }));
  for (const result of ['failure', 'skipped', 'cancelled']) {
    assert.throws(() => assertQualityResults({ ...passed,
      DATABASE_REQUIRED: 'true', DATABASE_RESULT: result }), /DATABASE expected success/);
  }
  assert.throws(() => assertQualityResults({ ...passed, CHANGES_RESULT: 'failure' }), /Change detection/);
  assert.throws(() => assertQualityResults({ ...passed, DATABASE_REQUIRED: '' }), /DATABASE has no valid/);
  assert.throws(() => assertQualityResults({ ...passed, APP_RESULT: 'failure' }), /APP expected success/);
});
