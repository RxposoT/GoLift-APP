const {
  sendStreakAtRiskReminders,
  sendWeeklyReportReminders,
} = require('./push.service');

let lastStreakRun = null;
let lastReportRun = null;

function startNotificationScheduler() {
  const check = async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    const dateKey = now.toDateString();

    const streakKey = `${dateKey}-20`;
    if (hour === 20 && minute === 0 && lastStreakRun !== streakKey) {
      lastStreakRun = streakKey;
      try {
        const result = await sendStreakAtRiskReminders();
        console.log(`[Push] Streak reminders enviados: ${result.notified}`);
      } catch (err) {
        console.error('[Push] Erro ao enviar streak reminders:', err);
      }
    }

    const reportKey = `${dateKey}-9`;
    if (day === 1 && hour === 9 && minute === 0 && lastReportRun !== reportKey) {
      lastReportRun = reportKey;
      try {
        const result = await sendWeeklyReportReminders();
        console.log(`[Push] Relatório IA reminders enviados: ${result.notified}`);
      } catch (err) {
        console.error('[Push] Erro ao enviar relatório IA reminders:', err);
      }
    }
  };

  setInterval(check, 60_000);
  console.log('[Push] Scheduler de notificações iniciado');
}

module.exports = { startNotificationScheduler };
