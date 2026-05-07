export const FREE_SCANS_PER_DAY = 1;

type SessionLike = {
  createdAt: string | number | Date;
};

function dayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function countSessionsForDay(sessions: SessionLike[], date = new Date()) {
  const targetDay = dayKey(date);
  return sessions.filter((session) => dayKey(new Date(session.createdAt)) === targetDay).length;
}

export function getFreeScansRemainingToday(sessions: SessionLike[], date = new Date()) {
  return Math.max(0, FREE_SCANS_PER_DAY - countSessionsForDay(sessions, date));
}

export function hasFreeScanAvailableToday(sessions: SessionLike[], date = new Date()) {
  return getFreeScansRemainingToday(sessions, date) > 0;
}
