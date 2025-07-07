import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWrapper from "./components/AuthWrapper";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import AddShift from "./pages/AddShift";
import AllShifts from "./pages/AllShifts";
import TodaysShifts from "./pages/TodaysShifts";
import PasteShifts from "./pages/PasteShifts";
import GroupedShifts from "./pages/GroupedShifts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* AuthWrapper temporarily disabled for development */}
        {/* <AuthWrapper> */}
          <div className="min-h-screen bg-background">
            <Navigation />
            <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-shift" element={<AddShift />} />
          <Route path="/all-shifts" element={<AllShifts />} />
          <Route path="/todays-shifts" element={<TodaysShifts />} />
          <Route path="/paste-shifts" element={<PasteShifts />} />
          <Route path="/grouped-shifts" element={<GroupedShifts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
            </main>
          </div>
        {/* </AuthWrapper> */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
