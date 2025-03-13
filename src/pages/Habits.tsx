
import React from "react";
import { HabitTracker } from "@/components/habits/HabitTracker";
import { MonthlyView } from "@/components/habits/MonthlyView";
import AppLayout from "@/components/layout/AppLayout";

const Habits = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HabitTracker />
          </div>
          
          <div>
            <MonthlyView />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Habits;
