export default function AiBadge({ label = "AI 분석" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-plum px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
      ✦ {label}
    </span>
  );
}
