import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import MobileLayout from "@/components/MobileLayout";

type InviteState = "loading" | "valid" | "invalid" | "used" | "accepting";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, profile, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [state, setState] = useState<InviteState>("loading");
  const [ownerName, setOwnerName] = useState("");
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    loadToken();
  }, [token]);

  useEffect(() => {
    if (user && tokenData && state === "valid") acceptInvite();
  }, [user, tokenData, state]);

  const loadToken = async () => {
    const { data } = await supabase.from("share_tokens").select("*").eq("token", token!).maybeSingle();
    if (!data || !data.is_active) { setState("invalid"); return; }
    if (data.partner_id) { setState("used"); return; }
    const { data: name } = await supabase.rpc("get_invite_owner_name", { _token: token! });
    setOwnerName(name || "");
    setTokenData(data);
    setState("valid");
  };

  const acceptInvite = async () => {
    if (!user || !tokenData) return;
    setState("accepting");
    try {
      const { data: ownerId, error } = await supabase.rpc("accept_invite", { _token: token!, _partner_id: user.id });
      if (error) { setState("invalid"); return; }
      navigate(`/partner/${ownerId}`);
    } catch { setState("invalid"); }
  };

  const handleSignIn = () => signInWithGoogle(`${window.location.origin}/invite/${token}`);

  return (
    <MobileLayout>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 bg-gradient-to-b from-background via-secondary/30 to-muted">
        {state === "loading" || state === "accepting" ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl animate-pulse-bloom">🌸</span>
            <p className="text-sm text-muted-foreground font-body">
              {state === "accepting" ? t("invite_connecting") : t("invite_loading")}
            </p>
          </div>
        ) : state === "invalid" ? (
          <div className="text-center">
            <span className="text-4xl">❌</span>
            <h2 className="mt-3 text-lg font-display font-bold text-foreground">{t("invite_invalid_title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground font-body">{t("invite_invalid_desc")}</p>
          </div>
        ) : state === "used" ? (
          <div className="text-center">
            <span className="text-4xl">✅</span>
            <h2 className="mt-3 text-lg font-display font-bold text-foreground">{t("invite_used_title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground font-body">{t("invite_used_desc")}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 shadow-soft text-center max-w-[340px]">
            <span className="text-5xl">🌸</span>
            <h2 className="mt-4 text-xl font-display font-bold text-foreground whitespace-pre-line">
              {t("invite_shared", { name: ownerName })}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground font-body leading-relaxed whitespace-pre-line">
              {t("invite_desc")}
            </p>
            <button
              onClick={handleSignIn}
              className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl bg-white border border-border px-6 py-3 text-foreground font-body font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t("login_google")}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
