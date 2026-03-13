import { useLocation, useNavigate } from "react-router-dom";
import { Home, CalendarDays, PenSquare, Sparkles, Settings } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ElementType;
}

const ownerTabKeys: NavItem[] = [
  { path: "/dashboard", labelKey: "nav_home", icon: Home },
  { path: "/calendar", labelKey: "nav_calendar", icon: CalendarDays },
  { path: "/log", labelKey: "nav_log", icon: PenSquare },
  { path: "/routine", labelKey: "nav_routine", icon: Sparkles },
  { path: "/settings", labelKey: "nav_settings", icon: Settings },
];

export function OwnerBottomNav() {
  return <BottomNavBase tabs={ownerTabKeys} />;
}

export function PartnerBottomNav({ ownerId }: { ownerId: string }) {
  const tabs: NavItem[] = [
    { path: `/partner/${ownerId}`, labelKey: "nav_home", icon: Home },
    { path: `/partner/${ownerId}/calendar`, labelKey: "nav_calendar", icon: CalendarDays },
    { path: `/partner/${ownerId}/routine`, labelKey: "nav_routine", icon: Sparkles },
    { path: `/partner/${ownerId}/settings`, labelKey: "nav_settings", icon: Settings },
  ];
  return <BottomNavBase tabs={tabs} />;
}

function BottomNavBase({ tabs }: { tabs: NavItem[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="mx-2 mb-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-soft">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium font-body">{t(tab.labelKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
