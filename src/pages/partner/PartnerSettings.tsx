import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { PartnerBottomNav } from "@/components/BottomNav";
import { LANG_LABELS, type Lang } from "@/i18n/translations";
import { LogOut } from "lucide-react";

export default function PartnerSettings() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const { t, lang, setLang } = useLanguage();
  const { signOut } = useAuth();

  const langs: Lang[] = ["ko", "en", "ru"];

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-8">
        <h1 className="text-xl font-display font-bold text-foreground mb-6">{t("settings")}</h1>

        {/* Language */}
        <div className="rounded-2xl bg-card p-5 shadow-soft mb-4">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("language")}</h3>
          <div className="flex gap-2">
            {langs.map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-full px-4 py-2 text-sm font-body font-medium transition-all ${
                  lang === l ? "bg-primary text-primary-foreground" : "bg-mist text-muted-foreground hover:bg-lavender"
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <h3 className="text-sm font-body font-semibold text-foreground mb-3">{t("account")}</h3>
          <button onClick={signOut}
            className="flex items-center gap-2 text-sm font-body text-destructive hover:underline"
          >
            <LogOut className="h-4 w-4" />
            {t("sign_out")}
          </button>
        </div>
      </div>
      {ownerId && <PartnerBottomNav ownerId={ownerId} />}
    </MobileLayout>
  );
}
