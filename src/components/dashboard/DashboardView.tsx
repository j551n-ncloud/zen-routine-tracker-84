
import React from "react";
import HabitsWidget from "./HabitsWidget";
import FocusToday from "@/components/tasks/FocusToday";
import TaskManager from "@/components/tasks/TaskManager";
import EnergyTracker from "@/components/tasks/EnergyTracker";

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
