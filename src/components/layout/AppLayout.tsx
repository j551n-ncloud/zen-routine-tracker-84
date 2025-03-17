import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { syncData } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncData();
    } finally {
      setTimeout(() => setIsSyncing(false), 1000); // Add slight delay to show animation
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0"
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with menu button */}
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm border-b lg:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold ml-4">Zen Habit Tracker</h1>
          </div>
          
          {/* Add Sync Button to mobile header */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Sync Data"
          >
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          </button>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;