import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "./MobileLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "partner";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-3xl animate-pulse-bloom">🌸</span>
        </div>
      </MobileLayout>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
