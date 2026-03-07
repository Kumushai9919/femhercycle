import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import AiBadge from "@/components/AiBadge";
import { getPhaseInfo, PHASE_LABELS, type Phase } from "@/lib/cycle";

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "exercise", label: "🏋️ 운동" },
  { key: "diet", label: "🥗 식단" },
  { key: "sleep", label: "🌙 수면" },
  { key: "support", label: "💬 응원 팁" },
];

interface RoutineItem {
  category: string;
  emoji: string;
  name: string;
  time: string;
  description: string;
  partnerTip: string;
}

const PARTNER_ROUTINES: Record<Phase, RoutineItem[]> = {
  menstruation: [
    { category: "exercise", emoji: "🧘", name: "부드러운 요가", time: "아침", description: "가벼운 스트레칭과 요가", partnerTip: "함께 스트레칭을 해 보세요" },
    { category: "diet", emoji: "🥗", name: "철분 보충 식단", time: "식사 시간", description: "철분이 풍부한 음식 섭취", partnerTip: "철분이 많은 식사를 준비해 주세요" },
    { category: "sleep", emoji: "🌙", name: "충분한 수면", time: "밤", description: "평소보다 일찍 취침", partnerTip: "편안한 수면 환경을 만들어 주세요" },
    { category: "support", emoji: "💬", name: "감정적 지지", time: "하루 종일", description: "공감과 이해가 필요한 시기", partnerTip: "따뜻한 말 한마디가 큰 힘이 돼요" },
  ],
  follicular: [
    { category: "exercise", emoji: "🏃‍♀️", name: "유산소 운동", time: "아침", description: "달리기, 자전거 등 활발한 운동", partnerTip: "함께 운동하자고 제안하세요" },
    { category: "diet", emoji: "🥗", name: "단백질 강화", time: "식사 시간", description: "양질의 단백질 섭취", partnerTip: "단백질 풍부한 식사를 함께 하세요" },
    { category: "sleep", emoji: "🌙", name: "규칙적 수면", time: "밤", description: "일정한 수면 패턴 유지", partnerTip: "함께 일찍 잠자리에 들어요" },
    { category: "support", emoji: "💬", name: "함께 활동", time: "저녁", description: "에너지가 높은 시기", partnerTip: "새로운 활동을 함께 시도해 보세요" },
  ],
  ovulation: [
    { category: "exercise", emoji: "💪", name: "고강도 운동", time: "오후", description: "HIIT 또는 웨이트 트레이닝", partnerTip: "함께 헬스장에 가 보세요" },
    { category: "diet", emoji: "🥗", name: "항산화 식품", time: "간식", description: "베리류, 녹차 등 섭취", partnerTip: "건강한 간식을 함께 준비하세요" },
    { category: "sleep", emoji: "🌙", name: "질 좋은 수면", time: "밤", description: "수면 환경 최적화", partnerTip: "편안한 밤을 함께 보내세요" },
    { category: "support", emoji: "💬", name: "특별한 시간", time: "저녁", description: "가장 활기찬 시기", partnerTip: "특별한 데이트를 계획하세요" },
  ],
  luteal: [
    { category: "exercise", emoji: "🚶‍♀️", name: "가벼운 산책", time: "저녁", description: "편안한 속도로 산책하기", partnerTip: "함께 산책하자고 제안하세요" },
    { category: "diet", emoji: "🥗", name: "복합 탄수화물", time: "식사 시간", description: "고구마, 현미 등 섭취", partnerTip: "영양가 있는 식사를 준비해 주세요" },
    { category: "sleep", emoji: "🌙", name: "릴렉싱 루틴", time: "밤", description: "따뜻한 목욕과 허브티", partnerTip: "허브티를 끓여 주세요" },
    { category: "support", emoji: "💬", name: "인내와 공감", time: "하루 종일", description: "감정 변화가 큰 시기", partnerTip: "감정 변화에 인내심을 가져 주세요" },
  ],
};

export default function PartnerRoutine() {
  const { ownerId } = useParams<{ ownerId: string }>();
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
  const routines = PARTNER_ROUTINES[phaseInfo.phase];
  const filtered = activeTab === "all" ? routines : routines.filter((r) => r.category === activeTab);
  const firstName = ownerProfile?.full_name?.split(" ")[0] || "파트너";

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {firstName}의 루틴 & 응원법
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <PhaseChip phase={phaseInfo.phase} size="sm" />
            </div>
          </div>
        </div>

        {/* Support summary */}
        <div className="rounded-2xl bg-gradient-to-r from-blush to-lavender p-4 shadow-soft mb-4">
          <h3 className="text-sm font-body font-semibold text-charcoal mb-2">
            💬 {firstName}님을 응원하는 방법
          </h3>
          <p className="text-xs text-charcoal/80 font-body leading-relaxed">
            현재 {phaseInfo.label}에 있어요.{" "}
            {phaseInfo.phase === "menstruation" && "편안한 환경과 따뜻한 배려가 가장 큰 힘이 돼요."}
            {phaseInfo.phase === "follicular" && "함께 활동적인 시간을 보내기 좋은 때예요!"}
            {phaseInfo.phase === "ovulation" && "가장 활기찬 시기! 특별한 시간을 함께 만들어 보세요."}
            {phaseInfo.phase === "luteal" && "감정 변화에 인내심을 갖고 따뜻하게 지지해 주세요."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setActiveTab(cat.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all ${
                activeTab === cat.key ? "bg-plum text-accent-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((r, i) => (
            <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-body font-semibold text-foreground">{r.name}</h4>
                    <span className="text-[11px] text-muted-foreground font-body">{r.time}</span>
                  </div>
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
