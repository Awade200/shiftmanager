import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Plus, 
  Calendar, 
  Clock, 
  Clipboard, 
  Settings, 
  Users, 
  TrendingUp, 
  CalendarDays,
  ChevronDown,
  BarChart3
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  items?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: Home },
  {
    label: 'Shifts',
    icon: Users,
    items: [
      { path: '/todays-shifts', label: "Today's Shifts", icon: Clock },
      { path: '/add-shift', label: 'Add Shift', icon: Plus },
      { path: '/paste-shifts', label: 'Paste Shifts', icon: Clipboard },
      { path: '/all-shifts', label: 'All Shifts', icon: Calendar },
      { path: '/grouped-shifts', label: 'Grouped Shifts', icon: Users },
    ]
  },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed" && !isMobile;

  const isGroupActive = (items?: NavItem[]) => 
    items?.some(item => location.pathname === item.path) || false;

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    
    if (item.items && !collapsed) {
      const isActive = isGroupActive(item.items);
      
      return (
        <SidebarMenuItem key={item.label}>
          <Collapsible defaultOpen={isActive} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  "transition-all duration-200 w-full justify-between",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = location.pathname === subItem.path;
                  
                  return (
                    <SidebarMenuSubItem key={subItem.path}>
                      <SidebarMenuSubButton 
                        asChild
                        className={cn(
                          "transition-all duration-200",
                          isSubActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Link to={subItem.path!}>
                          <SubIcon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      );
    }

    // Regular navigation item
    const isActive = location.pathname === item.path;
    
    return (
      <SidebarMenuItem key={item.path || item.label}>
        <SidebarMenuButton 
          asChild
          className={cn(
            "transition-all duration-200",
            isActive
              ? "bg-primary text-primary-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Link to={item.path!}>
            <Icon className="w-4 h-4" />
            <span className={cn(collapsed && !isMobile && "sr-only")}>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      className={cn(
        "bg-gradient-card border-r border-border shadow-card transition-all duration-300",
        collapsed ? "w-14" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarContent className="px-2">
        {/* Header */}
        <div className={cn(
          "flex items-center space-x-2 p-4 border-b border-border mb-2",
          collapsed && "justify-center px-2"
        )}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold text-foreground">Shift Manager</h1>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}