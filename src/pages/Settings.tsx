import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import { LANG_LABELS, type Lang } from "@/i18n/translations";
import { toast } from "sonner";
import { Copy, LogOut, RefreshCw, UserX, Globe } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriod, setLastPeriod] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState<any>(null);
  const [partners, setPartners] = useState<{ full_name: string; id: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadSettings();
    loadShareToken();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase.from("cycle_settings").select("*").eq("user_id", user.id).single();
    if (data) {
      setSettings(data);
      setCycleLength(data.cycle_length);
      setPeriodLength(data.period_length);
      setLastPeriod(data.last_period_start || "");
    }
    setDisplayName(profile?.full_name || "");
  };

  const loadShareToken = async () => {
    if (!user) return;
    const { data } = await supabase.from("share_tokens").select("*").eq("owner_id", user.id).eq("is_active", true).maybeSingle();
    if (data) {
      setShareEnabled(true);
      setShareToken(data);
    }
    const { data: accessRows } = await supabase.from("partner_access").select("partner_id").eq("owner_id", user.id).eq("is_active", true);
    if (accessRows && accessRows.length > 0) {
      const ids = accessRows.map((r) => r.partner_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setPartners(profiles || []);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    await supabase.from("cycle_settings").upsert(
      { user_id: user.id, cycle_length: cycleLength, period_length: periodLength, last_period_start: lastPeriod || null },
      { onConflict: "user_id" }
    );
    if (displayName !== profile?.full_name) {
      await supabase.from("profiles").update({ full_name: displayName }).eq("id", user.id);
    }
    toast.success(t("save_success") as string);
  };

  const generateLink = async () => {
    if (!user) return;
    await supabase.from("share_tokens").update({ is_active: false }).eq("owner_id", user.id);
    const { data } = await supabase.from("share_tokens").insert({ owner_id: user.id }).select().single();
    if (data) {
      setShareToken(data);
      setShareEnabled(true);
      toast.success(t("link_created") as string);
    }
  };

  const copyLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/invite/${shareToken.token}`;
    navigator.clipboard.writeText(url);
    toast.success(t("copied") as string);
  };

  const removePartner = async (partnerId?: string) => {
    if (!user) return;
    if (partnerId) {
      await supabase.from("partner_access").update({ is_active: false }).eq("owner_id", user.id).eq("partner_id", partnerId);
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    } else {
      await supabase.from("partner_access").update({ is_active: false }).eq("owner_id", user.id);
      await supabase.from("share_tokens").update({ is_active: false, partner_id: null }).eq("owner_id", user.id);
      setPartners([]);
      setShareToken(null);
      setShareEnabled(false);
    }
    toast.success(t("partner_disconnected") as string);
  };

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <h1 className="text-xl font-display font-bold text-foreground mb-6">{t("settings")}</h1>

        {/* Language */}
        <Section title={t("language") as string}>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-body">{t("language")}</span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 rounded-xl py-2 text-sm font-body font-medium transition-all ${
                  lang === l ? "bg-primary text-primary-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </Section>

        {/* Profile */}
        <Section title={t("profile") as string}>
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {displayName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("name_placeholder") as string}
            />
          </div>
          {displayName !== (profile?.full_name || "") && (
            <button
              onClick={saveDisplayName}
              className="mt-3 w-full rounded-2xl bg-primary/90 py-2.5 text-primary-foreground text-sm font-body font-semibold"
            >
              {t("save")}
            </button>
          )}
        </Section>

        {/* Cycle Setup */}
        <Section title={t("cycle_settings") as string}>
          <label className="block mb-3">
            <span className="text-xs text-muted-foreground font-body">{t("last_period_start")}</span>
            <input
              type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="block mb-3">
            <span className="text-xs text-muted-foreground font-body">{t("cycle_length_label", { n: cycleLength })}</span>
            <input type="range" min={21} max={35} value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum mt-1" />
          </label>

          <label className="block mb-4">
            <span className="text-xs text-muted-foreground font-body">{t("period_length_label", { n: periodLength })}</span>
            <input type="range" min={3} max={7} value={periodLength} onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum mt-1" />
          </label>

          <button onClick={saveSettings} className="w-full rounded-2xl bg-gradient-to-r from-primary/90 to-accent/80 py-3 text-primary-foreground font-body font-semibold shadow-soft">
            {t("save")}
          </button>
        </Section>

        {/* Partner Sharing */}
        <Section title={t("partner_sharing") as string}>
          <p className="text-xs text-muted-foreground font-body mb-3">{t("diary_private")}</p>

          {!shareEnabled ? (
            <button onClick={generateLink} className="w-full rounded-2xl bg-mist py-3 text-plum font-body font-semibold hover:bg-lavender transition-colors">
              {t("generate_link")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input readOnly value={shareToken ? `${window.location.origin}/invite/${shareToken.token}` : ""} className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-body text-muted-foreground truncate" />
                <button onClick={copyLink} className="p-2 rounded-xl bg-mist text-plum hover:bg-lavender">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <button onClick={generateLink} className="flex items-center gap-2 text-xs text-muted-foreground font-body hover:text-foreground">
                <RefreshCw className="h-3 w-3" /> {t("regenerate_link")}
              </button>

              {partners.map((p) => (
                <div key={p.id} className="rounded-2xl bg-mist p-3 flex items-center justify-between">
                  <span className="text-sm font-body text-foreground">
                    💜 {p.full_name || t("partner")} {t("connected")}
                  </span>
                  <button onClick={() => removePartner(p.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Account */}
        <Section title={t("account") as string}>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <LogOut className="h-4 w-4" /> {t("sign_out")}
          </button>
        </Section>
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-body font-semibold text-foreground mb-3">{title}</h3>
      <div className="rounded-2xl bg-card p-4 shadow-soft">{children}</div>
    </div>
  );
}
