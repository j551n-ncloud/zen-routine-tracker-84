import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

const SyncButton: React.FC<SyncButtonProps> = ({ 
  variant = 'outline', 
  size = 'default',
  showText = true
}) => {
  const { syncData } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncData();
    } finally {
      setIsSyncing(false);
    }
  };

  const button = (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className={isSyncing ? 'animate-pulse' : ''}
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''} ${showText ? 'mr-2' : ''}`} />
      {showText && (isSyncing ? 'Syncing...' : 'Sync')}
    </Button>
  );

  // If text is shown, no need for tooltip
  if (showText) {
    return button;
  }

  // Add tooltip for icon-only button
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSyncing ? 'Synchronizing data...' : 'Sync data across devices'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncButton;