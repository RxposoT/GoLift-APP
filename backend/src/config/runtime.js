function validateRuntimeEnv(source) {
  const mode = source.APP_ENV;
  if (mode !== undefined && !['local', 'staging', 'production'].includes(mode)) {
    throw new Error('APP_ENV deve ser local, staging ou production');
  }
  const flag = source.NOTIFICATION_SCHEDULER_ENABLED;
  if (flag !== undefined && !['true', 'false'].includes(flag)) {
    throw new Error('NOTIFICATION_SCHEDULER_ENABLED deve ser true ou false');
  }
  const scheduler = flag === undefined ? mode === undefined || mode === 'production' : flag === 'true';
  const runtime = { APP_ENV: mode, NOTIFICATION_SCHEDULER_ENABLED: scheduler };
  if (mode !== 'staging') return runtime;

  const port = source.PORT || '3001';
  if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535');
  }
  function origin(key) {
    let url;
    try { url = new URL(source[key]); } catch {
      throw new Error(`${key} deve conter uma origem HTTPS`);
    }
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error(`${key} deve conter uma origem HTTPS`);
    }
    return url.origin;
  }
  const active = origin('SUPABASE_URL');
  const staging = origin('STAGING_SUPABASE_URL');
  const production = origin('PRODUCTION_SUPABASE_URL');
  if (active !== staging || staging === production) {
    throw new Error('SUPABASE_URL deve corresponder ao staging isolado de produção');
  }
  if (typeof source.SUPABASE_SERVICE_KEY !== 'string' || !source.SUPABASE_SERVICE_KEY.trim()) {
    throw new Error('SUPABASE_SERVICE_KEY é obrigatória em staging');
  }
  if (scheduler) throw new Error('NOTIFICATION_SCHEDULER_ENABLED deve ser false em staging');
  if (source.STRIPE_SECRET_KEY && !/^sk_test_.+/.test(source.STRIPE_SECRET_KEY)) {
    throw new Error('STRIPE_SECRET_KEY deve ser de teste em staging');
  }
  return { ...runtime, PORT: Number(port) };
}

module.exports = { validateRuntimeEnv };
