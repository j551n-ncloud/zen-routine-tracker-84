
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardView from "@/components/dashboard/DashboardView";
import WeatherWidget from "@/components/dashboard/WeatherWidget";

const Index: React.FC = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <WeatherWidget />
        <DashboardView />
      </div>
    </AppLayout>
  );
};

export default Index;
