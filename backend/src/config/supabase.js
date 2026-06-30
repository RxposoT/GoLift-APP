// Configuração do cliente Supabase com permissões de administrador (service_role)
// Este cliente ignora Row Level Security (RLS) — toda a autorização é feita manualmente
// É usado para: verificar JWTs, ler/escrever em todas as tabelas, gerir subscrições

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('./env');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

module.exports = supabaseAdmin;
