const { test } = require('node:test');
const assert = require('node:assert/strict');
const guard = require('./guard.cjs');
const sha = 'a'.repeat(40);
const productionEnvironment = { name: 'production', can_admins_bypass: false, protection_rules: [
  { type: 'required_reviewers', prevent_self_review: true,
    reviewers: [{ type: 'User', reviewer: { login: 'RxposoT' } }] },
] };

test('beta usa develop e produção requer main com ator distinto do reviewer', () => {
  assert.equal(guard.validateSource({ stage: 'beta-build', sha,
    ref: 'refs/heads/develop' }).environment, 'staging');
  for (const ref of ['refs/heads/main']) {
    assert.equal(guard.validateSource({ stage: 'production-build', sha, ref,
      actor: 'release-bot' }).environment, 'production');
  }
  assert.throws(() => guard.validateSource({ stage: 'beta-build', sha, ref: 'refs/heads/main' }));
  assert.throws(() => guard.validateSource({ stage: 'production-build', sha,
    ref: 'refs/heads/main', actor: 'RxposoT' }));
  assert.throws(() => guard.validateSource({ stage: 'beta-build', sha: 'short',
    ref: 'refs/heads/develop' }));
});

test('environment ausente ou produção sem reviewer falha', () => {
  guard.validateEnvironment(productionEnvironment, true);
  assert.throws(() => guard.validateEnvironment(null, false));
  assert.throws(() => guard.validateEnvironment({ name: 'production' }, true));
  assert.throws(() => guard.validateEnvironment({ name: 'production', protection_rules: [
    { ...productionEnvironment.protection_rules[0], prevent_self_review: false },
  ] }, true));
  assert.throws(() => guard.validateEnvironment({ ...productionEnvironment, can_admins_bypass: true }, true));
  assert.throws(() => guard.validateEnvironment({ ...productionEnvironment, protection_rules: [{
    ...productionEnvironment.protection_rules[0], reviewers: [
      ...productionEnvironment.protection_rules[0].reviewers,
      { type: 'User', reviewer: { login: 'other' } },
    ],
  }] }, true));
});

test('build deve corresponder a SHA, perfil e plataforma concluídos', () => {
  const expected = { sourceSha: sha, profile: 'beta', projectId: 'project', bundleIdentifier: 'com.example.beta' };
  const build = { id: 'a'.repeat(36), platform: 'IOS', status: 'FINISHED', gitCommitHash: sha,
    buildProfile: 'beta', app: { id: 'project' }, appIdentifier: 'com.example.beta',
    distribution: 'STORE', isForIosSimulator: false };
  guard.validateBuild(build, expected);
  guard.validateBuild([build], expected);
  assert.throws(() => guard.validateBuild([], expected));
  assert.throws(() => guard.validateBuild([build, build], expected));
  for (const change of [{ platform: 'ANDROID' }, { status: 'ERRORED' },
    { gitCommitHash: 'b'.repeat(40) }, { buildProfile: 'production' }, { app: { id: 'other' } },
    { appIdentifier: 'com.other' }, { distribution: 'INTERNAL' }, { isForIosSimulator: true }]) {
    assert.throws(() => guard.validateBuild({ ...build, ...change }, expected));
  }
});

test('config remota exige infraestrutura e isola backend/Supabase', () => {
  const env = { RELEASE_INFRA_READY: 'true', IOS_BUNDLE_IDENTIFIER: 'com.example.beta', ASC_APP_ID: '123',
    EXPO_PUBLIC_BACKEND_URL: 'https://staging.example.com',
    EXPO_PUBLIC_SUPABASE_URL: 'https://staging.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_example',
    PRODUCTION_BACKEND_URL: 'https://production.example.com',
    PRODUCTION_SUPABASE_URL: 'https://production.supabase.co' };
  const config = { build: { beta: { env: {} } } };
  assert.throws(() => guard.configureBuild(config, env, 'development'));
  assert.equal(guard.configureBuild(config, env, 'beta').build.beta.env.EXPO_PUBLIC_BACKEND_URL,
    'https://staging.example.com');
  for (const change of [{ RELEASE_INFRA_READY: '' },
    { EXPO_PUBLIC_BACKEND_URL: env.PRODUCTION_BACKEND_URL },
    { EXPO_PUBLIC_SUPABASE_URL: env.PRODUCTION_SUPABASE_URL },
    { EXPO_PUBLIC_SUPABASE_ANON_KEY: 'service-role-secret' }]) {
    assert.throws(() => guard.configureBuild(config, { ...env, ...change }, 'beta'));
  }
});

test('candidato exige CI push no HEAD integrado e CI Gate aprovado', async () => {
  const makeClient = (changes = {}) => ({
    request: async () => ({ data: { name: 'staging' } }),
    paginate: async (method, options) => [{
      name: options.run_id === 'ci.yml' ? 'CI Gate' : 'Workflow Governance',
      conclusion: options.run_id === 'ci.yml' ? changes.gate || 'success'
        : changes.governance || 'success',
    }],
    rest: {
      repos: { getBranch: async () => ({ data: { commit: { sha: changes.sha || sha } } }) },
      actions: {
        listWorkflowRuns: async (options) => ({ data: { workflow_runs: changes.runs || [
          { id: options.workflow_id, head_branch: 'develop', status: 'completed', conclusion: 'success' },
        ] } }),
        listJobsForWorkflowRun() {},
      },
    },
  });
  const context = { ref: 'refs/heads/develop', sha, actor: 'RxposoT',
    repo: { owner: 'RxposoT', repo: 'GoLift-APP' } };
  const inputs = { stage: 'beta-build', sha };
  assert.equal((await guard.verifyCandidate(makeClient(), context, inputs)).profile, 'beta');
  for (const changes of [{ sha: 'b'.repeat(40) }, { runs: [] },
    { gate: 'failure' }, { governance: 'failure' }, { runs: [
      { head_branch: 'develop', status: 'completed', conclusion: 'failure' },
      { head_branch: 'develop', status: 'completed', conclusion: 'success' },
    ] }]) {
    await assert.rejects(guard.verifyCandidate(makeClient(changes), context, inputs));
  }
  await assert.rejects(guard.verifyCandidate(makeClient(), { ...context, sha: 'b'.repeat(40) }, inputs));
});
