import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo } from "@/lib/cycle";
import { format } from "date-fns";
import { ko as koLocale } from "date-fns/locale";
import { toast } from "sonner";

const MOODS = [
  { value: "Low", emoji: "😔" },
  { value: "Okay", emoji: "😐" },
  { value: "Good", emoji: "😊" },
  { value: "Great", emoji: "😄" },
  { value: "Amazing", emoji: "🤩" },
];

export default function LogPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState(50);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const symptoms = t("symptoms") as string[];

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

    const { data: recent } = await supabase.from("cycle_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(5);
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
      toast.error(t("save_error") as string);
    } else {
      toast.success(t("save_success") as string);
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

  const dateStr = lang === "ko"
    ? format(new Date(), "M월 d일 EEEE", { locale: koLocale })
    : format(new Date(), "EEEE, MMM d");

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{t("today_log")}</h1>
            <p className="text-sm text-muted-foreground font-body">{dateStr}</p>
          </div>
          {phaseInfo && <PhaseChip phase={phaseInfo.phase} size="md" />}
        </div>

        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("mood")}</h3>
          <div className="flex gap-3">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex-1 aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  mood === m.value ? "bg-blush ring-2 ring-primary scale-110" : "bg-mist hover:bg-blush/50"
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("symptoms_title")}</h3>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all ${
                  selectedSymptoms.includes(s) ? "bg-plum text-accent-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">
            {t("energy_level")} · {energy}%
          </h3>
          <input
            type="range" min={0} max={100} value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum"
          />
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("memo")}</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("memo_placeholder") as string}
            className="w-full rounded-2xl border border-border bg-card p-4 text-sm font-display italic text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-primary/90 to-accent/80 py-3.5 text-primary-foreground font-body font-semibold shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? t("saving") : t("save_today")}
        </button>

        {recentLogs.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("recent_logs")}</h3>
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const moodE = MOODS.find((m) => m.value === log.mood)?.emoji || "—";
                return (
                  <div key={log.id} className="rounded-2xl bg-card p-3 shadow-soft space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{moodE}</span>
                        <span className="text-sm font-body text-foreground">{log.log_date}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-body">
                        {t("energy")} {log.energy_level ?? "—"}%
                      </span>
                    </div>
                    {log.symptoms && log.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-9">
                        {log.symptoms.map((s: string) => (
                          <span key={s} className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-body text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    {log.note && (
                      <p className="text-xs font-display italic text-muted-foreground pl-9 line-clamp-2">{log.note}</p>
                    )}
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
