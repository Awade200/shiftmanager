import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, User } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const { user, signOut } = useMobileAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-gradient-card border-b border-border sticky top-0 z-50 shadow-card">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground" />
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Shift Manager" className="w-8 h-8 rounded-lg object-contain" />
            <h1 className="text-xl font-bold text-foreground">Shift Manager</h1>
          </div>
        </div>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.display_name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Navigation;