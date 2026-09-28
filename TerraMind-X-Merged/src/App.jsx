import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredNotice";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LanguageProvider, useLang } from "@/lib/i18n";

// Auth pages (boilerplate)
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

// TerraMind-X app
import TerraMindShell from "@/components/TerraMindShell";
import { OnboardingScreen } from "@/screens/terra/Onboarding";
import VoiceAssistant from "@/pages/VoiceAssistant";

const previewEnabled = import.meta.env.DEV || import.meta.env.VITE_PREVIEW_MODE === "true";

function Welcome() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const {
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" role="status">
        <span className="sr-only">Loading</span>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  return (
    <OnboardingScreen
      onNav={(destination) => navigate(`/${destination}`)}
      language={lang}
      onLanguage={setLang}
      previewEnabled={previewEnabled}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/preview/*"
                element={previewEnabled ? <TerraMindShell /> : <Navigate to="/" replace />}
              />
              <Route
                element={
                  <ProtectedRoute
                    unauthenticatedElement={<Navigate to="/login" replace />}
                  />
                }
              >
                <Route path="/app/*" element={<TerraMindShell />} />
                <Route path="/voice-assistant" element={<VoiceAssistant />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}