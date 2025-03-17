import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  CheckCircle,
  ListTodo,
  Calendar,
  BarChart2,
  Award,
  Clock,
  Settings,
  Menu,
  LogOut,
  X
} from "lucide-react";
import SyncButton from "@/components/shared/SyncButton";

const navItems = [
  { path: "/", label: "Dashboard", icon: <Home size={18} /> },
  { path: "/habits", label: "Habits", icon: <CheckCircle size={18} /> },
  { path: "/tasks", label: "Tasks", icon: <ListTodo size={18} /> },
  { path: "/calendar", label: "Calendar", icon: <Calendar size={18} /> },
  { path: "/daily-routine", label: "Daily Routine", icon: <Clock size={18} /> },
  { path: "/insights", label: "Insights", icon: <BarChart2 size={18} /> },
  { path: "/achievements", label: "Achievements", icon: <Award size={18} /> },
  { path: "/settings", label: "Settings", icon: <Settings size={18} /> },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={`bg-sidebar fixed top-0 left-0 z-40 h-full w-64 border-r border-sidebar-border transition-transform duration-300 ${
          isMobile
            ? sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">Zen Routine Tracker</h1>
          </div>

          <nav className="flex-1 py-6">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-2 px-3 rounded-md transition-colors ${
                      location.pathname === item.path
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                    onClick={closeSidebar}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-sidebar-border flex justify-between items-center">
            <div className="flex space-x-2">
              <ModeToggle />
              <SyncButton size="icon" variant="outline" showText={false} />
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isMobile ? "ml-0" : "ml-64"
        }`}
      >
        <main className="container py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;