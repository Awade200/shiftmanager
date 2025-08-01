import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Plus, Calendar, Clock, Clipboard, Settings, Users, TrendingUp, CalendarDays } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/todays-shifts', label: 'Today', icon: Clock },
  { path: '/add-shift', label: 'Add Shift', icon: Plus },
  { path: '/paste-shifts', label: 'Paste Shifts', icon: Clipboard },
  { path: '/grouped-shifts', label: 'Grouped', icon: Users },
  { path: '/all-shifts', label: 'All Shifts', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={cn(
        "bg-gradient-card border-r border-border shadow-card transition-all duration-300",
        collapsed ? "w-14" : "w-60"
      )}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className={cn(
          "flex items-center space-x-2 p-4 border-b border-border",
          collapsed && "justify-center px-2"
        )}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <h1 className="text-xl font-bold text-foreground">Shift Manager</h1>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        "transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-card"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Link to={item.path}>
                        <Icon className="w-4 h-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}