import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const ContextPanel = ({ 
  isOpen, 
  onClose, 
  title = "Details", 
  children, 
  className 
}: ContextPanelProps) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div
        className={cn(
          "fixed lg:relative top-0 right-0 h-full w-full sm:w-96 bg-card border-l shadow-modal z-50 transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          !isOpen && "lg:hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-card">
          <h2 className="font-semibold text-lg text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
};

// Hook for managing context panel state
export const useContextPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [title, setTitle] = useState<string>('Details');

  const openPanel = (panelContent: React.ReactNode, panelTitle?: string) => {
    setContent(panelContent);
    if (panelTitle) setTitle(panelTitle);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    content,
    title,
    openPanel,
    closePanel,
  };
};