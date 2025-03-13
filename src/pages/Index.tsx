
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import DashboardView from "@/components/dashboard/DashboardView";

const Index: React.FC = () => {
  return (
    <AppLayout>
      <DashboardView />
    </AppLayout>
  );
};

export default Index;
