import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, type Phase } from "@/lib/cycle";

const CAT_KEYS = [
  { key: "all", labelKey: "cat_all" },
  { key: "exercise", labelKey: "cat_exercise" },
  { key: "diet", labelKey: "cat_diet" },
  { key: "sleep", labelKey: "cat_sleep" },
  { key: "support", labelKey: "cat_support" },
];

const CATEGORY_MAP = ["exercise", "diet", "sleep", "support"];

export default function PartnerRoutine() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const { t, lang } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    Promise.all([
      supabase.from("cycle_settings").select("*").eq("user_id", ownerId).single(),
      supabase.from("profiles").select("full_name").eq("id", ownerId).single(),
    ]).then(([{ data: s }, { data: p }]) => {
      setSettings(s);
      setOwnerProfile(p);
      setLoading(false);
    });
  }, [ownerId]);

  if (loading || !settings) {
    return (
      <MobileLayout>
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-3xl animate-pulse-bloom">🌸</span>
        </div>
        {ownerId && <PartnerBottomNav ownerId={ownerId} />}
      </MobileLayout>
    );
  }

  const phaseInfo = getPhaseInfo(new Date(), new Date(settings.last_period_start), settings.cycle_length, settings.period_length);
  const firstName = ownerProfile?.full_name?.split(" ")[0] || t("partner");

  // Parse routine items from translation strings "emoji|name|description|partnerTip"
  const rawItems = t(`pr_${phaseInfo.phase}` as any) as string[];
  const routines = rawItems.map((item, i) => {
    const [emoji, name, description, partnerTip] = item.split("|");
    return { emoji, name, description, partnerTip, category: CATEGORY_MAP[i] };
  });

  const filtered = activeTab === "all" ? routines : routines.filter((r) => r.category === activeTab);
  const supportText = t(`partner_support_${phaseInfo.phase}` as any) as string;

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {t("partner_routine_title", { name: firstName })}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <PhaseChip phase={phaseInfo.phase} size="sm" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blush to-lavender p-4 shadow-soft mb-4">
          <h3 className="text-sm font-body font-semibold text-charcoal mb-2">
            {t("support_method", { name: firstName })}
          </h3>
          <p className="text-xs text-charcoal/80 font-body leading-relaxed">
            {supportText}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CAT_KEYS.map((cat) => (
            <button key={cat.key} onClick={() => setActiveTab(cat.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all ${
                activeTab === cat.key ? "bg-plum text-accent-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
              }`}
            >
              {t(cat.labelKey as any)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((r, i) => (
            <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-body font-semibold text-foreground">{r.name}</h4>
                  <p className="text-xs text-muted-foreground font-body mt-1">{r.description}</p>
                  <div className="mt-2 rounded-xl bg-phase-follicular/50 px-3 py-1.5">
                    <p className="text-xs text-phase-follicular-text font-body font-medium">
                      💬 {r.partnerTip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {ownerId && <PartnerBottomNav ownerId={ownerId} />}
    </MobileLayout>
  );
}
