import { SidebarProvider } from '@/components/ui/sidebar';
import { AppBar } from './AppBar';
import { NavRail } from './NavRail';
import { ContextPanel, useContextPanel } from './ContextPanel';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const contextPanel = useContextPanel();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Navigation Rail */}
        <NavRail />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* App Bar */}
          <AppBar />
          
          {/* Page Content */}
          <main className="flex-1 flex relative">
            {/* Primary Content */}
            <div className={`flex-1 transition-all duration-300 ${
              contextPanel.isOpen ? 'lg:mr-96' : ''
            }`}>
              {children}
            </div>
            
            {/* Context Panel */}
            <ContextPanel
              isOpen={contextPanel.isOpen}
              onClose={contextPanel.closePanel}
              title={contextPanel.title}
            >
              {contextPanel.content}
            </ContextPanel>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Export context panel hook for use in pages
export { useContextPanel };