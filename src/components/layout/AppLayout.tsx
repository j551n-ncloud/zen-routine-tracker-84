
import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

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
        {/* Header with menu button and user info */}
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold ml-4 lg:hidden">Zen Habit Tracker</h1>
          </div>
          
          {/* User info and logout */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm mr-2 hidden sm:inline-block">
                Logged in as: <span className="font-semibold">{user.username}</span>
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
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
