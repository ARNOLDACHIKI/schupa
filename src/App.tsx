import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import ResultsUpload from "./pages/ResultsUpload";
import FeeStatement from "./pages/FeeStatement";
import AdminStudentManagement from "./pages/AdminStudentManagement";
import AdminApprovalQueue from "./pages/AdminApprovalQueue";
import Messages from "./pages/Messages";
import AdminAuditLogs from "./pages/AdminAuditLogs";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const dark = localStorage.getItem("schupa_dark_mode") === "true";
    const language = localStorage.getItem("schupa_language") || "en";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("lang", language);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/profile-settings" element={<ProfileSettings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/results" element={<ResultsUpload />} />
              <Route path="/fees" element={<FeeStatement />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin/students" element={<AdminStudentManagement />} />
              <Route path="/admin/approvals" element={<AdminApprovalQueue />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
