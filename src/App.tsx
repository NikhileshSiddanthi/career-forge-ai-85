import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Roles from "./pages/Roles";
import RoleDetail from "./pages/RoleDetail";
import Simulation from "./pages/Simulation";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import InterviewPrep from "./pages/InterviewPrep";
import SkillAnalyzer from "./pages/SkillAnalyzer";
import Jobs from "./pages/Jobs";
import CodePlayground from "./pages/CodePlayground";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/role/:slug" element={<RoleDetail />} />
            <Route path="/simulation/:slug" element={<Simulation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn/:slug" element={<Learn />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            <Route path="/interview-prep/:slug" element={<InterviewPrep />} />
            <Route path="/skill-analyzer" element={<SkillAnalyzer />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/code-playground" element={<CodePlayground />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
