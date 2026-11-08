const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expectation, createReceipt, validateReceipt, verifyBuildRun } = require('./receipt.cjs');
const sha = 'a'.repeat(40);
const buildId = 'a'.repeat(36);
const expected = { sourceSha: sha, profile: 'beta', projectId: 'project',
  bundleIdentifier: 'com.golift.beta', distribution: 'STORE', configFingerprint: 'fingerprint' };
const request = { buildId, runId: '12', attempt: '1', repository: 'RxposoT/GoLift-APP' };

test('recibo liga build, configuração, execução, tentativa e repositório', () => {
  const build = { id: buildId, platform: 'IOS', status: 'FINISHED', gitCommitHash: sha,
    buildProfile: 'beta', app: { id: 'project' }, appIdentifier: 'com.golift.beta',
    distribution: 'STORE', isForIosSimulator: false };
  const receipt = createReceipt(build, expected, { id: '12', attempt: '1', repository: request.repository });
  validateReceipt(receipt, expected, request);
  for (const change of [{ buildId: 'b'.repeat(36) }, { configFingerprint: 'other' },
    { buildRunId: '13' }, { runAttempt: '2' }, { repository: 'other/repo' },
    { stage: 'beta-upload-qa' }, { projectId: 'other' }, { sourceSha: 'b'.repeat(40) }]) {
    assert.throws(() => validateReceipt({ ...receipt, ...change }, expected, request));
  }
});

test('fingerprint inclui configuração pública, projeto, bundle e ID Apple', () => {
  const config = { build: { beta: { distribution: 'store', environment: 'preview', env: {
    EXPO_PUBLIC_BACKEND_URL: 'https://staging.example', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
  } } } };
  const app = { expo: { extra: { eas: { projectId: 'project' } }, ios: { bundleIdentifier: 'com.golift.beta' } } };
  const env = { PROFILE: 'beta', SOURCE_SHA: sha, ASC_APP_ID: '123' };
  const original = expectation(config, app, env);
  assert.notEqual(expectation(config, app, { ...env, ASC_APP_ID: '456' }).configFingerprint, original.configFingerprint);
  config.build.beta.env.EXPO_PUBLIC_BACKEND_URL = 'https://changed.example';
  assert.notEqual(expectation(config, app, env).configFingerprint, original.configFingerprint);
  assert.equal(JSON.stringify(original).includes('public-key'), false);
});

test('run aprovado exige workflow, repo, SHA, branch, evento e recibo único válido', async () => {
  const repo = { owner: 'RxposoT', repo: 'GoLift-APP' };
  const context = { repo };
  const run = { workflow_id: 7, head_repository: { full_name: request.repository },
    head_sha: sha, head_branch: 'develop', event: 'workflow_dispatch',
    status: 'completed', conclusion: 'success', run_attempt: 1 };
  const artifact = { id: 9, name: `ios-build-receipt-${sha}-beta`, expired: false };
  const client = (change = {}, artifacts = [artifact]) => ({
    paginate: async () => artifacts,
    rest: { actions: {
      getWorkflow: async () => ({ data: { id: 7 } }),
      getWorkflowRun: async () => ({ data: { ...run, ...change } }),
      listWorkflowRunArtifacts() {},
    } },
  });
  const input = { runId: '12', sha, branch: 'develop', profile: 'beta' };
  assert.deepEqual(await verifyBuildRun(client(), context, input), { artifactId: 9, runAttempt: 1 });
  for (const change of [{ workflow_id: 8 }, { head_sha: 'b'.repeat(40) },
    { head_branch: 'main' }, { event: 'pull_request' }, { status: 'in_progress' },
    { conclusion: 'failure' }, { head_repository: { full_name: 'other/repo' } }]) {
    await assert.rejects(verifyBuildRun(client(change), context, input));
  }
  for (const artifacts of [[], [artifact, artifact], [{ ...artifact, expired: true }]]) {
    await assert.rejects(verifyBuildRun(client({}, artifacts), context, input));
  }
});
