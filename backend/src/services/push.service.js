const supabaseAdmin = require('../config/supabase');

async function sendPushToUser(userId, title, body, data = {}) {
  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error || !tokens?.length) return { sent: 0, failed: 0 };

  const expoTokens = tokens.map((t) => t.token).filter(Boolean);
  const tokensToRemove = [];

  const results = await Promise.allSettled(
    expoTokens.map(async (token) => {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title,
          body,
          data,
          priority: 'high',
        }),
      });
      return res.json();
    })
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value?.data?.status === 'error') {
      tokensToRemove.push(expoTokens[index]);
    }
  });

  if (tokensToRemove.length > 0) {
    await supabaseAdmin
      .from('push_tokens')
      .delete()
      .in('token', tokensToRemove);
  }

  return { sent: expoTokens.length, failed: tokensToRemove.length };
}

async function sendStreakAtRiskReminders() {
  const hoje = new Date().toISOString().split('T')[0];

  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('user_id')
    .not('user_id', 'is', null);

  if (error || !tokens?.length) return { notified: 0 };

  const userIds = [...new Set(tokens.map((t) => t.user_id))];
  let notified = 0;

  for (const userId of userIds) {
    const { data: streakData } = await supabaseAdmin.rpc('get_user_streak', {
      p_user_id: userId,
    });

    const streak = streakData?.streak || 0;
    if (streak <= 0) continue;

    const { count } = await supabaseAdmin
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('id_utilizador', userId)
      .gte('criado_em', hoje);

    if (count && count > 0) continue;

    await sendPushToUser(
      userId,
      'Não quebres a tua streak!',
      'Ainda vais a tempo de treinar hoje',
      { route: '/(tabs)/workouts' }
    );
    notified++;
  }

  return { notified };
}

async function sendWeeklyReportReminders() {
  const { data: premiumUsers, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('plano', 'pago');

  if (error || !premiumUsers?.length) return { notified: 0 };

  let notified = 0;

  for (const user of premiumUsers) {
    const { data: tokens } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', user.id)
      .limit(1);

    if (!tokens?.length) continue;

    await sendPushToUser(
      user.id,
      'O teu relatório IA está pronto!',
      'Vê como correu a tua semana de treino',
      { route: '/ai-report' }
    );
    notified++;
  }

  return { notified };
}

module.exports = {
  sendPushToUser,
  sendStreakAtRiskReminders,
  sendWeeklyReportReminders,
};
