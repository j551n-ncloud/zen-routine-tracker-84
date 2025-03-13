
import React from "react";
import HabitTracker from "../habits/HabitTracker";
import FocusToday from "../tasks/FocusToday";
import TaskManager from "../tasks/TaskManager";
import EnergyTracker from "../tasks/EnergyTracker";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardView: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className={`grid gap-6 ${isMobile ? "" : "grid-cols-12"}`}>
        {/* Main Column */}
        <div className={`space-y-6 ${isMobile ? "" : "col-span-8"}`}>
          {/* Habit Streaks */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Habit Streaks</h2>
              <button className="text-sm text-primary font-medium hover:underline">
                View All
              </button>
            </div>
            <HabitTracker />
          </section>

          {/* Task Manager */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Tasks</h2>
              <button className="text-sm text-primary font-medium hover:underline">
                View All
              </button>
            </div>
            <TaskManager />
          </section>
        </div>

        {/* Side Column */}
        <div className={`space-y-6 ${isMobile ? "" : "col-span-4"}`}>
          {/* Focus Today */}
          <section className="space-y-4">
            <h2 className="text-xl font-medium">Focus Today</h2>
            <FocusToday />
          </section>

          {/* Energy Tracker */}
          <section className="space-y-4">
            <h2 className="text-xl font-medium">Energy Tracker</h2>
            <EnergyTracker />
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
