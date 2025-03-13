
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardView from "@/components/dashboard/DashboardView";

const Index: React.FC = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardView />
      </div>
    </AppLayout>
  );
};

export default Index;
