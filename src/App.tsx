import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import AddShift from "./pages/AddShift";
import AllShifts from "./pages/AllShifts";
import TodaysShifts from "./pages/TodaysShifts";
import PasteShifts from "./pages/PasteShifts";
import GroupedShifts from "./pages/GroupedShifts";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useMobileAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider defaultOpen={false}>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/add-shift" element={
            <ProtectedRoute>
              <AppLayout>
                <AddShift />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/all-shifts" element={
            <ProtectedRoute>
              <AppLayout>
                <AllShifts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/todays-shifts" element={
            <ProtectedRoute>
              <AppLayout>
                <TodaysShifts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/paste-shifts" element={
            <ProtectedRoute>
              <AppLayout>
                <PasteShifts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/grouped-shifts" element={
            <ProtectedRoute>
              <AppLayout>
                <GroupedShifts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
