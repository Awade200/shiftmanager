import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Calendar } from 'lucide-react';

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
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Shift Manager</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;