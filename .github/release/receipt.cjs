const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { validateBuild } = require('./guard.cjs');

function expectation(config, app, env) {
  const profile = config.build[env.PROFILE];
  assert.equal(profile.distribution, 'store');
  const projectId = app.expo.extra?.eas?.projectId;
  assert.ok(projectId, 'Definir o projeto EAS');
  const publicConfig = Object.fromEntries(Object.entries(profile.env).sort(([a], [b]) => a.localeCompare(b)));
  const configFingerprint = createHash('sha256').update(JSON.stringify({
    app: app.expo, profile: { ...profile, env: publicConfig }, appleAppId: env.ASC_APP_ID,
  })).digest('hex');
  return { sourceSha: env.SOURCE_SHA, profile: env.PROFILE, projectId,
    bundleIdentifier: app.expo.ios.bundleIdentifier, distribution: 'STORE', configFingerprint };
}

function createReceipt(build, expected, run) {
  const verified = validateBuild(build, expected);
  return { version: 1, ...expected, buildId: verified.id, buildRunId: String(run.id),
    runAttempt: String(run.attempt), repository: run.repository, stage: `${expected.profile}-build` };
}

function validateReceipt(receipt, expected, request) {
  assert.equal(receipt.version, 1, 'Versão de recibo inválida');
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(receipt[key], value, `Recibo incompatível com ${key}`);
  }
  assert.equal(receipt.buildId, request.buildId, 'Build externo ao recibo');
  assert.equal(receipt.buildRunId, String(request.runId), 'Execução diferente do recibo');
  assert.equal(receipt.runAttempt, String(request.attempt), 'Tentativa diferente do recibo');
  assert.equal(receipt.repository, request.repository, 'Recibo de outro repositório');
  assert.equal(receipt.stage, `${expected.profile}-build`, 'Recibo exige etapa de build');
}

async function verifyBuildRun(github, context, request) {
  assert.match(String(request.runId), /^[1-9][0-9]*$/, 'Indicar execução de build GitHub');
  const repo = context.repo;
  const workflow = await github.rest.actions.getWorkflow({ ...repo, workflow_id: 'eas-build.yml' });
  const { data: run } = await github.rest.actions.getWorkflowRun({ ...repo, run_id: request.runId });
  assert.equal(run.workflow_id, workflow.data.id, 'Execução de outro workflow');
  assert.equal(run.head_repository?.full_name, `${repo.owner}/${repo.repo}`, 'Execução de outro repositório');
  assert.equal(run.head_sha, request.sha, 'Execução de outro SHA');
  assert.equal(run.head_branch, request.branch, 'Execução de outra branch');
  assert.equal(run.event, 'workflow_dispatch', 'Execução de outro evento');
  assert.equal(run.status, 'completed', 'Aguardar conclusão do build');
  assert.equal(run.conclusion, 'success', 'Build workflow tem de estar aprovado');
  const artifacts = await github.paginate(github.rest.actions.listWorkflowRunArtifacts,
    { ...repo, run_id: request.runId, per_page: 100 });
  const receipts = artifacts.filter(item => item.name === `ios-build-receipt-${request.sha}-${request.profile}`);
  assert.equal(receipts.length, 1, 'Exigir um recibo único da execução');
  assert.equal(receipts[0].expired, false, 'Recibo expirado');
  return { artifactId: receipts[0].id, runAttempt: run.run_attempt };
}

module.exports = { expectation, createReceipt, validateReceipt, verifyBuildRun };
