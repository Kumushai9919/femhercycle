import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/MobileLayout";
import { OwnerBottomNav } from "@/components/BottomNav";
import PhaseChip from "@/components/PhaseChip";
import AiBadge from "@/components/AiBadge";
import { getPhaseInfo, type Phase } from "@/lib/cycle";
import { format } from "date-fns";

interface RoutineItem {
  category: string;
  emoji: string;
  name: string;
  time: string;
  description: string;
  logReason: string;
  priority: string;
}

const DEFAULT_ROUTINES: Record<Phase, RoutineItem[]> = {
  menstruation: [
    { category: "exercise", emoji: "🧘", name: "부드러운 요가", time: "아침 15분", description: "생리 중 경련을 완화하는 부드러운 스트레칭", logReason: "생리기 통증 완화", priority: "high" },
    { category: "diet", emoji: "🥗", name: "철분 보충 식단", time: "점심/저녁", description: "시금치, 두부 등 철분이 풍부한 음식 섭취", logReason: "생리로 인한 철분 소실 보충", priority: "high" },
    { category: "sleep", emoji: "🌙", name: "일찍 취침하기", time: "밤 10시", description: "평소보다 30분 일찍 잠자리에 들기", logReason: "피로 회복을 위한 충분한 수면", priority: "medium" },
    { category: "mindset", emoji: "🧘", name: "명상 5분", time: "아침 기상 후", description: "호흡에 집중하는 짧은 명상", logReason: "생리기 스트레스 관리", priority: "medium" },
    { category: "supplements", emoji: "💊", name: "마그네슘 섭취", time: "저녁 식후", description: "마그네슘 보충제로 경련 예방", logReason: "생리통 완화 보조", priority: "low" },
  ],
  follicular: [
    { category: "exercise", emoji: "🏃‍♀️", name: "유산소 운동", time: "아침 30분", description: "달리기, 자전거 등 활발한 유산소 활동", logReason: "에너지가 높은 시기 활용", priority: "high" },
    { category: "diet", emoji: "🥗", name: "단백질 강화 식단", time: "매 끼니", description: "닭가슴살, 달걀 등 양질의 단백질 섭취", logReason: "근육 회복과 성장 지원", priority: "high" },
    { category: "sleep", emoji: "🌙", name: "규칙적 수면 패턴", time: "밤 11시", description: "일정한 시간에 취침하고 기상하기", logReason: "호르몬 균형 유지", priority: "medium" },
    { category: "mindset", emoji: "🧘", name: "새로운 목표 설정", time: "아침", description: "이번 주 달성할 작은 목표 세우기", logReason: "에너지 높은 시기에 동기 부여", priority: "medium" },
    { category: "supplements", emoji: "💊", name: "비타민 B 복합체", time: "아침 식후", description: "에너지 대사를 돕는 비타민 B 섭취", logReason: "활동적인 시기 에너지 지원", priority: "low" },
  ],
  ovulation: [
    { category: "exercise", emoji: "💪", name: "고강도 인터벌 운동", time: "오후", description: "HIIT 또는 웨이트 트레이닝", logReason: "체력이 최고조인 시기", priority: "high" },
    { category: "diet", emoji: "🥗", name: "항산화 식품 섭취", time: "간식/식사", description: "베리류, 녹차 등 항산화 음식 섭취", logReason: "배란기 세포 보호", priority: "high" },
    { category: "sleep", emoji: "🌙", name: "질 좋은 수면", time: "밤 10:30", description: "수면 환경 최적화하기", logReason: "호르몬 변화 시기 회복", priority: "medium" },
    { category: "mindset", emoji: "🧘", name: "사교 활동 참여", time: "저녁", description: "친구 만남이나 그룹 활동 참여하기", logReason: "사교성이 높아지는 시기 활용", priority: "medium" },
    { category: "supplements", emoji: "💊", name: "오메가-3 섭취", time: "저녁 식후", description: "오메가-3 지방산으로 염증 관리", logReason: "배란기 염증 반응 조절", priority: "low" },
  ],
  luteal: [
    { category: "exercise", emoji: "🚶‍♀️", name: "가벼운 산책", time: "저녁 20분", description: "편안한 속도로 동네 산책하기", logReason: "PMS 증상 완화에 도움", priority: "high" },
    { category: "diet", emoji: "🥗", name: "복합 탄수화물 섭취", time: "매 끼니", description: "고구마, 현미 등 GI 낮은 탄수화물", logReason: "세로토닌 생성 지원", priority: "high" },
    { category: "sleep", emoji: "🌙", name: "릴렉싱 루틴", time: "밤 9:30", description: "따뜻한 목욕과 허브티로 이완하기", logReason: "황체기 수면 질 개선", priority: "medium" },
    { category: "mindset", emoji: "🧘", name: "저널링", time: "밤", description: "감정을 글로 표현하는 시간 갖기", logReason: "감정 변화가 큰 시기 관리", priority: "medium" },
    { category: "supplements", emoji: "💊", name: "칼슘 & 비타민 D", time: "아침 식후", description: "PMS 증상 완화를 위한 보충제", logReason: "황체기 증상 경감", priority: "low" },
  ],
};

export default function RoutinePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const CATEGORIES = [
    { key: "all", label: t("cat_all") },
    { key: "exercise", label: t("cat_exercise") },
    { key: "diet", label: t("cat_diet") },
    { key: "sleep", label: t("cat_sleep") },
    { key: "mindset", label: t("cat_mind") },
    { key: "supplements", label: t("cat_supplements") },
  ];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("cycle_settings").select("*").eq("user_id", user.id).single();
      setSettings(s);
      if (s?.last_period_start) {
        const phaseInfo = getPhaseInfo(new Date(), new Date(s.last_period_start), s.cycle_length, s.period_length);
        const today = format(new Date(), "yyyy-MM-dd");
        const { data: cached } = await supabase.from("ai_routines").select("routines").eq("user_id", user.id).eq("phase", phaseInfo.phase).eq("log_date", today).maybeSingle();
        if (cached?.routines) {
          setRoutines(cached.routines as unknown as RoutineItem[]);
        } else {
          setRoutines(DEFAULT_ROUTINES[phaseInfo.phase]);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const phaseInfo = settings?.last_period_start
    ? getPhaseInfo(new Date(), new Date(settings.last_period_start), settings.cycle_length, settings.period_length)
    : null;

  const filtered = activeTab === "all" ? routines : routines.filter((r) => r.category === activeTab);

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{t("my_routine")}</h1>
            {phaseInfo && (
              <div className="flex items-center gap-2 mt-1">
                <PhaseChip phase={phaseInfo.phase} size="sm" />
              </div>
            )}
          </div>
          <AiBadge label={t("custom_rec") as string} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setActiveTab(cat.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all ${
                activeTab === cat.key ? "bg-plum text-accent-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
              }`}
            >
              {cat.label as string}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <span className="text-4xl animate-pulse-bloom">🌸</span>
            <p className="text-sm text-muted-foreground font-body">{t("analyzing")}</p>
          </div>
        ) : (
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
                    <div className="mt-2">
                      <AiBadge label={r.logReason} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <OwnerBottomNav />
    </MobileLayout>
  );
}
