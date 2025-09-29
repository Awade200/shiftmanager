import { CalendarIcon, Upload, BarChart3, Settings as SettingsIcon, Home } from "lucide-react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import UploadSession from "./pages/UploadSession";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

/**
 * Central place to define the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Homepage",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: Index,
  },
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    page: Dashboard,
  },
  {
    title: "Calendar",
    to: "/calendar",
    icon: <CalendarIcon className="h-4 w-4" />,
    page: Calendar,
  },
  {
    title: "Upload Shifts",
    to: "/upload",
    icon: <Upload className="h-4 w-4" />,
    page: UploadSession,
  },
  {
    title: "Analytics",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: Analytics,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <SettingsIcon className="h-4 w-4" />,
    page: Settings,
  },
];