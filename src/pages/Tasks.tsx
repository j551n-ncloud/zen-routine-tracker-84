
import React from "react";
import { TaskManager } from "@/components/tasks/TaskManager";
import { FocusToday } from "@/components/tasks/FocusToday";
import { EnergyTracker } from "@/components/tasks/EnergyTracker";
import AppLayout from "@/components/layout/AppLayout";

const Tasks = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Task Manager</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TaskManager />
          </div>
          
          <div className="space-y-6">
            <FocusToday />
            <EnergyTracker />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Tasks;
