const assert = require('node:assert/strict');

function validateSource({ stage, sha, ref, actor }) {
  assert.match(sha, /^[a-f0-9]{40}$/, 'Indicar o SHA completo da release');
  const production = stage.startsWith('production-');
  assert.ok(['beta-build', 'beta-upload-qa', 'beta-distribution-review',
    'production-build', 'production-upload'].includes(stage), 'Etapa inválida');
  assert.ok(production ? ref === 'refs/heads/main'
    : ref === 'refs/heads/develop', 'Ref incompatível com o ambiente');
  if (production) assert.notEqual(actor, 'RxposoT',
    'Produção requer ator distinto de Tomas para permitir a revisão independente');
  return { production, branch: production ? 'main' : 'develop',
    environment: production ? 'production' : 'staging',
    profile: production ? 'production' : 'beta' };
}

function validateEnvironment(environment, production) {
  assert.ok(environment?.name, 'Criar o GitHub environment antes da release');
  if (production) {
    const rules = environment.protection_rules?.filter(rule => rule.type === 'required_reviewers') || [];
    assert.equal(rules.length, 1, 'Exigir uma regra de reviewers de produção');
    assert.equal(rules[0].prevent_self_review, true, 'Bloquear self review');
    assert.deepEqual(rules[0].reviewers.map(entry => [entry.type, entry.reviewer?.login]),
      [['User', 'RxposoT']], 'Tomas deve ser o único reviewer elegível');
    assert.equal(environment.can_admins_bypass, false, 'Bloquear bypass administrativo');
  }
}

async function verifyCandidate(github, context, inputs) {
  const target = validateSource({ ...inputs, ref: context.ref, actor: context.actor });
  const repo = context.repo;
  const branch = await github.rest.repos.getBranch({ ...repo, branch: target.branch });
  assert.equal(branch.data.commit.sha, inputs.sha, 'Candidato deve ser o HEAD integrado');
  assert.equal(context.sha, inputs.sha, 'Executar o workflow no SHA candidato');
  const environment = await github.request('GET /repos/{owner}/{repo}/environments/{environment_name}',
    { ...repo, environment_name: target.environment });
  validateEnvironment(environment.data, target.production);
  for (const [workflow, jobName] of [['ci.yml', 'CI Gate'],
    ['governance.yml', 'Workflow Governance']]) {
    const runs = await github.rest.actions.listWorkflowRuns({ ...repo,
      workflow_id: workflow, head_sha: inputs.sha, event: 'push', per_page: 100 });
    const run = runs.data.workflow_runs.find(item => item.head_branch === target.branch);
    assert.ok(run, `Exigir ${workflow} de push aprovado no SHA integrado`);
    assert.equal(run.status, 'completed', `Aguardar ${workflow}`);
    assert.equal(run.conclusion, 'success', `A última execução ${workflow} tem de passar`);
    const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun,
      { ...repo, run_id: run.id, filter: 'latest', per_page: 100 });
    assert.ok(jobs.some(job => job.name === jobName && job.conclusion === 'success'),
      `${jobName} tem de estar aprovado`);
  }
  return target;
}

function configureBuild(config, env, profile) {
  assert.ok(['beta', 'production'].includes(profile), 'Perfil remoto inválido');
  const production = profile === 'production';
  assert.equal(env.RELEASE_INFRA_READY, 'true', 'Validar infraestrutura antes do build');
  const backend = new URL(env.EXPO_PUBLIC_BACKEND_URL);
  const supabase = new URL(env.EXPO_PUBLIC_SUPABASE_URL);
  assert.equal(backend.protocol, 'https:', 'Backend remoto requer HTTPS');
  assert.equal(supabase.protocol, 'https:', 'Supabase remoto requer HTTPS');
  const productionBackend = new URL(env.PRODUCTION_BACKEND_URL);
  const productionSupabase = new URL(env.PRODUCTION_SUPABASE_URL);
  assert.equal(backend.origin === productionBackend.origin, production,
    'Backend incompatível com o ambiente');
  assert.equal(supabase.origin === productionSupabase.origin, production,
    'Supabase incompatível com o ambiente');
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!key.startsWith('sb_publishable_')) {
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); }
    catch { throw new Error('Fornecer chave pública Supabase válida'); }
    assert.equal(payload.role, 'anon', 'A app aceita apenas a chave pública anon');
  }
  assert.ok(env.IOS_BUNDLE_IDENTIFIER, 'Definir bundle identifier validado com Apple');
  assert.match(env.ASC_APP_ID || '', /^\d+$/, 'Definir ID Apple antes do build');
  config.build[profile].env = { ...config.build[profile].env,
    EXPO_PUBLIC_BACKEND_URL: backend.href.replace(/\/$/, ''),
    EXPO_PUBLIC_SUPABASE_URL: supabase.href.replace(/\/$/, ''),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    EXPO_PUBLIC_POSTHOG_HOST: env.EXPO_PUBLIC_POSTHOG_HOST || '',
    EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN: env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN || '' };
  return config;
}

function validateBuild(build, expected, buildId) {
  if (Array.isArray(build)) {
    assert.equal(build.length, 1, 'Exigir um único build iOS');
    [build] = build;
  }
  assert.equal(build.platform, 'IOS', 'Build deve ser iOS');
  assert.equal(build.status, 'FINISHED', 'Build deve estar concluído');
  assert.equal(build.gitCommitHash, expected.sourceSha, 'Build pertence a outro SHA');
  assert.equal(build.buildProfile, expected.profile, 'Build pertence a outro perfil');
  assert.equal(build.app?.id, expected.projectId, 'Build pertence a outro projeto EAS');
  assert.equal(build.appIdentifier, expected.bundleIdentifier, 'Build pertence a outro bundle');
  assert.equal(build.distribution, 'STORE', 'Exigir distribuição App Store');
  assert.equal(build.isForIosSimulator, false, 'Exigir build para dispositivo');
  assert.match(build.id || '', /^[a-f0-9-]{36}$/, 'ID EAS inválido');
  if (buildId) assert.equal(build.id, buildId, 'ID EAS diferente do pedido');
  return build;
}

module.exports = { validateSource, validateEnvironment, verifyCandidate, configureBuild, validateBuild };
