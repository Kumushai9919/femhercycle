import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, getNextPeriodDate, type Phase } from "@/lib/cycle";
import { format, addDays } from "date-fns";
import { ko as koLocale } from "date-fns/locale";

export default function PartnerHome() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const { t, lang } = useLanguage();
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", ownerId).single(),
      supabase.from("cycle_settings").select("*").eq("user_id", ownerId).single(),
    ]).then(([{ data: prof }, { data: s }]) => {
      setOwnerProfile(prof);
      setSettings(s);
      setLoading(false);
    });
  }, [ownerId]);

  if (loading || !settings || !ownerProfile) {
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
  const phaseInfo = getPhaseInfo(new Date(), lastPeriod, settings.cycle_length, settings.period_length);
  const nextPeriod = getNextPeriodDate(lastPeriod, settings.cycle_length);
  const firstName = ownerProfile.full_name?.split(" ")[0] || t("partner");

  const formatDate = (d: Date) =>
    lang === "ko" ? format(d, "M월 d일", { locale: koLocale }) : format(d, "MMM d");

  const tips = t(`partner_tips_${phaseInfo.phase}` as any) as string[];

  return (
    <MobileLayout>
      <div className="pb-24">
        <div className="bg-gradient-to-br from-blush via-rose to-lavender px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ownerProfile.avatar_url && (
                <img src={ownerProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-card" />
              )}
              <h1 className="text-xl font-display font-bold text-charcoal">
                {t("partner_cycle", { name: firstName })}
              </h1>
            </div>
            <span className="text-[10px] font-body text-charcoal/60 bg-card/50 rounded-full px-2 py-0.5">
              {t("partner_view")}
            </span>
          </div>

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

        <div className="px-5 mt-5">
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="text-sm font-body font-semibold text-foreground mb-3">
              {t("support_today")}
            </h3>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground font-body flex items-start gap-2">
                  <span>•</span> {tip}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 mt-4">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("upcoming")}</h3>
          <div className="space-y-2">
            <EventCard emoji="🩸" label={t("next_period_label")} date={formatDate(nextPeriod)} />
            <EventCard emoji="💛" label={t("ovulation_expected")} date={formatDate(addDays(lastPeriod, settings.cycle_length - 14))} />
            <EventCard emoji="💜" label={t("luteal_start")} date={formatDate(addDays(lastPeriod, settings.cycle_length - 11))} />
          </div>
        </div>
      </div>
      <PartnerBottomNav ownerId={ownerId!} />
    </MobileLayout>
  );
}

function EventCard({ emoji, label, date }: { emoji: string; label: string; date: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft flex items-center gap-3">
      <span className="text-xl">{emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-body text-foreground">{label}</p>
      </div>
      <span className="text-sm font-body text-muted-foreground">{date}</span>
    </div>
  );
}
