import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Dashboard />
              </main>
            </div>
          } />
          <Route path="/dashboard" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Dashboard />
              </main>
            </div>
          } />
          <Route path="/add-shift" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <AddShift />
              </main>
            </div>
          } />
          <Route path="/all-shifts" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <AllShifts />
              </main>
            </div>
          } />
          <Route path="/todays-shifts" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <TodaysShifts />
              </main>
            </div>
          } />
          <Route path="/paste-shifts" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <PasteShifts />
              </main>
            </div>
          } />
          <Route path="/grouped-shifts" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <GroupedShifts />
              </main>
            </div>
          } />
          <Route path="/analytics" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Analytics />
              </main>
            </div>
          } />
          <Route path="/calendar" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Calendar />
              </main>
            </div>
          } />
          <Route path="/settings" element={
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Settings />
              </main>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
