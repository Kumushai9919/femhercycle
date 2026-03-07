import { useLocation, useNavigate } from "react-router-dom";
import { Home, CalendarDays, PenSquare, Sparkles, Settings } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const ownerTabs: NavItem[] = [
  { path: "/dashboard", label: "홈", icon: Home },
  { path: "/calendar", label: "캘린더", icon: CalendarDays },
  { path: "/log", label: "기록", icon: PenSquare },
  { path: "/routine", label: "루틴", icon: Sparkles },
  { path: "/settings", label: "설정", icon: Settings },
];

export function OwnerBottomNav() {
  return <BottomNavBase tabs={ownerTabs} />;
}

export function PartnerBottomNav({ ownerId }: { ownerId: string }) {
  const tabs: NavItem[] = [
    { path: `/partner/${ownerId}`, label: "홈", icon: Home },
    { path: `/partner/${ownerId}/calendar`, label: "캘린더", icon: CalendarDays },
    { path: `/partner/${ownerId}/routine`, label: "루틴", icon: Sparkles },
  ];
  return <BottomNavBase tabs={tabs} />;
}

function BottomNavBase({ tabs }: { tabs: NavItem[] }) {
  const location = useLocation();
  const navigate = useNavigate();

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
                <span className="text-[10px] font-medium font-body">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
