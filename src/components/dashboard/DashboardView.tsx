
import React from "react";
import HabitsWidget from "./HabitsWidget";
import FocusToday from "@/components/tasks/FocusToday";
import TaskManager from "@/components/tasks/TaskManager";
import EnergyTracker from "@/components/tasks/EnergyTracker";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Badge 
          variant="outline" 
          className="cursor-pointer bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30 flex items-center gap-1.5 px-3 py-1.5"
          onClick={() => navigate("/achievements")}
        >
          <Award className="h-4 w-4" />
          <span>View Achievements</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FocusToday />
          <TaskManager />
        </div>
        
        <div className="space-y-6">
          <HabitsWidget />
          <EnergyTracker />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
