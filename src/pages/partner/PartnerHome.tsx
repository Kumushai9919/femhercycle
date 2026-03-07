import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import { getPhaseInfo, getNextPeriodDate, PHASE_LABELS, type Phase } from "@/lib/cycle";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";

export default function PartnerHome() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    loadData();
  }, [ownerId]);

  const loadData = async () => {
    const [{ data: prof }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", ownerId!).single(),
      supabase.from("cycle_settings").select("*").eq("user_id", ownerId!).single(),
    ]);
    setOwnerProfile(prof);
    setSettings(s);

    // Get today's mood/energy via share_tokens visibility check
    // Partner can see mood/energy if owner allowed it
    // For now, get abstracted data via RPC or just show phase-based defaults
    setLoading(false);
  };

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
  const firstName = ownerProfile.full_name?.split(" ")[0] || "파트너";

  return (
    <MobileLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-blush via-rose to-lavender px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ownerProfile.avatar_url && (
                <img src={ownerProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-card" />
              )}
              <h1 className="text-xl font-display font-bold text-charcoal">
                {firstName}의 사이클
              </h1>
            </div>
            <span className="text-[10px] font-body text-charcoal/60 bg-card/50 rounded-full px-2 py-0.5">
              파트너 보기
            </span>
          </div>

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

        {/* Support tips */}
        <div className="px-5 mt-5">
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="text-sm font-body font-semibold text-foreground mb-3">
              💬 오늘 파트너를 응원하는 법
            </h3>
            <div className="space-y-2">
              {getPartnerTips(phaseInfo.phase).map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground font-body flex items-start gap-2">
                  <span>•</span> {tip}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="px-5 mt-4">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">다가오는 일정</h3>
          <div className="space-y-2">
            <EventCard emoji="🩸" label="다음 생리일" date={format(nextPeriod, "M월 d일", { locale: ko })} />
            <EventCard
              emoji="💛"
              label="배란 예정"
              date={format(addDays(lastPeriod, settings.cycle_length - 14), "M월 d일", { locale: ko })}
            />
            <EventCard
              emoji="💜"
              label="황체기 시작"
              date={format(addDays(lastPeriod, settings.cycle_length - 11), "M월 d일", { locale: ko })}
            />
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

function getPartnerTips(phase: Phase): string[] {
  const tips: Record<Phase, string[]> = {
    menstruation: [
      "따뜻한 음료를 준비해 주세요",
      "무리한 활동 대신 편안한 저녁을 제안하세요",
      "감정적으로 지지해 주세요 — 공감이 최고예요",
      "필요한 것이 있는지 물어봐 주세요",
    ],
    follicular: [
      "함께 활동적인 데이트를 계획해 보세요",
      "새로운 장소나 레스토랑을 제안해 보세요",
      "에너지가 넘치는 시기 — 함께 운동해요!",
      "창의적인 활동을 함께 시도해 보세요",
    ],
    ovulation: [
      "소셜 활동에 함께 참여하세요",
      "특별한 저녁을 계획해 보세요",
      "가장 활기찬 시기에요 — 함께 즐기세요!",
      "새로운 모험을 함께 떠나보세요",
    ],
    luteal: [
      "편안한 환경을 만들어 주세요",
      "영양가 있는 간식을 준비해 주세요",
      "감정 변화에 인내심을 가져 주세요",
      "가벼운 산책을 함께 제안해 보세요",
    ],
  };
  return tips[phase];
}
