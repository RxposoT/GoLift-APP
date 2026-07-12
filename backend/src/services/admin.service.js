const supabaseAdmin = require('../config/supabase');

async function getDashboardStats() {
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: premiumUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('plano', 'pago');

  const { count: totalWorkouts } = await supabaseAdmin
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true });

  const hoje = new Date().toISOString().split('T')[0];
  const { count: workoutsHoje } = await supabaseAdmin
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('data_inicio', hoje);

  const { count: totalPhrases } = await supabaseAdmin
    .from('daily_phrases')
    .select('*', { count: 'exact', head: true });

  return {
    total_utilizadores: totalUsers || 0,
    utilizadores_premium: premiumUsers || 0,
    total_treinos: totalWorkouts || 0,
    treinos_hoje: workoutsHoje || 0,
    total_frases: totalPhrases || 0,
  };
}

async function listUsers() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, nome, tipo, plano, plano_ativo_ate, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function updateUserTipo(userId, novoTipo) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ tipo: novoTipo })
    .eq('id', userId);

  if (error) throw error;
  return { sucesso: true };
}

async function deleteUser(userId) {
  // Remove registos associados antes de apagar o perfil
  await supabaseAdmin.from('workout_sessions').delete().eq('user_id', userId);
  await supabaseAdmin.from('weight_history').delete().eq('user_id', userId);
  await supabaseAdmin.from('daily_phrases').delete().eq('criado_por', userId);

  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return { sucesso: true };
}

async function listPhrases() {
  const { data, error } = await supabaseAdmin
    .from('daily_phrases')
    .select('*')
    .order('data', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createPhrase(data, frase, criadoPor) {
  const { error } = await supabaseAdmin
    .from('daily_phrases')
    .insert({ data, frase, criado_por: criadoPor });

  if (error) throw error;
  return { sucesso: true };
}

async function updatePhrase(id, frase) {
  const { error } = await supabaseAdmin
    .from('daily_phrases')
    .update({ frase })
    .eq('id', id);

  if (error) throw error;
  return { sucesso: true };
}

async function deletePhrase(id) {
  const { error } = await supabaseAdmin
    .from('daily_phrases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { sucesso: true };
}

async function getGrowthData() {
  const { data: users, error: usersErr } = await supabaseAdmin
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (usersErr) throw usersErr;

  const { data: workouts, error: workoutsErr } = await supabaseAdmin
    .from('workout_sessions')
    .select('data_inicio')
    .order('data_inicio', { ascending: true });

  if (workoutsErr) throw workoutsErr;

  const monthlyUsers = {};
  const monthlyWorkouts = {};

  (users || []).forEach(u => {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyUsers[key] = (monthlyUsers[key] || 0) + 1;
  });

  (workouts || []).forEach(w => {
    const d = new Date(w.data_inicio);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyWorkouts[key] = (monthlyWorkouts[key] || 0) + 1;
  });

  const months = Object.keys({ ...monthlyUsers, ...monthlyWorkouts }).sort().slice(-12);

  return {
    users: months.map(m => ({ month: m, count: monthlyUsers[m] || 0 })),
    workouts: months.map(m => ({ month: m, count: monthlyWorkouts[m] || 0 })),
  };
}

module.exports = {
  getDashboardStats,
  listUsers,
  updateUserTipo,
  deleteUser,
  getGrowthData,
  listPhrases,
  createPhrase,
  updatePhrase,
  deletePhrase,
};
