import { useLanguage } from "@/hooks/useLanguage";
import { Phase, PHASE_EMOJI, getPhaseColor } from "@/lib/cycle";

interface PhaseChipProps {
  phase: Phase;
  size?: "sm" | "md";
}

const PHASE_KEYS: Record<Phase, string> = {
  menstruation: "phase_menstruation",
  follicular: "phase_follicular",
  ovulation: "phase_ovulation",
  luteal: "phase_luteal",
};

export default function PhaseChip({ phase, size = "sm" }: PhaseChipProps) {
  const { t } = useLanguage();
  const colors = getPhaseColor(phase);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-body font-medium ${colors.bg} ${colors.text} ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {PHASE_EMOJI[phase]} {t(PHASE_KEYS[phase] as any)}
    </span>
  );
}
