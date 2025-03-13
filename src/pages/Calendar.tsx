
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";

const CalendarPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        </div>
        
        <Card className="shadow-subtle">
          <CardContent className="p-6">
            <Calendar 
              mode="month"
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
