import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import AiBadge from "@/components/AiBadge";
import lunaMascot from "@/assets/luna-mascot.png";
import AiChatDialog from "@/components/AiChatDialog";
import { getPhaseInfo, getNextPeriodDate, type Phase } from "@/lib/cycle";
import { seedDataIfNeeded } from "@/lib/seed";
import { format, subDays } from "date-fns";
import { ko as koLocale } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles } from "lucide-react";

interface CycleSettings {
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);
  const [partners, setPartners] = useState<{ full_name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await seedDataIfNeeded(user.id);
      const { data: s } = await supabase.from("cycle_settings").select("*").eq("user_id", user.id).single();
      setSettings(s);

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: log } = await supabase.from("cycle_logs").select("*").eq("user_id", user.id).eq("log_date", today).maybeSingle();
      setTodayLog(log);

      const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data: wLogs } = await supabase.from("cycle_logs").select("log_date, energy_level, mood").eq("user_id", user.id).gte("log_date", weekAgo).order("log_date");
      setWeekLogs(wLogs || []);

      const { data: accessRows } = await supabase.from("partner_access").select("partner_id").eq("owner_id", user.id).eq("is_active", true);
      if (accessRows && accessRows.length > 0) {
        const ids = accessRows.map((r) => r.partner_id);
        const { data: pProfiles } = await supabase.from("profiles").select("full_name").in("id", ids);
        setPartners(pProfiles || []);
      }

      setLoading(false);
    })();
  }, [user]);

  if (loading || !settings) {
    return (
      <MobileLayout>
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-3xl animate-pulse-bloom">🌸</span>
        </div>
        <OwnerBottomNav />
      </MobileLayout>
    );
  }

  const lastPeriod = settings.last_period_start ? new Date(settings.last_period_start) : new Date();
  const phaseInfo = getPhaseInfo(new Date(), lastPeriod, settings.cycle_length, settings.period_length);
  const nextPeriod = getNextPeriodDate(lastPeriod, settings.cycle_length);

  const greeting = getGreeting(t);
  const moodEmoji = todayLog?.mood
    ? { Low: "😔", Okay: "😐", Good: "😊", Great: "😄", Amazing: "🤩" }[todayLog.mood as string] || "😊"
    : "—";

  const weekdays = t("weekdays") as string[];
  const phaseLabel = t(`phase_${phaseInfo.phase}` as any) as string;

  const dateStr = lang === "ko"
    ? format(new Date(), "M월 d일 EEEE", { locale: koLocale })
    : format(new Date(), "EEEE, MMM d");

  return (
    <MobileLayout>
      <div className="pb-24">
        {/* Hero */}
        <div className="bg-gradient-to-br from-lavender via-blush to-secondary px-6 pt-12 pb-8 rounded-b-[2rem]">
          <p className="text-sm font-body text-charcoal/70">{dateStr}</p>
          <h1 className="mt-1 text-2xl font-display font-bold text-charcoal">
            {greeting}, {profile?.full_name?.split(" ")[0] || "✦"}{lang === "ko" ? "님" : ""} ✦
          </h1>

          <div className="mt-5 rounded-2xl bg-card/90 backdrop-blur-sm p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <PhaseChip phase={phaseInfo.phase} size="md" />
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  {t("cycle_day_of", { day: phaseInfo.cycleDay, total: settings.cycle_length })}
                </p>
              </div>
              <span className="text-5xl">{phaseInfo.emoji}</span>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="px-5 mt-5">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-lavender/30 border border-primary/15 p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-primary rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                <span className="text-[11px] font-medium text-primary-foreground font-body">{t("ai_analysis")}</span>
              </div>
              <span className="text-sm font-display font-bold text-foreground">{t("today_insight")}</span>
            </div>
            <p className="text-sm text-foreground font-body leading-relaxed">
              {t("currently_in", { phase: phaseLabel })}
              {t(`phase_insight_${phaseInfo.phase}` as any)}
            </p>

            <div className="mt-4 pt-4 border-t border-primary/10">
              <p className="text-xs font-body font-semibold text-muted-foreground mb-2">{t("weekly_energy")}</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeekChartData(weekLogs, weekdays)} barSize={18}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(30 50% 97%)", color: "hsl(var(--foreground))" }}
                      cursor={{ fill: "hsl(30 40% 95%)" }}
                      formatter={(v: number) => [`${v}%`, t("energy") as string]}
                    />
                    <Bar dataKey="energy" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3">
          <StatCard label={t("cycle_length") as string} value={`${settings.cycle_length}${lang === "ko" ? "일" : "d"}`} />
          <StatCard label={t("next_period") as string} value={format(nextPeriod, "M/d")} />
          <StatCard label={t("today_energy") as string} value={todayLog?.energy_level != null ? `${todayLog.energy_level}%` : "—"} />
          <StatCard label={t("today_mood") as string} value={moodEmoji} />
        </div>

        {/* Partners */}
        {partners.length > 0 && (
          <div className="px-5 mt-4">
            <h3 className="text-sm font-body font-semibold text-foreground mb-2">{t("linked_partners")}</h3>
            <div className="flex gap-2 flex-wrap">
              {partners.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-xs font-body font-medium text-primary">
                  💜 {p.full_name || t("partner")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Routine pills */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-body font-semibold text-foreground mb-2">{t("today_routine")}</h3>
          <div className="flex gap-2 flex-wrap">
            {[t("routine_exercise"), t("routine_diet"), t("routine_sleep"), t("routine_mind")].map((r) => (
              <span key={r as string} className="rounded-full bg-mist px-3 py-1.5 text-xs font-body text-plum font-medium">
                {r as string}
              </span>
            ))}
          </div>
        </div>

        {/* Luna intro card */}
        <div className="px-5 mt-4">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-primary/8 to-accent/8 border border-primary/15 p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <img src={lunaMascot} alt="Luna" className="w-11 h-11 shrink-0" />
            <div>
              <p className="text-sm font-body font-semibold text-foreground">{t("luna_chat_title")}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{t("luna_chat_desc")}</p>
            </div>
          </button>
        </div>
        <AiChatDialog open={chatOpen} onOpenChange={setChatOpen} />
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <p className="text-[11px] text-muted-foreground font-body">{label}</p>
      <p className="mt-1 text-xl font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

function getGreeting(t: any) {
  const h = new Date().getHours();
  if (h < 12) return t("greeting_morning");
  if (h < 18) return t("greeting_afternoon");
  return t("greeting_evening");
}

function getWeekChartData(logs: any[], weekdays: string[]) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs.find((l) => l.log_date === dateStr);
    result.push({
      day: weekdays[d.getDay()],
      energy: log?.energy_level ?? 0,
    });
  }
  return result;
}
