
import React from "react";
import { 
  Calendar, 
  CheckCircle, 
  Home, 
  ListChecks, 
  Settings, 
  Trophy, 
  X,
  BarChart3,
  ClipboardList
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onClose: () => void;
}

const SidebarLink = ({ 
  icon: Icon, 
  href, 
  label, 
  isActive = false 
}: { 
  icon: React.ElementType; 
  href: string; 
  label: string; 
  isActive?: boolean;
}) => {
  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200",
        isActive ? 
          "bg-primary text-primary-foreground" : 
          "text-foreground/70 hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  // Get current path to determine active link
  const path = window.location.pathname;
  
  return (
    <div className="h-full w-64 bg-card border-r overflow-auto flex flex-col">
      {/* Header */}
      <div className="flex flex-col p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Zen Tracker</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">created by Johannes Nguyen</p>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1">
        <SidebarLink 
          icon={Home} 
          href="/" 
          label="Home" 
          isActive={path === "/"}
        />
        <SidebarLink 
          icon={CheckCircle} 
          href="/habits" 
          label="Habits" 
          isActive={path === "/habits"}
        />
        <SidebarLink 
          icon={ListChecks} 
          href="/tasks" 
          label="Tasks" 
          isActive={path === "/tasks"}
        />
        <SidebarLink 
          icon={ClipboardList} 
          href="/daily-routine" 
          label="Daily Routine" 
          isActive={path === "/daily-routine"}
        />
        <SidebarLink 
          icon={Calendar} 
          href="/calendar" 
          label="Calendar" 
          isActive={path === "/calendar"}
        />
        <SidebarLink 
          icon={BarChart3} 
          href="/insights" 
          label="Insights" 
          isActive={path === "/insights"}
        />
        <SidebarLink 
          icon={Trophy} 
          href="/achievements" 
          label="Achievements" 
          isActive={path === "/achievements"}
        />
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t">
        <SidebarLink 
          icon={Settings} 
          href="/settings" 
          label="Settings" 
          isActive={path === "/settings"}
        />
      </div>
    </div>
  );
};
