import { Phase, PHASE_LABELS, PHASE_EMOJI, getPhaseColor } from "@/lib/cycle";

interface PhaseChipProps {
  phase: Phase;
  size?: "sm" | "md";
}

export default function PhaseChip({ phase, size = "sm" }: PhaseChipProps) {
  const colors = getPhaseColor(phase);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-body font-medium ${colors.bg} ${colors.text} ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {PHASE_EMOJI[phase]} {PHASE_LABELS[phase]}
    </span>
  );
}
