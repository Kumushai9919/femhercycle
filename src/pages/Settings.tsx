import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { format } from "date-fns";
import { Copy, LogOut, RefreshCw, UserX } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriod, setLastPeriod] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Sharing state
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
    const { data } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (data) {
      setShareEnabled(true);
      setShareToken(data);
      if (data.partner_id) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.partner_id).single();
        setPartnerInfo({ ...p, accepted_at: data.accepted_at });
      }
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
    toast.success("저장되었어요 ✦");
  };

  const generateLink = async () => {
    if (!user) return;
    // Deactivate old tokens
    await supabase.from("share_tokens").update({ is_active: false }).eq("owner_id", user.id);
    const { data } = await supabase.from("share_tokens").insert({ owner_id: user.id }).select().single();
    if (data) {
      setShareToken(data);
      setShareEnabled(true);
      toast.success("초대 링크가 생성되었어요!");
    }
  };

  const copyLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/invite/${shareToken.token}`;
    navigator.clipboard.writeText(url);
    toast.success("복사되었어요!");
  };

  const removePartner = async () => {
    if (!user || !shareToken) return;
    await supabase.from("partner_access").update({ is_active: false }).eq("owner_id", user.id);
    await supabase.from("share_tokens").update({ is_active: false, partner_id: null }).eq("owner_id", user.id);
    setPartnerInfo(null);
    setShareToken(null);
    setShareEnabled(false);
    toast.success("파트너 연결이 해제되었어요.");
  };

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <h1 className="text-xl font-display font-bold text-foreground mb-6">설정</h1>

        {/* Profile */}
        <Section title="프로필">
          <div className="flex items-center gap-3 mb-3">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            )}
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="이름"
            />
          </div>
        </Section>

        {/* Cycle Setup */}
        <Section title="사이클 설정">
          <label className="block mb-3">
            <span className="text-xs text-muted-foreground font-body">마지막 생리 시작일</span>
            <input
              type="date"
              value={lastPeriod}
              onChange={(e) => setLastPeriod(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="block mb-3">
            <span className="text-xs text-muted-foreground font-body">사이클 길이: {cycleLength}일</span>
            <input type="range" min={21} max={35} value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum mt-1" />
          </label>

          <label className="block mb-4">
            <span className="text-xs text-muted-foreground font-body">생리 기간: {periodLength}일</span>
            <input type="range" min={3} max={7} value={periodLength} onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-lavender accent-plum mt-1" />
          </label>

          <button onClick={saveSettings} className="w-full rounded-2xl bg-gradient-to-r from-plum to-deep-rose py-3 text-accent-foreground font-body font-semibold shadow-glow">
            저장하기
          </button>
        </Section>

        {/* Partner Sharing */}
        <Section title="파트너 공유">
          <p className="text-xs text-muted-foreground font-body mb-3">
            📝 일기는 본인만 볼 수 있어요
          </p>

          {!shareEnabled ? (
            <button onClick={generateLink} className="w-full rounded-2xl bg-mist py-3 text-plum font-body font-semibold hover:bg-lavender transition-colors">
              초대 링크 생성
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareToken ? `${window.location.origin}/invite/${shareToken.token}` : ""}
                  className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-body text-muted-foreground truncate"
                />
                <button onClick={copyLink} className="p-2 rounded-xl bg-mist text-plum hover:bg-lavender">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <button onClick={generateLink} className="flex items-center gap-2 text-xs text-muted-foreground font-body hover:text-foreground">
                <RefreshCw className="h-3 w-3" /> 링크 재생성
              </button>

              {partnerInfo && (
                <div className="rounded-2xl bg-mist p-3 flex items-center justify-between">
                  <span className="text-sm font-body text-foreground">
                    💜 {partnerInfo.full_name || "파트너"} 연결됨
                  </span>
                  <button onClick={removePartner} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Account */}
        <Section title="계정">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
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
