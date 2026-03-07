import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { getPhaseForDay } from "./cycle";

const MOODS = ["Low", "Okay", "Good", "Great", "Amazing"] as const;
const SYMPTOMS_POOL = ["복부팽만", "두통", "피로", "생리통", "열감", "점상출혈", "에너지", "오한"];
const NOTES = [
  "오늘은 좀 피곤했어요.",
  "기분이 좋고 에너지가 넘쳐요!",
  "약간의 두통이 있었지만 괜찮았어요.",
  "운동 후 기분이 좋아졌어요.",
  "잠을 충분히 못 잤어요.",
  "요가를 했더니 몸이 가벼워요.",
  "오늘 하루도 무사히!",
  "조금 예민한 하루였어요.",
  "따뜻한 차를 마시니 좋아요.",
  "산책이 기분 전환에 최고!",
  "생리통이 있어서 쉬었어요.",
  "친구를 만나서 즐거웠어요.",
  "집에서 쉬는 게 제일이에요.",
  "새로운 레시피를 시도했어요!",
];

export async function seedDataIfNeeded(userId: string) {
  // Check if settings exist
  const { data: existing } = await supabase
    .from("cycle_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return; // already seeded

  const cycleLength = 28;
  const periodLength = 5;
  const lastPeriodStart = subDays(new Date(), 28);

  // Insert cycle settings
  await supabase.from("cycle_settings").insert({
    user_id: userId,
    cycle_length: cycleLength,
    period_length: periodLength,
    last_period_start: format(lastPeriodStart, "yyyy-MM-dd"),
  });

  // Insert 14 days of logs
  const logs = [];
  for (let i = 13; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayInCycle = 28 - i; // days 15-28 range
    const phase = getPhaseForDay(dayInCycle > 28 ? dayInCycle - 28 : dayInCycle, cycleLength, periodLength);
    const moodIdx = Math.min(4, Math.floor(Math.random() * 5));
    const energy = 30 + Math.floor(Math.random() * 60);
    const symptomCount = Math.floor(Math.random() * 3);
    const shuffled = [...SYMPTOMS_POOL].sort(() => Math.random() - 0.5);
    const symptoms = shuffled.slice(0, symptomCount);

    logs.push({
      user_id: userId,
      log_date: format(date, "yyyy-MM-dd"),
      cycle_day: dayInCycle > 28 ? dayInCycle - 28 : dayInCycle,
      phase,
      mood: MOODS[moodIdx],
      energy_level: energy,
      symptoms,
      note: NOTES[i % NOTES.length],
    });
  }

  await supabase.from("cycle_logs").insert(logs);
}
