export interface WeekDay {
  day: string;
  date: string;
  completed: boolean;
}

/**
 * Generates an array of 7 WeekDay objects representing the current week
 * (Monday to Sunday), each pre-filled with `completed: false`.
 */
export function generateStreakWeek(): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return { day: dayNames[i], date: `${y}-${m}-${d}`, completed: false };
  });
}
