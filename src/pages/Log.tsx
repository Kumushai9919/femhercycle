import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo } from "@/lib/cycle";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

const MOODS = [
  { value: "Low", emoji: "😔" },
  { value: "Okay", emoji: "😐" },
  { value: "Good", emoji: "😊" },
  { value: "Great", emoji: "😄" },
  { value: "Amazing", emoji: "🤩" },
];

const SYMPTOMS = [
  "복부팽만", "두통", "피로", "생리통", "열감", "점상출혈", "에너지", "오한",
];

export default function LogPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState(50);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: s } = await supabase.from("cycle_settings").select("*").eq("user_id", user.id).single();
    setSettings(s);

    const today = format(new Date(), "yyyy-MM-dd");
    const { data: existing } = await supabase.from("cycle_logs").select("*").eq("user_id", user.id).eq("log_date", today).maybeSingle();
    if (existing) {
      setMood(existing.mood);
      setEnergy(existing.energy_level ?? 50);
      setSelectedSymptoms(existing.symptoms ?? []);
      setNote(existing.note ?? "");
    }

    const { data: recent } = await supabase
      .from("cycle_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(5);
    setRecentLogs(recent ?? []);
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    setSaving(true);

    const lastPeriod = new Date(settings.last_period_start);
    const phaseInfo = getPhaseInfo(new Date(), lastPeriod, settings.cycle_length, settings.period_length);
    const today = format(new Date(), "yyyy-MM-dd");

    const { error } = await supabase.from("cycle_logs").upsert(
      {
        user_id: user.id,
        log_date: today,
        cycle_day: phaseInfo.cycleDay,
        phase: phaseInfo.phase,
        mood,
        energy_level: energy,
        symptoms: selectedSymptoms,
        note,
      },
      { onConflict: "user_id,log_date" }
    );

    setSaving(false);
    if (error) {
      toast.error("저장에 실패했어요. 다시 시도해 주세요.");
    } else {
      toast.success("저장되었어요 ✦");
      loadData();
    }
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const lastPeriod = settings?.last_period_start ? new Date(settings.last_period_start) : null;
  const phaseInfo = lastPeriod
    ? getPhaseInfo(new Date(), lastPeriod, settings.cycle_length, settings.period_length)
    : null;

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">오늘의 기록</h1>
            <p className="text-sm text-muted-foreground font-body">
              {format(new Date(), "M월 d일 EEEE", { locale: ko })}
            </p>
          </div>
          {phaseInfo && <PhaseChip phase={phaseInfo.phase} size="md" />}
        </div>

        {/* Mood */}
        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">기분</h3>
          <div className="flex gap-3">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex-1 aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  mood === m.value
                    ? "bg-blush ring-2 ring-primary scale-110"
                    : "bg-mist hover:bg-blush/50"
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </section>

        {/* Symptoms */}
        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">증상</h3>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all ${
                  selectedSymptoms.includes(s)
                    ? "bg-plum text-accent-foreground"
                    : "bg-mist text-muted-foreground hover:bg-lavender"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Energy */}
        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">
            에너지 레벨 · {energy}%
          </h3>
          <input
            type="range"
            min={0}
            max={100}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum"
          />
        </section>

        {/* Note */}
        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">메모</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="오늘 몸 상태는 어때요?"
            className="w-full rounded-2xl border border-border bg-card p-4 text-sm font-display italic text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-primary/90 to-accent/80 py-3.5 text-primary-foreground font-body font-semibold shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? "저장 중…" : "✦ 오늘의 기록 저장하기"}
        </button>

        {/* Recent logs */}
        {recentLogs.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-body font-semibold text-foreground mb-3">최근 기록</h3>
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const moodE = MOODS.find((m) => m.value === log.mood)?.emoji || "—";
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-card p-3 shadow-soft flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{moodE}</span>
                      <span className="text-sm font-body text-foreground">{log.log_date}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-body">
                      에너지 {log.energy_level ?? "—"}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}
