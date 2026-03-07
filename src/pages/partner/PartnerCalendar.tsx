import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, getPhaseColor, type Phase } from "@/lib/cycle";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PartnerCalendar() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    supabase.from("cycle_settings").select("*").eq("user_id", ownerId).single().then(({ data }) => setSettings(data));
  }, [ownerId]);

  if (!settings) {
    return (
      <MobileLayout>
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-3xl animate-pulse-bloom">🌸</span>
        </div>
        {ownerId && <PartnerBottomNav ownerId={ownerId} />}
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
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const selectedPhase = selectedDay
    ? getPhaseInfo(selectedDay, lastPeriod, settings.cycle_length, settings.period_length)
    : null;

  const phases: Phase[] = ["menstruation", "follicular", "ovulation", "luteal"];

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <div className="flex gap-2 flex-wrap mb-4">
          {phases.map((p) => <PhaseChip key={p} phase={p} size="sm" />)}
        </div>

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

        <div className="grid grid-cols-7 text-center mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <span key={w} className="text-xs text-muted-foreground font-body">{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const info = getPhaseInfo(day, lastPeriod, settings.cycle_length, settings.period_length);
            const colors = getPhaseColor(info.phase);
            const selected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button key={idx} onClick={() => setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body transition-all
                  ${inMonth ? colors.bg : "bg-transparent"} ${inMonth ? colors.text : "text-muted-foreground/30"}
                  ${today ? "ring-2 ring-primary ring-offset-1" : ""} ${selected ? "ring-2 ring-foreground" : ""}`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {selectedDay && selectedPhase && (
          <div className="mt-4 rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <PhaseChip phase={selectedPhase.phase} size="md" />
              <span className="text-sm text-muted-foreground font-body">
                {format(selectedDay, "M월 d일")} · {selectedPhase.cycleDay}일차
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {getPartnerDayAdvice(selectedPhase.phase).map((tip, i) => (
                <p key={i} className="text-sm text-foreground font-body flex items-start gap-2">
                  <span>💬</span> {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground font-body text-center mt-4">
          📌 일기는 본인만 볼 수 있어요
        </p>
      </div>
      {ownerId && <PartnerBottomNav ownerId={ownerId} />}
    </MobileLayout>
  );
}

function getPartnerDayAdvice(phase: Phase): string[] {
  const tips: Record<Phase, string[]> = {
    menstruation: ["편안한 저녁을 제안하세요", "따뜻한 음료를 준비해 주세요"],
    follicular: ["활발한 활동을 함께 계획하세요", "새로운 곳에 데이트를 가 보세요"],
    ovulation: ["함께 활발한 활동을 즐기세요", "특별한 시간을 만들어 보세요"],
    luteal: ["편안한 분위기를 만들어 주세요", "영양가 있는 간식을 준비하세요"],
  };
  return tips[phase];
}
