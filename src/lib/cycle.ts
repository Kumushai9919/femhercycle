import { differenceInDays, addDays, format } from "date-fns";

export type Phase = "menstruation" | "follicular" | "ovulation" | "luteal";

export interface PhaseInfo {
  phase: Phase;
  cycleDay: number;
  label: string;
  emoji: string;
}

export const PHASE_LABELS: Record<Phase, string> = {
  menstruation: "생리기",
  follicular: "난포기",
  ovulation: "배란기",
  luteal: "황체기",
};

export const PHASE_EMOJI: Record<Phase, string> = {
  menstruation: "🌺",
  follicular: "🌱",
  ovulation: "🌸",
  luteal: "🌙",
};

export function getPhaseForDay(
  cycleDay: number,
  cycleLength: number,
  periodLength: number
): Phase {
  if (cycleDay >= 1 && cycleDay <= periodLength) return "menstruation";
  if (cycleDay > periodLength && cycleDay <= cycleLength - 15) return "follicular";
  if (cycleDay >= cycleLength - 14 && cycleDay <= cycleLength - 12) return "ovulation";
  return "luteal";
}

export function getCycleDay(
  date: Date,
  lastPeriodStart: Date,
  cycleLength: number
): number {
  const diff = differenceInDays(date, lastPeriodStart);
  const dayInCycle = ((diff % cycleLength) + cycleLength) % cycleLength;
  return dayInCycle === 0 ? cycleLength : dayInCycle;
}

export function getPhaseInfo(
  date: Date,
  lastPeriodStart: Date,
  cycleLength: number,
  periodLength: number
): PhaseInfo {
  const cycleDay = getCycleDay(date, lastPeriodStart, cycleLength);
  const phase = getPhaseForDay(cycleDay, cycleLength, periodLength);
  return {
    phase,
    cycleDay,
    label: PHASE_LABELS[phase],
    emoji: PHASE_EMOJI[phase],
  };
}

export function getNextPeriodDate(
  lastPeriodStart: Date,
  cycleLength: number
): Date {
  const today = new Date();
  const diff = differenceInDays(today, lastPeriodStart);
  const cyclesElapsed = Math.ceil(diff / cycleLength);
  return addDays(lastPeriodStart, cyclesElapsed * cycleLength);
}

export function getPhaseColor(phase: Phase) {
  return {
    menstruation: { bg: "bg-phase-menstruation", text: "text-phase-menstruation-text" },
    follicular: { bg: "bg-phase-follicular", text: "text-phase-follicular-text" },
    ovulation: { bg: "bg-phase-ovulation", text: "text-phase-ovulation-text" },
    luteal: { bg: "bg-phase-luteal", text: "text-phase-luteal-text" },
  }[phase];
}
