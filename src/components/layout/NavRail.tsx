import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', url: '/', icon: Home },
      { title: 'Today\'s Shifts', url: '/todays-shifts', icon: Clock },
      { title: 'All Shifts', url: '/all-shifts', icon: Calendar },
      { title: 'Analytics', url: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Manage',
    items: [
      { title: 'Add Shift', url: '/add-shift', icon: Plus },
      { title: 'Paste Shifts', url: '/paste-shifts', icon: FileText },
      { title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];

export const NavRail = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return cn(
      "w-full justify-start gap-3 h-11 font-medium transition-all duration-200",
      active 
        ? "bg-primary text-primary-foreground shadow-1 hover:bg-primary/90" 
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    );
  };

  return (
    <Sidebar
      className={cn(
        "border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <SidebarContent className="px-2 py-4">
        {navigation.map((section) => (
          <SidebarGroup key={section.title} className="mb-6">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                {section.title}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={getNavClassName(item.url)}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};