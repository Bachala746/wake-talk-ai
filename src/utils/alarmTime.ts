export function calculateNextTriggerTime(
  time: string,
  selectedDays: string[]
): number {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  // One-time alarm (no repeat days selected)
  if (selectedDays.length === 0) {
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  }

  // Map day names to JavaScript day numbers
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  let earliestTime: number | null = null;

  for (const day of selectedDays) {
    const targetDay = dayMap[day];

    if (targetDay === undefined) continue;

    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    let diff = targetDay - now.getDay();

    if (diff < 0) {
      diff += 7;
    }

    if (diff === 0 && next <= now) {
      diff = 7;
    }

    next.setDate(now.getDate() + diff);

    if (earliestTime === null || next.getTime() < earliestTime) {
      earliestTime = next.getTime();
    }
  }

  return earliestTime ?? now.getTime();
}