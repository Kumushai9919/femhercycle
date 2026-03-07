import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, getPhaseColor, PHASE_LABELS, PHASE_EMOJI, type Phase } from "@/lib/cycle";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cycle_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setSettings(data));
  }, [user]);

  if (!settings) {
    return (
      <MobileLayout>
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-3xl animate-pulse-bloom">🌸</span>
        </div>
        <OwnerBottomNav />
      </MobileLayout>
    );
  }

  const lastPeriod = new Date(settings.last_period_start);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const selectedPhase = selectedDay
    ? getPhaseInfo(selectedDay, lastPeriod, settings.cycle_length, settings.period_length)
    : null;

  const phases: Phase[] = ["menstruation", "follicular", "ovulation", "luteal"];

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        {/* Phase legend */}
        <div className="flex gap-2 flex-wrap mb-4">
          {phases.map((p) => (
            <PhaseChip key={p} phase={p} size="sm" />
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-mist">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-lg font-display font-bold text-foreground">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-mist">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <span key={w} className="text-xs text-muted-foreground font-body">{w}</span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const info = getPhaseInfo(day, lastPeriod, settings.cycle_length, settings.period_length);
            const colors = getPhaseColor(info.phase);
            const selected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body transition-all
                  ${inMonth ? colors.bg : "bg-transparent"}
                  ${inMonth ? colors.text : "text-muted-foreground/30"}
                  ${today ? "ring-2 ring-primary ring-offset-1" : ""}
                  ${selected ? "ring-2 ring-foreground" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Selected day sheet */}
        {selectedDay && selectedPhase && (
          <div className="mt-4 rounded-2xl bg-card p-5 shadow-soft animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <PhaseChip phase={selectedPhase.phase} size="md" />
              <span className="text-sm text-muted-foreground font-body">
                {format(selectedDay, "M월 d일")} · {selectedPhase.cycleDay}일차
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {getPhaseAdvice(selectedPhase.phase).map((tip, i) => (
                <p key={i} className="text-sm text-foreground font-body flex items-start gap-2">
                  <span className="text-base">{["🏃‍♀️", "🥗", "💤"][i]}</span>
                  {tip}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}

function getPhaseAdvice(phase: Phase): string[] {
  const advice: Record<Phase, string[]> = {
    menstruation: [
      "가벼운 스트레칭이나 요가가 좋아요",
      "철분이 풍부한 음식을 드세요",
      "충분한 수면을 취하세요",
    ],
    follicular: [
      "새로운 운동을 시작하기 좋은 시기예요",
      "에너지를 높이는 식단을 추천해요",
      "사교 활동에 적극적으로 참여해 보세요",
    ],
    ovulation: [
      "고강도 운동에 도전해 보세요",
      "항산화 식품을 충분히 섭취하세요",
      "창의적인 활동에 집중해 보세요",
    ],
    luteal: [
      "부드러운 운동으로 전환하세요",
      "마그네슘이 풍부한 음식이 도움돼요",
      "스트레스 관리에 집중하세요",
    ],
  };
  return advice[phase];
}
