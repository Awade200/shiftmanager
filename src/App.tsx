import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileAuth } from "@/hooks/useMobileAuth";
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
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Dashboard />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Dashboard />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/add-shift" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <AddShift />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/all-shifts" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <AllShifts />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/todays-shifts" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <TodaysShifts />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/paste-shifts" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <PasteShifts />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/grouped-shifts" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <GroupedShifts />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Analytics />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Calendar />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Settings />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
