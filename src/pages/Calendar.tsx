import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, getPhaseColor, getNextPeriodDate, type Phase } from "@/lib/cycle";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday,
  differenceInDays,
} from "date-fns";
import { ko as koLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import lunaMascot from "@/assets/luna-mascot.png";

export default function CalendarPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  useEffect(() => {
    if (!user) return;
    supabase.from("cycle_settings").select("*").eq("user_id", user.id).single().then(({ data }) => setSettings(data));
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

  const weekdays = t("weekdays") as string[];
  const lastPeriod = new Date(settings.last_period_start);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const selectedPhase = selectedDay ? getPhaseInfo(selectedDay, lastPeriod, settings.cycle_length, settings.period_length) : null;
  const phases: Phase[] = ["menstruation", "follicular", "ovulation", "luteal"];
  const nextPeriod = getNextPeriodDate(lastPeriod, settings.cycle_length);
  const daysUntil = differenceInDays(nextPeriod, new Date());

  const monthLabel = lang === "ko"
    ? format(currentMonth, "yyyy년 M월", { locale: koLocale })
    : format(currentMonth, "MMMM yyyy");

  const getAdvice = (phase: Phase) => t(`phase_advice_${phase}` as any) as string[];

  const nextPeriodDateStr = lang === "ko"
    ? format(nextPeriod, "M월 d일 (EEEE)", { locale: koLocale })
    : format(nextPeriod, "MMM d (EEEE)");

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
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-lg font-display font-bold text-foreground hover:text-primary transition-colors px-3 py-1 rounded-lg hover:bg-muted">
                {monthLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar mode="single" selected={currentMonth} onSelect={(date) => { if (date) setCurrentMonth(date); }} defaultMonth={currentMonth} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-mist">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center mb-2">
          {weekdays.map((w) => (
            <span key={w} className="text-xs text-muted-foreground font-body">{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const inMonth = isSameMonth(day, currentMonth);
            const todayFlag = isToday(day);
            const info = getPhaseInfo(day, lastPeriod, settings.cycle_length, settings.period_length);
            const colors = getPhaseColor(info.phase);
            const selected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button key={idx} onClick={() => setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body transition-all
                  ${inMonth ? colors.bg : "bg-transparent"} ${inMonth ? colors.text : "text-muted-foreground/30"}
                  ${todayFlag ? "ring-2 ring-primary ring-offset-1" : ""} ${selected ? "ring-2 ring-foreground" : ""}`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {selectedDay && selectedPhase && (
          <div className="mt-4 rounded-2xl bg-card p-5 shadow-soft animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <PhaseChip phase={selectedPhase.phase} size="md" />
              <span className="text-sm text-muted-foreground font-body">
                {lang === "ko" ? format(selectedDay, "M월 d일") : format(selectedDay, "MMM d")} · {selectedPhase.cycleDay}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {getAdvice(selectedPhase.phase).map((tip, i) => (
                <p key={i} className="text-sm text-foreground font-body flex items-start gap-2">
                  <span className="text-base">{["🏃‍♀️", "🥗", "💤"][i]}</span>
                  {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-4 flex items-start gap-3">
          <img src={lunaMascot} alt="Luna" className="w-10 h-10 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-bold text-foreground">{t("next_period_prediction")}</p>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {t("predicted_date", { date: nextPeriodDateStr })}
              {daysUntil > 0
                ? t("days_left", { n: daysUntil })
                : daysUntil === 0
                ? t("today_is_predicted")
                : t("past_predicted")}
            </p>
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}
