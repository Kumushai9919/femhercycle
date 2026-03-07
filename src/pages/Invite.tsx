import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";

type InviteState = "loading" | "valid" | "invalid" | "used" | "accepting";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, profile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<InviteState>("loading");
  const [ownerName, setOwnerName] = useState("");
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    loadToken();
  }, [token]);

  // After user signs in, accept the invite
  useEffect(() => {
    if (user && tokenData && state === "valid") {
      acceptInvite();
    }
  }, [user, tokenData, state]);

  const loadToken = async () => {
    const { data } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("token", token!)
      .maybeSingle();

    if (!data) {
      setState("invalid");
      return;
    }

    if (!data.is_active) {
      setState("invalid");
      return;
    }

    if (data.partner_id) {
      setState("used");
      return;
    }

    // Get owner name via public function (works without auth)
    const { data: name } = await supabase.rpc("get_invite_owner_name", { _token: token! });
    setOwnerName(name || "");
    setTokenData(data);
    setState("valid");
  };

  const acceptInvite = async () => {
    if (!user || !tokenData) return;
    setState("accepting");

    try {
      const { data: ownerId, error } = await supabase.rpc("accept_invite", {
        _token: token!,
        _partner_id: user.id,
      });

      if (error) {
        console.error("Accept invite error:", error);
        setState("invalid");
        return;
      }

      navigate(`/partner/${ownerId}`);
    } catch (err) {
      console.error("Accept invite failed:", err);
      setState("invalid");
    }
  };

  const handleSignIn = () => {
    signInWithGoogle(`${window.location.origin}/invite/${token}`);
  };

  return (
    <MobileLayout>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 bg-gradient-to-b from-blush via-mist to-lavender">
        {state === "loading" || state === "accepting" ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl animate-pulse-bloom">🌸</span>
            <p className="text-sm text-muted-foreground font-body">
              {state === "accepting" ? "연결 중…" : "로딩 중…"}
            </p>
          </div>
        ) : state === "invalid" ? (
          <div className="text-center">
            <span className="text-4xl">❌</span>
            <h2 className="mt-3 text-lg font-display font-bold text-foreground">
              유효하지 않은 초대 링크예요
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              이 초대 링크는 더 이상 유효하지 않아요.
            </p>
          </div>
        ) : state === "used" ? (
          <div className="text-center">
            <span className="text-4xl">✅</span>
            <h2 className="mt-3 text-lg font-display font-bold text-foreground">
              이미 사용된 초대예요
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              이 초대는 이미 수락되었어요.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 shadow-soft text-center max-w-[340px]">
            <span className="text-5xl">🌸</span>
            <h2 className="mt-4 text-xl font-display font-bold text-foreground">
              {ownerName}님이
              <br />
              사이클을 공유했어요
            </h2>
            <p className="mt-3 text-sm text-muted-foreground font-body leading-relaxed">
              사이클 단계, 캘린더, 응원 방법을 볼 수 있어요.
              <br />
              일기는 항상 비공개예요.
            </p>

            <button
              onClick={handleSignIn}
              className="mt-6 w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-plum to-deep-rose px-6 py-3.5 text-accent-foreground font-body font-semibold shadow-glow"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              구글로 계속하기
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
