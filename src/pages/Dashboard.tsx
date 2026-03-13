import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { ko } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles } from "lucide-react";

interface CycleSettings {
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
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
      const { data: s } = await supabase
        .from("cycle_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setSettings(s);

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: log } = await supabase
        .from("cycle_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();
      setTodayLog(log);

      // Fetch last 7 days logs
      const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data: wLogs } = await supabase
        .from("cycle_logs")
        .select("log_date, energy_level, mood")
        .eq("user_id", user.id)
        .gte("log_date", weekAgo)
        .order("log_date");
      setWeekLogs(wLogs || []);

      // Fetch linked partners
      const { data: accessRows } = await supabase
        .from("partner_access")
        .select("partner_id")
        .eq("owner_id", user.id)
        .eq("is_active", true);
      if (accessRows && accessRows.length > 0) {
        const ids = accessRows.map((r) => r.partner_id);
        const { data: pProfiles } = await supabase
          .from("profiles")
          .select("full_name")
          .in("id", ids);
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

  const lastPeriod = settings.last_period_start
    ? new Date(settings.last_period_start)
    : new Date();
  const phaseInfo = getPhaseInfo(new Date(), lastPeriod, settings.cycle_length, settings.period_length);
  const nextPeriod = getNextPeriodDate(lastPeriod, settings.cycle_length);

  const greeting = getGreeting();
  const moodEmoji = todayLog?.mood
    ? { Low: "😔", Okay: "😐", Good: "😊", Great: "😄", Amazing: "🤩" }[todayLog.mood as string] || "😊"
    : "—";

  return (
    <MobileLayout>
      <div className="pb-24">
        {/* Hero */}
        <div className="bg-gradient-to-br from-lavender via-blush to-secondary px-6 pt-12 pb-8 rounded-b-[2rem]">
          <p className="text-sm font-body text-charcoal/70">
            {format(new Date(), "M월 d일 EEEE", { locale: ko })}
          </p>
          <h1 className="mt-1 text-2xl font-display font-bold text-charcoal">
            {greeting}, {profile?.full_name?.split(" ")[0] || "회원"} ✦
          </h1>

          {/* Phase Card */}
          <div className="mt-5 rounded-2xl bg-card/90 backdrop-blur-sm p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <PhaseChip phase={phaseInfo.phase} size="md" />
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  사이클 {phaseInfo.cycleDay}일차 / {settings.cycle_length}일
                </p>
              </div>
              <span className="text-5xl">{phaseInfo.emoji}</span>
            </div>
          </div>
        </div>

        {/* AI Insight - Featured */}
        <div className="px-5 mt-5">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-lavender/30 border border-primary/15 p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-primary rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                <span className="text-[11px] font-medium text-primary-foreground font-body">AI 분석</span>
              </div>
              <span className="text-sm font-display font-bold text-foreground">오늘의 인사이트</span>
            </div>
            <p className="text-sm text-foreground font-body leading-relaxed">
              현재 <span className="font-semibold text-primary">{phaseInfo.label}</span>에 있어요. 이 시기에는{" "}
              {phaseInfo.phase === "menstruation" && "충분한 휴식과 따뜻한 음식이 중요해요. 무리하지 마세요."}
              {phaseInfo.phase === "follicular" && "에너지가 올라가는 시기예요! 새로운 활동을 시작하기 좋아요."}
              {phaseInfo.phase === "ovulation" && "가장 활기찬 시기예요. 사교 활동과 운동에 적극적으로 참여해 보세요."}
              {phaseInfo.phase === "luteal" && "몸이 편안함을 원하는 시기예요. 스트레스 관리에 신경 쓰세요."}
            </p>

            {/* Weekly Energy Chart */}
            <div className="mt-4 pt-4 border-t border-primary/10">
              <p className="text-xs font-body font-semibold text-muted-foreground mb-2">📊 이번 주 에너지 추이</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeekChartData(weekLogs)} barSize={18}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(30 50% 97%)", color: "hsl(var(--foreground))" }}
                      cursor={{ fill: "hsl(30 40% 95%)" }}
                      formatter={(v: number) => [`${v}%`, "에너지"]}
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
          <StatCard label="사이클 길이" value={`${settings.cycle_length}일`} />
          <StatCard label="다음 생리일" value={format(nextPeriod, "M/d")} />
          <StatCard label="오늘 에너지" value={todayLog?.energy_level != null ? `${todayLog.energy_level}%` : "—"} />
          <StatCard label="오늘 기분" value={moodEmoji} />
        </div>

        {/* Partners */}
        {partners.length > 0 && (
          <div className="px-5 mt-4">
            <h3 className="text-sm font-body font-semibold text-foreground mb-2">연결된 파트너</h3>
            <div className="flex gap-2 flex-wrap">
              {partners.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-xs font-body font-medium text-primary">
                  💜 {p.full_name || "파트너"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Routine pills */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-body font-semibold text-foreground mb-2">오늘의 루틴</h3>
          <div className="flex gap-2 flex-wrap">
            {["🏋️ 운동", "🥗 식단", "🌙 수면", "🧘 마인드"].map((r) => (
              <span key={r} className="rounded-full bg-mist px-3 py-1.5 text-xs font-body text-plum font-medium">
                {r}
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
            <img src={lunaMascot} alt="루나" className="w-11 h-11 shrink-0" />
            <div>
              <p className="text-sm font-body font-semibold text-foreground">루나 AI와 대화하세요</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">나만의 건강 어시스턴트가 궁금한 걸 답해드려요 →</p>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}

function getWeekChartData(logs: any[]) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs.find((l) => l.log_date === dateStr);
    result.push({
      day: days[d.getDay()],
      energy: log?.energy_level ?? 0,
    });
  }
  return result;
}
