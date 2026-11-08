const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validateRuntimeEnv } = require('./runtime');

const valid = {
  APP_ENV: 'staging', PORT: '10000',
  SUPABASE_URL: 'https://staging.example.test',
  STAGING_SUPABASE_URL: 'https://staging.example.test',
  PRODUCTION_SUPABASE_URL: 'https://production.example.test',
  SUPABASE_SERVICE_KEY: 'synthetic-service-key',
  NOTIFICATION_SCHEDULER_ENABLED: 'false',
};
const envSource = fs.readFileSync(path.join(__dirname, 'env.js'), 'utf8');
const serverSource = fs.readFileSync(path.join(__dirname, '../../server.js'), 'utf8');

function loadEnv(source) {
  const module = { exports: {} };
  vm.runInNewContext(envSource, {
    module, process: { env: source }, console: { warn() {} },
    require(name) {
      if (name === 'dotenv') return { config() {} };
      assert.equal(name, './runtime');
      return { validateRuntimeEnv };
    },
  });
  return module.exports;
}

function startup(source, calls) {
  vm.runInNewContext(serverSource, {
    console: { log() {} },
    require(name) {
      calls.push(name);
      if (name === './src/config/env') return loadEnv(source);
      if (name === './src/app') return { listen(port, host, ready) {
        calls.push({ port, host }); ready();
      } };
      assert.equal(name, './src/services/notificationScheduler');
      return { startNotificationScheduler() { calls.push('timer-started'); } };
    },
  });
}

test('staging validates isolated origins and starts without Gemini or Stripe', () => {
  const env = loadEnv(valid);
  assert.equal(env.PORT, 10000);
  assert.equal(env.APP_ENV, 'staging');
  assert.equal(env.NOTIFICATION_SCHEDULER_ENABLED, false);
  assert.equal(env.GEMINI_API_KEY, undefined);
  assert.equal(env.STRIPE_SECRET_KEY, undefined);
  assert.equal(validateRuntimeEnv({ ...valid, STRIPE_SECRET_KEY: 'sk_test_synthetic' }).PORT, 10000);
  assert.equal(validateRuntimeEnv({ ...valid, PORT: undefined }).PORT, 3001);
});

test('staging rejects missing required fields and all production URL combinations', () => {
  for (const key of ['SUPABASE_URL', 'STAGING_SUPABASE_URL', 'PRODUCTION_SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) {
    assert.throws(() => loadEnv({ ...valid, [key]: undefined }), Error, key);
  }
  for (const source of [
    { ...valid, SUPABASE_URL: valid.PRODUCTION_SUPABASE_URL },
    { ...valid, STAGING_SUPABASE_URL: valid.PRODUCTION_SUPABASE_URL },
    { ...valid, SUPABASE_URL: 'https://another.example.test' },
  ]) assert.throws(() => loadEnv(source), /staging isolado/);
});

test('staging refuses invalid ports, origins and secret values without disclosing them', () => {
  for (const port of ['0', '-1', '65536', '1.2', 'named-pipe', 'Infinity']) {
    assert.throws(() => loadEnv({ ...valid, PORT: port }), /PORT/);
  }
  for (const key of ['SUPABASE_URL', 'STAGING_SUPABASE_URL', 'PRODUCTION_SUPABASE_URL']) {
    for (const url of ['http://example.test', 'https://user:secret@example.test', 'https://example.test/path', 'https://example.test/?token=secret']) {
      assert.throws(() => loadEnv({ ...valid, [key]: url }), error =>
        error.message.includes(key) && !error.message.includes('secret'));
    }
  }
  for (const key of ['sk_live_synthetic-private-value', 'wrong-private-value']) {
    assert.throws(() => loadEnv({ ...valid, STRIPE_SECRET_KEY: key }), error =>
      error.message.includes('STRIPE_SECRET_KEY') && !error.message.includes(key));
  }
});

test('invalid staging stops before importing the app or notification scheduler', () => {
  for (const change of [{ SUPABASE_SERVICE_KEY: '' }, { NOTIFICATION_SCHEDULER_ENABLED: 'true' },
    { SUPABASE_URL: valid.PRODUCTION_SUPABASE_URL }, { STRIPE_SECRET_KEY: 'sk_live_synthetic' }]) {
    const calls = [];
    assert.throws(() => startup({ ...valid, ...change }, calls));
    assert.deepEqual(calls, ['./src/config/env']);
  }
});

test('staging never imports or starts the scheduler and preserves the HTTP binding', () => {
  const calls = [];
  startup(valid, calls);
  assert.deepEqual(calls, ['./src/config/env', './src/app', { port: 10000, host: '0.0.0.0' }]);
});

test('legacy startup and explicit production preserve scheduler default while local disables it', () => {
  const calls = [];
  startup({}, calls);
  assert.ok(calls.includes('timer-started'));
  assert.equal(validateRuntimeEnv({ APP_ENV: 'production' }).NOTIFICATION_SCHEDULER_ENABLED, true);
  assert.equal(validateRuntimeEnv({ APP_ENV: 'local' }).NOTIFICATION_SCHEDULER_ENABLED, false);
  assert.equal(validateRuntimeEnv({}).NOTIFICATION_SCHEDULER_ENABLED, true);
  for (const source of [{ APP_ENV: '' }, { APP_ENV: 'stagng' }, { NOTIFICATION_SCHEDULER_ENABLED: 'yes' }]) {
    assert.throws(() => validateRuntimeEnv(source));
  }
});

test('health response remains the public liveness contract', () => {
  let body;
  require('../controllers/health.controller').getHealth({}, { json(value) { body = value; } });
  assert.deepEqual(body, { sucesso: true, mensagem: 'GoLift Backend v2 online' });
});
