import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/Calendar";
import LogPage from "./pages/Log";
import RoutinePage from "./pages/Routine";
import SettingsPage from "./pages/Settings";
import InvitePage from "./pages/Invite";
import PartnerHome from "./pages/partner/PartnerHome";
import PartnerCalendar from "./pages/partner/PartnerCalendar";
import PartnerRoutine from "./pages/partner/PartnerRoutine";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/log" element={<ProtectedRoute><LogPage /></ProtectedRoute>} />
            <Route path="/routine" element={<ProtectedRoute><RoutinePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/partner/:ownerId" element={<ProtectedRoute><PartnerHome /></ProtectedRoute>} />
            <Route path="/partner/:ownerId/calendar" element={<ProtectedRoute><PartnerCalendar /></ProtectedRoute>} />
            <Route path="/partner/:ownerId/routine" element={<ProtectedRoute><PartnerRoutine /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
